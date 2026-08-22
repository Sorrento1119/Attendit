/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ClassesManagement } from './components/ClassesManagement';
import { LiveAttendanceDashboard } from './components/LiveAttendanceDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import {
  Teacher,
  ClassItem,
  SubjectItem,
  BranchItem,
  DivisionItem,
  SemesterItem,
  TimetableSlot,
  AttendanceSession,
  Student,
  DailyAttendanceStat,
  LowAttendanceStudent,
} from './types';

export default function App() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'session' | 'student'>('dashboard');

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [divisions, setDivisions] = useState<DivisionItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceStat[]>([]);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Initialize Socket.io and fetch metadata
  useEffect(() => {
    // Connect to Socket.io server
    const socketClient = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socketClient.on('connect', () => {
      console.log('Connected to SmartCampus Socket.IO Server');
    });

    socketClient.on('session:sync', (sessionData: AttendanceSession) => {
      setActiveSession(sessionData);
    });

    socketClient.on('session:started', (sessionData: AttendanceSession) => {
      setActiveSession(sessionData);
      if (teacher) {
        setActiveTab('session');
      }
    });

    socketClient.on('session:ended', (sessionData: AttendanceSession) => {
      setActiveSession(null);
      if (teacher) {
        setActiveTab('dashboard');
      }
    });

    socketClient.on('qr:tick', (data: { secondsRemaining: number; totalSeconds: number }) => {
      setActiveSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          qrExpiresIn: data.secondsRemaining,
          qrTotalDuration: data.totalSeconds,
        };
      });
    });

    socketClient.on('qr:rotated', (data: { qrCodeUrl: string; qrToken: string; secondsRemaining: number }) => {
      setActiveSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          qrCodeUrl: data.qrCodeUrl,
          qrToken: data.qrToken,
          qrExpiresIn: data.secondsRemaining,
        };
      });
    });

    socketClient.on('attendance:marked', (payload: { student: Student; stats: any; sessionId: string }) => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const updatedStudents = prev.students.map((s) =>
          s.id === payload.student.id ? payload.student : s
        );
        return {
          ...prev,
          students: updatedStudents,
          stats: payload.stats,
        };
      });
    });

    socketClient.on('attendance:updated', (payload: { student: Student; stats: any; sessionId: string }) => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const updatedStudents = prev.students.map((s) =>
          s.id === payload.student.id ? payload.student : s
        );
        return {
          ...prev,
          students: updatedStudents,
          stats: payload.stats,
        };
      });
    });

    setSocket(socketClient);

    // Initial fetch of meta data without force-logging in
    fetch('/api/teacher/meta')
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) setClasses(data.classes);
        if (data.subjects) setSubjects(data.subjects);
        if (data.branches) setBranches(data.branches);
        if (data.divisions) setDivisions(data.divisions);
        if (data.semesters) setSemesters(data.semesters);
        if (data.timetable) setTimetable(data.timetable);
        if (data.dailyAttendance) setDailyAttendance(data.dailyAttendance);
        if (data.lowAttendanceStudents) setLowAttendanceStudents(data.lowAttendanceStudents);
        if (data.activeSession) {
          setActiveSession(data.activeSession);
        }
      })
      .catch((err) => console.error('Failed to load teacher metadata:', err));

    return () => {
      socketClient.disconnect();
    };
  }, [teacher]);

  const handleTeacherLoginSuccess = (teacherData: Teacher, authToken: string) => {
    setTeacher(teacherData);
    setStudent(null);
    setToken(authToken);
    setActiveTab('dashboard');
  };

  const handleStudentLoginSuccess = (studentData: any, authToken: string) => {
    setStudent(studentData);
    setTeacher(null);
    setToken(authToken);
    setActiveTab('student');
  };

  const handleLogout = () => {
    setTeacher(null);
    setStudent(null);
    setToken(null);
    setActiveSession(null);
    setActiveTab('dashboard');
  };

  const handleStartSession = async (classId: string, subjectId: string, room: string) => {
    setIsStartingSession(true);
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, subjectId, room }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start session');
      }
      setActiveSession(data);
      setActiveTab('session');
    } catch (err: any) {
      alert(err.message || 'Error starting session');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch('/api/session/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        if (data.timetable) {
          setTimetable(data.timetable);
        }
        setActiveSession(null);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Failed to stop session:', err);
    }
  };

  const handleSimulateScan = async (isFlagged: boolean = false) => {
    if (!activeSession) return;
    try {
      await fetch('/api/session/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFlagged,
          flagReason: isFlagged ? 'BLE Range Discrepancy (Signal strength anomaly)' : undefined,
        }),
      });
    } catch (err) {
      console.error('Failed to simulate scan:', err);
    }
  };

  const handleOverrideStatus = async (studentId: string, newStatus: 'present' | 'flagged' | 'absent') => {
    if (!activeSession) return;
    try {
      await fetch('/api/session/override-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newStatus }),
      });
    } catch (err) {
      console.error('Failed to override status:', err);
    }
  };

  // If user is not logged in, render the clean Landing Page inspired by the reference design
  if (!teacher && !student) {
    return (
      <LandingPage
        onTeacherLoginSuccess={handleTeacherLoginSuccess}
        onStudentLoginSuccess={handleStudentLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-slate-900 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Persistent Navigation */}
      <Navbar
        teacher={teacher}
        student={student}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSessionActive={!!activeSession}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="animate-fadeIn">
        {/* If logged in as Student */}
        {student && (
          <StudentDashboard loggedInStudent={student} />
        )}

        {/* If logged in as Teacher */}
        {teacher && activeTab === 'dashboard' && (
          <Dashboard
            teacher={teacher}
            timetable={timetable}
            dailyAttendance={dailyAttendance}
            lowAttendanceStudents={lowAttendanceStudents}
            onStartSession={handleStartSession}
            onGoToClasses={() => setActiveTab('classes')}
          />
        )}

        {teacher && activeTab === 'classes' && (
          <ClassesManagement
            classes={classes}
            subjects={subjects}
            branches={branches}
            divisions={divisions}
            semesters={semesters}
            onStartSession={handleStartSession}
            onClassesUpdated={(updated) => setClasses(updated)}
            onSubjectsUpdated={(updated) => setSubjects(updated)}
            onBranchesUpdated={(updated) => setBranches(updated)}
            isLoading={isStartingSession}
          />
        )}

        {teacher && activeTab === 'session' && (
          activeSession ? (
            <LiveAttendanceDashboard
              session={activeSession}
              onEndSession={handleEndSession}
              onSimulateScan={handleSimulateScan}
              onOverrideStatus={handleOverrideStatus}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <span className="w-4 h-4 rounded-full bg-slate-300"></span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Active Attendance Session</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Select a class and subject from the schedule to initiate a real-time attendance session with dynamic QR rotation.
              </p>
              <button
                onClick={() => setActiveTab('classes')}
                className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Go to Classes
              </button>
            </div>
          )
        )}

        {teacher && activeTab === 'student' && (
          <StudentDashboard />
        )}
      </main>
    </div>
  );
}

