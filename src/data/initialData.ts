import {
  ClassItem,
  SubjectItem,
  BranchItem,
  DivisionItem,
  SemesterItem,
  TimetableSlot,
  DailyAttendanceStat,
  LowAttendanceStudent,
} from '../types';

export const INITIAL_BRANCHES: BranchItem[] = [
  { id: 'branch-cse', code: 'CSE', name: 'Computer Science & Engineering', department: 'School of Computing' },
  { id: 'branch-it', code: 'IT', name: 'Information Technology', department: 'School of Computing' },
  { id: 'branch-ece', code: 'ECE', name: 'Electronics & Communication Engineering', department: 'School of Electrical' },
  { id: 'branch-me', code: 'ME', name: 'Mechanical Engineering', department: 'School of Mechanical' },
];

export const INITIAL_SEMESTERS: SemesterItem[] = [
  { id: 'sem-1', semesterNumber: 1, label: 'Semester 1 (Autumn)', academicYear: '2024-2025' },
  { id: 'sem-2', semesterNumber: 2, label: 'Semester 2 (Spring)', academicYear: '2024-2025' },
  { id: 'sem-3', semesterNumber: 3, label: 'Semester 3 (Autumn)', academicYear: '2024-2025' },
  { id: 'sem-4', semesterNumber: 4, label: 'Semester 4 (Spring)', academicYear: '2024-2025' },
  { id: 'sem-5', semesterNumber: 5, label: 'Semester 5 (Autumn)', academicYear: '2024-2025' },
  { id: 'sem-6', semesterNumber: 6, label: 'Semester 6 (Spring)', academicYear: '2024-2025' },
];

export const INITIAL_DIVISIONS: DivisionItem[] = [
  { id: 'div-a', name: 'Division A', code: 'A', capacity: 70 },
  { id: 'div-b', name: 'Division B', code: 'B', capacity: 70 },
  { id: 'div-c', name: 'Division C', code: 'C', capacity: 65 },
];

export const INITIAL_SUBJECTS: SubjectItem[] = [
  { id: 'sub-ds', code: 'CS401', name: 'Data Structures & Algorithms', credits: 4, type: 'Theory + Lab' },
  { id: 'sub-dbms', code: 'CS402', name: 'Database Management Systems', credits: 4, type: 'Theory + Lab' },
  { id: 'sub-os', code: 'CS403', name: 'Operating Systems', credits: 3, type: 'Theory' },
  { id: 'sub-ai', code: 'CS404', name: 'Artificial Intelligence & ML', credits: 4, type: 'Theory + Lab' },
  { id: 'sub-cn', code: 'CS405', name: 'Computer Networks', credits: 3, type: 'Theory' },
];

export const INITIAL_CLASSES: ClassItem[] = [
  {
    id: 'class-cse-a',
    name: 'CSE-A (Semester 4)',
    branchId: 'branch-cse',
    branchName: 'Computer Science & Engineering',
    semesterId: 'sem-4',
    semesterName: 'Semester 4 (Spring)',
    divisionId: 'div-a',
    divisionName: 'Division A',
    batchYear: 2024,
    totalStudents: 64,
    currentRoom: 'Lab 302 (North Wing)',
    subjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
  },
  {
    id: 'class-cse-b',
    name: 'CSE-B (Semester 4)',
    branchId: 'branch-cse',
    branchName: 'Computer Science & Engineering',
    semesterId: 'sem-4',
    semesterName: 'Semester 4 (Spring)',
    divisionId: 'div-b',
    divisionName: 'Division B',
    batchYear: 2024,
    totalStudents: 62,
    currentRoom: 'LH 104 (East Block)',
    subjectIds: ['sub-ds', 'sub-os', 'sub-cn'],
  },
  {
    id: 'class-it-a',
    name: 'IT-A (Semester 6)',
    branchId: 'branch-it',
    branchName: 'Information Technology',
    semesterId: 'sem-6',
    semesterName: 'Semester 6 (Spring)',
    divisionId: 'div-a',
    divisionName: 'Division A',
    batchYear: 2023,
    totalStudents: 58,
    currentRoom: 'Seminar Hall B',
    subjectIds: ['sub-ai', 'sub-dbms'],
  },
];

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  {
    id: 'slot-1',
    day: 'Today',
    time: '09:00 AM - 10:00 AM',
    subject: 'Data Structures & Algorithms',
    subjectId: 'sub-ds',
    class: 'CSE-A (Semester 4)',
    classId: 'class-cse-a',
    room: 'Lab 302 (North Wing)',
    status: 'completed',
    attendancePercent: 92,
  },
  {
    id: 'slot-2',
    day: 'Today',
    time: '10:15 AM - 11:15 AM',
    subject: 'Database Systems (DBMS)',
    subjectId: 'sub-dbms',
    class: 'CSE-B (Semester 4)',
    classId: 'class-cse-b',
    room: 'LH 104 (East Block)',
    status: 'upcoming',
  },
  {
    id: 'slot-3',
    day: 'Today',
    time: '01:30 PM - 02:30 PM',
    subject: 'Artificial Intelligence & ML',
    subjectId: 'sub-ai',
    class: 'IT-A (Semester 6)',
    classId: 'class-it-a',
    room: 'Seminar Hall B',
    status: 'upcoming',
  },
];

export const INITIAL_DAILY_ATTENDANCE: DailyAttendanceStat[] = [
  { day: 'Mon', percentage: 91, totalPresent: 58, totalEnrolled: 64, date: '17 Aug' },
  { day: 'Tue', percentage: 87, totalPresent: 56, totalEnrolled: 64, date: '18 Aug' },
  { day: 'Wed', percentage: 94, totalPresent: 60, totalEnrolled: 64, date: '19 Aug' },
  { day: 'Thu', percentage: 89, totalPresent: 57, totalEnrolled: 64, date: '20 Aug' },
  { day: 'Fri', percentage: 85, totalPresent: 54, totalEnrolled: 64, date: '21 Aug' },
  { day: 'Today', percentage: 92, totalPresent: 59, totalEnrolled: 64, date: '22 Aug' },
];

export const INITIAL_LOW_ATTENDANCE: LowAttendanceStudent[] = [
  {
    id: 'std-low-1',
    rollNo: '22CS013',
    name: 'Karan Malhotra',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop',
    className: 'CSE-A (Semester 4)',
    branch: 'CSE',
    overallAttendance: 64,
    totalClasses: 45,
    attendedClasses: 29,
    consecutiveAbsences: 4,
    lastAttended: '12 Aug 2026',
    status: 'critical',
  },
  {
    id: 'std-low-2',
    rollNo: '22CS007',
    name: 'Rahul Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=120&auto=format&fit=crop',
    className: 'CSE-A (Semester 4)',
    branch: 'CSE',
    overallAttendance: 68,
    totalClasses: 45,
    attendedClasses: 31,
    consecutiveAbsences: 3,
    lastAttended: '14 Aug 2026',
    status: 'critical',
  },
  {
    id: 'std-low-3',
    rollNo: '22CS019',
    name: 'Rohan Gupta',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&auto=format&fit=crop',
    className: 'CSE-B (Semester 4)',
    branch: 'CSE',
    overallAttendance: 72,
    totalClasses: 43,
    attendedClasses: 31,
    consecutiveAbsences: 2,
    lastAttended: '18 Aug 2026',
    status: 'warning',
  },
];
