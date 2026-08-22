import React, { useState, useEffect } from 'react';
import { AttendanceSession, Student } from '../types';
import {
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserX,
  Search,
  CheckCircle2,
  StopCircle,
  Zap,
  Radio,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

interface LiveAttendanceDashboardProps {
  session: AttendanceSession;
  onEndSession: () => void;
  onSimulateScan: (isFlagged?: boolean) => void;
  onOverrideStatus?: (studentId: string, newStatus: 'present' | 'flagged' | 'absent') => void;
}

export const LiveAttendanceDashboard: React.FC<LiveAttendanceDashboardProps> = ({
  session,
  onEndSession,
  onSimulateScan,
  onOverrideStatus,
}) => {
  // Tab for filtering student roster: 'attendees' (present), 'flagged', 'absent'
  const [activeListTab, setActiveListTab] = useState<'attendees' | 'flagged' | 'absent'>('attendees');
  const [searchQuery, setSearchQuery] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Time elapsed live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Group students
  const presentStudents = session.students.filter((s) => s.status === 'present');
  const flaggedStudents = session.students.filter((s) => s.status === 'flagged');
  const absentStudents = session.students.filter((s) => s.status === 'absent');

  // Filtered roster based on tab & search
  const currentList =
    activeListTab === 'attendees'
      ? presentStudents
      : activeListTab === 'flagged'
      ? flaggedStudents
      : absentStudents;

  const filteredStudents = currentList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const qrSeconds = session.qrExpiresIn ?? 15;
  const qrTotal = session.qrTotalDuration || 15;
  const qrProgressPercent = Math.max(0, Math.min(100, (qrSeconds / qrTotal) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header: Class Details, Time Elapsed, and End Session */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Class Details */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {session.subjectCode}
            </span>
            <h1 className="text-xl sm:text-2xl font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 tracking-tight">
              {session.subjectName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-900 bg-slate-100 px-3 py-0.5 rounded-full">
              Branch: {session.className}
            </span>
            <div className="flex items-center space-x-1.5 bg-slate-50 text-slate-800 px-3 py-0.5 rounded-full font-medium border border-slate-200/80">
              <Clock className="w-3.5 h-3.5 text-slate-700" />
              <span>Timings:</span>
              <span className="font-bold text-slate-900">
                {session.timeSlot ? session.timeSlot : `Start: ${session.startedAt || '10:00 AM'} → Finish: Active`}
              </span>
            </div>
            <div className="flex items-center space-x-1 font-medium text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{session.room}</span>
            </div>
            <span className="text-slate-600 font-medium">Faculty: {session.teacherName}</span>
          </div>
        </div>

        {/* Time Elapsed & End Session Button */}
        <div className="flex items-center space-x-4 shrink-0">
          {/* Time Elapsed */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Time Elapsed
            </span>
            <span className="text-lg font-extrabold font-mono text-slate-900">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>

          {/* End Session Button */}
          <button
            onClick={onEndSession}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-full font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <StopCircle className="w-4 h-4" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* 2. Main Live Layout: Dynamic QR (Left) and Lists of Attendees, Flagged, Absent (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (lg:col-span-5): Dynamic QR Code */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-slate-700" />
              <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">Dynamic Rotating QR</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
              Rotates in {qrSeconds}s
            </span>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm">
              <img
                src={session.qrCodeUrl}
                alt="Dynamic Attendance QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl"
              />
            </div>

            {/* Rotation Countdown Bar */}
            <div className="w-full max-w-xs mt-5 space-y-1.5">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${qrProgressPercent}%` }}
                  className="h-full bg-slate-950 transition-all duration-1000 ease-linear rounded-full"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Auto-refreshes every 15s</span>
                <span className="font-mono font-bold text-slate-800">{qrSeconds}s remaining</span>
              </div>
            </div>
          </div>

          {/* Test / Simulation Controls */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Simulation Controls
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onSimulateScan(false)}
                className="py-2.5 px-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200/80 rounded-full font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simulate Scan</span>
              </button>
              <button
                onClick={() => onSimulateScan(true)}
                className="py-2.5 px-3 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 border border-slate-200/80 rounded-full font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulate Proxy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-7): Student Lists (Attendees, Flagged, Absent) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header & Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">Student Attendance Roster</h3>
              <span className="text-xs text-slate-600 font-mono bg-slate-100 px-3 py-1 rounded-full">
                {presentStudents.length} / {session.students.length} Present
              </span>
            </div>

            {/* Filter Tabs: Attendees (Present), Flagged, Absent */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200/60">
              <button
                onClick={() => setActiveListTab('attendees')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeListTab === 'attendees'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attendees ({presentStudents.length})</span>
              </button>

              <button
                onClick={() => setActiveListTab('flagged')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeListTab === 'flagged'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Flagged ({flaggedStudents.length})</span>
              </button>

              <button
                onClick={() => setActiveListTab('absent')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeListTab === 'absent'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                <span>Absent ({absentStudents.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeListTab} by name or roll number...`}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Student List Container */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {student.name}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-500">
                        {student.rollNo}
                      </span>
                    </div>

                    {student.status === 'present' && (
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1 mt-0.5">
                        <span>Marked at {student.markedAt || 'Just now'}</span>
                        {student.verificationMethod && <span>· {student.verificationMethod}</span>}
                      </p>
                    )}

                    {student.status === 'flagged' && (
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        {student.flagReason || 'Proximity / Token discrepancy'}
                      </p>
                    )}

                    {student.status === 'absent' && (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Not checked in
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Status Badge & Manual Actions */}
                <div className="shrink-0 flex items-center space-x-2">
                  {student.status === 'present' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      Present
                    </span>
                  )}

                  {student.status === 'flagged' && onOverrideStatus && (
                    <button
                      onClick={() => onOverrideStatus(student.id, 'present')}
                      className="px-3.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-full text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  )}

                  {student.status === 'absent' && onOverrideStatus && (
                    <button
                      onClick={() => onOverrideStatus(student.id, 'present')}
                      className="px-3.5 py-1 bg-slate-200 hover:bg-slate-950 hover:text-white text-slate-700 rounded-full text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Mark Present
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No students found in {activeListTab} list.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
