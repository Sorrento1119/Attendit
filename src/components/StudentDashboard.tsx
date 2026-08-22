import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  BookOpen,
  User,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Zap,
  ArrowRight,
  Upload,
  SwitchCamera,
  Search,
  Check,
  Smartphone,
  Info
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  avatar: string;
  classId: string;
  className: string;
  overallAttendance: number;
}

interface CurrentClassSession {
  id: string;
  sessionCode: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  room: string;
  timeSlot: string;
  teacherName: string;
  startedAt: string;
  status: string;
}

interface VerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  reason?: string;
  code?: string;
  record?: any;
}

interface StudentDashboardProps {
  loggedInStudent?: StudentData | null;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ loggedInStudent }) => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(loggedInStudent || null);
  const [activeSession, setActiveSession] = useState<CurrentClassSession | null>(null);
  const [alreadyMarked, setAlreadyMarked] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  // Manual & Roll search state
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [rollSearchQuery, setRollSearchQuery] = useState<string>('');
  const [isSelectingProfile, setIsSelectingProfile] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanAnimFrameRef = useRef<number | null>(null);

  // Fetch student directory and current class
  const fetchCurrentClassData = async (studentId?: string) => {
    setIsLoadingSession(true);
    try {
      const studentQuery = studentId ? `?studentId=${studentId}` : '';
      const res = await fetch(`/api/student/current-class${studentQuery}`);
      const data = await res.json();
      if (data.student) {
        setSelectedStudent(data.student);
      }
      setActiveSession(data.activeSession || null);
      setAlreadyMarked(!!data.alreadyMarked);
      setExistingRecord(data.existingRecord || null);
    } catch (err) {
      console.error('Failed to load student current class info:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    // Fetch students list for testing switch
    fetch('/api/student/list')
      .then((r) => r.json())
      .then((data) => {
        if (data.students && data.students.length > 0) {
          setStudents(data.students);
          // Check localStorage for previously selected roll
          const savedRoll = localStorage.getItem('attendit_student_roll');
          const matched = savedRoll ? data.students.find((s: StudentData) => s.rollNo === savedRoll) : null;
          const initial = matched || data.students[0];
          setSelectedStudent(initial);
          fetchCurrentClassData(initial.id);
        }
      })
      .catch(() => {
        fetchCurrentClassData();
      });

    // Check if opened with scan data directly in URL parameters
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || params.get('t');
    const scanDataParam = params.get('scanData');
    if (tokenParam || scanDataParam) {
      handleVerifyToken(tokenParam || scanDataParam || '');
    }
  }, []);

  // Handle switching active student test profile
  const handleSelectStudent = (std: StudentData) => {
    setSelectedStudent(std);
    localStorage.setItem('attendit_student_roll', std.rollNo);
    setVerificationResult(null);
    setIsSelectingProfile(false);
    fetchCurrentClassData(std.id);
  };

  // Start Camera Stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setVerificationResult(null);
    setIsScannerOpen(true);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startScanLoop();
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Tap "Snap Photo / Upload" below, or allow camera permissions in your browser settings.'
          : `Camera not accessible (${err.message || 'Check camera'}). You can use the "Snap Photo / Upload" option.`
      );
    }
  };

  // Switch camera between front and back
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Stop Camera
  const stopCamera = () => {
    if (scanAnimFrameRef.current) {
      cancelAnimationFrame(scanAnimFrameRef.current);
      scanAnimFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScannerOpen(false);
  };

  // Scanning loop using jsQR on HTML5 Canvas
  const startScanLoop = () => {
    const scan = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (qrCode && qrCode.data) {
              console.log('QR Code scanned successfully:', qrCode.data);
              stopCamera();
              handleVerifyToken(qrCode.data);
              return;
            }
          }
        }
      }
      scanAnimFrameRef.current = requestAnimationFrame(scan);
    };
    scanAnimFrameRef.current = requestAnimationFrame(scan);
  };

  // Photo / File Upload fallback scan
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode && qrCode.data) {
            stopCamera();
            handleVerifyToken(qrCode.data);
          } else {
            setVerificationResult({
              success: false,
              error: 'QR Code Not Found in Image',
              reason: 'Could not detect a valid QR code in the uploaded image. Please make sure the QR code is clearly visible and well lit.',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Send Token to /api/verify
  const handleVerifyToken = async (qrDataString: string) => {
    if (!selectedStudent) return;
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const payload = {
        rawQrData: qrDataString,
        studentId: selectedStudent.id,
        rollNo: selectedStudent.rollNo,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          device: window.innerWidth < 768 ? 'Mobile Device Scanner' : 'Desktop/Tablet Web Scanner',
        },
      };

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setVerificationResult(data);

      if (data.success) {
        setAlreadyMarked(true);
        setExistingRecord(data.record);
        // Refresh session stats
        fetchCurrentClassData(selectedStudent.id);
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        error: 'Network Error',
        reason: err.message || 'Failed to reach verification server. Please ensure you are connected to the network.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Quick test scan helper
  const handleSimulateActiveScan = async () => {
    if (!activeSession) return;
    try {
      const sessionRes = await fetch('/api/session/active');
      const sessionData = await sessionRes.json();
      if (sessionData.activeSession && sessionData.activeSession.qrToken) {
        handleVerifyToken(sessionData.activeSession.qrToken);
      } else {
        alert('No active session token found to simulate.');
      }
    } catch {
      alert('Could not fetch active session token.');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(rollSearchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(rollSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Hidden file input for camera snap / photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageFileUpload}
      />

      {/* Student Identity Card with Quick Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-3.5 w-full sm:w-auto">
            <img
              src={selectedStudent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={selectedStudent?.name || 'Student'}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-slate-100 border border-slate-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 truncate">
                  {selectedStudent?.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold shrink-0">
                  {selectedStudent?.rollNo}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {selectedStudent?.className}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              onClick={() => setIsSelectingProfile(!isSelectingProfile)}
              className="w-full sm:w-auto px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Change Roll No</span>
            </button>
            <button
              onClick={() => fetchCurrentClassData(selectedStudent?.id)}
              title="Refresh Session Status"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Selector Dropdown / Search Modal */}
        {isSelectingProfile && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or roll no (e.g. 22CS001)..."
                value={rollSearchQuery}
                onChange={(e) => setRollSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-50">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between transition-colors ${
                    selectedStudent?.id === s.id
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full object-cover" />
                    <div className="truncate">
                      <p className="text-xs font-semibold">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{s.rollNo}</p>
                    </div>
                  </div>
                  {selectedStudent?.id === s.id && <Check className="w-4 h-4 text-slate-900 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verification Result Feedback Banner */}
      {verificationResult && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {verificationResult.success ? (
            <div className="bg-emerald-600 text-white rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold font-mono uppercase">
                      STATUS: PRESENT
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold font-mono">
                      VERIFIED
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold mt-1">Attendance Marked Successfully!</h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {verificationResult.message || 'Attendance logged in real-time. Live session updated.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVerificationResult(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-white text-emerald-900 text-xs font-bold hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div className="bg-rose-600 text-white rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold font-mono uppercase">
                      CODE: {verificationResult.code || 'VERIFY_FAILED'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold mt-1">
                    {verificationResult.error || 'Verification Failed'}
                  </h4>
                  <p className="text-xs text-rose-100 mt-0.5 leading-relaxed">
                    {verificationResult.reason || 'Verification criteria could not be satisfied.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVerificationResult(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-white text-rose-900 text-xs font-bold hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Card: Current Class Session Info & Scan Buttons */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-full bg-slate-100 text-slate-800">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">Current Class Schedule</h3>
              <p className="text-xs text-slate-500">Live lecture status</p>
            </div>
          </div>

          {activeSession ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
              Live Session Open
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              No Active Session
            </span>
          )}
        </div>

        {isLoadingSession ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-5 h-5 text-slate-900 animate-spin" />
            <p className="text-xs text-slate-500">Checking for active session...</p>
          </div>
        ) : activeSession ? (
          <div className="space-y-4">
            {/* Subject Hero */}
            <div className="p-5 rounded-3xl bg-slate-950 text-white space-y-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold text-slate-200">
                    {activeSession.subjectCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-slate-200">
                    Branch: {activeSession.className}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center space-x-1.5 font-medium bg-white/10 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Timings: <strong className="text-white">{activeSession.timeSlot}</strong></span>
                </div>
              </div>
              <h4 className="text-lg sm:text-xl font-['Playfair_Display',Georgia,serif] font-bold tracking-tight">{activeSession.subjectName}</h4>
              <p className="text-xs text-slate-300">
                Faculty: <span className="font-semibold text-white">{activeSession.teacherName}</span> • Room:{' '}
                <span className="font-semibold text-slate-200">{activeSession.room}</span>
              </p>
            </div>

            {/* Attendance Status */}
            {alreadyMarked ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-900">Attendance Already Recorded</h5>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your attendance was logged at{' '}
                    <span className="font-bold">{existingRecord?.timestamp || 'Recently'}</span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-800 flex items-start space-x-3">
                <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed">
                  Scan the rotating QR code on the teacher's screen to register attendance.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200/60">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">No Active Session</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                When your instructor starts attendance, class info and scanner will activate.
              </p>
            </div>
          </div>
        )}

        {/* Scan Actions */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => startCamera('environment')}
            disabled={isVerifying || isScannerOpen}
            className="w-full py-3.5 px-4 rounded-full bg-slate-950 hover:bg-slate-900 active:scale-98 disabled:opacity-50 text-white text-sm font-bold shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Open Camera QR Scanner</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isVerifying || isScannerOpen}
              className="py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Snap / Upload Photo</span>
            </button>

            {activeSession && (
              <button
                onClick={handleSimulateActiveScan}
                disabled={isVerifying || isScannerOpen}
                className="py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Test Scan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Camera Scanner Full-Screen/Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm">Align QR Code in Frame</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleCamera}
                title="Flip Camera"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
              <button
                onClick={stopCamera}
                title="Close Scanner"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Viewport Box */}
          <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden rounded-3xl bg-black border border-white/10">
            {cameraError ? (
              <div className="p-6 text-center text-white space-y-4 max-w-sm">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-200 leading-relaxed">{cameraError}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      stopCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Snap / Upload QR Photo Instead
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target Bounding Frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="w-64 h-64 border-2 border-indigo-400/80 rounded-2xl relative shadow-2xl">
                    <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl"></span>
                    <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr"></span>
                    <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl"></span>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br"></span>

                    {/* Animated Laser Scan Bar */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-white/10 text-white space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>Point at active rotating QR code</span>
              <button
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="text-indigo-400 hover:underline cursor-pointer"
              >
                Upload Photo
              </button>
            </div>

            {/* Manual Token Paste */}
            <div className="pt-2 border-t border-white/10 flex gap-2">
              <input
                type="text"
                placeholder="Or paste QR token here..."
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                className="text-xs flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  if (manualTokenInput.trim()) {
                    stopCamera();
                    handleVerifyToken(manualTokenInput.trim());
                  }
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
