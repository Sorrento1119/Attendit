import React, { useState } from 'react';
import { Teacher } from '../types';
import { QrCode, ShieldCheck, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, Users, Radio } from 'lucide-react';

interface TeacherLoginProps {
  onLoginSuccess: (teacher: Teacher, token: string) => void;
  onOpenStudentScanner?: () => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLoginSuccess, onOpenStudentScanner }) => {
  const [email, setEmail] = useState('anjali.sharma@smartcampus.edu');
  const [password, setPassword] = useState('teacher123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      onLoginSuccess(data.teacher, data.token);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('anjali.sharma@smartcampus.edu');
    setPassword('teacher123');
    setIsLoading(true);
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anjali.sharma@smartcampus.edu', password: 'teacher123' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.teacher && data.token) {
          onLoginSuccess(data.teacher, data.token);
        }
      })
      .catch(() => setError('Demo login failed'))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50/70">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Feature Showcase */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Smart Attendance & Anti-Proxy System
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automated rotating QR attendance with real-time verification and class roster synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Rotating QR Code</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Rotates dynamically every 15 seconds</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Verification Pipeline</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Validates enrollment and prevents duplicates</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Live Roster</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Live student check-in updates</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Instant Analytics</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time counts and summaries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Teacher Portal</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sign in to initiate classroom attendance</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Faculty Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="faculty@smartcampus.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-3">
              <p className="text-xs text-slate-500">Quick Demo Testing Profile</p>
              <button
                onClick={handleDemoLogin}
                type="button"
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-medium text-xs transition-all flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop"
                  alt="Prof. Anjali Sharma"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>Log in as <strong>Prof. Anjali Sharma</strong> (CSE Dept)</span>
              </button>

              {onOpenStudentScanner && (
                <div className="pt-2">
                  <button
                    onClick={onOpenStudentScanner}
                    type="button"
                    className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>Student Attendance QR Scanner Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
