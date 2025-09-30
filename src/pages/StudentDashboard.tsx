import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { 
  User, 
  BookOpen, 
  Calendar, 
  CreditCard,
  Clock,
  CheckCircle,
  X,
  Menu,
  LogOut,
  ChevronRight,
  Award,
  School,
  AlertCircle
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<'home' | 'schedule' | 'payments' | 'profile'>('home');
  const [showMenu, setShowMenu] = useState(false);

  // Fetch current student's own data
  const { data: currentStudent, isLoading: studentLoading } = useQuery({
    queryKey: ['current-student'],
    queryFn: () => apiService.getCurrentStudent(),
    enabled: !!user,
  });

  // Fetch attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', 'student', currentStudent?.id],
    queryFn: () => apiService.getAttendanceByStudent(currentStudent!.id),
    enabled: !!currentStudent,
  });

  const enrollments = currentStudent?.enrollments || [];
  
  // Extract subjects and groups from enrollments
  const subjects = enrollments.map(e => ({
    id: e.subjectId,
    name: e.subjectName
  })).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  
  const groups = enrollments.map(e => ({
    id: e.groupId,
    name: e.groupName
  })).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  // Calculate attendance percentage
  const calculateAttendanceRate = (enrollmentId: string) => {
    if (!attendanceData) return 0;
    const records = attendanceData.filter((r: any) => r.enrollmentId === enrollmentId);
    if (records.length === 0) return 0;
    const present = records.filter((r: any) => r.status === 'present').length;
    return Math.round((present / records.length) * 100);
  };

  // Get today's schedule (simplified - will need full data from backend)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses: any[] = []; // Will be populated when we have full schedule data
  
  // Get payment status (simplified - will calculate from actual subject fees)
  const monthlyFee = enrollments.length * 300; // Placeholder, will be calculated from actual fees

  const currentMonth = new Date().toISOString().slice(0, 7);
  const payments = currentStudent?.payments || [];
  const currentMonthPayment = payments.find(p => p.month === currentMonth);

  if (studentLoading || !currentStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white px-4 pt-8 pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Welcome Back!</h1>
              <p className="text-sm text-purple-100">{currentStudent.firstName} {currentStudent.lastName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{enrollments.length}</p>
            <p className="text-xs text-purple-100">Subjects</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{todayClasses.length}</p>
            <p className="text-xs text-purple-100">Today</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Award className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">
              {enrollments.length > 0 
                ? Math.round(enrollments.reduce((sum, e) => sum + calculateAttendanceRate(e.id), 0) / enrollments.length)
                : 0}%
            </p>
            <p className="text-xs text-purple-100">Attendance</p>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMenu(false)}>
          <div 
            className="absolute top-0 right-0 w-64 h-full bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{currentStudent.firstName}</p>
                <p className="text-sm text-gray-500">{currentStudent.phone}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-6 space-y-4">
        {activeView === 'home' && (
          <>
            {/* Today's Classes */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-purple-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <h2 className="font-bold text-gray-900">Today's Classes</h2>
                </div>
                <span className="text-sm text-gray-600">{today}</span>
              </div>
              
              {todayClasses.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No classes scheduled for today</p>
                  <p className="text-sm text-gray-400 mt-1">Enjoy your free day! 🎉</p>
                </div>
              ) : (
                <div className="divide-y">
                  {todayClasses.map((cls, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{cls?.subject}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {cls?.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <School className="w-4 h-4" />
                              Room {cls?.room}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Subjects */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-blue-50 border-b flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">My Subjects</h2>
              </div>
              
              <div className="p-3 space-y-2">
                {enrollments.map((enrollment, index) => {
                  const attendanceRate = calculateAttendanceRate(enrollment.id);
                  
                  return (
                    <div 
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{enrollment.subjectName || 'Unknown'}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          attendanceRate >= 80 ? 'bg-green-100 text-green-700' :
                          attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {attendanceRate}% Present
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Group: {enrollment.groupName}</span>
                      </div>
                      
                      {/* Attendance Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              attendanceRate >= 80 ? 'bg-green-500' :
                              attendanceRate >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-gray-900">Payment Status</h2>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Fee</p>
                    <p className="text-2xl font-bold text-gray-900">{monthlyFee} DH</p>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    currentMonthPayment?.status === 'paid' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {currentMonthPayment?.status === 'paid' ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <X className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                </div>
                
                <div className={`px-4 py-3 rounded-xl ${
                  currentMonthPayment?.status === 'paid' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    currentMonthPayment?.status === 'paid' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {currentMonthPayment?.status === 'paid' 
                      ? '✓ Payment received for this month' 
                      : '⚠ Payment pending for this month'}
                  </p>
                  {currentMonthPayment?.status === 'paid' && currentMonthPayment?.date && (
                    <p className="text-xs text-green-600 mt-1">
                      Paid on {new Date(currentMonthPayment.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-purple-50 border-b flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-900">My Profile</h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {currentStudent.firstName} {currentStudent.lastName}
                </h2>
                <p className="text-sm text-gray-600">
                  {currentStudent.yearName} • {currentStudent.fieldName}
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                  <p className="font-medium text-gray-900">{currentStudent.phone}</p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Parent Phone</p>
                  <p className="font-medium text-gray-900">{currentStudent.parentPhone}</p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Student ID</p>
                  <p className="font-medium text-gray-900">{currentStudent.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveView('home')}
            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
              activeView === 'home' 
                ? 'bg-purple-100 text-purple-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={() => setActiveView('schedule')}
            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
              activeView === 'schedule' 
                ? 'bg-purple-100 text-purple-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">Schedule</span>
          </button>
          
          <button
            onClick={() => setActiveView('payments')}
            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
              activeView === 'payments' 
                ? 'bg-purple-100 text-purple-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">Payments</span>
          </button>
          
          <button
            onClick={() => setActiveView('profile')}
            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
              activeView === 'profile' 
                ? 'bg-purple-100 text-purple-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
