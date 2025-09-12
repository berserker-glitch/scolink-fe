// Mock data for Educational Center Management System
// Realistic seed data for development and testing

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  sex: 'M' | 'F';
  yearId: string;
  fieldId: string;
  phone: string;
  parentPhone: string;
  parentType: 'Mother' | 'Father' | 'Guardian';
  tag: 'normal' | 'ss';
  cni?: string;
  yearName?: string;
  fieldName?: string;
  teacherId?: string;
  subjects?: Array<{
    subjectId: string;
    groupId: string;
  }>;
  enrollments?: Array<{
    id: string;
    groupId: string;
    groupName?: string;
    subjectName?: string;
  }>;
  attendanceRecords?: Array<{
    date: string;
    groupId: string;
    status: 'present' | 'absent' | 'late';
    note?: string;
  }>;
  payments?: Array<{
    id: string;
    month: string;
    subjectIds: string[];
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'overdue';
  }>;
  createdAt?: string;
  notes?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  avatarUrl?: string;
  bio?: string;
}

export interface Subject {
  id: string;
  name: string;
  monthlyFee: number;
  yearId: string;
  fieldId: string;
}

export interface Group {
  id: string;
  subjectId: string;
  name: string;
  capacity: number;
  classNumber: string;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  teacherId?: string;
  studentIds: string[];
}

export interface Event {
  id: string;
  name: string;
  type: 'Normal' | 'Temp Additional Course Day';
  fee?: number;
  groupId?: string;
  startDate: string;
  endDate: string;
  studentIds: string[];
}

// Generate realistic names and data
const firstNames = {
  M: ['Ahmed', 'Mohamed', 'Youssef', 'Omar', 'Ali', 'Hassan', 'Karim', 'Tariq', 'Samir', 'Nabil'],
  F: ['Fatima', 'Aisha', 'Khadija', 'Amina', 'Zahra', 'Maryam', 'Yasmin', 'Leila', 'Sara', 'Nour']
};

const lastNames = ['Benali', 'Hamidi', 'Mansouri', 'Alaoui', 'Kadiri', 'Tazi', 'Fassi', 'Berrada', 'Bennani', 'Chraibi'];

// Years and Fields Management
export interface Year {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

export interface Field {
  id: string;
  name: string;
  yearId: string;
  isActive: boolean;
}

// Mock years and fields data
export const mockYears: Year[] = [
  { id: 'y1', name: 'Year 1', order: 1, isActive: true },
  { id: 'y2', name: 'Year 2', order: 2, isActive: true },
  { id: 'y3', name: 'Year 3', order: 3, isActive: true },
  { id: 'y4', name: 'Year 4', order: 4, isActive: true },
  { id: 'y5', name: 'Year 5', order: 5, isActive: false }
];

export const mockFields: Field[] = [
  { id: 'f1', name: 'Sciences', yearId: 'y1', isActive: true },
  { id: 'f2', name: 'Sciences', yearId: 'y2', isActive: true },
  { id: 'f3', name: 'Sciences', yearId: 'y3', isActive: true },
  { id: 'f4', name: 'Sciences', yearId: 'y4', isActive: true },
  { id: 'f5', name: 'Literature', yearId: 'y1', isActive: true },
  { id: 'f6', name: 'Literature', yearId: 'y2', isActive: true },
  { id: 'f7', name: 'Literature', yearId: 'y3', isActive: true },
  { id: 'f8', name: 'Economics', yearId: 'y3', isActive: true },
  { id: 'f9', name: 'Economics', yearId: 'y4', isActive: true },
  { id: 'f10', name: 'Technology', yearId: 'y4', isActive: true },
  { id: 'f11', name: 'Arts', yearId: 'y1', isActive: true },
  { id: 'f12', name: 'Arts', yearId: 'y2', isActive: true },
  { id: 'f13', name: 'Languages', yearId: 'y1', isActive: true },
  { id: 'f14', name: 'Languages', yearId: 'y2', isActive: true },
  { id: 'f15', name: 'Languages', yearId: 'y3', isActive: true }
];

// Helper functions
export const getYearName = (yearId: string) => {
  return mockYears.find(y => y.id === yearId)?.name || 'Unknown Year';
};

export const getFieldName = (fieldId: string) => {
  return mockFields.find(f => f.id === fieldId)?.name || 'Unknown Field';
};

export const getFieldsByYear = (yearId: string) => {
  return mockFields.filter(f => f.yearId === yearId && f.isActive);
};

export const getActiveYears = () => {
  return mockYears.filter(y => y.isActive).sort((a, b) => a.order - b.order);
};

const fields = ['Sciences', 'Literature', 'Economics', 'Technology', 'Arts', 'Languages'];

// Mock teachers
export const mockTeachers: Teacher[] = [
  { id: 't1', name: 'Dr. Amina Fassi', email: 'a.fassi@center.ma', phone: '+212 6 11 22 33 44', subjects: ['math', 'physics'], bio: 'Mathematics and Physics specialist with 15 years experience.' },
  { id: 't2', name: 'Prof. Hassan Alaoui', email: 'h.alaoui@center.ma', phone: '+212 6 55 66 77 88', subjects: ['arabic', 'philosophy'], bio: 'Arabic literature and Philosophy expert.' },
  { id: 't3', name: 'Ms. Sara Berrada', email: 's.berrada@center.ma', phone: '+212 6 99 88 77 66', subjects: ['french', 'english'], bio: 'Modern languages coordinator.' },
  { id: 't4', name: 'Dr. Omar Bennani', email: 'o.bennani@center.ma', phone: '+212 6 44 33 22 11', subjects: ['chemistry', 'biology'], bio: 'Natural sciences department head.' },
  { id: 't5', name: 'Prof. Khadija Tazi', email: 'k.tazi@center.ma', phone: '+212 6 77 88 99 00', subjects: ['history', 'geography'], bio: 'Social sciences specialist.' },
  { id: 't6', name: 'Mr. Youssef Chraibi', email: 'y.chraibi@center.ma', phone: '+212 6 12 34 56 78', subjects: ['economics', 'accounting'], bio: 'Business and Economics instructor.' },
  { id: 't7', name: 'Ms. Leila Mansouri', email: 'l.mansouri@center.ma', phone: '+212 6 87 65 43 21', subjects: ['computer'], bio: 'Information Technology and Computer Science.' },
  { id: 't8', name: 'Dr. Tariq Kadiri', email: 't.kadiri@center.ma', phone: '+212 6 33 44 55 66', subjects: ['physics', 'chemistry'], bio: 'Advanced sciences researcher.' },
  { id: 't9', name: 'Prof. Nour Hamidi', email: 'n.hamidi@center.ma', phone: '+212 6 66 77 88 99', subjects: ['art', 'design'], bio: 'Creative arts and design mentor.' },
  { id: 't10', name: 'Mr. Karim Benali', email: 'k.benali@center.ma', phone: '+212 6 22 33 44 55', subjects: ['sports', 'health'], bio: 'Physical education and wellness coach.' }
];

// Mock subjects
export const mockSubjects: Subject[] = [
  { id: 'math', name: 'Mathematics', monthlyFee: 350, yearId: 'y1', fieldId: 'f1' },
  { id: 'physics', name: 'Physics', monthlyFee: 320, yearId: 'y2', fieldId: 'f2' },
  { id: 'chemistry', name: 'Chemistry', monthlyFee: 300, yearId: 'y2', fieldId: 'f2' },
  { id: 'biology', name: 'Biology', monthlyFee: 280, yearId: 'y1', fieldId: 'f1' },
  { id: 'french', name: 'French Language', monthlyFee: 250, yearId: 'y1', fieldId: 'f13' },
  { id: 'english', name: 'English Language', monthlyFee: 270, yearId: 'y1', fieldId: 'f13' },
  { id: 'arabic', name: 'Arabic Language', monthlyFee: 200, yearId: 'y1', fieldId: 'f13' },
  { id: 'philosophy', name: 'Philosophy', monthlyFee: 220, yearId: 'y3', fieldId: 'f7' },
  { id: 'history', name: 'History', monthlyFee: 200, yearId: 'y2', fieldId: 'f6' },
  { id: 'geography', name: 'Geography', monthlyFee: 200, yearId: 'y2', fieldId: 'f6' },
  { id: 'economics', name: 'Economics', monthlyFee: 300, yearId: 'y3', fieldId: 'f8' },
  { id: 'computer', name: 'Computer Science', monthlyFee: 400, yearId: 'y4', fieldId: 'f10' }
];

// Mock groups
export const mockGroups: Group[] = [
  { id: 'g1', subjectId: 'math', name: 'Advanced Math A', capacity: 20, classNumber: 'Room 101', schedule: [{ day: 'Monday', startTime: '08:00', endTime: '10:00' }], teacherId: 't1', studentIds: [] },
  { id: 'g2', subjectId: 'math', name: 'Basic Math B', capacity: 25, classNumber: 'Room 102', schedule: [{ day: 'Tuesday', startTime: '14:00', endTime: '16:00' }], teacherId: 't1', studentIds: [] },
  { id: 'g3', subjectId: 'physics', name: 'Physics Lab A', capacity: 15, classNumber: 'Lab 201', schedule: [{ day: 'Wednesday', startTime: '10:00', endTime: '12:00' }], teacherId: 't1', studentIds: [] },
  { id: 'g4', subjectId: 'chemistry', name: 'Chemistry Practical', capacity: 18, classNumber: 'Lab 202', schedule: [{ day: 'Thursday', startTime: '08:00', endTime: '10:00' }], teacherId: 't4', studentIds: [] },
  { id: 'g5', subjectId: 'french', name: 'French Conversation', capacity: 22, classNumber: 'Room 301', schedule: [{ day: 'Friday', startTime: '09:00', endTime: '11:00' }], teacherId: 't3', studentIds: [] },
  { id: 'g6', subjectId: 'english', name: 'English Grammar', capacity: 20, classNumber: 'Room 302', schedule: [{ day: 'Monday', startTime: '14:00', endTime: '16:00' }], teacherId: 't3', studentIds: [] },
  { id: 'g7', subjectId: 'arabic', name: 'Arabic Literature', capacity: 30, classNumber: 'Room 401', schedule: [{ day: 'Sunday', startTime: '08:00', endTime: '10:00' }], teacherId: 't2', studentIds: [] },
  { id: 'g8', subjectId: 'computer', name: 'Programming Basics', capacity: 16, classNumber: 'Computer Lab', schedule: [{ day: 'Tuesday', startTime: '10:00', endTime: '12:00' }], teacherId: 't7', studentIds: [] },
  { id: 'g9', subjectId: 'economics', name: 'Microeconomics', capacity: 25, classNumber: 'Room 501', schedule: [{ day: 'Wednesday', startTime: '14:00', endTime: '16:00' }], teacherId: 't6', studentIds: [] },
  { id: 'g10', subjectId: 'history', name: 'Modern History', capacity: 28, classNumber: 'Room 502', schedule: [{ day: 'Thursday', startTime: '10:00', endTime: '12:00' }], teacherId: 't5', studentIds: [] }
];

// Generate 200 mock students
function generateMockStudents(): Student[] {
  const students: Student[] = [];
  
  for (let i = 1; i <= 200; i++) {
    const sex = Math.random() > 0.5 ? 'M' : 'F';
    const firstName = firstNames[sex][Math.floor(Math.random() * firstNames[sex].length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Random subject assignments (1-4 subjects per student)
    const numSubjects = Math.floor(Math.random() * 3) + 1;
    const availableSubjects = [...mockSubjects];
    const studentSubjects = [];
    
    for (let j = 0; j < numSubjects; j++) {
      if (availableSubjects.length > 0) {
        const subjectIndex = Math.floor(Math.random() * availableSubjects.length);
        const subject = availableSubjects.splice(subjectIndex, 1)[0];
        // Assign to a random group for this subject
        const subjectGroups = mockGroups.filter(g => g.subjectId === subject.id);
        if (subjectGroups.length > 0) {
          const group = subjectGroups[Math.floor(Math.random() * subjectGroups.length)];
          studentSubjects.push({
            subjectId: subject.id,
            groupId: group.id
          });
          // Add student to group
          group.studentIds.push(`s${i}`);
        }
      }
    }
    
    // Generate attendance records for the last 30 days
    const attendanceRecords = [];
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      studentSubjects.forEach(sub => {
        if (Math.random() > 0.2) { // 80% attendance rate
          attendanceRecords.push({
            date: date.toISOString().split('T')[0],
            groupId: sub.groupId,
            status: Math.random() > 0.9 ? 'late' : 'present' as 'present' | 'absent' | 'late',
            note: Math.random() > 0.8 ? 'Excellent participation' : undefined
          });
        } else {
          attendanceRecords.push({
            date: date.toISOString().split('T')[0],
            groupId: sub.groupId,
            status: 'absent' as 'present' | 'absent' | 'late',
            note: Math.random() > 0.5 ? 'Excused absence' : undefined
          });
        }
      });
    }
    
    // Generate payment records
    const payments = [];
    const currentDate = new Date();
    for (let month = 0; month < 6; month++) {
      const paymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - month, 15);
      const monthStr = paymentDate.toISOString().slice(0, 7);
      
      const totalFee = studentSubjects.reduce((sum, sub) => {
        const subject = mockSubjects.find(s => s.id === sub.subjectId);
        return sum + (subject?.monthlyFee || 0);
      }, 0);
      
      payments.push({
        id: `p${i}-${month}`,
        month: monthStr,
        subjectIds: studentSubjects.map(s => s.subjectId),
        amount: totalFee,
        date: paymentDate.toISOString().split('T')[0],
        status: Math.random() > 0.1 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'overdue') as 'paid' | 'pending' | 'overdue'
      });
    }
    
    students.push({
      id: `s${i}`,
      firstName,
      lastName,
      sex,
      yearId: mockYears[Math.floor(Math.random() * 4)].id,
      fieldId: mockFields[Math.floor(Math.random() * mockFields.length)].id,
      phone: `+212 6 ${Math.random().toString().slice(2, 4)} ${Math.random().toString().slice(2, 4)} ${Math.random().toString().slice(2, 4)} ${Math.random().toString().slice(2, 4)}`,
      parentPhone: `+212 6 ${Math.random().toString().slice(2, 4)} ${Math.random().toString().slice(2, 4)} ${Math.random().toString().slice(2, 4)} ${Math.random().toString().slice(2, 4)}`,
      parentType: ['Mother', 'Father', 'Guardian'][Math.floor(Math.random() * 3)] as 'Mother' | 'Father' | 'Guardian',
      tag: Math.random() > 0.85 ? 'ss' : 'normal' as 'normal' | 'ss',
      CNI: `AB${Math.random().toString().slice(2, 8)}`,
      teacherId: Math.random() > 0.7 ? mockTeachers[Math.floor(Math.random() * mockTeachers.length)].id : undefined,
      subjects: studentSubjects,
      attendanceRecords,
      payments,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: Math.random() > 0.7 ? 'Excellent student with consistent performance' : undefined
    });
  }
  
  return students;
}

export const mockStudents = generateMockStudents();

// Mock events
export const mockEvents: Event[] = [
  {
    id: 'e1',
    name: 'Science Fair 2024',
    type: 'Normal',
    fee: 50,
    groupId: undefined,
    startDate: '2024-03-15',
    endDate: '2024-03-15',
    studentIds: mockStudents.slice(0, 50).map(s => s.id)
  },
  {
    id: 'e2',
    name: 'Extra Math Session',
    type: 'Temp Additional Course Day',
    groupId: 'g1',
    startDate: '2024-02-20',
    endDate: '2024-02-20',
    studentIds: mockGroups.find(g => g.id === 'g1')?.studentIds || []
  },
  {
    id: 'e3',
    name: 'Parent-Teacher Conference',
    type: 'Normal',
    fee: 0,
    startDate: '2024-03-01',
    endDate: '2024-03-02',
    studentIds: mockStudents.slice(0, 100).map(s => s.id)
  }
];

// Analytics helpers
export const getAnalytics = () => {
  const totalStudents = mockStudents.length;
  const newStudentsThisMonth = mockStudents.filter(s => {
    const createdDate = new Date(s.createdAt);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const paymentsThisMonth = mockStudents.flatMap(s => s.payments).filter(p => p.month === currentMonth);
  const newPaymentsThisMonth = paymentsThisMonth.filter(p => p.status === 'paid').length;
  const monthlyRevenue = paymentsThisMonth.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = mockStudents.flatMap(s => s.attendanceRecords).filter(r => r.date === today);
  const presentToday = todayAttendance.filter(r => r.status === 'present').length;
  const totalToday = todayAttendance.length;
  const attendanceRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
  
  const groupsToday = mockGroups.filter(g => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[new Date().getDay()];
    return g.schedule.some(s => s.day === todayName);
  }).length;
  
  return {
    totalStudents,
    newStudentsThisMonth,
    newPaymentsThisMonth,
    monthlyRevenue,
    attendanceRate,
    groupsToday
  };
};