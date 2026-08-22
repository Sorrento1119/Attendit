import React, { useState } from 'react';
import { Teacher, Student } from '../types';
import {
  QrCode,
  Lock,
  Mail,
  ArrowRight,
  GraduationCap,
  KeyRound,
  UserCheck,
  Smartphone,
  ChevronRight,
  X,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onTeacherLoginSuccess: (teacher: Teacher, token: string) => void;
  onStudentLoginSuccess: (student: any, token: string) => void;
}

interface DemoCredential {
  role: 'teacher' | 'student';
  name: string;
  title: string;
  email: string;
  rollNo?: string;
  password?: string;
  department: string;
  avatar: string;
  classInfo?: string;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: 'teacher',
    name: 'Prof. Anjali Sharma',
    title: 'Faculty / Professor',
    email: 'anjali.sharma@smartcampus.edu',
    password: 'teacher123',
    department: 'Computer Science & Eng.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop',
    classInfo: 'CSE-A, CSE-B (Sem 4)',
  },
  {
    role: 'student',
    name: 'Aditya Verma',
    title: 'Student (CSE-A)',
    email: 'aditya.verma.001@smartcampus.edu',
    rollNo: '22CS001',
    password: 'student123',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
    classInfo: 'Semester 4 · Roll 001',
  },
  {
    role: 'student',
    name: 'Sneha Patil',
    title: 'Student (CSE-A)',
    email: 'sneha.patil.002@smartcampus.edu',
    rollNo: '22CS002',
    password: 'student123',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
    classInfo: 'Semester 4 · Roll 002',
  },
  {
    role: 'student',
    name: 'Vikram Patel',
    title: 'Student (CSE-B)',
    email: 'vikram.patel.009@smartcampus.edu',
    rollNo: '22CS009',
    password: 'student123',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=120&auto=format&fit=crop',
    classInfo: 'Semester 4 · Roll 009',
  },
  {
    role: 'student',
    name: 'Diya Menon',
    title: 'Student (IT-A)',
    email: 'diya.menon.016@smartcampus.edu',
    rollNo: '22IT016',
    password: 'student123',
    department: 'Information Tech',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=120&auto=format&fit=crop',
    classInfo: 'Semester 6 · Roll 016',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onTeacherLoginSuccess,
  onStudentLoginSuccess,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'teacher' | 'student'>('teacher');
  const [email, setEmail] = useState('anjali.sharma@smartcampus.edu');
  const [password, setPassword] = useState('teacher123');
  const [rollNo, setRollNo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAuthModal = (defaultRole: 'teacher' | 'student' = 'teacher') => {
    setAuthRole(defaultRole);
    setError(null);
    if (defaultRole === 'teacher') {
      setEmail('anjali.sharma@smartcampus.edu');
      setPassword('teacher123');
      setRollNo('');
    } else {
      setEmail('aditya.verma.001@smartcampus.edu');
      setPassword('student123');
      setRollNo('22CS001');
    }
    setIsModalOpen(true);
  };

  const handleRoleSwitch = (role: 'teacher' | 'student') => {
    setAuthRole(role);
    setError(null);
    if (role === 'teacher') {
      setEmail('anjali.sharma@smartcampus.edu');
      setPassword('teacher123');
      setRollNo('');
    } else {
      setEmail('aditya.verma.001@smartcampus.edu');
      setPassword('student123');
      setRollNo('22CS001');
    }
  };

  const handleAutofill = (cred: DemoCredential) => {
    setAuthRole(cred.role);
    setEmail(cred.email);
    setPassword(cred.password || 'password123');
    setRollNo(cred.rollNo || '');
    setError(null);
  };

  const handleInstantLogin = async (cred: DemoCredential) => {
    setIsLoading(true);
    setError(null);
    try {
      if (cred.role === 'teacher') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cred.email, password: cred.password || 'teacher123' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        onTeacherLoginSuccess(data.teacher, data.token);
      } else {
        const res = await fetch('/api/auth/student-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cred.email,
            rollNo: cred.rollNo,
            password: cred.password || 'student123',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Student login failed');
        onStudentLoginSuccess(data.student, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (authRole === 'teacher') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Teacher login failed');
        onTeacherLoginSuccess(data.teacher, data.token);
      } else {
        const res = await fetch('/api/auth/student-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, rollNo, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Student login failed');
        onStudentLoginSuccess(data.student, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* Aesthetic Ambient Curved Spheres / Orbs matching inspiration */}
      <div
        className="pointer-events-none absolute -left-32 top-1/4 w-[380px] h-[380px] rounded-full opacity-85 blur-[1px] -z-0"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #0f766e 0%, #115e59 40%, #042f2e 85%)',
          boxShadow: '0 0 80px rgba(15, 118, 110, 0.15)',
        }}
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 w-[320px] h-[320px] rounded-full opacity-80 blur-[1px] -z-0"
        style={{
          background: 'radial-gradient(circle at 60% 40%, #d97706 0%, #b45309 45%, #451a03 90%)',
          boxShadow: '0 0 80px rgba(217, 119, 6, 0.12)',
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 -top-40 -translate-x-1/2 w-[600px] h-[220px] rounded-full opacity-35 blur-[120px] -z-0"
        style={{
          background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
        }}
      />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6 pb-4 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5 group cursor-pointer" onClick={() => setIsModalOpen(false)}>
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">smartcampus</span>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => openAuthModal('teacher')}
            className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center space-x-2 cursor-pointer hover:shadow-md active:scale-98"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign in / Login</span>
          </button>
        </div>
      </header>

      {/* Main Landing Centerpiece */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 py-16 md:py-24 text-center flex-1 flex flex-col items-center justify-center">
        {/* Eyebrow Label */}
        <div className="inline-flex items-center space-x-1.5 mb-6 text-xs font-medium text-slate-600 bg-white/80 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-xs backdrop-blur-xs">
          <span>A modern attendance ecosystem from</span>
          <span className="font-semibold text-slate-900 underline underline-offset-4 decoration-slate-300">
            SmartCampus
          </span>
        </div>

        {/* Editorial Serif Display Headline */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-slate-900 tracking-tight leading-[1.08] max-w-3xl mx-auto"
          style={{ fontFamily: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif" }}
        >
          The attendance system that works for you
        </h1>

        {/* Short & Simple Subtitle */}
        <p className="mt-6 text-sm sm:text-base text-slate-600 font-normal max-w-xl mx-auto leading-relaxed">
          Available for Teachers, Students, and Campus Administrators
        </p>

        {/* Primary Inspiration CTA Pill (Triggers Popup) */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => openAuthModal('teacher')}
            className="group px-7 py-3.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-medium text-sm transition-all shadow-lg shadow-slate-950/15 flex items-center space-x-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
            <span>Sign in / Access Portal</span>
          </button>
        </div>

        {/* Quick Instant Test Login Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Quick direct access:</span>
          <button
            onClick={() => handleInstantLogin(DEMO_CREDENTIALS[0])}
            className="px-3 py-1.5 rounded-full bg-white/90 border border-slate-200/90 text-slate-700 hover:bg-slate-100 font-semibold transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-2xs hover:shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Teacher Portal</span>
          </button>
          <button
            onClick={() => handleInstantLogin(DEMO_CREDENTIALS[1])}
            className="px-3 py-1.5 rounded-full bg-white/90 border border-slate-200/90 text-slate-700 hover:bg-slate-100 font-semibold transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-2xs hover:shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Student Portal</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 text-center border-t border-slate-200/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} SmartCampus System. Anti-Proxy Dynamic QR Verification.</p>
        <p className="text-[11px] text-slate-500">Uniform typography & layout standard.</p>
      </footer>

      {/* SIGN IN / ACCESS PORTAL MODAL POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          {/* Overlay click to close */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => !isLoading && setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">SmartCampus Portal</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Select your role to sign in</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Two Column Layout */}
            <div className="overflow-y-auto p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left Side: Form */}
                <div className="md:col-span-7">
                  {/* Role Switcher Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-full mb-5 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('teacher')}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        authRole === 'teacher'
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>As Teacher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('student')}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        authRole === 'student'
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>As Student</span>
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {authRole === 'teacher' ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Faculty Email Address
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              placeholder="faculty@smartcampus.edu"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              placeholder="••••••••"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Student Email or Roll Number
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              placeholder="22CS001 or student@smartcampus.edu"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              placeholder="••••••••"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 active:scale-98 text-white rounded-full font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
                    >
                      {isLoading ? (
                        <span>Authenticating...</span>
                      ) : (
                        <>
                          <span>{authRole === 'teacher' ? 'Sign In as Faculty' : 'Sign In as Student'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right Side: Demo Credentials */}
                <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0 space-y-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                      <span>Test Profiles</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">1-click test</span>
                  </div>

                  <div className="space-y-2">
                    {DEMO_CREDENTIALS.map((cred, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-100/80 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={cred.avatar}
                            alt={cred.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{cred.name}</p>
                            <span
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                cred.role === 'teacher'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {cred.role === 'teacher' ? 'Faculty' : cred.rollNo}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAutofill(cred)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-full text-[10px] font-semibold border border-slate-200 transition-all cursor-pointer"
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInstantLogin(cred)}
                            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-full text-[10px] font-semibold transition-all cursor-pointer flex items-center"
                          >
                            <span>Login</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
