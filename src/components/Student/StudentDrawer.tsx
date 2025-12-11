import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModernButton } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  GraduationCap,
  ChevronRight,
  Users,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { Student } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SubjectSelection } from './SubjectSelection';
import { GroupAssignment } from './GroupAssignment';
import { PaymentRecordModal } from '../Payment/PaymentRecordModal';

interface StudentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Plan status query to check attendance permissions
  const { data: planStatus } = useQuery({
    queryKey: ['plan-status'],
    queryFn: () => apiService.getPlanStatus(),
    enabled: isAuthenticated && !authLoading,
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: () => apiService.deleteStudent(student!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
      if (onDelete && student) {
        onDelete(student.id);
      }
    },
  });

  // Activate student account mutation
  const activateAccountMutation = useMutation({
    mutationFn: async () => {
      // Generate password format: FirstName + First3LettersOfLastNameInCaps + Last4DigitsOfPhone
      // Example: Ahmed Benali with phone 0612345678 → AhmedBEN5678
      const lastNamePrefix = student!.lastName.substring(0, 3).toUpperCase();
      const phoneLast4 = student!.phone.slice(-4);
      const password = `${student!.firstName}${lastNamePrefix}${phoneLast4}`;
      
      return apiService.activateStudentAccount({
        studentId: student!.id,
        phoneNumber: student!.phone,
        password: password
      });
    },
    onSuccess: (data) => {
      // Use password from response
      const password = data.password;
      
      toast({
        title: "Account Activated ✓",
        description: `Student account created successfully!\n\n📱 Username: ${student?.phone}\n🔑 Password: ${password}\n\nPlease share these credentials with the student.`,
        duration: 15000,
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Activation Failed",
        description: error.message || "Failed to activate student account. Please try again."
      });
    },
  });

  const handleDeleteStudent = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStudent = () => {
    if (!student) return;
    deleteStudentMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  const handleActivateAccount = () => {
    if (!student) return;
    activateAccountMutation.mutate();
  };

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

  // Fetch attendance data for an enrollment - only if user has attendance access
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', 'student', student.id],
    queryFn: () => apiService.getAttendanceByStudent(student.id),
    enabled: isOpen && !!student.id && planStatus?.hasAttendance,
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
    const payments = student?.payments || [];
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
    const currentSubjectIds = enrollments.map(e => e.subjectId);
    
    // Filter subjects by student's year and field, and exclude already enrolled subjects
    return availableSubjects.filter(subject => 
      subject.yearId === student.yearId && 
      subject.fieldId === student.fieldId && 
      !currentSubjectIds.includes(subject.id) &&
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

  if (!isOpen) return null;
  
  return (
    <div className="w-full bg-surface h-full overflow-hidden flex flex-col shadow-adaptive-lg">
        <div className="p-4 shrink-0 shadow-adaptive-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                {student.yearName || 'Unknown Year'} • {student.fieldName || 'Unknown Field'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                Student ID: {student.id?.slice(-6)?.toUpperCase()}
              </Badge>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={handleActivateAccount}
                disabled={activateAccountMutation.isPending || student.hasAccount}
                className="p-2 hover:bg-green-50 rounded-md text-green-600 hover:text-green-700 disabled:opacity-50"
                title={student.hasAccount ? "Account already activated" : "Activate student account"}
              >
                {activateAccountMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => onEdit(student)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <Edit className="w-4 h-4" />
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={handleDeleteStudent}
                disabled={deleteStudentMutation.isPending}
                className="p-2 hover:bg-red-50 rounded-md text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-4 h-4" />
              </ModernButton>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4 shadow-adaptive-sm">
              <TabsList className={`grid w-full ${planStatus?.hasAttendance ? 'grid-cols-4' : 'grid-cols-3'} bg-surface-secondary p-1 rounded-lg h-12 shadow-adaptive-sm`}>
                <TabsTrigger
                  value="info"
                  className="flex items-center justify-center rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200"
                >
                  <User className="w-5 h-5" />
                </TabsTrigger>
                <TabsTrigger
                  value="subjects"
                  className="flex items-center justify-center rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200"
                >
                  <BookOpen className="w-5 h-5" />
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="flex items-center justify-center rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200"
                >
                  <CreditCard className="w-5 h-5" />
                </TabsTrigger>
                {planStatus?.hasAttendance && (
                  <TabsTrigger
                    value="reports"
                    className="flex items-center justify-center rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                {/* Profile Header - Minimal */}
                <div className="text-center py-6 bg-surface rounded-lg shadow-adaptive-sm">
                  <div className="w-16 h-16 mx-auto mb-3 bg-interactive rounded-full flex items-center justify-center shadow-adaptive">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary mb-1">
                    {student.firstName} {student.lastName}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {student.yearName || 'Unknown Year'} • {student.fieldName || 'Unknown Field'}
                  </p>
                </div>

                {/* Information Grid - Minimal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-interactive" />
                      <span className="text-sm font-medium text-text-secondary">Student Phone</span>
                    </div>
                    <p className="text-text-primary font-medium">{student.phone}</p>
                  </div>
                  
                  <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-interactive" />
                      <span className="text-sm font-medium text-text-secondary">Parent Phone</span>
                    </div>
                    <p className="text-text-primary font-medium">{student.parentPhone}</p>
                  </div>
                  
                  <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-interactive" />
                      <span className="text-sm font-medium text-text-secondary">Academic Year</span>
                    </div>
                    <p className="text-text-primary font-medium">{student.yearName || 'Unknown Year'}</p>
                  </div>
                  
                  <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-4 h-4 text-interactive" />
                      <span className="text-sm font-medium text-text-secondary">Field of Study</span>
                    </div>
                    <p className="text-text-primary font-medium">{student.fieldName || 'Unknown Field'}</p>
                  </div>
                </div>

                {/* Gender Badge - Minimal */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center px-3 py-1 bg-surface rounded-full shadow-adaptive-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${student.sex === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                    <span className="text-sm font-medium text-text-primary">
                      {student.sex === 'M' ? 'Male' : 'Female'}
                    </span>
                  </div>
                </div>

                {/* Notes - Only if exists */}
                {student?.notes && (
                  <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-text-muted" />
                      <span className="text-sm font-medium text-text-secondary">Notes</span>
                    </div>
                    <p className="text-text-primary text-sm">{student?.notes}</p>
                  </div>
                )}
              </TabsContent>

              {/* Subjects & Groups Tab */}
              <TabsContent value="subjects" className="space-y-4">
                {/* Header with Add Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-interactive" />
                    <h3 className="text-lg font-semibold text-text-primary">Current Subjects</h3>
                  </div>
                  <ModernButton 
                    variant="solid" 
                    size="sm"
                    onClick={() => setIsAddSubjectModalOpen(true)}
                    disabled={getAvailableSubjects().length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subject
                  </ModernButton>
                </div>

                {/* Subjects List */}
                <div className="space-y-3">
                  {(!student.enrollments || student.enrollments.length === 0) ? (
                    <div className="text-center py-12 bg-surface rounded-lg shadow-adaptive-sm">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                      <h4 className="text-lg font-medium text-text-primary mb-2">No Subjects Enrolled</h4>
                      <p className="text-text-secondary mb-4">The student is not enrolled in any subjects yet.</p>
                      <ModernButton 
                        variant="outline" 
                        onClick={() => setIsAddSubjectModalOpen(true)}
                        disabled={getAvailableSubjects().length === 0}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Subject
                      </ModernButton>
                    </div>
                  ) : (
                    (student.enrollments || []).map((enrollment, index) => {
                      const subjectData = availableSubjects.find(s => s.name === enrollment.subjectName);
                      const groupData = availableGroups.find(g => g.id === enrollment.groupId);
                      const attendanceRate = getAttendancePercentage(enrollment.id);
                      
                      return (
                        <div key={index} className="bg-surface rounded-lg shadow-adaptive-sm p-4 hover:shadow-adaptive transition-shadow">
                          {/* Subject Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-interactive/10 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-interactive" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-text-primary">{subjectData?.name}</h4>
                                <p className="text-sm text-text-secondary">{enrollment.groupName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-text-primary">{subjectData?.monthlyFee} DH</p>
                              <p className="text-xs text-text-secondary">per month</p>
                            </div>
                          </div>

                          {/* Subject Details Grid */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-text-muted" />
                              <div>
                                <p className="text-xs text-text-secondary">Group</p>
                                <p className="text-sm font-medium text-text-primary">{enrollment.groupName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-text-muted" />
                              <div>
                                <p className="text-xs text-text-secondary">Room</p>
                                <p className="text-sm font-medium text-text-primary">{groupData?.classNumber || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-text-muted" />
                              <div>
                                <p className="text-xs text-text-secondary">Schedule</p>
                                <p className="text-sm font-medium text-text-primary">
                                  {groupData?.schedules && groupData.schedules.length > 0 
                                    ? `${(groupData.schedules[0] as any).day} ${(groupData.schedules[0] as any).startTime}-${(groupData.schedules[0] as any).endTime}`
                                    : 'Not scheduled'
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-text-muted" />
                              <div>
                                <p className="text-xs text-text-secondary">Teacher</p>
                                <p className="text-sm font-medium text-text-primary">Assigned Teacher</p>
                              </div>
                            </div>
                          </div>

                          {/* Attendance Progress - Only show for users with attendance access */}
                          {planStatus?.hasAttendance && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-text-secondary">Attendance Rate</span>
                                <span className="text-sm font-medium text-text-primary">{attendanceRate}%</span>
                              </div>
                              <div className="w-full bg-surface-secondary rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    attendanceRate >= 80 ? 'bg-green-500' :
                                    attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${attendanceRate}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2">
                            <ModernButton 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSubjectForGroupChange(enrollment);
                                setIsChangeGroupModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Change Group
                            </ModernButton>
                            <ModernButton 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveSubject(enrollment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </ModernButton>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-4">
                {/* Header with Record Payment Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-interactive" />
                    <h3 className="text-lg font-semibold text-text-primary">Payment History</h3>
                  </div>
                  <ModernButton 
                    variant="solid" 
                    size="sm"
                    onClick={() => {
                      setSelectedPaymentMonth('');
                      setIsPaymentRecordModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </ModernButton>
                </div>

                {/* Payment Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-surface rounded-lg shadow-adaptive-sm p-4 text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-sm text-text-secondary">Paid</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {months.slice(0, 6).filter((_, index) => {
                        const monthKey = new Date().getFullYear() + '-' + String(index + 1).padStart(2, '0');
                        return getPaymentStatus(monthKey) === 'paid';
                      }).length}
                    </p>
                  </div>
                  <div className="bg-surface rounded-lg shadow-adaptive-sm p-4 text-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <ClockIcon className="w-4 h-4 text-yellow-600" />
                    </div>
                    <p className="text-sm text-text-secondary">Pending</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {months.slice(0, 6).filter((_, index) => {
                        const monthKey = new Date().getFullYear() + '-' + String(index + 1).padStart(2, '0');
                        return getPaymentStatus(monthKey) === 'pending';
                      }).length}
                    </p>
                  </div>
                  <div className="bg-surface rounded-lg shadow-adaptive-sm p-4 text-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <X className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-sm text-text-secondary">Overdue</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {months.slice(0, 6).filter((_, index) => {
                        const monthKey = new Date().getFullYear() + '-' + String(index + 1).padStart(2, '0');
                        return getPaymentStatus(monthKey) === 'overdue';
                      }).length}
                    </p>
                  </div>
                </div>

                {/* Payment List */}
                <div className="space-y-3">
                  {months.slice(0, 6).map((month, index) => {
                    const monthKey = new Date().getFullYear() + '-' + String(index + 1).padStart(2, '0');
                    const payments = student?.payments || [];
                    const payment = payments.find(p => p.month === monthKey);
                    const status = getPaymentStatus(monthKey);
                    const amount = payment ? payment.amount : getMonthlyFee();
                    
                    return (
                      <div key={month} className="bg-surface rounded-lg shadow-adaptive-sm p-4 hover:shadow-adaptive transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              status === 'paid' ? 'bg-green-100' : 
                              status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              {status === 'paid' && <CheckCircle className="w-5 h-5 text-green-600" />}
                              {status === 'overdue' && <X className="w-5 h-5 text-red-600" />}
                              {status === 'pending' && <ClockIcon className="w-5 h-5 text-yellow-600" />}
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">{month}</h4>
                              <p className="text-sm text-text-secondary">
                                {payment ? `Paid on ${payment.date}` : 'Not paid yet'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-semibold text-text-primary">{amount} DH</p>
                              <p className="text-sm text-text-secondary">Monthly fee</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                status === 'paid' ? 'bg-green-100 text-green-800' : 
                                status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </div>
                              
                              {status !== 'paid' && (
                                <ModernButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPaymentMonth(monthKey);
                                    setIsPaymentRecordModalOpen(true);
                                  }}
                                >
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  Pay Now
                                </ModernButton>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Reports & Attendance Tab */}
              <TabsContent value="reports" className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-interactive" />
                  <h3 className="text-lg font-semibold text-text-primary">Attendance Reports</h3>
                </div>

                {/* Status Banner */}
                <div className="bg-green-50 rounded-lg p-4 shadow-adaptive-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-text-primary mb-1">Attendance Tracking Active</h4>
                      <p className="text-sm text-text-secondary">
                        View real-time attendance data and statistics for this student across all enrolled subjects.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subject Selection */}
                {(student.enrollments || []).length === 0 ? (
                  <div className="text-center py-12 bg-surface rounded-lg shadow-adaptive-sm">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                    <h4 className="text-lg font-medium text-text-primary mb-2">No Subjects Enrolled</h4>
                    <p className="text-text-secondary">The student is not enrolled in any subjects yet.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-medium text-text-primary mb-3">Select Subject to View Attendance</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {(student.enrollments || []).map((enrollment, index) => {
                          const subjectData = availableSubjects.find(s => s.name === enrollment.subjectName);
                          const groupData = availableGroups.find(g => g.id === enrollment.groupId);
                          const attendancePercentage = getAttendancePercentage(enrollment.id);
                          
                          return (
                            <div
                              key={index}
                              onClick={() => setSelectedSubjectForAttendance(enrollment.id)}
                              className={`p-4 rounded-lg cursor-pointer transition-all ${
                                selectedSubjectForAttendance === enrollment.id
                                  ? 'bg-interactive/10 border-2 border-interactive'
                                  : 'bg-surface shadow-adaptive-sm hover:shadow-adaptive hover:bg-surface-hover'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-interactive/10 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-interactive" />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-text-primary">{subjectData?.name}</h5>
                                    <p className="text-sm text-text-secondary">Group: {groupData?.name}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    attendancePercentage >= 80 ? 'bg-green-100 text-green-800' : 
                                    attendancePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {attendancePercentage > 0 ? `${attendancePercentage}%` : 'No data'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="w-full bg-surface-secondary rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    attendancePercentage >= 80 ? 'bg-green-500' : 
                                    attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${attendancePercentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                      {/* Selected Subject Attendance Details */}
                      {selectedSubjectForAttendance && (
                        <div className="bg-surface rounded-lg p-4 shadow-adaptive-sm">
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
                                <div className="pt-3">
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
                          className="w-full p-3 rounded-lg bg-background text-text-primary focus-brutalist shadow-adaptive-sm"
                          rows={4}
                          placeholder="Add teacher notes about the student..."
                        />
                      </div>

                      {/* Generate Report Button */}
                      <div className="pt-4">
                        <ModernButton 
                          variant="solid" 
                          className="w-full"
                          onClick={() => {
                            // TODO: Implement PDF generation
                            console.log('Generating report for student:', student.id);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Generate Student Report
                        </ModernButton>
                      </div>
                    </>
                  )}
              </TabsContent>
            </div>
          </Tabs>
        

        {/* Action Buttons */}
        <div className="p-4 shrink-0 shadow-adaptive-sm">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ModernButton 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(student)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Student
              </ModernButton>
              <ModernButton 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(student.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Student
              </ModernButton>
            </div>
            
            <div className="text-sm text-text-secondary">
              Monthly Fee: <span className="font-medium text-text-primary">{getMonthlyFee()} DH</span>
            </div>
          </div>
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
                                  <div className="w-2 h-2 bg-surface rounded-full"></div>
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
                
                <div className="flex items-center justify-end gap-2 pt-4">
                  <ModernButton 
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
                  </ModernButton>
                  <ModernButton 
                    variant="solid" 
                    size="sm"
                    onClick={() => setAddSubjectStep('groups')}
                    disabled={selectedSubjectsForAddition.length === 0}
                  >
                    Next: Select Groups
                  </ModernButton>
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
                    <div key={subjectId} className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
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
                                  : 'shadow-adaptive-sm hover:shadow-adaptive hover:bg-surface-hover'
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
                                    <div className="w-1.5 h-1.5 bg-surface rounded-full"></div>
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
                
                <div className="flex items-center justify-end gap-2 pt-4">
                  <ModernButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAddSubjectStep('subjects')}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </ModernButton>
                  <ModernButton 
                    variant="solid" 
                    size="sm"
                    onClick={handleAddSubjectsToStudent}
                    disabled={Object.keys(selectedGroupsForAddition).length !== selectedSubjectsForAddition.length}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Student
                  </ModernButton>
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
                        availableGroups={availableGroups.filter(g => g.subjectId === selectedSubjectForGroupChange.subjectId)}
                      />
                    )}
                    
                    <div className="flex items-center justify-end gap-2 pt-4">
                      <ModernButton 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsChangeGroupModalOpen(false);
                          setSelectedSubjectForGroupChange(null);
                        }}
                      >
                        Cancel
                      </ModernButton>
                      <ModernButton 
                        size="sm"
                        onClick={() => {
                          setIsChangeGroupModalOpen(false);
                          setSelectedSubjectForGroupChange(null);
                        }}
                      >
                        Confirm
                      </ModernButton>
                    </div>
                  </DialogContent>
                </Dialog>

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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-surface border border-gray-200 shadow-adaptive-xl">
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-xl font-semibold text-text-primary flex items-center gap-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                Delete Student
              </AlertDialogTitle>
              <AlertDialogDescription className="text-text-secondary leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-text-primary">{student.firstName} {student.lastName}</span>?
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  This action cannot be undone and will permanently remove the student and all associated data including enrollments, payments, and attendance records.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-3 pt-6">
              <AlertDialogCancel className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteStudent}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={deleteStudentMutation.isPending}
              >
                {deleteStudentMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Student
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
