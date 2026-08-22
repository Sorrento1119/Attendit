/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ClassesManagement } from './components/ClassesManagement';
import { LiveAttendanceDashboard } from './components/LiveAttendanceDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { safeFetchJson } from './utils/apiClient';
import {
  INITIAL_BRANCHES,
  INITIAL_CLASSES,
  INITIAL_DIVISIONS,
  INITIAL_SEMESTERS,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE,
  INITIAL_DAILY_ATTENDANCE,
  INITIAL_LOW_ATTENDANCE,
} from './data/initialData';
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

  const [classes, setClasses] = useState<ClassItem[]>(INITIAL_CLASSES);
  const [subjects, setSubjects] = useState<SubjectItem[]>(INITIAL_SUBJECTS);
  const [branches, setBranches] = useState<BranchItem[]>(INITIAL_BRANCHES);
  const [divisions, setDivisions] = useState<DivisionItem[]>(INITIAL_DIVISIONS);
  const [semesters, setSemesters] = useState<SemesterItem[]>(INITIAL_SEMESTERS);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(INITIAL_TIMETABLE);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceStat[]>(INITIAL_DAILY_ATTENDANCE);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>(INITIAL_LOW_ATTENDANCE);
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
      console.log('Connected to AttendIt Socket.IO Server');
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

    // Initial fetch of meta data
    safeFetchJson('/api/teacher/meta')
      .then(({ ok, data }) => {
        if (ok && data) {
          if (data.classes?.length) setClasses(data.classes);
          if (data.subjects?.length) setSubjects(data.subjects);
          if (data.branches?.length) setBranches(data.branches);
          if (data.divisions?.length) setDivisions(data.divisions);
          if (data.semesters?.length) setSemesters(data.semesters);
          if (data.timetable?.length) setTimetable(data.timetable);
          if (data.dailyAttendance?.length) setDailyAttendance(data.dailyAttendance);
          if (data.lowAttendanceStudents?.length) setLowAttendanceStudents(data.lowAttendanceStudents);
          if (data.activeSession) {
            setActiveSession(data.activeSession);
          }
        }
      })
      .catch(() => {});

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
      const { ok, data } = await safeFetchJson('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, subjectId, room }),
      });

      if (ok && data && data.sessionId) {
        setActiveSession(data);
        setActiveTab('session');
      } else {
        // Standalone client fallback for static Vercel hosting
        const targetClass = classes.find((c) => c.id === classId) || classes[0];
        const targetSubject = subjects.find((s) => s.id === subjectId) || subjects[0];
        const initialToken = 'STATIC_SESSION_TOKEN_' + Date.now();
        const qrUrl = await QRCode.toDataURL(
          JSON.stringify({
            app: 'AttendIt',
            sessionId: 'sess-' + Date.now(),
            sessionCode: 'CS' + Math.floor(1000 + Math.random() * 9000),
            token: initialToken,
            room,
          }),
          { width: 320, margin: 2 }
        );

        const mockSession: AttendanceSession = {
          sessionId: 'sess-' + Date.now(),
          sessionCode: 'CS401',
          classId: targetClass.id,
          className: targetClass.name,
          subjectId: targetSubject.id,
          subjectName: targetSubject.name,
          room: room || 'Lab 302 (North Wing)',
          startedAt: new Date().toISOString(),
          qrExpiresIn: 15,
          qrTotalDuration: 15,
          qrCodeUrl: qrUrl,
          qrToken: initialToken,
          stats: {
            total: targetClass.totalStudents,
            totalStudents: targetClass.totalStudents,
            present: 0,
            flagged: 0,
            absent: targetClass.totalStudents,
            attendanceRate: 0,
          },
          students: [
            {
              id: 'std-class-cse-a-1',
              name: 'Aditya Verma',
              rollNo: '22CS001',
              email: 'aditya.verma.001@attendit.edu',
              avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
              classId: targetClass.id,
              overallAttendance: 94,
              status: 'absent',
            },
            {
              id: 'std-class-cse-a-2',
              name: 'Sneha Patil',
              rollNo: '22CS002',
              email: 'sneha.patil.002@attendit.edu',
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
              classId: targetClass.id,
              overallAttendance: 91,
              status: 'absent',
            },
            {
              id: 'std-class-cse-a-3',
              name: 'Rohan Mehta',
              rollNo: '22CS003',
              email: 'rohan.mehta.003@attendit.edu',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
              classId: targetClass.id,
              overallAttendance: 88,
              status: 'absent',
            },
          ],
        };
        setActiveSession(mockSession);
        setActiveTab('session');
      }
    } catch (err: any) {
      alert(err?.message || 'Error starting session');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      const { ok, data } = await safeFetchJson('/api/session/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (ok && data?.timetable) {
        setTimetable(data.timetable);
      }
    } catch {
      // safe fallback
    } finally {
      setActiveSession(null);
      setActiveTab('dashboard');
    }
  };

  const handleSimulateScan = async (isFlagged: boolean = false) => {
    if (!activeSession) return;
    try {
      const { ok } = await safeFetchJson('/api/session/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFlagged,
          flagReason: isFlagged ? 'BLE Range Discrepancy (Signal strength anomaly)' : undefined,
        }),
      });

      if (!ok) {
        // Local simulation fallback
        setActiveSession((prev) => {
          if (!prev) return null;
          const unverified = prev.students.filter((s) => s.status === 'absent');
          if (unverified.length === 0) return prev;
          const randomStudent = unverified[Math.floor(Math.random() * unverified.length)];
          const newStatus = isFlagged ? 'flagged' : 'present';
          const updated = prev.students.map((s) =>
            s.id === randomStudent.id
              ? {
                  ...s,
                  status: newStatus as any,
                  verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  verificationMethod: isFlagged ? 'Flagged Proxy Attempt' : 'Rotating QR + BLE Range Validated',
                  isFlagged,
                  flagReason: isFlagged ? 'BLE Range Discrepancy (Signal strength anomaly)' : undefined,
                }
              : s
          );
          const presentCount = updated.filter((s) => s.status === 'present').length;
          const flaggedCount = updated.filter((s) => s.status === 'flagged').length;
          const absentCount = updated.filter((s) => s.status === 'absent').length;
          return {
            ...prev,
            students: updated,
            stats: {
              ...prev.stats,
              present: presentCount,
              flagged: flaggedCount,
              absent: absentCount,
              attendanceRate: Math.round((presentCount / prev.stats.totalStudents) * 100),
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to simulate scan:', err);
    }
  };

  const handleOverrideStatus = async (studentId: string, newStatus: 'present' | 'flagged' | 'absent') => {
    if (!activeSession) return;
    try {
      await safeFetchJson('/api/session/override-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newStatus }),
      });
    } catch {
      // safe fallback
    }
    // Update local state directly
    setActiveSession((prev) => {
      if (!prev) return null;
      const updated = prev.students.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s));
      const presentCount = updated.filter((s) => s.status === 'present').length;
      const flaggedCount = updated.filter((s) => s.status === 'flagged').length;
      const absentCount = updated.filter((s) => s.status === 'absent').length;
      return {
        ...prev,
        students: updated,
        stats: {
          ...prev.stats,
          present: presentCount,
          flagged: flaggedCount,
          absent: absentCount,
          attendanceRate: Math.round((presentCount / prev.stats.totalStudents) * 100),
        },
      };
    });
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

