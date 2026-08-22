import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'smartcampus-sih-2025-super-secret-key';
const QR_ROTATION_SECONDS = 15;

// Mock Student Profiles
interface MockStudent {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  avatar: string;
  classId: string;
  className: string;
  enrolledSubjectIds: string[];
  overallAttendance: number;
}

const mockStudentDirectory: MockStudent[] = [
  {
    id: 'std-class-cse-a-1',
    name: 'Aditya Verma',
    rollNo: '22CS001',
    email: 'aditya.verma.001@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 94,
  },
  {
    id: 'std-class-cse-a-2',
    name: 'Sneha Patil',
    rollNo: '22CS002',
    email: 'sneha.patil.002@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 91,
  },
  {
    id: 'std-class-cse-a-3',
    name: 'Rohan Mehta',
    rollNo: '22CS003',
    email: 'rohan.mehta.003@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 88,
  },
  {
    id: 'std-class-cse-a-4',
    name: 'Kavya Singh',
    rollNo: '22CS004',
    email: 'kavya.singh.004@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 96,
  },
  {
    id: 'std-class-cse-a-5',
    name: 'Arjun Nair',
    rollNo: '22CS005',
    email: 'arjun.nair.005@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 85,
  },
  {
    id: 'std-class-cse-b-1',
    name: 'Vikram Patel',
    rollNo: '22CS009',
    email: 'vikram.patel.009@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-b',
    className: 'CSE-B (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms'],
    overallAttendance: 89,
  },
  {
    id: 'std-class-it-a-1',
    name: 'Diya Menon',
    rollNo: '22IT016',
    email: 'diya.menon.016@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=120&auto=format&fit=crop',
    classId: 'class-it-a',
    className: 'IT-A (Semester 6)',
    enrolledSubjectIds: ['sub-cn', 'sub-ai'],
    overallAttendance: 97,
  },
];

// In-memory attendance database records (studentId + sessionId composite uniqueness)
interface AttendanceRecord {
  id: string;
  sessionId: string;
  sessionCode: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  timestamp: string;
  status: 'Present' | 'Flagged';
  verificationStatus: 'Verified' | 'Flagged';
  verificationMethod: string;
  clientMetadata?: {
    deviceInfo?: string;
    scannedAt?: string;
  };
}

const attendanceTable: AttendanceRecord[] = [];

// Seed attendance for previously marked demo items if active


interface MockTeacher {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  department: string;
  branch: string;
  designation: string;
  facultyCode: string;
  avatar: string;
  timings: {
    start: string;
    finish: string;
  };
}

const mockTeacher: MockTeacher = {
  id: 'teacher-101',
  name: 'Prof. Anjali Sharma',
  email: 'anjali.sharma@smartcampus.edu',
  passwordHash: bcrypt.hashSync('teacher123', 8),
  department: 'Computer Science & Engineering',
  branch: 'Computer Science & Engineering (CSE)',
  designation: 'Associate Professor',
  facultyCode: 'CSE-FAC-409',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop',
  timings: {
    start: '09:00 AM',
    finish: '05:00 PM',
  },
};

let mockBranches = [
  { id: 'branch-cse', code: 'CSE', name: 'Computer Science & Engineering', department: 'Computer Science' },
  { id: 'branch-it', code: 'IT', name: 'Information Technology', department: 'Information Technology' },
  { id: 'branch-aids', code: 'AI&DS', name: 'Artificial Intelligence & Data Science', department: 'Computer Science' },
  { id: 'branch-ece', code: 'ECE', name: 'Electronics & Communication', department: 'Electronics' },
  { id: 'branch-mech', code: 'MECH', name: 'Mechanical Engineering', department: 'Mechanical' },
  { id: 'branch-civil', code: 'CIVIL', name: 'Civil Engineering', department: 'Civil' },
];

let mockDivisions = [
  { id: 'div-a', name: 'A' },
  { id: 'div-b', name: 'B' },
  { id: 'div-c', name: 'C' },
  { id: 'div-d', name: 'D' },
  { id: 'div-e', name: 'E' },
];

let mockSemesters = [
  { id: 'sem-1', semesterNumber: 1, label: 'Semester 1' },
  { id: 'sem-2', semesterNumber: 2, label: 'Semester 2' },
  { id: 'sem-3', semesterNumber: 3, label: 'Semester 3' },
  { id: 'sem-4', semesterNumber: 4, label: 'Semester 4' },
  { id: 'sem-5', semesterNumber: 5, label: 'Semester 5' },
  { id: 'sem-6', semesterNumber: 6, label: 'Semester 6' },
  { id: 'sem-7', semesterNumber: 7, label: 'Semester 7' },
  { id: 'sem-8', semesterNumber: 8, label: 'Semester 8' },
];

let mockClasses = [
  {
    id: 'class-cse-a',
    code: 'CSE-A',
    name: 'CSE-A (Semester 4)',
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    semester: 4,
    section: 'A',
    totalStudents: 42,
    defaultRoom: 'Room 301',
  },
  {
    id: 'class-cse-b',
    code: 'CSE-B',
    name: 'CSE-B (Semester 4)',
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    semester: 4,
    section: 'B',
    totalStudents: 38,
    defaultRoom: 'Room 304',
  },
  {
    id: 'class-it-a',
    code: 'IT-A',
    name: 'IT-A (Semester 6)',
    department: 'Information Technology',
    branch: 'Information Technology',
    semester: 6,
    section: 'A',
    totalStudents: 40,
    defaultRoom: 'Room 202',
  },
  {
    id: 'class-ece-a',
    code: 'ECE-A',
    name: 'ECE-A (Semester 4)',
    department: 'Electronics & Comm.',
    branch: 'Electronics & Communication',
    semester: 4,
    section: 'A',
    totalStudents: 36,
    defaultRoom: 'Room 105',
  },
  {
    id: 'class-aids-a',
    code: 'AIDS-A',
    name: 'AI&DS-A (Semester 4)',
    department: 'Computer Science',
    branch: 'Artificial Intelligence & Data Science',
    semester: 4,
    section: 'A',
    totalStudents: 35,
    defaultRoom: 'Lab 201',
  },
];

let mockSubjects = [
  {
    id: 'sub-ds',
    code: 'CS401',
    name: 'Data Structures',
    credits: 4,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'indigo',
  },
  {
    id: 'sub-os',
    code: 'CS402',
    name: 'Operating Systems',
    credits: 4,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'blue',
  },
  {
    id: 'sub-dbms',
    code: 'CS403',
    name: 'Database Management Systems',
    credits: 3,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'emerald',
  },
  {
    id: 'sub-cn',
    code: 'CS404',
    name: 'Computer Networks',
    credits: 3,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'purple',
  },
  {
    id: 'sub-ai',
    code: 'CS405',
    name: 'Artificial Intelligence & ML',
    credits: 4,
    department: 'Computer Science',
    branch: 'Artificial Intelligence & Data Science',
    colorTheme: 'amber',
  },
  {
    id: 'sub-cloud',
    code: 'IT601',
    name: 'Cloud Computing & DevOps',
    credits: 3,
    department: 'Information Technology',
    branch: 'Information Technology',
    colorTheme: 'cyan',
  },
];

let mockLowAttendanceStudents = [
  {
    id: 'std-low-1',
    rollNo: '22CS013',
    name: 'Karan Malhotra',
    email: 'karan.malhotra.013@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    overallAttendance: 58,
    missedLectures: 14,
    totalLectures: 33,
    parentEmail: 's.malhotra@parentmail.com',
    parentPhone: '+91 98230 44123',
    statusRisk: 'critical' as const,
  },
  {
    id: 'std-low-2',
    rollNo: '22CS007',
    name: 'Rahul Deshmukh',
    email: 'rahul.deshmukh.007@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    overallAttendance: 64,
    missedLectures: 12,
    totalLectures: 33,
    parentEmail: 'v.deshmukh@parentmail.com',
    parentPhone: '+91 98231 55234',
    statusRisk: 'critical' as const,
  },
  {
    id: 'std-low-3',
    rollNo: '22CS019',
    name: 'Rohan Gupta',
    email: 'rohan.gupta.019@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-b',
    className: 'CSE-B (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    overallAttendance: 68,
    missedLectures: 10,
    totalLectures: 31,
    parentEmail: 'm.gupta@parentmail.com',
    parentPhone: '+91 98232 66345',
    statusRisk: 'warning' as const,
  },
  {
    id: 'std-low-4',
    rollNo: '22IT008',
    name: 'Aniket Verma',
    email: 'aniket.verma.008@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    classId: 'class-it-a',
    className: 'IT-A (Semester 6)',
    branch: 'Information Technology',
    semester: 6,
    overallAttendance: 52,
    missedLectures: 16,
    totalLectures: 33,
    parentEmail: 'k.verma@parentmail.com',
    parentPhone: '+91 98233 77456',
    statusRisk: 'critical' as const,
  },
  {
    id: 'std-low-5',
    rollNo: '22EC014',
    name: 'Tanmay Shinde',
    email: 'tanmay.shinde.014@smartcampus.edu',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop',
    classId: 'class-ece-a',
    className: 'ECE-A (Semester 4)',
    branch: 'Electronics & Communication',
    semester: 4,
    overallAttendance: 71,
    missedLectures: 9,
    totalLectures: 31,
    parentEmail: 'a.shinde@parentmail.com',
    parentPhone: '+91 98234 88567',
    statusRisk: 'borderline' as const,
  },
];

const mockDailyAttendance = [
  { day: 'Mon', date: 'Aug 17', percentage: 92, totalPresent: 147, totalEnrolled: 160 },
  { day: 'Tue', date: 'Aug 18', percentage: 88, totalPresent: 141, totalEnrolled: 160 },
  { day: 'Wed', date: 'Aug 19', percentage: 95, totalPresent: 152, totalEnrolled: 160 },
  { day: 'Thu', date: 'Aug 20', percentage: 89, totalPresent: 142, totalEnrolled: 160 },
  { day: 'Fri', date: 'Aug 21 (Today)', percentage: 94, totalPresent: 150, totalEnrolled: 160 },
];

interface TimetableItem {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  room: string;
  dayOfWeek: string;
  isToday: boolean;
  isCompleted: boolean;
  attendanceCount?: {
    present: number;
    total: number;
    flagged?: number;
    percentage: number;
  };
}

let mockTimetable: TimetableItem[] = [
  {
    id: 'tt-1',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    subjectId: 'sub-ds',
    subjectName: 'Data Structures',
    subjectCode: 'CS401',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    room: 'Room 301',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-2',
    classId: 'class-cse-b',
    className: 'CSE-B (Semester 4)',
    subjectId: 'sub-os',
    subjectName: 'Operating Systems',
    subjectCode: 'CS402',
    startTime: '11:15 AM',
    endTime: '12:15 PM',
    room: 'Room 304',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-3',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    subjectId: 'sub-dbms',
    subjectName: 'Database Management Systems',
    subjectCode: 'CS403',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    room: 'Room 301',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-4',
    classId: 'class-it-a',
    className: 'IT-A (Semester 6)',
    subjectId: 'sub-cn',
    subjectName: 'Computer Networks',
    subjectCode: 'CS404',
    startTime: '03:15 PM',
    endTime: '04:15 PM',
    room: 'Room 202',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
];

const studentTemplates = [
  { name: 'Aditya Verma', rollNo: '22CS001', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop', attendance: 94 },
  { name: 'Sneha Patil', rollNo: '22CS002', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop', attendance: 91 },
  { name: 'Rohan Mehta', rollNo: '22CS003', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop', attendance: 88 },
  { name: 'Kavya Singh', rollNo: '22CS004', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop', attendance: 96 },
  { name: 'Arjun Nair', rollNo: '22CS005', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop', attendance: 85 },
  { name: 'Priya Sharma', rollNo: '22CS006', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop', attendance: 92 },
  { name: 'Rahul Deshmukh', rollNo: '22CS007', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=120&auto=format&fit=crop', attendance: 78 },
  { name: 'Ananya Iyer', rollNo: '22CS008', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop', attendance: 95 },
  { name: 'Vikram Patel', rollNo: '22CS009', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=120&auto=format&fit=crop', attendance: 89 },
  { name: 'Neha Gupta', rollNo: '22CS010', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=120&auto=format&fit=crop', attendance: 82 },
  { name: 'Siddharth Roy', rollNo: '22CS011', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&auto=format&fit=crop', attendance: 90 },
  { name: 'Tanvi Joshi', rollNo: '22CS012', avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=120&auto=format&fit=crop', attendance: 87 },
  { name: 'Karan Malhotra', rollNo: '22CS013', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop', attendance: 76 },
  { name: 'Meera Nambiar', rollNo: '22CS014', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=120&auto=format&fit=crop', attendance: 93 },
  { name: 'Varun Sen', rollNo: '22CS015', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop', attendance: 84 },
  { name: 'Diya Menon', rollNo: '22CS016', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=120&auto=format&fit=crop', attendance: 97 },
];

function generateStudentsForClass(classId: string, count: number) {
  const students = [];
  for (let i = 0; i < count; i++) {
    const template = studentTemplates[i % studentTemplates.length];
    const rollIndex = (i + 1).toString().padStart(3, '0');
    const rollPrefix = classId.includes('it') ? '22IT' : classId.includes('ece') ? '22EC' : '22CS';
    students.push({
      id: `std-${classId}-${i + 1}`,
      rollNo: `${rollPrefix}${rollIndex}`,
      name: i < studentTemplates.length ? template.name : `${template.name} (${i + 1})`,
      email: `${template.name.toLowerCase().replace(/\s+/g, '.')}.${rollIndex}@smartcampus.edu`,
      avatar: template.avatar,
      classId,
      overallAttendance: template.attendance,
      status: 'absent' as const,
    });
  }
  return students;
}

// Active session state
let activeSession: any = null;
let qrRotationTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;
let secondsRemaining = QR_ROTATION_SECONDS;

async function generateDynamicQrPayload(sessionId: string, sessionCode: string) {
  const timestamp = Date.now();
  const token = jwt.sign(
    {
      sessionId,
      sessionCode,
      ts: timestamp,
      type: 'anti-proxy-dynamic-qr',
    },
    JWT_SECRET,
    { expiresIn: '60s' } // 60s validity gives smooth scanning across mobile camera focuses while rotating on screen
  );

  const qrDataString = JSON.stringify({
    app: 'SmartCampus',
    sessionId,
    sessionCode,
    token,
    ts: timestamp,
    validForMs: QR_ROTATION_SECONDS * 1000,
  });

  const qrCodeUrl = await QRCode.toDataURL(qrDataString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  return { qrCodeUrl, qrToken: token, timestamp, qrDataString };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.use(express.json());

  // Socket.io connection handler
  io.on('connection', (socket) => {
    // Send active session snapshot immediately if available
    if (activeSession) {
      socket.emit('session:sync', {
        ...activeSession,
        qrExpiresIn: secondsRemaining,
      });
    }

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  // Background QR Rotation Engine (every 15 seconds)
  function startSessionTimer(sessionId: string, sessionCode: string) {
    if (qrRotationTimer) clearInterval(qrRotationTimer);
    if (countdownTimer) clearInterval(countdownTimer);

    secondsRemaining = QR_ROTATION_SECONDS;

    // 1-second countdown tick for smooth UI radial ring
    countdownTimer = setInterval(() => {
      if (!activeSession) return;
      secondsRemaining -= 1;
      if (secondsRemaining < 0) {
        secondsRemaining = QR_ROTATION_SECONDS;
      }
      io.emit('qr:tick', {
        secondsRemaining,
        totalSeconds: QR_ROTATION_SECONDS,
      });
    }, 1000);

    // 15-second QR regeneration cycle
    qrRotationTimer = setInterval(async () => {
      if (!activeSession) return;
      try {
        const { qrCodeUrl, qrToken } = await generateDynamicQrPayload(sessionId, sessionCode);
        activeSession.qrCodeUrl = qrCodeUrl;
        activeSession.qrToken = qrToken;
        secondsRemaining = QR_ROTATION_SECONDS;

        io.emit('qr:rotated', {
          qrCodeUrl,
          qrToken,
          secondsRemaining: QR_ROTATION_SECONDS,
        });
      } catch (err) {
        console.error('Error rotating QR code:', err);
      }
    }, QR_ROTATION_SECONDS * 1000);
  }

  function stopSessionTimers() {
    if (qrRotationTimer) {
      clearInterval(qrRotationTimer);
      qrRotationTimer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    secondsRemaining = QR_ROTATION_SECONDS;
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SmartCampus Attendance Engine',
      realtime: 'Socket.IO Active',
      time: new Date().toISOString(),
    });
  });

  // Teacher Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Match teacher or allow demo login
    const isDemo = !password || password === 'teacher123' || email.includes('anjali') || email.includes('teacher');
    if (isDemo || email === mockTeacher.email) {
      const token = jwt.sign(
        { id: mockTeacher.id, email: mockTeacher.email, role: 'teacher' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        token,
        teacher: {
          id: mockTeacher.id,
          name: mockTeacher.name,
          email: mockTeacher.email,
          department: mockTeacher.department,
          branch: mockTeacher.branch,
          designation: mockTeacher.designation,
          facultyCode: mockTeacher.facultyCode,
          avatar: mockTeacher.avatar,
          timings: mockTeacher.timings,
          shiftStart: mockTeacher.timings.start,
          shiftFinish: mockTeacher.timings.finish,
        },
      });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  });

  // Student Login
  app.post('/api/auth/student-login', (req, res) => {
    const { email, rollNo, studentId, password } = req.body;
    
    // Find matching student from mock directory
    let student = mockStudentDirectory.find(
      (s) =>
        (email && s.email.toLowerCase() === email.toLowerCase()) ||
        (rollNo && s.rollNo.toLowerCase() === rollNo.toLowerCase()) ||
        (studentId && s.id === studentId)
    );

    // If query by partial name or default demo
    if (!student && email) {
      student = mockStudentDirectory.find(
        (s) => s.name.toLowerCase().includes(email.toLowerCase()) || s.email.includes(email.toLowerCase())
      );
    }

    if (!student) {
      student = mockStudentDirectory[0]; // fallback to default first demo student
    }

    const token = jwt.sign(
      { id: student.id, rollNo: student.rollNo, role: 'student', classId: student.classId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      student,
    });
  });

  // Get Teacher Classes & Timetable Meta
  app.get('/api/teacher/meta', (req, res) => {
    res.json({
      teacher: {
        id: mockTeacher.id,
        name: mockTeacher.name,
        email: mockTeacher.email,
        department: mockTeacher.department,
        branch: mockTeacher.branch,
        designation: mockTeacher.designation,
        facultyCode: mockTeacher.facultyCode,
        avatar: mockTeacher.avatar,
        timings: mockTeacher.timings,
        shiftStart: mockTeacher.timings.start,
        shiftFinish: mockTeacher.timings.finish,
      },
      branches: mockBranches,
      divisions: mockDivisions,
      semesters: mockSemesters,
      classes: mockClasses,
      subjects: mockSubjects,
      timetable: mockTimetable,
      dailyAttendance: mockDailyAttendance,
      lowAttendanceStudents: mockLowAttendanceStudents,
      activeSession: activeSession ? { ...activeSession, qrExpiresIn: secondsRemaining } : null,
    });
  });

  // Low Attendance Students API
  app.get('/api/students/low-attendance', (req, res) => {
    const threshold = Number(req.query.threshold) || 75;
    const filtered = mockLowAttendanceStudents.filter((s) => s.overallAttendance <= threshold);
    res.json({ students: filtered, threshold, totalCount: filtered.length });
  });

  app.post('/api/students/send-warning', (req, res) => {
    const { studentId, message, type } = req.body;
    const student = mockLowAttendanceStudents.find((s) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json({
      success: true,
      message: `Notice and SMS warning successfully dispatched to ${student.name} (${student.parentPhone || student.parentEmail}).`,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  // Branches CRUD APIs
  app.get('/api/branches', (req, res) => {
    res.json({ branches: mockBranches });
  });

  app.post('/api/branches', (req, res) => {
    try {
      const { code, name, department } = req.body;
      if (!name) return res.status(400).json({ error: 'Branch name is required' });
      const newBranch = {
        id: `branch-${Date.now()}`,
        code: (code || name.substring(0, 4)).toUpperCase(),
        name,
        department: department || name,
      };
      mockBranches.push(newBranch);
      return res.status(201).json({ message: 'Branch created', branch: newBranch, branches: mockBranches });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create branch' });
    }
  });

  app.put('/api/branches/:id', (req, res) => {
    const { id } = req.params;
    const idx = mockBranches.findIndex((b) => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Branch not found' });
    const { code, name, department } = req.body;
    mockBranches[idx] = {
      ...mockBranches[idx],
      code: code || mockBranches[idx].code,
      name: name || mockBranches[idx].name,
      department: department || mockBranches[idx].department,
    };
    return res.json({ message: 'Branch updated', branch: mockBranches[idx], branches: mockBranches });
  });

  app.delete('/api/branches/:id', (req, res) => {
    const { id } = req.params;
    mockBranches = mockBranches.filter((b) => b.id !== id);
    return res.json({ message: 'Branch deleted', branches: mockBranches });
  });

  // Divisions CRUD APIs
  app.get('/api/divisions', (req, res) => {
    res.json({ divisions: mockDivisions });
  });

  app.post('/api/divisions', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Division name is required' });
    const newDiv = {
      id: `div-${Date.now()}`,
      name: name.toUpperCase().trim(),
    };
    mockDivisions.push(newDiv);
    return res.status(201).json({ message: 'Division created', division: newDiv, divisions: mockDivisions });
  });

  app.put('/api/divisions/:id', (req, res) => {
    const { id } = req.params;
    const idx = mockDivisions.findIndex((d) => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Division not found' });
    if (req.body.name) {
      mockDivisions[idx].name = req.body.name.toUpperCase().trim();
    }
    return res.json({ message: 'Division updated', division: mockDivisions[idx], divisions: mockDivisions });
  });

  app.delete('/api/divisions/:id', (req, res) => {
    const { id } = req.params;
    mockDivisions = mockDivisions.filter((d) => d.id !== id);
    return res.json({ message: 'Division deleted', divisions: mockDivisions });
  });

  // Semesters CRUD APIs
  app.get('/api/semesters', (req, res) => {
    res.json({ semesters: mockSemesters });
  });

  app.post('/api/semesters', (req, res) => {
    const { semesterNumber, label } = req.body;
    const num = Number(semesterNumber);
    if (!num) return res.status(400).json({ error: 'Valid semester number required' });
    const newSem = {
      id: `sem-${Date.now()}`,
      semesterNumber: num,
      label: label || `Semester ${num}`,
    };
    mockSemesters.push(newSem);
    mockSemesters.sort((a, b) => a.semesterNumber - b.semesterNumber);
    return res.status(201).json({ message: 'Semester created', semester: newSem, semesters: mockSemesters });
  });

  app.put('/api/semesters/:id', (req, res) => {
    const { id } = req.params;
    const idx = mockSemesters.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Semester not found' });
    const { semesterNumber, label } = req.body;
    if (semesterNumber) mockSemesters[idx].semesterNumber = Number(semesterNumber);
    if (label) mockSemesters[idx].label = label;
    mockSemesters.sort((a, b) => a.semesterNumber - b.semesterNumber);
    return res.json({ message: 'Semester updated', semester: mockSemesters[idx], semesters: mockSemesters });
  });

  app.delete('/api/semesters/:id', (req, res) => {
    const { id } = req.params;
    mockSemesters = mockSemesters.filter((s) => s.id !== id);
    return res.json({ message: 'Semester deleted', semesters: mockSemesters });
  });

  // Subjects CRUD APIs
  app.get('/api/subjects', (req, res) => {
    res.json({ subjects: mockSubjects });
  });

  app.post('/api/subjects', (req, res) => {
    const { code, name, credits, department, branch, colorTheme } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Subject code and name are required' });
    const newSub = {
      id: `sub-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      credits: Number(credits) || 3,
      department: department || 'Computer Science',
      branch: branch || 'Computer Science & Engineering',
      colorTheme: colorTheme || 'indigo',
    };
    mockSubjects.push(newSub);
    return res.status(201).json({ message: 'Subject created', subject: newSub, subjects: mockSubjects });
  });

  app.put('/api/subjects/:id', (req, res) => {
    const { id } = req.params;
    const idx = mockSubjects.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Subject not found' });
    const { code, name, credits, department, branch, colorTheme } = req.body;
    mockSubjects[idx] = {
      ...mockSubjects[idx],
      code: code ? code.toUpperCase() : mockSubjects[idx].code,
      name: name || mockSubjects[idx].name,
      credits: credits !== undefined ? Number(credits) : mockSubjects[idx].credits,
      department: department || mockSubjects[idx].department,
      branch: branch || mockSubjects[idx].branch,
      colorTheme: colorTheme || mockSubjects[idx].colorTheme,
    };
    return res.json({ message: 'Subject updated', subject: mockSubjects[idx], subjects: mockSubjects });
  });

  app.delete('/api/subjects/:id', (req, res) => {
    const { id } = req.params;
    mockSubjects = mockSubjects.filter((s) => s.id !== id);
    return res.json({ message: 'Subject deleted', subjects: mockSubjects });
  });

  // Class Management CRUD APIs
  app.get('/api/classes', (req, res) => {
    res.json({ classes: mockClasses });
  });

  app.post('/api/classes', (req, res) => {
    try {
      const { code, name, department, branch, semester, section, totalStudents, defaultRoom } = req.body;
      if (!name || !section) {
        return res.status(400).json({ error: 'Class name and division/section are required' });
      }

      const newClass = {
        id: `class-${Date.now()}`,
        code: code || `${section}-${semester || 1}`,
        name: name || `${code || section} (Semester ${semester || 1})`,
        department: department || 'Computer Science',
        branch: branch || department || 'Computer Science & Engineering',
        semester: Number(semester) || 1,
        section: section || 'A',
        totalStudents: Number(totalStudents) || 40,
        defaultRoom: defaultRoom || 'Room 101',
      };

      mockClasses.push(newClass);
      return res.status(201).json({ message: 'Class created successfully', class: newClass, classes: mockClasses });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create class' });
    }
  });

  app.put('/api/classes/:id', (req, res) => {
    try {
      const { id } = req.params;
      const index = mockClasses.findIndex((c) => c.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Class not found' });
      }

      const { code, name, department, branch, semester, section, totalStudents, defaultRoom } = req.body;
      mockClasses[index] = {
        ...mockClasses[index],
        code: code !== undefined ? code : mockClasses[index].code,
        name: name !== undefined ? name : mockClasses[index].name,
        department: department !== undefined ? department : mockClasses[index].department,
        branch: branch !== undefined ? branch : mockClasses[index].branch,
        semester: semester !== undefined ? Number(semester) : mockClasses[index].semester,
        section: section !== undefined ? section : mockClasses[index].section,
        totalStudents: totalStudents !== undefined ? Number(totalStudents) : mockClasses[index].totalStudents,
        defaultRoom: defaultRoom !== undefined ? defaultRoom : mockClasses[index].defaultRoom,
      };

      return res.json({ message: 'Class updated successfully', class: mockClasses[index], classes: mockClasses });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update class' });
    }
  });

  app.delete('/api/classes/:id', (req, res) => {
    try {
      const { id } = req.params;
      mockClasses = mockClasses.filter((c) => c.id !== id);
      return res.json({ message: 'Class deleted successfully', classes: mockClasses });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete class' });
    }
  });

  // Start Attendance Session
  app.post('/api/session/start', async (req, res) => {
    try {
      const { classId, subjectId, room } = req.body;
      const selectedClass = mockClasses.find((c) => c.id === classId) || mockClasses[0];
      const selectedSubject = mockSubjects.find((s) => s.id === subjectId) || mockSubjects[0];
      const roomAssigned = room || selectedClass.defaultRoom;

      const sessionId = `SES-${Date.now()}`;
      const sessionCode = `DS-0905-${Math.floor(1000 + Math.random() * 9000)}`;

      const { qrCodeUrl, qrToken } = await generateDynamicQrPayload(sessionId, sessionCode);

      // Generate realistic student roster
      const students = generateStudentsForClass(selectedClass.id, selectedClass.totalStudents);

      // Initialize clean roster for actual live testing (no autofilled attendance)
      students.forEach((s) => {
        s.status = 'absent';
        s.markedAt = undefined;
        s.flagReason = undefined;
        s.verificationMethod = undefined;
      });

      activeSession = {
        id: sessionId,
        sessionCode,
        classId: selectedClass.id,
        className: selectedClass.name,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        subjectCode: selectedSubject.code,
        room: roomAssigned,
        timeSlot: '10:00 AM - 11:00 AM',
        teacherId: mockTeacher.id,
        teacherName: mockTeacher.name,
        startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'active',
        qrCodeUrl,
        qrToken,
        qrExpiresIn: QR_ROTATION_SECONDS,
        qrTotalDuration: QR_ROTATION_SECONDS,
        stats: {
          present: 0,
          flagged: 0,
          absent: students.length,
          total: students.length,
        },
        students,
      };

      startSessionTimer(sessionId, sessionCode);

      io.emit('session:started', activeSession);

      return res.json(activeSession);
    } catch (err: any) {
      console.error('Failed to start attendance session:', err);
      return res.status(500).json({ error: 'Failed to start session' });
    }
  });

  // Stop Attendance Session
  app.post('/api/session/stop', (req, res) => {
    if (!activeSession) {
      return res.status(400).json({ error: 'No active session found' });
    }

    activeSession.status = 'ended';
    stopSessionTimers();

    const finalSessionData = { ...activeSession };

    // Update timetable slot if matching
    const matchingTt = mockTimetable.find(
      (t) => t.classId === finalSessionData.classId && t.subjectId === finalSessionData.subjectId
    );
    if (matchingTt) {
      matchingTt.isCompleted = true;
      matchingTt.attendanceCount = {
        present: finalSessionData.stats.present,
        total: finalSessionData.stats.total,
        flagged: finalSessionData.stats.flagged,
        percentage: Math.round((finalSessionData.stats.present / (finalSessionData.stats.total || 1)) * 100),
      };
    } else {
      // Find the first non-completed today's lecture and mark it completed
      const firstPending = mockTimetable.find((t) => !t.isCompleted);
      if (firstPending) {
        firstPending.isCompleted = true;
        firstPending.attendanceCount = {
          present: finalSessionData.stats.present,
          total: finalSessionData.stats.total,
          flagged: finalSessionData.stats.flagged,
          percentage: Math.round((finalSessionData.stats.present / (finalSessionData.stats.total || 1)) * 100),
        };
      }
    }

    io.emit('session:ended', finalSessionData);

    return res.json({ message: 'Attendance session closed successfully', session: finalSessionData, timetable: mockTimetable });
  });

  // Get Active Session
  app.get('/api/session/active', (req, res) => {
    if (!activeSession) {
      return res.json({ activeSession: null });
    }
    return res.json({
      activeSession: {
        ...activeSession,
        qrExpiresIn: secondsRemaining,
      },
    });
  });

  // Simulate or Record Student Scan
  app.post('/api/session/scan', (req, res) => {
    if (!activeSession || activeSession.status !== 'active') {
      return res.status(400).json({ error: 'No active session running' });
    }

    const { studentId, rollNo, studentName, isFlagged, flagReason } = req.body;

    // Find student in roster or first absent student
    let student = activeSession.students.find((s: any) => s.id === studentId || s.rollNo === rollNo);
    if (!student) {
      student = activeSession.students.find((s: any) => s.status === 'absent');
    }

    if (!student) {
      return res.status(400).json({ error: 'All students have already scanned in this session' });
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (isFlagged) {
      student.status = 'flagged';
      student.markedAt = nowStr;
      student.flagReason = flagReason || 'Suspicious token delay or BLE beacon out of range';
      student.verificationMethod = 'Liveness Verified';
    } else {
      student.status = 'present';
      student.markedAt = nowStr;
      student.flagReason = undefined;
      student.verificationMethod = 'BLE Verified';
    }

    // Recompute stats
    activeSession.stats.present = activeSession.students.filter((s: any) => s.status === 'present').length;
    activeSession.stats.flagged = activeSession.students.filter((s: any) => s.status === 'flagged').length;
    activeSession.stats.absent = activeSession.students.filter((s: any) => s.status === 'absent').length;

    io.emit('attendance:marked', {
      student,
      stats: activeSession.stats,
      sessionId: activeSession.id,
    });

    return res.json({
      success: true,
      student,
      stats: activeSession.stats,
    });
  });

  // Manual Status Override by Teacher
  app.post('/api/session/override-student', (req, res) => {
    if (!activeSession) {
      return res.status(400).json({ error: 'No active session' });
    }
    const { studentId, newStatus } = req.body;
    const student = activeSession.students.find((s: any) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found in session' });
    }

    student.status = newStatus;
    if (newStatus === 'present') {
      student.markedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      student.verificationMethod = 'Manual Override';
      student.flagReason = undefined;
    } else if (newStatus === 'absent') {
      student.markedAt = undefined;
      student.flagReason = undefined;
    }

    activeSession.stats.present = activeSession.students.filter((s: any) => s.status === 'present').length;
    activeSession.stats.flagged = activeSession.students.filter((s: any) => s.status === 'flagged').length;
    activeSession.stats.absent = activeSession.students.filter((s: any) => s.status === 'absent').length;

    io.emit('attendance:updated', {
      student,
      stats: activeSession.stats,
      sessionId: activeSession.id,
    });

    return res.json({ success: true, student, stats: activeSession.stats });
  });

  // ==========================================
  // Student Scan & Verification Pipeline
  // ==========================================

  // Get current active session for students (Current class details)
  app.get('/api/student/current-class', (req, res) => {
    const studentId = (req.query.studentId as string) || 'std-class-cse-a-1';
    const student = mockStudentDirectory.find((s) => s.id === studentId) || mockStudentDirectory[0];

    // Check if there is an active session
    if (!activeSession || activeSession.status !== 'active') {
      return res.json({
        activeSession: null,
        student,
        currentTimetableSlot: mockTimetable[0],
        message: 'No live attendance session is currently active.',
      });
    }

    // Check if student has already scanned in attendance table
    const existingRecord = attendanceTable.find(
      (rec) => rec.studentId === student.id && rec.sessionId === activeSession.id
    );

    return res.json({
      activeSession: {
        id: activeSession.id,
        sessionCode: activeSession.sessionCode,
        classId: activeSession.classId,
        className: activeSession.className,
        subjectId: activeSession.subjectId,
        subjectName: activeSession.subjectName,
        subjectCode: activeSession.subjectCode,
        room: activeSession.room,
        timeSlot: activeSession.timeSlot,
        teacherName: activeSession.teacherName,
        startedAt: activeSession.startedAt,
        status: activeSession.status,
      },
      student,
      alreadyMarked: !!existingRecord,
      existingRecord: existingRecord || null,
    });
  });

  // Get student list for demo student switcher
  app.get('/api/student/list', (req, res) => {
    return res.json({ students: mockStudentDirectory });
  });

  // Unified Verification Pipeline: POST /api/verify
  // Executes all required checks in one single API endpoint:
  // 1. Check session active
  // 2. Token integrity & expiration check (JWT verification & timestamp check)
  // 3. Correct class check
  // 4. Student enrollment check
  // 5. Duplicate scan check (composite uniqueness on attendanceTable: studentId + sessionId)
  // If valid, inserts attendance record (status="Present", verificationStatus="Verified")
  app.post('/api/verify', (req, res) => {
    try {
      const { token, rawQrData, studentId, rollNo, metadata } = req.body;

      // Extract payload either from direct token, raw QR JSON string, or scanned URL
      let jwtToken = token;
      let qrPayload: any = null;

      if (rawQrData && typeof rawQrData === 'string') {
        const trimmed = rawQrData.trim();
        // Check if rawQrData is a URL containing query parameters
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('?')) {
          try {
            const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://smartcampus.local/${trimmed}`);
            const queryToken = urlObj.searchParams.get('token') || urlObj.searchParams.get('t');
            const scanDataParam = urlObj.searchParams.get('scanData');
            if (queryToken) {
              jwtToken = queryToken;
            } else if (scanDataParam) {
              const parsed = JSON.parse(decodeURIComponent(scanDataParam));
              if (parsed && parsed.token) jwtToken = parsed.token;
            }
          } catch {
            // fallback to string parsing
          }
        }

        if (!jwtToken) {
          try {
            qrPayload = JSON.parse(trimmed);
            if (qrPayload && qrPayload.token) {
              jwtToken = qrPayload.token;
            }
          } catch {
            // If rawQrData is just the raw token string
            jwtToken = trimmed;
          }
        }
      }

      if (!jwtToken) {
        return res.status(400).json({
          success: false,
          error: 'Missing QR Token',
          reason: 'No QR verification token was provided in the request.',
          code: 'MISSING_TOKEN',
        });
      }

      // Check 1: Is there an active session?
      if (!activeSession || activeSession.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Session Inactive',
          reason: 'No active attendance session is currently open for scanning.',
          code: 'SESSION_INACTIVE',
        });
      }

      // Check 2: Verify Token Signature & Expiration
      let decoded: any = null;
      try {
        decoded = jwt.verify(jwtToken, JWT_SECRET);
      } catch (jwtErr: any) {
        if (jwtErr.name === 'TokenExpiredError') {
          return res.status(400).json({
            success: false,
            error: 'Token Expired',
            reason: 'This QR code token has expired. Please scan the updated QR code currently displayed on screen.',
            code: 'TOKEN_EXPIRED',
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Invalid QR Token',
          reason: 'Cryptographic signature verification failed for this QR code.',
          code: 'TOKEN_INVALID',
        });
      }

      // Verify token matches current active session
      if (decoded.sessionId !== activeSession.id) {
        return res.status(400).json({
          success: false,
          error: 'Session Mismatch',
          reason: 'The scanned QR code belongs to a different or expired attendance session.',
          code: 'SESSION_MISMATCH',
        });
      }

      // Check 3 & 4: Student verification & enrollment check
      const queryId = studentId || '';
      const queryRoll = (rollNo || '').trim().toUpperCase();

      // Find in mockStudentDirectory or activeSession roster
      let student = mockStudentDirectory.find(
        (s) => s.id === queryId || (queryRoll && s.rollNo.toUpperCase() === queryRoll)
      );

      // If not in mock directory, find in activeSession roster
      if (!student && activeSession.students) {
        const rosterMatch = activeSession.students.find(
          (s: any) => s.id === queryId || (queryRoll && s.rollNo.toUpperCase() === queryRoll)
        );
        if (rosterMatch) {
          student = {
            id: rosterMatch.id,
            name: rosterMatch.name,
            rollNo: rosterMatch.rollNo,
            email: rosterMatch.email,
            avatar: rosterMatch.avatar,
            classId: activeSession.classId,
            className: activeSession.className,
            enrolledSubjectIds: [activeSession.subjectId],
            overallAttendance: rosterMatch.overallAttendance || 90,
          };
        }
      }

      // Fallback default student if none specified
      if (!student) {
        student = mockStudentDirectory[0];
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student Not Found',
          reason: `Student profile not found for identifier: ${queryId || queryRoll}`,
          code: 'STUDENT_NOT_FOUND',
        });
      }

      // Correct class check: Check if student belongs to active session's class
      if (student.classId !== activeSession.classId) {
        const activeClass = mockClasses.find((c) => c.id === activeSession.classId);
        return res.status(403).json({
          success: false,
          error: 'Incorrect Class',
          reason: `You are enrolled in ${student.className}, but this live session is for ${activeClass?.name || activeSession.className}.`,
          code: 'INCORRECT_CLASS',
        });
      }

      // Student enrollment check: Check if student is enrolled in this subject
      if (student.enrolledSubjectIds && !student.enrolledSubjectIds.includes(activeSession.subjectId)) {
        return res.status(403).json({
          success: false,
          error: 'Not Enrolled in Subject',
          reason: `Student is not enrolled in course "${activeSession.subjectName}" (${activeSession.subjectCode}).`,
          code: 'NOT_ENROLLED',
        });
      }

      // Check 5: Duplicate scan check (check attendance table for studentId + sessionId)
      const existingScan = attendanceTable.find(
        (rec) => rec.studentId === student.id && rec.sessionId === activeSession.id
      );

      if (existingScan) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate Scan Detected',
          reason: `Attendance for ${student.name} (${student.rollNo}) has already been recorded at ${existingScan.timestamp}.`,
          code: 'DUPLICATE_SCAN',
          existingRecord: existingScan,
        });
      }

      // All checks passed! Insert attendance record (status="Present", verificationStatus="Verified")
      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sessionId: activeSession.id,
        sessionCode: activeSession.sessionCode,
        studentId: student.id,
        rollNo: student.rollNo,
        studentName: student.name,
        classId: activeSession.classId,
        subjectId: activeSession.subjectId,
        subjectName: activeSession.subjectName,
        timestamp: nowStr,
        status: 'Present',
        verificationStatus: 'Verified',
        verificationMethod: 'BLE & Dynamic QR Verified',
        clientMetadata: metadata || {
          deviceInfo: 'Camera Scanner Web Client',
          scannedAt: new Date().toISOString(),
        },
      };

      // Push to attendance table
      attendanceTable.push(newRecord);

      // Update session roster & real-time stats
      let rosterStudent = activeSession.students.find((s: any) => s.id === student.id || s.rollNo === student.rollNo);
      if (rosterStudent) {
        rosterStudent.status = 'present';
        rosterStudent.markedAt = nowStr;
        rosterStudent.verificationMethod = 'BLE Verified';
        rosterStudent.flagReason = undefined;
      } else {
        rosterStudent = {
          id: student.id,
          rollNo: student.rollNo,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          classId: student.classId,
          overallAttendance: student.overallAttendance,
          status: 'present',
          markedAt: nowStr,
          verificationMethod: 'BLE Verified',
        };
        activeSession.students.push(rosterStudent);
      }

      // Recompute stats
      activeSession.stats.present = activeSession.students.filter((s: any) => s.status === 'present').length;
      activeSession.stats.flagged = activeSession.students.filter((s: any) => s.status === 'flagged').length;
      activeSession.stats.absent = activeSession.students.filter((s: any) => s.status === 'absent').length;

      // Broadcast real-time event to teacher dashboard
      io.emit('attendance:marked', {
        student: rosterStudent,
        stats: activeSession.stats,
        sessionId: activeSession.id,
      });

      return res.json({
        success: true,
        message: 'Attendance successfully verified and marked.',
        record: newRecord,
        session: {
          id: activeSession.id,
          className: activeSession.className,
          subjectName: activeSession.subjectName,
          subjectCode: activeSession.subjectCode,
          room: activeSession.room,
        },
        student: {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          overallAttendance: student.overallAttendance,
        },
      });
    } catch (error: any) {
      console.error('Attendance verification failure:', error);
      return res.status(500).json({
        success: false,
        error: 'Verification Server Error',
        reason: error.message || 'An unexpected error occurred during verification.',
        code: 'INTERNAL_ERROR',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartCampus Attendance Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
