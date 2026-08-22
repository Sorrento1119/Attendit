export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  branch?: string;
  avatar: string;
  designation: string;
  facultyCode: string;
  timings?: {
    start: string;
    finish: string;
  };
  shiftStart?: string;
  shiftFinish?: string;
}

export interface BranchItem {
  id: string;
  code: string;
  name: string;
  department?: string;
}

export interface DivisionItem {
  id: string;
  name: string;
}

export interface SemesterItem {
  id: string;
  semesterNumber: number;
  label: string;
}

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  department: string;
  branch?: string;
  semester: number;
  section: string;
  totalStudents: number;
  defaultRoom: string;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  branch?: string;
  colorTheme?: string;
}

export interface LowAttendanceStudent {
  id: string;
  rollNo: string;
  rollNumber?: string;
  name: string;
  email?: string;
  avatar?: string;
  classId?: string;
  className?: string;
  branch: string;
  section?: string;
  semester: number;
  overallAttendance: number;
  missedLectures?: number;
  totalLectures?: number;
  totalClasses?: number;
  attendedClasses?: number;
  parentEmail?: string;
  parentPhone?: string;
  statusRisk?: 'critical' | 'warning' | 'borderline';
  lastAttended?: string;
}

export interface TimetableSlot {
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
  isToday?: boolean;
  isCompleted?: boolean;
  attendanceCount?: {
    present: number;
    total: number;
    flagged?: number;
    percentage: number;
  };
}

export interface DailyAttendanceStat {
  day: string;
  date: string;
  percentage: number;
  totalPresent: number;
  totalEnrolled: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  avatar: string;
  classId: string;
  overallAttendance: number;
  status: 'present' | 'flagged' | 'absent';
  markedAt?: string;
  flagReason?: string;
  verificationMethod?: string;
}

export interface AttendanceSession {
  id: string;
  sessionCode: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  room: string;
  timeSlot: string;
  teacherId: string;
  teacherName: string;
  startedAt: string;
  status: 'active' | 'ended';
  qrCodeUrl: string;
  qrExpiresIn: number;
  qrTotalDuration: number;
  qrToken: string;
  stats: {
    present: number;
    flagged: number;
    absent: number;
    total: number;
  };
  students: Student[];
}

export interface AttendanceEventPayload {
  sessionId: string;
  student: Student;
  stats: {
    present: number;
    flagged: number;
    absent: number;
    total: number;
  };
}
