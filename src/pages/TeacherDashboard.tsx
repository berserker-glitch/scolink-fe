import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ModernButton } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input } from '@/components/ui/FormField';
import { CalendarIcon, Clock, Users, BookOpen, Loader2, GraduationCap, ChevronLeft, ChevronRight, Menu, X, LogOut, Key } from 'lucide-react';

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
  const [currentView, setCurrentView] = useState<'overview' | 'classes' | 'events'>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Change password modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get teacher's groups (which include schedule information)
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['teacher-groups'],
    queryFn: () => apiService.getGroups(1, 100), // Get all groups, we'll filter by teacher
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

  // Filter groups that belong to this teacher
  const teacherGroups = groupsData?.groups?.filter(group => group.teacherId === user?.id) || [];
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
  const totalSubjects = new Set(teacherGroups.map(group => group.subjectId)).size;

  // Touch gesture handlers for swipe navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentView === 'overview') {
      setCurrentView('classes');
    } else if (isRightSwipe && currentView === 'classes') {
      setCurrentView('overview');
    } else if (isLeftSwipe && currentView === 'classes') {
      setCurrentView('events');
    } else if (isRightSwipe && currentView === 'events') {
      setCurrentView('classes');
    }
  };

  // Navigation handlers
  const nextView = () => {
    if (currentView === 'overview') setCurrentView('classes');
    else if (currentView === 'classes') setCurrentView('events');
  };

  const prevView = () => {
    if (currentView === 'classes') setCurrentView('overview');
    else if (currentView === 'events') setCurrentView('classes');
  };

  // Render different views based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div
            className="flex-1 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Statistics Cards - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
              <Card className="surface touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-xs font-medium text-text-secondary truncate">Classes</p>
                      <p className="text-xl font-bold text-text-primary">
                        {groupsLoading ? '...' : totalClasses}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full flex-shrink-0">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-xs font-medium text-text-secondary truncate">Students</p>
                      <p className="text-xl font-bold text-text-primary">
                        {groupsLoading ? '...' : totalStudents}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-xs font-medium text-text-secondary truncate">Subjects</p>
                      <p className="text-xl font-bold text-text-primary">
                        {groupsLoading ? '...' : totalSubjects}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Quick Classes Preview */}
            <div className="px-4 pb-24">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Today's Classes</h2>
              {groupsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-interactive" />
                </div>
              ) : todayClasses.length === 0 ? (
                <Card className="surface">
                  <CardContent className="p-8 text-center">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50 text-text-secondary" />
                    <p className="text-text-secondary">No classes scheduled for today</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {todayClasses.slice(0, 3).map((classItem) => (
                    <Card key={classItem.id} className="surface touch-manipulation">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-text-primary truncate">{classItem.subject}</h3>
                            <p className="text-sm text-text-secondary truncate">{classItem.group}</p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                            {classItem.time}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {classItem.students} students
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {classItem.room}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {todayClasses.length > 3 && (
                    <div className="text-center py-4">
                      <button
                        onClick={() => setCurrentView('classes')}
                        className="text-interactive text-sm font-medium hover:underline"
                      >
                        View all {todayClasses.length} classes →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'classes':
        return (
          <div
            className="flex-1 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="p-4 pb-24">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Today's Classes</h2>
              {groupsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-interactive" />
                </div>
              ) : todayClasses.length === 0 ? (
                <Card className="surface">
                  <CardContent className="p-8 text-center">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50 text-text-secondary" />
                    <p className="text-text-secondary">No classes scheduled for today</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {todayClasses.map((classItem) => (
                    <Card key={classItem.id} className="surface touch-manipulation">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-text-primary mb-1">{classItem.subject}</h3>
                            <p className="text-text-secondary">{classItem.group}</p>
                          </div>
                          <Badge variant="outline" className="ml-3 flex-shrink-0">
                            {classItem.time}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-text-secondary text-xs">Students</p>
                              <p className="font-medium text-text-primary">{classItem.students}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-text-secondary text-xs">Room</p>
                              <p className="font-medium text-text-primary">{classItem.room}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'events':
        return (
          <div
            className="flex-1 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="p-4 pb-24">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Upcoming Events</h2>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-interactive" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <Card className="surface">
                  <CardContent className="p-8 text-center">
                    <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50 text-text-secondary" />
                    <p className="text-text-secondary">No upcoming events</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="surface touch-manipulation">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-text-primary mb-1">{event.title}</h3>
                            <p className="text-text-secondary text-sm">{event.time}</p>
                          </div>
                          <Badge
                            variant={
                              event.type === 'exam' ? 'destructive' :
                              event.type === 'meeting' ? 'secondary' : 'default'
                            }
                            className="ml-3 flex-shrink-0 capitalize"
                          >
                            {event.type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Desktop version (old layout)
  const renderDesktopView = () => (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Welcome back, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-text-secondary">
          Here's your teaching schedule for today
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Total Classes</p>
                <p className="text-2xl font-bold text-text-primary">
                  {groupsLoading ? '...' : totalClasses}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Total Students</p>
                <p className="text-2xl font-bold text-text-primary">
                  {groupsLoading ? '...' : totalStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Subjects</p>
                <p className="text-2xl font-bold text-text-primary">
                  {groupsLoading ? '...' : totalSubjects}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <Card className="surface">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Schedule Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border-0 w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Today's Classes */}
        <div className="space-y-6">
          <Card className="surface">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Today's Classes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-interactive" />
                  <span className="ml-2 text-text-secondary">Loading classes...</span>
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No classes scheduled for today</p>
                </div>
              ) : (
                todayClasses.map((classItem) => (
                  <div key={classItem.id} className="p-4 bg-surface-secondary rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-text-primary">{classItem.subject}</h3>
                      <Badge variant="outline">{classItem.time}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{classItem.group}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{classItem.room} • {classItem.students} students</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="surface">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Upcoming Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-interactive" />
                  <span className="ml-2 text-text-secondary">Loading events...</span>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-surface-secondary rounded-lg">
                    <h4 className="font-medium text-text-primary mb-1">{event.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <Badge
                      variant={event.type === 'exam' ? 'destructive' : event.type === 'meeting' ? 'secondary' : 'default'}
                      className="mt-2"
                    >
                      {event.type}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return isMobile ? (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <div className="bg-surface/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl hover:bg-surface-secondary active:bg-surface-tertiary touch-manipulation transition-colors"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-text-primary truncate">
              Welcome, {user?.fullName?.split(' ')[0]}
            </h1>
            <p className="text-xs text-text-secondary truncate">Teacher Dashboard</p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="flex items-center gap-1">
          {currentView !== 'overview' && (
            <button
              onClick={prevView}
              className="p-2 rounded-xl hover:bg-surface-secondary active:bg-surface-tertiary touch-manipulation transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-text-primary" />
            </button>
          )}
          {currentView !== 'events' && (
            <button
              onClick={nextView}
              className="p-2 rounded-xl hover:bg-surface-secondary active:bg-surface-tertiary touch-manipulation transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-text-primary" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="flex safe-area-inset-bottom">
          <button
            onClick={() => setCurrentView('overview')}
            className={`flex-1 py-3 px-2 text-center touch-manipulation transition-all duration-200 relative ${
              currentView === 'overview'
                ? 'text-interactive'
                : 'text-text-secondary active:text-text-primary'
            }`}
          >
            <div className={`w-8 h-8 mx-auto mb-1 rounded-xl flex items-center justify-center transition-colors ${
              currentView === 'overview' ? 'bg-interactive/10' : ''
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Overview</span>
            {currentView === 'overview' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-interactive rounded-full" />
            )}
          </button>

          <button
            onClick={() => setCurrentView('classes')}
            className={`flex-1 py-3 px-2 text-center touch-manipulation transition-all duration-200 relative ${
              currentView === 'classes'
                ? 'text-interactive'
                : 'text-text-secondary active:text-text-primary'
            }`}
          >
            <div className={`w-8 h-8 mx-auto mb-1 rounded-xl flex items-center justify-center transition-colors ${
              currentView === 'classes' ? 'bg-interactive/10' : ''
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Classes</span>
            {currentView === 'classes' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-interactive rounded-full" />
            )}
          </button>

          <button
            onClick={() => setCurrentView('events')}
            className={`flex-1 py-3 px-2 text-center touch-manipulation transition-all duration-200 relative ${
              currentView === 'events'
                ? 'text-interactive'
                : 'text-text-secondary active:text-text-primary'
            }`}
          >
            <div className={`w-8 h-8 mx-auto mb-1 rounded-xl flex items-center justify-center transition-colors ${
              currentView === 'events' ? 'bg-interactive/10' : ''
            }`}>
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Events</span>
            {currentView === 'events' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-interactive rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed left-0 top-0 h-full w-72 bg-surface shadow-2xl z-50 transform animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-surface-secondary active:bg-surface-tertiary touch-manipulation transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-secondary">
                <div className="w-12 h-12 bg-gradient-to-br from-interactive to-interactive/80 rounded-xl flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text-primary truncate">{user?.fullName}</p>
                  <p className="text-sm text-text-secondary">Teacher</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-4 space-y-2">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 px-3">Navigation</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setCurrentView('overview');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full p-3 text-left rounded-xl touch-manipulation transition-all duration-200 flex items-center gap-3 ${
                      currentView === 'overview'
                        ? 'bg-interactive/10 text-interactive'
                        : 'hover:bg-surface-secondary active:bg-surface-tertiary text-text-primary'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Overview</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('classes');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full p-3 text-left rounded-xl touch-manipulation transition-all duration-200 flex items-center gap-3 ${
                      currentView === 'classes'
                        ? 'bg-interactive/10 text-interactive'
                        : 'hover:bg-surface-secondary active:bg-surface-tertiary text-text-primary'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Today's Classes</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('events');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full p-3 text-left rounded-xl touch-manipulation transition-all duration-200 flex items-center gap-3 ${
                      currentView === 'events'
                        ? 'bg-interactive/10 text-interactive'
                        : 'hover:bg-surface-secondary active:bg-surface-tertiary text-text-primary'
                    }`}
                  >
                    <CalendarIcon className="w-5 h-5" />
                    <span className="font-medium">Upcoming Events</span>
                  </button>
                </div>
              </div>

              {/* Account Actions */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 px-3">Account</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsChangePasswordOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full p-3 text-left rounded-xl hover:bg-surface-secondary active:bg-surface-tertiary touch-manipulation flex items-center gap-3 text-text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Key className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Change Password</span>
                  </button>

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full p-3 text-left rounded-xl hover:bg-red-50 active:bg-red-100 touch-manipulation flex items-center gap-3 text-red-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-secondary touch-manipulation"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary">
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

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary">
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

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary">
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
              <div className="flex gap-3 pt-4 border-t border-border">
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
    </div>
  ) : (
    renderDesktopView()
  );
};

export default TeacherDashboard;
