import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiService, Group, Subject, Teacher } from '@/services/api';
import { 
  Users, 
  Clock, 
  Trash2, 
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface GroupDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group & { schedule?: any[]; studentIds?: string[] }; // For compatibility with old mock structure
  defaultTab?: 'details' | 'students';
  mode?: 'view' | 'takeAttendance';
}

export const GroupDetailDrawer: React.FC<GroupDetailDrawerProps> = ({
  isOpen,
  onClose,
  group,
  defaultTab = 'details',
  mode = 'view'
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'students'>(defaultTab);
  const [attendance, setAttendance] = useState<{[studentId: string]: 'present' | 'absent' | 'late'}>({});

  // Get group's subject and teacher info using API
  const { data: subjectData } = useQuery({
    queryKey: ['subjects', group.subjectId],
    queryFn: () => apiService.getSubjectById(group.subjectId),
    enabled: isOpen && !!group.subjectId,
  });

  const { data: teacherData } = useQuery({
    queryKey: ['teachers', group.teacherId],
    queryFn: () => apiService.getTeacherById(group.teacherId!),
    enabled: isOpen && !!group.teacherId,
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiService.getTeachers(1, 100),
    enabled: isOpen,
  });

  // Fetch students for this group
  const { data: groupStudents } = useQuery({
    queryKey: ['group-students', group.id],
    queryFn: () => apiService.getGroupStudents(group.id),
    enabled: isOpen && !!group.id,
  });

  // Check if today is a class day for this group
  const { data: classDayInfo, isLoading: classDayLoading } = useQuery({
    queryKey: ['group-class-today', group.id],
    queryFn: () => apiService.checkGroupClassToday(group.id),
    enabled: isOpen && !!group.id,
  });

  // Get current week attendance for smart prefilling
  const { data: weekAttendanceData } = useQuery({
    queryKey: ['group-week-attendance', group.id],
    queryFn: () => apiService.getGroupCurrentWeekAttendance(group.id),
    enabled: isOpen && !!group.id,
  });

  const subject = subjectData;
  const teacher = teacherData;
  const teachers = teachersData?.teachers || [];
  const students = groupStudents || [];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-detect mode based on schedule - only when data is loaded
  // Default to view mode if still loading or if not a class day
  const isClassToday = classDayInfo?.isClassToday === true;
  const autoDetectedMode = (!classDayLoading && isClassToday) ? 'takeAttendance' : 'view';
  
  // Effective mode logic: 
  // 1. If explicitly set to takeAttendance AND it's actually a class day, use takeAttendance
  // 2. Otherwise, use auto-detected mode (which defaults to view for non-class days)
  const effectiveMode = (mode === 'takeAttendance' && !classDayLoading && isClassToday) 
    ? 'takeAttendance' 
    : autoDetectedMode;

  // Debug logging
  React.useEffect(() => {
    if (classDayInfo) {
      console.log('Group:', group.name);
      console.log('Class day info:', classDayInfo);
      console.log('Is class today:', isClassToday);
      console.log('Auto detected mode:', autoDetectedMode);
      console.log('Effective mode:', effectiveMode);
    }
  }, [classDayInfo, isClassToday, autoDetectedMode, effectiveMode, group.name]);
  
  // Use the schedules from the group (API data) or fall back to schedule (mock data compatibility)
  const groupSchedules = group.schedules || group.schedule || [];
  const studentIds = group.studentIds || [];
  const studentCount = students.length || group.studentCount || studentIds.length;

  // Prefill attendance based on existing data
  React.useEffect(() => {
    if (weekAttendanceData?.students && students.length > 0) {
      const prefilledAttendance: {[studentId: string]: 'present' | 'absent' | 'late'} = {};
      
      weekAttendanceData.students.forEach((studentStatus: any) => {
        if (studentStatus.currentWeekStatus) {
          prefilledAttendance[studentStatus.studentId] = studentStatus.currentWeekStatus;
        } else {
          // Default to present if no existing attendance
          prefilledAttendance[studentStatus.studentId] = 'present';
        }
      });

      setAttendance(prefilledAttendance);
    }
  }, [weekAttendanceData, students]);

  const handleDeleteGroup = async () => {
    try {
      await apiService.deleteGroup(group.id);
      
      toast({
        title: "Success",
        description: `Group ${group.name} has been deleted successfully.`
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-students', group.id] });
      
      onClose();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete group. Please try again."
      });
    }
  };

  // Show attendance status info
  const getAttendanceStatusInfo = () => {
    if (classDayLoading) {
      return 'Loading schedule information...';
    }
    if (weekAttendanceData?.attendanceExists && weekAttendanceData?.attendanceDate) {
      return `Attendance already taken on ${new Date(weekAttendanceData.attendanceDate).toLocaleDateString()}`;
    }
    if (effectiveMode === 'takeAttendance') {
      return 'Today is a class day - Take attendance';
    }
    return 'View student details';
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="!w-[50%] !max-w-[50vw] h-full flex flex-col" style={{ width: '50%', maxWidth: '50vw' }}>
        <SheetHeader className="border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                {group.name}
              </SheetTitle>
              <p className="text-sm text-text-secondary mt-1">
                {getAttendanceStatusInfo()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ModernButton
                variant="danger"
                size="sm"
                onClick={handleDeleteGroup}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </ModernButton>
            </div>
          </div>
        </SheetHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-interactive border-b-2 border-interactive'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Group Details
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'students'
                ? 'text-interactive border-b-2 border-interactive'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Students ({studentCount})
          </button>
        </div>

        {/* Tab Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {activeTab === 'details' ? (
            <>
              {/* Group Information Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Group Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Group Name</label>
                      <p className="text-text-primary font-medium">{group.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Subject</label>
                      <p className="text-text-primary font-medium">{subject?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Capacity</label>
                      <p className="text-text-primary font-medium">{group.capacity} students</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Current Students</label>
                      <p className="text-text-primary font-medium">{studentCount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Class Number</label>
                      <p className="text-text-primary font-medium">{group.classNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Teacher</label>
                      <p className="text-text-primary font-medium">{teacher?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupSchedules.map((schedule, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-text-secondary" />
                          <span className="text-text-primary font-medium">{schedule.day}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary">Time:</span>
                          <span className="text-text-primary font-medium">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </>
          ) : (
            /* Students Tab */
            <div className="space-y-6">
              {/* Student List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Student List ({studentCount}/{group.capacity})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                      <p className="text-text-secondary">No students enrolled in this group yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[75vh] overflow-y-auto">
                      {students.map(student => {
                        return (
                          <Card key={student.id} className="surface-secondary">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-text-primary">
                                    {student.firstName} {student.lastName}
                                  </h4>
                                  <p className="text-sm text-text-secondary">
                                    {student?.yearName || 'Unknown'} • {student?.fieldName || 'Unknown'}
                                  </p>
                                </div>
                                
                                {effectiveMode === 'takeAttendance' ? (
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
                                ) : (
                                  <div className="text-sm text-text-secondary">
                                    {attendance[student.id] ? (
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        attendance[student.id] === 'present' 
                                          ? 'bg-status-success/20 text-status-success'
                                          : attendance[student.id] === 'late'
                                          ? 'bg-status-warning/20 text-status-warning'
                                          : 'bg-status-error/20 text-status-error'
                                      }`}>
                                        {attendance[student.id] === 'present' ? 'Present' : 
                                         attendance[student.id] === 'late' ? 'Late' : 'Absent'}
                                      </span>
                                    ) : (
                                      <span className="text-text-muted">No attendance recorded</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attendance Actions - Only show in takeAttendance mode */}
              {effectiveMode === 'takeAttendance' && students.length > 0 && (
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <ModernButton
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // Reset all attendance to present
                      const initialAttendance: {[studentId: string]: 'present' | 'absent' | 'late'} = {};
                      students.forEach(student => {
                        initialAttendance[student.id] = 'present';
                      });
                      setAttendance(initialAttendance);
                    }}
                  >
                    Mark All Present
                  </ModernButton>
                  <ModernButton
                    variant="solid"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        const currentDate = new Date().toISOString().split('T')[0];
                        const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
                          studentId,
                          status,
                        }));

                        await apiService.bulkCreateAttendance({
                          groupId: group.id,
                          date: currentDate,
                          attendanceRecords,
                        });

                        // Show success message or close modal
                        console.log('Attendance saved successfully');
                        setAttendance({}); // Reset attendance state
                      } catch (error) {
                        console.error('Error saving attendance:', error);
                      }
                    }}
                  >
                    Save Attendance
                  </ModernButton>
                </div>
              )}
            </div>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
};
