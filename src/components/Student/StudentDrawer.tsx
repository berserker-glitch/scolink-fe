import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetClose 
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  User, 
  BookOpen, 
  CreditCard, 
  BarChart3, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  Download,
  Plus,
  CheckCircle,
  X,
  Clock as ClockIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle
} from 'lucide-react';
import { Student as MockStudent } from '@/data/mockData';
import { Student } from '@/services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { SubjectSelection } from './SubjectSelection';
import { GroupAssignment } from './GroupAssignment';
import { PaymentRecordModal } from '../Payment/PaymentRecordModal';

interface StudentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | MockStudent | null;
  onEdit: (student: Student | MockStudent) => void;
  onDelete: (studentId: string) => void;
  onOpenPaymentModal: () => void;
}

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onDelete,
  onOpenPaymentModal
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isPaymentRecordModalOpen, setIsPaymentRecordModalOpen] = useState(false);
  const [selectedPaymentMonth, setSelectedPaymentMonth] = useState<string>('');
  const [selectedSubjectForAttendance, setSelectedSubjectForAttendance] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<any>(null);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isChangeGroupModalOpen, setIsChangeGroupModalOpen] = useState(false);
  const [selectedSubjectForGroupChange, setSelectedSubjectForGroupChange] = useState<any>(null);
  const [addSubjectStep, setAddSubjectStep] = useState<'subjects' | 'groups'>('subjects');
  const [selectedSubjectsForAddition, setSelectedSubjectsForAddition] = useState<string[]>([]);
  const [selectedGroupsForAddition, setSelectedGroupsForAddition] = useState<{ [subjectId: string]: string }>({});

  // Fetch subjects for the student's year and field
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.getSubjects(),
    enabled: isOpen,
  });

  // Fetch groups
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(),
    enabled: isOpen,
  });

  const availableSubjects = subjectsData?.subjects || [];
  const availableGroups = groupsData?.groups || [];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!student) return null;

  const getSubjectName = (subjectId: string) => {
    return availableSubjects.find(s => s.id === subjectId)?.name || 'Unknown';
  };

  const getGroupName = (groupId: string) => {
    return availableGroups.find(g => g.id === groupId)?.name || 'Unknown';
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'Unassigned';
    const teacher = availableGroups.find(g => g.teacherId === teacherId);
    return teacher?.teacherName || 'Unknown Teacher';
  };


  const getMonthlyFee = () => {
    const enrollments = student.enrollments || [];
    return enrollments.reduce((total, enrollment) => {
      const subject = availableSubjects.find(s => s.name === enrollment.subjectName);
      return total + (subject?.monthlyFee || 0);
    }, 0);
  };

  // Fetch attendance data for an enrollment
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', 'student', student.id],
    queryFn: () => apiService.getAttendanceByStudent(student.id),
    enabled: isOpen && !!student.id,
  });

  const getAttendancePercentage = (enrollmentId: string) => {
    const attendanceRecords = attendanceData || [];
    
    // Filter attendance records for this specific enrollment
    const enrollmentAttendance = attendanceRecords.filter(
      (record: any) => record.enrollmentId === enrollmentId
    );
    
    if (enrollmentAttendance.length === 0) return 0;
    
    const presentCount = enrollmentAttendance.filter((record: any) => record.status === 'present').length;
    return Math.round((presentCount / enrollmentAttendance.length) * 100);
  };

  const getPaymentStatus = (month: string) => {
    const payments = (student as MockStudent)?.payments || [];
    const payment = payments.find(p => p.month === month);
    return payment?.status || 'unpaid';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar helper functions
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getAttendanceForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const attendanceRecords = attendanceData || [];
    
    return attendanceRecords.find((record: any) => {
      return record.enrollmentId === selectedSubjectForAttendance && record.date === dateString;
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const openAttendancePopup = (record: any) => {
    setSelectedAttendanceRecord(record);
  };

  // Subject and Group management functions
  const getAvailableSubjects = () => {
    const enrollments = student.enrollments || [];
    const currentSubjectNames = enrollments.map(e => e.subjectName);
    
    // Filter subjects by student's year and field, and exclude already enrolled subjects
    return availableSubjects.filter(subject => 
      subject.yearId === student.yearId && 
      subject.fieldId === student.fieldId && 
      !currentSubjectNames.includes(subject.name) &&
      subject.isActive
    );
  };

  const getAvailableGroupsForSubject = (subjectId: string) => {
    return availableGroups.filter(g => g.subjectId === subjectId && g.isActive);
  };

  const handleAddSubject = async (subjectId: string, groupId: string) => {
    try {
      await apiService.enrollStudentInSubjects(student.id, [{ subjectId, groupId }]);
      
      toast({
        title: "Success",
        description: "Subject enrolled successfully."
      });
      
      // Refresh student data
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', student.id] });
      
      setIsAddSubjectModalOpen(false);
      setAddSubjectStep('subjects');
      setSelectedSubjectsForAddition([]);
      setSelectedGroupsForAddition({});
    } catch (error) {
      console.error('Error enrolling subject:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enroll subject. Please try again."
      });
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectsForAddition(prev => {
      const newSelected = prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId];
      
      // Remove group selection if subject is deselected
      const newGroups = { ...selectedGroupsForAddition };
      if (!newSelected.includes(subjectId)) {
        delete newGroups[subjectId];
      }
      
      setSelectedGroupsForAddition(newGroups);
      return newSelected;
    });
  };

  const handleGroupSelect = (subjectId: string, groupId: string) => {
    setSelectedGroupsForAddition(prev => ({
      ...prev,
      [subjectId]: groupId
    }));
  };

  const handleAddSubjectsToStudent = async () => {
    try {
      // Prepare enrollment data
      const enrollments = selectedSubjectsForAddition.map(subjectId => ({
        subjectId,
        groupId: selectedGroupsForAddition[subjectId]
      })).filter(enrollment => enrollment.groupId); // Only include subjects with selected groups

      if (enrollments.length === 0) {
        toast({
          variant: "destructive",
          title: "Missing Group Selection",
          description: "Please select groups for all selected subjects."
        });
        return;
      }

      // Make API call to enroll student
      await apiService.enrollStudentInSubjects(student.id, enrollments);
      
      // Reset form state
      setIsAddSubjectModalOpen(false);
      setAddSubjectStep('subjects');
      setSelectedSubjectsForAddition([]);
      setSelectedGroupsForAddition({});
      
      // Show success message
      toast({
        title: "Enrollment Successful",
        description: `Successfully enrolled student in ${enrollments.length} subject(s)!`
      });
      
      // Refresh student data
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['students', student.id] });
      
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: "Failed to enroll student. Please try again."
      });
    }
  };

  const handleChangeGroup = async (enrollmentId: string, newGroupId: string) => {
    try {
      await apiService.updateStudentEnrollment(student.id, enrollmentId, newGroupId);
      
      toast({
        title: "Group Changed",
        description: "Student's group has been updated successfully."
      });
      
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['students', student.id] });
      setIsChangeGroupModalOpen(false);
      setSelectedSubjectForGroupChange(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Change Group",
        description: "Unable to change the student's group. Please try again."
      });
    }
  };

  const handleRemoveSubject = async (enrollmentId: string) => {
    try {
      await apiService.removeStudentEnrollment(student.id, enrollmentId);
      
      toast({
        title: "Subject Removed",
        description: "Student has been unenrolled from the subject."
      });
      
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['students', student.id] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Remove Subject",
        description: "Unable to remove the subject. Please try again."
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[50%] !max-w-[50vw] h-full overflow-hidden" style={{ width: '50%', maxWidth: '50vw' }}>
        <SheetHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-bold">
                {student.firstName} {student.lastName}
              </SheetTitle>
              <p className="text-sm text-text-secondary mt-1">
                {student.yearName || 'Unknown Year'} • {student.fieldName || 'Unknown Field'}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4 border-b border-border">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="subjects" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Subjects & Groups
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Reports & Attendance
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Info Tab */}
              <TabsContent value="info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Full Name</label>
                        <p className="text-text-primary">{student.firstName} {student.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Gender</label>
                        <p className="text-text-primary">{student.sex === 'M' ? 'Male' : 'Female'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Academic Year</label>
                        <p className="text-text-primary">{student.yearName || 'Unknown Year'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Field of Study</label>
                        <p className="text-text-primary">{student.fieldName || 'Unknown Field'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Phone</label>
                        <p className="text-text-primary flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {student.phone}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Parent Phone</label>
                        <p className="text-text-primary flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {student.parentPhone}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-secondary">Notes</label>
                      <textarea
                        className="w-full mt-2 p-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
                        rows={3}
                        placeholder="Add notes about the student..."
                        defaultValue={(student as MockStudent)?.notes || ''}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subjects & Groups Tab */}
              <TabsContent value="subjects" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Current Subjects & Groups
                      </CardTitle>
                      <BrutalistButton 
                        variant="primary" 
                        size="sm"
                        onClick={() => setIsAddSubjectModalOpen(true)}
                        disabled={getAvailableSubjects().length === 0}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Subject
                      </BrutalistButton>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(!student.enrollments || student.enrollments.length === 0) ? (
                        <div className="text-center py-8 text-text-secondary">
                          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No subjects assigned yet.</p>
                          <p className="text-sm">Click "Add Subject" to get started.</p>
                        </div>
                      ) : (
                        (student.enrollments || []).map((enrollment, index) => {
                        const subjectData = availableSubjects.find(s => s.name === enrollment.subjectName);
                        const groupData = availableGroups.find(g => g.id === enrollment.groupId);
                          
                          return (
                            <div key={index} className="p-4 border border-border rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-text-primary">
                                  {subjectData?.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {subjectData?.monthlyFee} DH/month
                                  </Badge>
                                  <BrutalistButton 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSubjectForGroupChange(enrollment);
                                      setIsChangeGroupModalOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Change Group
                                  </BrutalistButton>
                                  <BrutalistButton 
                                    variant="danger" 
                                    size="sm"
                                    onClick={() => handleRemoveSubject(enrollment.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </BrutalistButton>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-text-secondary">Group: </span>
                                  <span className="text-text-primary">{enrollment.groupName}</span>
                                </div>
                                <div>
                                  <span className="text-text-secondary">Teacher: </span>
                                  <span className="text-text-primary">{'Assigned Teacher'}</span>
                                </div>
                                <div>
                                  <span className="text-text-secondary">Schedule: </span>
                                  <span className="text-text-primary">
                                    {groupData?.schedules && groupData.schedules.length > 0 
                                      ? `${(groupData.schedules[0] as any).day} ${(groupData.schedules[0] as any).startTime}-${(groupData.schedules[0] as any).endTime}`
                                      : 'Not scheduled'
                                    }
                                  </span>
                                </div>
                                <div>
                                  <span className="text-text-secondary">Room: </span>
                                  <span className="text-text-primary">{groupData?.classNumber}</span>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-text-secondary">Attendance Rate</span>
                                  <span className="text-sm font-medium text-text-primary">
                                    {getAttendancePercentage(enrollment.id)}%
                                  </span>
                                </div>
                                <div className="mt-2 w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${getAttendancePercentage(enrollment.id)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payment History
                      </CardTitle>
                      <BrutalistButton 
                        variant="primary" 
                        size="sm"
                        onClick={() => {
                          setSelectedPaymentMonth('');
                          setIsPaymentRecordModalOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Record Payment
                      </BrutalistButton>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {months.slice(0, 6).map((month, index) => {
                        const monthKey = new Date().getFullYear() + '-' + String(index + 1).padStart(2, '0');
                        const payments = (student as MockStudent)?.payments || [];
                        const payment = payments.find(p => p.month === monthKey);
                        const status = getPaymentStatus(monthKey);
                        
                        return (
                          <div key={month} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-text-secondary" />
                              <span className="font-medium text-text-primary">{month}</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="text-text-primary font-medium">
                                {payment ? `${payment.amount} DH` : `${getMonthlyFee()} DH`}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={status === 'paid' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}
                                  className="flex items-center gap-1"
                                >
                                  {status === 'paid' && <CheckCircle className="w-3 h-3" />}
                                  {status === 'overdue' && <X className="w-3 h-3" />}
                                  {status === 'pending' && <ClockIcon className="w-3 h-3" />}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Badge>
                                
                                {status !== 'paid' && (
                                  <BrutalistButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPaymentMonth(monthKey);
                                      setIsPaymentRecordModalOpen(true);
                                    }}
                                  >
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    Pay
                                  </BrutalistButton>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reports & Attendance Tab */}
              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Attendance by Subject
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Subject Selection */}
                      {(student.enrollments || []).length === 0 ? (
                        <div className="text-center py-8">
                          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                          <h4 className="font-medium text-text-primary mb-2">No Subjects Enrolled</h4>
                          <p className="text-text-secondary">The student is not enrolled in any subjects yet.</p>
                        </div>
                      ) : (
                        <>
                        <div className="bg-status-success/10 border border-status-success/20 rounded-lg p-4 mb-6">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-text-primary mb-1">Attendance Tracking Active</h4>
                              <p className="text-sm text-text-secondary">
                                View real-time attendance data and statistics for this student across all enrolled subjects.
                              </p>
                            </div>
                          </div>
                        </div>
                          <div>
                            <h4 className="font-medium text-text-primary mb-3">Select Subject to View Attendance</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(student.enrollments || []).map((enrollment, index) => {
                        const subjectData = availableSubjects.find(s => s.name === enrollment.subjectName);
                        const groupData = availableGroups.find(g => g.id === enrollment.groupId);
                            const attendancePercentage = getAttendancePercentage(enrollment.id);
                            
                            return (
                              <button
                                key={index}
                                onClick={() => setSelectedSubjectForAttendance(enrollment.id)}
                                className={`p-4 border rounded-lg text-left transition-all ${
                                  selectedSubjectForAttendance === enrollment.id
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50 hover:bg-surface-hover'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-text-primary">
                                    {subjectData?.name}
                                  </h5>
                                  <Badge variant="outline">
                                    {attendancePercentage > 0 ? `${attendancePercentage}%` : 'No data'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-text-secondary">
                                  Group: {groupData?.name}
                                </div>
                                <div className="mt-2 w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${attendancePercentage}%` }}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Subject Attendance Details */}
                      {selectedSubjectForAttendance && (
                        <div className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-text-primary">
                              {student.enrollments?.find(e => e.id === selectedSubjectForAttendance)?.subjectName} - Attendance Calendar
                            </h4>
                            <button
                              onClick={() => setSelectedSubjectForAttendance(null)}
                              className="text-text-secondary hover:text-text-primary"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Calendar View */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                className="p-2 hover:bg-surface rounded-md"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <h5 className="font-medium text-text-primary">
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </h5>
                              <button
                                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                className="p-2 hover:bg-surface rounded-md"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {/* Day headers */}
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="p-2 text-center text-xs font-medium text-text-secondary">
                                  {day}
                                </div>
                              ))}
                              
                              {/* Calendar days */}
                              {getCalendarDays().map((day, index) => {
                                if (!day) {
                                  return <div key={index} className="p-2" />;
                                }
                                
                                const attendanceRecord = getAttendanceForDate(day);
                                const isToday = isSameDay(day, new Date());
                                
                                return (
                                  <button
                                    key={index}
                                    onClick={() => attendanceRecord && openAttendancePopup(attendanceRecord)}
                                    disabled={!attendanceRecord}
                                    className={`p-2 text-sm rounded-md transition-all ${
                                      attendanceRecord
                                        ? 'cursor-pointer hover:bg-surface-hover'
                                        : 'text-text-muted'
                                    } ${
                                      attendanceRecord?.status === 'present' ? 'bg-green-100 text-green-800' :
                                      attendanceRecord?.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                      attendanceRecord?.status === 'absent' ? 'bg-red-100 text-red-800' :
                                      ''
                                    } ${
                                      isToday ? 'ring-2 ring-primary' : ''
                                    }`}
                                  >
                                    {day.getDate()}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Attendance Details Popup */}
                      {selectedAttendanceRecord && (
                        <Dialog open={!!selectedAttendanceRecord} onOpenChange={() => setSelectedAttendanceRecord(null)}>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Attendance Details
                              </DialogTitle>
                              <DialogDescription>
                                View detailed attendance information for this record.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text-primary">Date:</span>
                                <span className="text-sm text-text-secondary">
                                  {selectedAttendanceRecord && new Date(selectedAttendanceRecord.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text-primary">Status:</span>
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    selectedAttendanceRecord?.status === 'present' ? 'border-green-500 text-green-700' :
                                    selectedAttendanceRecord?.status === 'late' ? 'border-yellow-500 text-yellow-700' :
                                    'border-red-500 text-red-700'
                                  }`}
                                >
                                  {selectedAttendanceRecord?.status}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text-primary">Subject:</span>
                                <span className="text-sm text-text-secondary">
                                  {availableSubjects.find(s => s.id === 
                                    availableGroups.find(g => g.id === selectedAttendanceRecord?.groupId)?.subjectId
                                  )?.name}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text-primary">Group:</span>
                                <span className="text-sm text-text-secondary">
                                  {availableGroups.find(g => g.id === selectedAttendanceRecord?.groupId)?.name}
                                </span>
                              </div>
                              
                              {selectedAttendanceRecord?.note && (
                                <div className="pt-3 border-t border-border">
                                  <span className="text-sm font-medium text-text-primary block mb-2">Teacher Note:</span>
                                  <p className="text-sm text-text-secondary bg-surface p-3 rounded-md">
                                    {selectedAttendanceRecord.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Teacher Notes */}
                      <div>
                        <h4 className="font-medium text-text-primary mb-3">Teacher Notes</h4>
                        <textarea
                          className="w-full p-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
                          rows={4}
                          placeholder="Add teacher notes about the student..."
                        />
                      </div>

                      {/* Generate Report Button */}
                      <div className="pt-4 border-t border-border">
                        <BrutalistButton 
                          variant="primary" 
                          className="w-full"
                          onClick={() => {
                            // TODO: Implement PDF generation
                            console.log('Generating report for student:', student.id);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Generate Student Report
                        </BrutalistButton>
                      </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Add Subject Modal */}
        <Dialog open={isAddSubjectModalOpen} onOpenChange={setIsAddSubjectModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Subjects
              </DialogTitle>
              <DialogDescription>
                Select subjects and groups to add to this student's enrollment.
              </DialogDescription>
            </DialogHeader>
            
            {addSubjectStep === 'subjects' ? (
              <div className="space-y-4">
                <div className="text-sm text-text-secondary">
                  Available subjects for {student.yearName || 'Unknown Year'} - {student.fieldName || 'Unknown Field'}:
                </div>
                
                <div className="grid gap-3">
                  {getAvailableSubjects().length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No available subjects found for this year and field.</p>
                    </div>
                  ) : (
                    getAvailableSubjects().map((subject) => {
                      const isSelected = selectedSubjectsForAddition.includes(subject.id);
                      return (
                        <div
                          key={subject.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'border-border hover:border-primary/50 hover:bg-surface-hover'
                          }`}
                          onClick={() => handleSubjectToggle(subject.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-text-primary">{subject.name}</div>
                              <div className="text-sm text-text-secondary">
                                Monthly fee: {subject.monthlyFee} DH
                              </div>
                            </div>
                            <div className="flex items-center">
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {selectedSubjectsForAddition.length > 0 && (
                  <div className="p-4 bg-surface-hover rounded-lg border">
                    <div className="text-sm font-medium text-text-primary mb-2">Selected Subjects:</div>
                    <div className="text-sm text-text-secondary">
                      Total monthly fee: {selectedSubjectsForAddition.reduce((total, subjectId) => {
                        const subject = availableSubjects.find(s => s.id === subjectId);
                        return total + (subject?.monthlyFee || 0);
                      }, 0)} DH
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                  <BrutalistButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsAddSubjectModalOpen(false);
                      setAddSubjectStep('subjects');
                      setSelectedSubjectsForAddition([]);
                      setSelectedGroupsForAddition({});
                    }}
                  >
                    Cancel
                  </BrutalistButton>
                  <BrutalistButton 
                    variant="primary" 
                    size="sm"
                    onClick={() => setAddSubjectStep('groups')}
                    disabled={selectedSubjectsForAddition.length === 0}
                  >
                    Next: Select Groups
                  </BrutalistButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-text-secondary mb-4">
                  Select groups for the chosen subjects:
                </div>
                
                {selectedSubjectsForAddition.map((subjectId) => {
                  const subject = availableSubjects.find(s => s.id === subjectId);
                  const groups = getAvailableGroupsForSubject(subjectId);
                  const selectedGroup = selectedGroupsForAddition[subjectId];
                  
                  return (
                    <div key={subjectId} className="p-4 border border-border rounded-lg">
                      <div className="mb-3">
                        <div className="font-medium text-text-primary">{subject?.name}</div>
                        <div className="text-sm text-text-secondary">Select a group:</div>
                      </div>
                      
                      <div className="grid gap-2">
                        {groups.length === 0 ? (
                          <div className="text-sm text-text-secondary italic">
                            No groups available for this subject
                          </div>
                        ) : (
                          groups.map((group) => (
                            <div
                              key={group.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedGroup === group.id 
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                  : 'border-border hover:border-primary/50 hover:bg-surface-hover'
                              }`}
                              onClick={() => handleGroupSelect(subjectId, group.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{group.name}</div>
                                  <div className="text-xs text-text-secondary">
                                    {group.studentCount || 0}/{group.capacity} students • Room {group.classNumber}
                                  </div>
                                </div>
                                {selectedGroup === group.id && (
                                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              
                              {group.schedules && group.schedules.length > 0 && (
                                <div className="mt-2 text-xs text-text-secondary">
                                  Schedule: {group.schedules.map((s: any) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <div className="p-4 bg-surface-hover rounded-lg border">
                  <div className="text-sm font-medium text-text-primary mb-2">Summary:</div>
                  <div className="text-sm text-text-secondary">
                    Student: {student.firstName} {student.lastName}<br/>
                    Subjects to add: {selectedSubjectsForAddition.length}<br/>
                    Groups selected: {Object.keys(selectedGroupsForAddition).length}/{selectedSubjectsForAddition.length}
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                  <BrutalistButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAddSubjectStep('subjects')}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </BrutalistButton>
                  <BrutalistButton 
                    variant="primary" 
                    size="sm"
                    onClick={handleAddSubjectsToStudent}
                    disabled={Object.keys(selectedGroupsForAddition).length !== selectedSubjectsForAddition.length}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Student
                  </BrutalistButton>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

                        {/* Change Group Modal */}
                <Dialog open={isChangeGroupModalOpen} onOpenChange={setIsChangeGroupModalOpen}>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5" />
                        Change Group
                      </DialogTitle>
                      <DialogDescription>
                        Select a new group for this subject from the available options.
                      </DialogDescription>
                    </DialogHeader>
                    {selectedSubjectForGroupChange && (
                      <GroupAssignment
                        selectedSubjects={[selectedSubjectForGroupChange.subjectName || '']}
                        selectedGroups={selectedSubjectForGroupChange.groupId ? { [selectedSubjectForGroupChange.subjectName || '']: selectedSubjectForGroupChange.groupId } : {}}
                        onGroupSelect={(subjectName, groupId) => {
                          handleChangeGroup(selectedSubjectForGroupChange.id, groupId);
                        }}
                        showSummary={false}
                        availableSubjects={availableSubjects}
                        availableGroups={availableGroups.filter(g => g.subjectName === selectedSubjectForGroupChange.subjectName)}
                      />
                    )}
                    
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                      <BrutalistButton 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsChangeGroupModalOpen(false);
                          setSelectedSubjectForGroupChange(null);
                        }}
                      >
                        Cancel
                      </BrutalistButton>
                      <BrutalistButton 
                        size="sm"
                        onClick={() => {
                          setIsChangeGroupModalOpen(false);
                          setSelectedSubjectForGroupChange(null);
                        }}
                      >
                        Confirm
                      </BrutalistButton>
                    </div>
                  </DialogContent>
                </Dialog>

        <SheetFooter className="border-t border-border">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <BrutalistButton 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(student)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Student
              </BrutalistButton>
              <BrutalistButton 
                variant="danger" 
                size="sm"
                onClick={() => onDelete(student.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Student
              </BrutalistButton>
            </div>
            
            <div className="text-sm text-text-secondary">
              Monthly Fee: <span className="font-medium text-text-primary">{getMonthlyFee()} DH</span>
            </div>
          </div>
        </SheetFooter>

        {/* Payment Record Modal */}
        <PaymentRecordModal
          isOpen={isPaymentRecordModalOpen}
          onClose={() => {
            setIsPaymentRecordModalOpen(false);
            setSelectedPaymentMonth('');
          }}
          student={student as any}
          defaultMonth={selectedPaymentMonth || undefined}
          onPaymentRecorded={() => {
            // Refresh student data
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['students', student.id] });
          }}
        />
      </SheetContent>
    </Sheet>
  );
};
