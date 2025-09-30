import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ModernButton } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input } from '@/components/ui/FormField';
import { AttendanceModal } from '@/components/Schedule/AttendanceModal';
import { CalendarIcon, Clock, Users, BookOpen, Loader2, GraduationCap, LogOut, Key, User, X, CheckCircle2, ClipboardCheck } from 'lucide-react';

// Hook to detect mobile screen size
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentView, setCurrentView] = useState<'overview' | 'classes' | 'events' | 'profile'>('overview');

  // Change password modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Attendance modal state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Get all teachers to find the one matching the logged-in user's email
  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiService.getTeachers(1, 1000),
    enabled: !!user,
  });

  // Get all groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(1, 1000),
    enabled: !!user,
  });

  // Get events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => apiService.getEvents(1, 50),
    enabled: !!user,
  });

  // Get subjects for subject names
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.getSubjects(1, 100),
    enabled: !!user,
  });

  // Find teacher by email (since user ID !== teacher ID)
  const teacherData = teachersData?.teachers?.find(t => t.email === user?.email);
  const teacherLoading = teachersLoading || groupsLoading;

  // Filter groups by teacher ID
  const allGroups = groupsData?.groups || [];
  const teacherGroups = teacherData ? allGroups.filter(group => group.teacherId === teacherData.id) : [];
  
  const hasTeacherProfile = !!teacherData;
  const subjects = subjectsData?.subjects || [];
  const events = eventsData?.events || [];

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      apiService.changePassword(data),
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
        variant: "default",
      });
      setIsChangePasswordOpen(false);
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation password must match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  // Check attendance status for today's classes using React Query
  const todayDate = new Date().toISOString().split('T')[0];
  const attendanceStatusQueries = useQueries({
    queries: teacherGroups.map(group => ({
      queryKey: ['attendance-status', group.id, todayDate],
      queryFn: async () => {
        try {
          const response = await apiService.getAttendanceByGroup(group.id, todayDate, todayDate);
          return { groupId: group.id, taken: response && response.length > 0 };
        } catch (error) {
          return { groupId: group.id, taken: false };
        }
      },
      enabled: !!group.id && !!user,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
    }))
  });

  // Convert query results to attendance status map
  const attendanceTakenToday = attendanceStatusQueries.reduce((acc, query) => {
    if (query.data) {
      acc[query.data.groupId] = query.data.taken;
    }
    return acc;
  }, {} as { [groupId: string]: boolean });

  // Open attendance modal for a group
  const openAttendanceModal = (group: any) => {
    setSelectedGroup(group);
    setIsAttendanceModalOpen(true);
  };

  // Close attendance modal and invalidate queries to refresh attendance status
  const closeAttendanceModal = () => {
    setIsAttendanceModalOpen(false);
    setSelectedGroup(null);
    // Invalidate attendance status queries to trigger a refresh
    queryClient.invalidateQueries({ queryKey: ['attendance-status'] });
  };

  // Get today's date for filtering classes
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[today.getDay()];

  // Filter today's classes from the teacher's groups
  const todayClasses = teacherGroups
    .filter(group => {
      // Check if this group has a schedule for today
      return group.schedules?.some(schedule =>
        schedule.day.toLowerCase() === todayDayName
      );
    })
    .map(group => {
      const todaySchedule = group.schedules?.find(schedule =>
        schedule.day.toLowerCase() === todayDayName
      );
      const subject = subjects.find(s => s.id === group.subjectId);

      return {
        id: group.id,
        subject: subject?.name || 'Unknown Subject',
        group: group.name,
        time: todaySchedule ? `${todaySchedule.startTime} - ${todaySchedule.endTime}` : 'TBD',
        room: group.classNumber || 'TBD',
        students: group.studentCount || 0
      };
    })
    .sort((a, b) => {
      // Sort by start time
      const timeA = a.time.split(' - ')[0];
      const timeB = b.time.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });

  // Get upcoming events (next 7 days)
  const upcomingEvents = events
    .filter(event => {
      // Check if any schedule date is within the next 7 days
      return event.schedules?.some(schedule => {
        const eventDate = new Date(schedule.date);
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      });
    })
    .map(event => {
      // Get the earliest upcoming schedule for this event
      const upcomingSchedule = event.schedules
        ?.filter(schedule => {
          const eventDate = new Date(schedule.date);
          const diffTime = eventDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      return {
        id: event.id,
        title: event.name,
        date: upcomingSchedule?.date || '',
        time: upcomingSchedule ? `${upcomingSchedule.startTime} - ${upcomingSchedule.endTime}` : 'All day',
        type: event.type || 'event'
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate statistics
  const totalClasses = teacherGroups.length;
  const totalStudents = teacherGroups.reduce((sum, group) => sum + (group.studentCount || 0), 0);

  // Add attendance data queries for teacher's groups using useQueries
  const attendanceQueries = useQueries({
    queries: teacherGroups.map(group => ({
      queryKey: ['group-attendance-current-week', group.id],
      queryFn: () => apiService.getGroupCurrentWeekAttendance(group.id),
      enabled: !!group.id && teacherGroups.length > 0,
    }))
  });

  // Calculate attendance stats - safely handle missing data
  const attendanceStats = attendanceQueries.reduce((stats, query) => {
    const data = query.data;
    if (data && typeof data === 'object') {
      stats.totalSessions += (data.totalSessions || data.total_sessions || 0);
      stats.presentCount += (data.presentCount || data.present_count || data.present || 0);
      stats.absentCount += (data.absentCount || data.absent_count || data.absent || 0);
      stats.lateCount += (data.lateCount || data.late_count || data.late || 0);
    }
    return stats;
  }, { totalSessions: 0, presentCount: 0, absentCount: 0, lateCount: 0 });
  const totalSubjects = new Set(teacherGroups.map(group => group.subjectId)).size;

  // Render different views based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div className="flex-1 overflow-hidden">
            {/* No Classes Assigned Message */}
            {hasTeacherProfile && teacherGroups.length === 0 && !teacherLoading && (
              <div className="mx-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      No Classes Assigned Yet
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>You don't have any classes assigned yet. Your administrator will assign classes to you when they're ready.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Cards - Beautiful Design */}
            <div className="grid grid-cols-2 gap-4 p-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {teacherLoading ? '...' : totalClasses}
                </p>
                <p className="text-xs text-gray-500 font-medium">Classes</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {teacherLoading ? '...' : totalStudents}
                </p>
                <p className="text-xs text-gray-500 font-medium">Students</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {teacherLoading ? '...' : totalSubjects}
                </p>
                <p className="text-xs text-gray-500 font-medium">Subjects</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mb-3">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {teacherLoading ? '...' : `${attendanceStats.presentCount}/${attendanceStats.totalSessions}`}
                </p>
                <p className="text-xs text-gray-500 font-medium">This Week</p>
              </div>
            </div>

            {/* Today's Quick Classes Preview */}
            <div className="px-6 pb-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Today's Classes</h2>
                {todayClasses.length > 0 && (
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    {todayClasses.length}
                  </span>
                )}
              </div>
              {teacherLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No classes today</p>
                  <p className="text-sm text-gray-400">Enjoy your free time!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.slice(0, 3).map((classItem) => {
                    const group = teacherGroups.find(g => g.id === classItem.id);
                    const attendanceTaken = group ? attendanceTakenToday[group.id] : false;
                    
                    return (
                      <div key={classItem.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{classItem.subject}</h3>
                            <p className="text-sm text-gray-500 truncate mt-0.5">{classItem.group}</p>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <div className="bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                              {classItem.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm mb-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Users className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="font-medium">{classItem.students}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="font-medium">{classItem.room}</span>
                          </div>
                        </div>
                        
                        {/* Attendance Button/Status */}
                        {attendanceTaken ? (
                          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5 border border-green-200">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-green-700">Attendance Taken</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => group && openAttendanceModal(group)}
                            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl px-3 py-2.5 transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span className="text-xs font-semibold">Take Attendance</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {todayClasses.length > 3 && (
                    <button
                      onClick={() => setCurrentView('classes')}
                      className="w-full mt-2 py-3 text-center text-purple-600 font-semibold text-sm bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                    >
                      View all {todayClasses.length} classes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'classes':
        return (
          <div className="flex-1 overflow-hidden">
            <div className="p-6 pb-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">All Classes Today</h2>
                {todayClasses.length > 0 && (
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">
                    {todayClasses.length} classes
                  </span>
                )}
              </div>
              {teacherLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No classes today</p>
                  <p className="text-sm text-gray-400">Enjoy your free time!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayClasses.map((classItem) => {
                    const group = teacherGroups.find(g => g.id === classItem.id);
                    const attendanceTaken = group ? attendanceTakenToday[group.id] : false;
                    
                    return (
                      <div key={classItem.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{classItem.subject}</h3>
                            <p className="text-sm text-gray-500 truncate mt-1">{classItem.group}</p>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <div className="bg-purple-50 text-purple-700 text-sm font-bold px-3 py-2 rounded-xl">
                              {classItem.time}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Students</p>
                              <p className="font-bold text-gray-900">{classItem.students}</p>
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Room</p>
                              <p className="font-bold text-gray-900">{classItem.room}</p>
                            </div>
                          </div>
                        </div>

                        {/* Attendance Button/Status */}
                        {attendanceTaken ? (
                          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-3 border border-green-200">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-semibold text-green-700">Attendance Taken</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => group && openAttendanceModal(group)}
                            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl px-4 py-3 transition-colors"
                          >
                            <ClipboardCheck className="w-5 h-5" />
                            <span className="text-sm font-semibold">Take Attendance</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'events':
        return (
          <div className="flex-1 overflow-hidden">
            <div className="p-6 pb-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                {upcomingEvents.length > 0 && (
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                    {upcomingEvents.length} events
                  </span>
                )}
              </div>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No upcoming events</p>
                  <p className="text-sm text-gray-400">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{event.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{event.time}</p>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                            event.type === 'exam' ? 'bg-red-50 text-red-600' :
                            event.type === 'meeting' ? 'bg-blue-50 text-blue-600' :
                            'bg-green-50 text-green-600'
                          }`}>
                            {event.type}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-xl">
                          <CalendarIcon className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-purple-700">
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="flex-1 overflow-hidden">
            <div className="p-6 pb-24">
              {/* Profile Header */}
              <div className="bg-white rounded-2xl p-6 mb-6 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 mx-auto mb-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.fullName}</h2>
                <p className="text-sm text-gray-500 mb-3">{user?.email}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-semibold text-purple-700">Teacher Account</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Classes</p>
                </div>

                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Students</p>
                </div>

                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalSubjects}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Subjects</p>
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Account Settings
                </h3>

                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">Change Password</p>
                    <p className="text-xs text-gray-500 mt-0.5">Update your security credentials</p>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <LogOut className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-red-600">Logout</p>
                    <p className="text-xs text-gray-500 mt-0.5">Sign out of your account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Desktop version (enhanced layout)
  const renderDesktopView = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-600">
            Here's your teaching schedule for today
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <ModernButton
            variant="outline"
            size="sm"
            icon={Key}
            iconPosition="left"
            onClick={() => setIsChangePasswordOpen(true)}
          >
            Change Password
          </ModernButton>
          <ModernButton
            variant="outline"
            size="sm"
            icon={LogOut}
            iconPosition="left"
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Logout
          </ModernButton>
        </div>
      </div>

      {/* No Classes Assigned Message */}
      {hasTeacherProfile && teacherGroups.length === 0 && !teacherLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                No Classes Assigned Yet
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>You don't have any classes assigned yet. Your administrator will assign classes to you when they're ready.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teacherLoading ? '...' : totalClasses}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teacherLoading ? '...' : totalStudents}
                </p>
                <p className="text-xs text-gray-500 mt-1">Across all classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teacherLoading ? '...' : totalSubjects}
                </p>
                <p className="text-xs text-gray-500 mt-1">Different subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
                <CalendarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teacherLoading ? '...' : `${attendanceStats.presentCount}/${attendanceStats.totalSessions}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">Attendance rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes - Full Width Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Today's Classes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {teacherLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading classes...</span>
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">No classes scheduled for today</p>
                  <p className="text-sm">Enjoy your day off!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayClasses.map((classItem) => (
                    <div key={classItem.id} className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{classItem.subject}</h3>
                          <p className="text-sm text-gray-600">{classItem.group}</p>
                        </div>
                        <Badge variant="outline" className="bg-white border-purple-200 text-purple-700 font-medium">
                          {classItem.time}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Students</p>
                            <p className="font-bold text-gray-900">{classItem.students}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Room</p>
                            <p className="font-bold text-gray-900">{classItem.room}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar Section */}
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                <span>Schedule Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border-0 w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                <span>Upcoming Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading events...</span>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">No upcoming events</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-900">{event.title}</h4>
                      <Badge
                        variant={
                          event.type === 'exam' ? 'destructive' :
                          event.type === 'meeting' ? 'secondary' : 'default'
                        }
                        className="capitalize"
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Current Password *
                </label>
                <Input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  placeholder="Enter your current password"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  New Password *
                </label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter your new password"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirm New Password *
                </label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your new password"
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <ModernButton
                  variant="outline"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1"
                  size="lg"
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="solid"
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  className="flex-1"
                  size="lg"
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return isMobile ? (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white px-6 pt-6 pb-4 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Welcome back</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {user?.fullName?.split(' ')[0]}
            </h1>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        
        {/* View Indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
          <span className="text-sm font-semibold text-gray-700">
            {currentView === 'overview' ? 'Dashboard Overview' : 
             currentView === 'classes' ? 'Today\'s Schedule' : 
             currentView === 'events' ? 'Upcoming Events' : 
             'My Profile'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation - Beautiful Design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="flex safe-area-inset-bottom px-2 py-2">
          <button
            onClick={() => setCurrentView('overview')}
            className={`flex-1 py-2 px-3 rounded-xl touch-manipulation transition-all duration-200 ${
              currentView === 'overview'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <BookOpen className={`w-6 h-6 mx-auto mb-1 ${
              currentView === 'overview' ? 'scale-110' : ''
            } transition-transform`} />
            <span className="text-xs font-semibold block">Overview</span>
          </button>

          <button
            onClick={() => setCurrentView('classes')}
            className={`flex-1 py-2 px-3 rounded-xl touch-manipulation transition-all duration-200 ${
              currentView === 'classes'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Clock className={`w-6 h-6 mx-auto mb-1 ${
              currentView === 'classes' ? 'scale-110' : ''
            } transition-transform`} />
            <span className="text-xs font-semibold block">Classes</span>
          </button>

          <button
            onClick={() => setCurrentView('events')}
            className={`flex-1 py-2 px-3 rounded-xl touch-manipulation transition-all duration-200 ${
              currentView === 'events'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <CalendarIcon className={`w-6 h-6 mx-auto mb-1 ${
              currentView === 'events' ? 'scale-110' : ''
            } transition-transform`} />
            <span className="text-xs font-semibold block">Events</span>
          </button>

          <button
            onClick={() => setCurrentView('profile')}
            className={`flex-1 py-2 px-3 rounded-xl touch-manipulation transition-all duration-200 ${
              currentView === 'profile'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <User className={`w-6 h-6 mx-auto mb-1 ${
              currentView === 'profile' ? 'scale-110' : ''
            } transition-transform`} />
            <span className="text-xs font-semibold block">Profile</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal - Mobile Version */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Current Password *
                </label>
                <Input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  placeholder="Enter your current password"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  New Password *
                </label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter your new password"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirm New Password *
                </label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your new password"
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <ModernButton
                  variant="outline"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 touch-manipulation"
                  size="lg"
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="solid"
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  className="flex-1 touch-manipulation"
                  size="lg"
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {isAttendanceModalOpen && selectedGroup && (
        <AttendanceModal
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          subject={subjects.find(s => s.id === selectedGroup.subjectId)?.name || 'Unknown'}
          teacher={user?.fullName || 'Unknown'}
          isOpen={isAttendanceModalOpen}
          onClose={closeAttendanceModal}
        />
      )}
    </div>
  ) : (
    renderDesktopView()
  );
};

export default TeacherDashboard;
