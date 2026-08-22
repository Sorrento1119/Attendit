import React from 'react';
import { Teacher } from '../types';
import { QrCode, LogOut, Calendar, Clock, Smartphone, ChevronRight, GraduationCap, User } from 'lucide-react';

interface NavbarProps {
  teacher: Teacher | null;
  student?: any | null;
  activeTab: 'dashboard' | 'classes' | 'session' | 'student';
  setActiveTab: (tab: 'dashboard' | 'classes' | 'session' | 'student') => void;
  isSessionActive: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  teacher,
  student,
  activeTab,
  setActiveTab,
  isSessionActive,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Title */}
          <div className="flex items-center space-x-2.5 cursor-pointer group" onClick={() => setActiveTab(teacher ? 'dashboard' : 'student')}>
            <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">attendit</span>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                {teacher ? 'Faculty Management' : student ? 'Student Attendance' : 'Smart Attendance System'}
              </p>
            </div>
          </div>

          {/* Core Navigation Tabs (Only for Teacher) */}
          {teacher && (
            <nav className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'classes'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Classes
              </button>
              <button
                onClick={() => setActiveTab('session')}
                className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'session'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Live Session</span>
                {isSessionActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </button>
            </nav>
          )}

          {/* Right Controls & User Profile */}
          <div className="flex items-center space-x-3">
            {/* If Teacher is logged in, show student mode preview toggle */}
            {teacher && (
              <button
                onClick={() => setActiveTab(activeTab === 'student' ? 'dashboard' : 'student')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                  activeTab === 'student'
                    ? 'bg-slate-950 text-white border-slate-950'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100 shadow-2xs'
                }`}
                title="Student QR Scanner Preview"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{activeTab === 'student' ? 'Teacher View' : 'Student Mode'}</span>
              </button>
            )}

            {/* Time / Date */}
            <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-slate-200/80 rounded-full text-xs text-slate-600 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
              <span className="text-slate-300">·</span>
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-mono font-semibold text-slate-900">{formattedTime}</span>
            </div>

            {/* Profile & Logout (Teacher or Student) */}
            {teacher ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">{teacher.name}</p>
                  <span className="text-[10px] text-indigo-600 font-semibold">Faculty</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : student ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
                <img
                  src={student.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop'}
                  alt={student.name}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">{student.name}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold font-mono">{student.rollNo || 'Student'}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-semibold text-rose-600 hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-slate-950 text-white rounded-full text-xs font-semibold hover:bg-slate-900 transition-all cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs for Teacher */}
        {teacher && (
          <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                activeTab === 'dashboard' ? 'bg-slate-950 text-white' : 'text-slate-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                activeTab === 'classes' ? 'bg-slate-950 text-white' : 'text-slate-600'
              }`}
            >
              Classes
            </button>
            <button
              onClick={() => setActiveTab('session')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                activeTab === 'session' ? 'bg-slate-950 text-white' : 'text-slate-600'
              }`}
            >
              <span>Live Session</span>
              {isSessionActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
