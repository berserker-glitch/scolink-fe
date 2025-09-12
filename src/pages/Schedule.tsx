import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Modal } from '@/components/ui/Modal';
import { GroupDetailDrawer } from '@/components/Subject/GroupDetailDrawer';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { generateAttendanceSheetPDF } from '@/utils/pdfGenerator';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  MapPin
} from 'lucide-react';

export const Schedule: React.FC = () => {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isGroupDrawerOpen, setIsGroupDrawerOpen] = useState(false);
  const [isGroupViewDrawerOpen, setIsGroupViewDrawerOpen] = useState(false);
  const [attendance, setAttendance] = useState<{[studentId: string]: 'present' | 'absent' | 'late'}>({});
  
  // Fetch groups from API
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch subjects from API  
  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.getSubjects(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch teachers from API
  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiService.getTeachers(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch students from API
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiService.getStudents(1, 1000),
    enabled: isAuthenticated && !authLoading,
  });

  const groups = groupsData?.groups || [];
  const subjects = subjectsData?.subjects || [];
  const teachers = teachersData?.teachers || [];
  const students = studentsData?.students || [];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const getGroupsForDay = (day: string) => {
    return groups.filter(group => 
      group.schedules.some(schedule => schedule.day === day)
    );
  };

  const getGroupsForTimeSlot = (day: string, time: string) => {
    return getGroupsForDay(day).filter(group => {
      // Find the schedule for this specific day
      const daySchedule = group.schedules.find(s => s.day === day);
      if (!daySchedule) return false;
      
      const slotTime = parseInt(time.split(':')[0]);
      const startTime = parseInt(daySchedule.startTime.split(':')[0]);
      
      // Only show group in the time slot that matches its start time
      return slotTime === startTime;
    });
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'No teacher assigned';
    return teachers.find(t => t.id === teacherId)?.name || 'Unknown Teacher';
  };

  const getGroupStudents = (groupId: string) => {
    return students.filter(student => 
      student.enrollments?.some(enrollment => enrollment.groupId === groupId)
    );
  };

  const getGroupYearsAndFields = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return {
        years: ['Unknown'],
        fields: ['Unknown'],
        hasMore: false,
        isEmpty: true
      };
    }

    // Get the subject this group belongs to
    const subject = subjects.find(s => s.id === group.subjectId);
    if (!subject) {
      return {
        years: ['Unknown Subject'],
        fields: ['Unknown Subject'],
        hasMore: false,
        isEmpty: true
      };
    }

    return {
      years: [subject.yearName || 'Unknown Year'],
      fields: [subject.fieldName || 'Unknown Field'],
      hasMore: false,
      isEmpty: false
    };
  };

  const handleTakeAttendance = (group: any) => {
    setSelectedGroup(group);
    const students = getGroupStudents(group.id);
    const initialAttendance: {[studentId: string]: 'present' | 'absent' | 'late'} = {};
    students.forEach(student => {
      initialAttendance[student.id] = 'present'; // Default to present
    });
    setAttendance(initialAttendance);
    setIsAttendanceOpen(true);
  };

  const handleSaveAttendance = async () => {
    if (!selectedGroup) return;
    
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await apiService.bulkCreateAttendance({
        groupId: selectedGroup.id,
        date: currentDate,
        attendanceRecords,
      });
      
      toast({
        title: "Attendance Saved",
        description: `Attendance for ${selectedGroup.name} has been saved successfully.`
      });
      
      setIsAttendanceOpen(false);
      setSelectedGroup(null);
      setAttendance({});
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save attendance. Please try again."
      });
    }
  };

  const handleOpenGroupDrawer = (group: any) => {
    setSelectedGroup(group);
    setIsGroupDrawerOpen(true);
  };

  const handleOpenGroupViewDrawer = (group: any) => {
    setSelectedGroup(group);
    setIsGroupViewDrawerOpen(true);
  };

  const generateAttendancePDF = async (group: any) => {
    try {
      // Find the subject name for this group
      const subject = subjects.find(s => s.id === group.subjectId);
      const subjectName = subject?.name || group.subjectName;
      
      // Generate PDF with current students data
      await generateAttendanceSheetPDF(group, students, subjectName);
      
      toast({
        title: "PDF Generated",
        description: `Attendance sheet for ${group.name} has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Error generating attendance PDF:', error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "Unable to generate attendance sheet. Please try again."
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-hero text-text-primary mb-2">Schedule & Attendance</h1>
          <p className="text-body text-text-secondary">
            View weekly schedule and manage class attendance for all groups.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <BrutalistButton variant="primary">
            <Download className="w-4 h-4 mr-2" />
            Export Schedule
          </BrutalistButton>
        </div>
      </div>

      {/* Main Layout: Day Selector Left + Schedule Right */}
      <div className="flex gap-6 mb-6">
        {/* Left Sidebar - Day Selector */}
        <Card className="surface w-80 flex-shrink-0">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Calendar className="w-6 h-6" />
              <span>Select Day</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {days.map(day => {
                const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                
                return (
                  <BrutalistButton
                    key={day}
                    variant={selectedDay === day ? 'primary' : 'outline'}
                    size="lg"
                    onClick={() => setSelectedDay(day)}
                    className="w-full justify-start text-left py-4"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-medium">{day}</span>
                      {isToday && (
                        <div className="w-2.5 h-2.5 bg-status-success rounded-full" />
                      )}
                    </div>
                  </BrutalistButton>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Schedule Display */}
        <Card className="surface flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{selectedDay} Schedule</span>
              </CardTitle>
              <div className="text-sm text-text-secondary">
                {groupsLoading ? 'Loading...' : `${getGroupsForDay(selectedDay).length} classes scheduled`}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {groupsLoading || subjectsLoading || teachersLoading || studentsLoading ? (
              <div className="text-center py-12">
                <div className="text-text-secondary">Loading schedule data...</div>
              </div>
            ) : getGroupsForDay(selectedDay).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30 text-text-muted" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No Classes Scheduled</h3>
                <p className="text-text-secondary">There are no classes scheduled for {selectedDay}.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timeline View */}
                {timeSlots.map(timeSlot => {
                  const groups = getGroupsForTimeSlot(selectedDay, timeSlot);
                  
                  if (groups.length === 0) return null;
                  
                  return (
                    <div key={timeSlot} className="border-l-4 border-interactive pl-6 relative">
                      {/* Time Badge */}
                      <div className="absolute -left-3 top-0 bg-interactive text-white px-3 py-1 rounded-full text-xs font-medium">
                        {timeSlot}
                      </div>
                      
                      {/* Groups for this time slot */}
                      <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {groups.map(group => {
                          const daySchedule = group.schedules.find(s => s.day === selectedDay);
                          
                          return (
                            <Card key={group.id} className="surface-secondary hover:shadow-lg transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-text-primary mb-1">
                                      {getSubjectName(group.subjectId)}
                                    </h4>
                                    <p className="text-sm text-text-secondary mb-2">{group.name}</p>
                                    
                                    <div className="flex items-center space-x-4 text-xs text-text-muted">
                                      <div className="flex items-center space-x-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                          {daySchedule ? `${daySchedule.startTime} - ${daySchedule.endTime}` : 'No schedule'}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Users className="w-3 h-3" />
                                        <span>{group.studentCount || 0}/{group.capacity}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 text-xs text-text-muted mt-1">
                                      <div className="flex items-center space-x-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{group.classNumber}</span>
                                      </div>
                                      <div>
                                        {getTeacherName(group.teacherId)}
                                      </div>
                                    </div>
                                    
                                    {/* Subject Year and Field Information */}
                                    {(() => {
                                      const { years, fields, isEmpty } = getGroupYearsAndFields(group.id);
                                      return (
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                          <div className="flex items-center space-x-3 text-xs">
                                            <div className="flex items-center space-x-1">
                                              <span className="text-text-muted">Year:</span>
                                              <span 
                                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                                  isEmpty 
                                                    ? 'bg-text-muted/10 text-text-muted' 
                                                    : 'bg-interactive/10 text-interactive'
                                                }`}
                                              >
                                                {years[0]}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <span className="text-text-muted">Field:</span>
                                              <span 
                                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                                  isEmpty 
                                                    ? 'bg-text-muted/10 text-text-muted' 
                                                    : 'bg-status-success/10 text-status-success'
                                                }`}
                                              >
                                                {fields[0]}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  
                                  <button
                                    onClick={() => handleOpenGroupViewDrawer(group)}
                                    className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                                    title="View group details"
                                  >
                                    <Eye className="w-5 h-5 text-text-muted" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <BrutalistButton 
                                    variant="primary" 
                                    size="sm"
                                    onClick={() => handleOpenGroupDrawer(group)}
                                    className="flex-1"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Take Attendance
                                  </BrutalistButton>
                                  <BrutalistButton 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => generateAttendancePDF(group)}
                                    title="Download attendance sheet"
                                  >
                                    <Download className="w-4 h-4" />
                                  </BrutalistButton>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">TODAY'S CLASSES</p>
                <p className="text-2xl font-bold text-text-primary">
                  {getGroupsForDay(selectedDay).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-interactive" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">TOTAL STUDENTS</p>
                <p className="text-2xl font-bold text-text-primary">
                  {getGroupsForDay(selectedDay).reduce((sum, group) => sum + (group.studentCount || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-interactive" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">ACTIVE TEACHERS</p>
                <p className="text-2xl font-bold text-text-primary">
                  {new Set(getGroupsForDay(selectedDay).map(g => g.teacherId).filter(Boolean)).size}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-interactive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        title={`Take Attendance - ${selectedGroup?.name || ''} (${selectedDay})`}
        size="lg"
      >
        {selectedGroup && (
          <div className="p-6">
            {/* Group Info */}
            <Card className="surface-secondary mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-caption">
                  <div>
                    <span className="text-text-muted">Subject:</span>
                    <span className="ml-2 text-text-primary">{getSubjectName(selectedGroup.subjectId)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Teacher:</span>
                    <span className="ml-2 text-text-primary">{getTeacherName(selectedGroup.teacherId)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Time:</span>
                    <span className="ml-2 text-text-primary">
                      {(() => {
                        const daySchedule = selectedGroup.schedules.find(s => s.day === selectedDay);
                        return daySchedule ? `${daySchedule.startTime} - ${daySchedule.endTime}` : 'No schedule for this day';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Room:</span>
                    <span className="ml-2 text-text-primary">{selectedGroup.classNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student List */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {getGroupStudents(selectedGroup.id).map(student => (
                <Card key={student.id} className="surface-secondary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-text-primary">
                          {student.firstName} {student.lastName}
                        </h4>
                        <p className="text-caption text-text-secondary">
                          {student.yearName || 'Unknown Year'} • {student.fieldName || 'Unknown Field'}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {(['present', 'late', 'absent'] as const).map(status => (
                          <button
                            key={status}
                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: status }))}
                            className={`p-2 rounded-lg border-2 transition-colors ${
                              attendance[student.id] === status
                                ? status === 'present' 
                                  ? 'bg-status-success/20 border-status-success text-status-success'
                                  : status === 'late'
                                  ? 'bg-status-warning/20 border-status-warning text-status-warning'
                                  : 'bg-status-error/20 border-status-error text-status-error'
                                : 'border-border text-text-muted hover:bg-surface-hover'
                            }`}
                          >
                            {status === 'present' && <CheckCircle2 className="w-4 h-4" />}
                            {status === 'late' && <AlertCircle className="w-4 h-4" />}
                            {status === 'absent' && <XCircle className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <BrutalistButton
                variant="outline"
                className="flex-1"
                onClick={() => setIsAttendanceOpen(false)}
              >
                Cancel
              </BrutalistButton>
              <BrutalistButton
                variant="primary"
                className="flex-1"
                onClick={handleSaveAttendance}
              >
                Save Attendance
              </BrutalistButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Group Detail Drawer - Take Attendance Mode */}
      {selectedGroup && (
        <GroupDetailDrawer
          isOpen={isGroupDrawerOpen}
          onClose={() => setIsGroupDrawerOpen(false)}
          group={selectedGroup}
          defaultTab="students"
          mode="takeAttendance"
        />
      )}

      {/* Group Detail Drawer - View Mode */}
      {selectedGroup && (
        <GroupDetailDrawer
          isOpen={isGroupViewDrawerOpen}
          onClose={() => setIsGroupViewDrawerOpen(false)}
          group={selectedGroup}
          defaultTab="details"
          mode="view"
        />
      )}
    </div>
  );
};