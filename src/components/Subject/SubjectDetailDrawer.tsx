import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Subject, Group, Teacher } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Users, 
  Clock, 
  MapPin, 
  Edit, 
  Trash2, 
  Plus,
  Eye,
  X,
  Search,
  BarChart3
} from 'lucide-react';

interface SubjectDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  onDelete?: (subjectId: string) => void;
}

export const SubjectDetailDrawer: React.FC<SubjectDetailDrawerProps> = ({
  isOpen,
  onClose,
  subject,
  onDelete
}) => {
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [groupForm, setGroupForm] = useState({
    name: '',
    capacity: '',
    classNumber: '',
    schedules: [{ day: 'Monday', startTime: '08:00', endTime: '10:00' }],
    teacherId: ''
  });

  // Get subject's groups using API
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups', 'subject', subject.id],
    queryFn: () => apiService.getGroupsBySubject(subject.id),
    enabled: isOpen && !!subject.id,
  });

  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiService.getTeachers(1, 100),
    enabled: isOpen,
  });

  const subjectGroups = groupsData || [];
  const teachers = teachersData?.teachers || [];
  
  const [groupFormStep, setGroupFormStep] = useState(1);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const totalStudents = subjectGroups.reduce((total, group) => total + (group.studentCount || 0), 0);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: () => apiService.deleteSubject(subject.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      onClose();
      if (onDelete) {
        onDelete(subject.id);
      }
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (groupData: any) => apiService.createGroup(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'subject', subject.id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: "Success",
        description: "Group created successfully."
      });
      setIsAddGroupOpen(false);
      setGroupFormStep(1);
      setTeacherSearchQuery('');
    },
    onError: (error) => {
      console.error('Error creating group:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create group. Please try again."
      });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: any }) => 
      apiService.updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'subject', subject.id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: "Success",
        description: "Group updated successfully."
      });
      setIsEditGroupOpen(false);
      setSelectedGroup(null);
      setGroupFormStep(1);
    },
    onError: (error) => {
      console.error('Error updating group:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update group. Please try again."
      });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => apiService.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'subject', subject.id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: "Success",
        description: "Group deleted successfully."
      });
    },
    onError: (error) => {
      console.error('Error deleting group:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete group. Please try again."
      });
    }
  });

  const dayOptions = [
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' }
  ];

  const getGroupTeacher = (teacherId?: string) => {
    if (!teacherId) return null;
    return teachers.find(t => t.id === teacherId);
  };

  const getTeacherSubjects = (subjectNames: string[]) => {
    return subjectNames.join(', ');
  };

  const getFilteredTeachers = () => {
    if (!teacherSearchQuery) return teachers;
    
    return teachers.filter(teacher =>
      teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      (teacher.subjects && teacher.subjects.some(subjectName => 
        subjectName.toLowerCase().includes(teacherSearchQuery.toLowerCase())
      ))
    );
  };

  const canProceedToNextStep = () => {
    if (groupFormStep === 1) {
      return groupForm.name && groupForm.capacity && groupForm.classNumber && groupForm.schedules.length > 0;
    }
    return true;
  };

  const handleNextStep = () => {
    if (groupFormStep === 1) {
      setGroupFormStep(2);
    }
  };

  const handlePreviousStep = () => {
    setGroupFormStep(1);
  };

  const handleSaveGroup = () => {
    const groupData = {
      name: groupForm.name,
      capacity: parseInt(groupForm.capacity),
      classNumber: groupForm.classNumber,
      subjectId: subject.id,
      teacherId: groupForm.teacherId || undefined,
      schedules: groupForm.schedules,
      isActive: true
    };
    
    createGroupMutation.mutate(groupData);
    setGroupForm({
      name: '',
      capacity: '',
      classNumber: '',
      schedules: [{ day: 'Monday', startTime: '08:00', endTime: '10:00' }],
      teacherId: ''
    });
  };

  const handleEditGroup = () => {
    if (!selectedGroup) return;
    
    const groupData = {
      name: groupForm.name,
      capacity: parseInt(groupForm.capacity),
      classNumber: groupForm.classNumber,
      teacherId: groupForm.teacherId || undefined,
      schedules: groupForm.schedules,
      isActive: true
    };
    
    updateGroupMutation.mutate({ groupId: selectedGroup.id, data: groupData });
    setGroupForm({
      name: '',
      capacity: '',
      classNumber: '',
      schedules: [{ day: 'Monday', startTime: '08:00', endTime: '10:00' }],
      teacherId: ''
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const openEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setGroupForm({
      name: group.name,
      capacity: group.capacity.toString(),
      classNumber: group.classNumber,
      schedules: group.schedules,
      teacherId: group.teacherId || ''
    });
    setIsEditGroupOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-surface h-full overflow-hidden flex flex-col shadow-adaptive-lg">
      {/* Header - Similar to Student Drawer */}
      <div className="p-4 shrink-0 shadow-adaptive-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {subject.name}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {subject.yearName} • {subject.fieldName} • {subject.monthlyFee} DH/month
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Subject ID: {subject.id?.slice(-6)?.toUpperCase()}
            </Badge>
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </ModernButton>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Similar to Student Drawer */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-4 shadow-adaptive-sm">
            <TabsList className="grid w-full grid-cols-2 bg-surface-secondary p-1 rounded-lg h-12 shadow-adaptive-sm">
              <TabsTrigger 
                value="info" 
                className="flex items-center justify-center rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200"
              >
                <BookOpen className="w-5 h-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="groups" 
                className="flex items-center justify-center rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200"
              >
                <Users className="w-5 h-5" />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Subject Info Tab */}
            <TabsContent value="info" className="space-y-4">
              {/* Subject Header */}
              <div className="text-center py-6 bg-surface rounded-lg shadow-adaptive-sm">
                <div className="w-16 h-16 mx-auto mb-3 bg-interactive rounded-full flex items-center justify-center shadow-adaptive">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-1">
                  {subject.name}
                </h2>
                <p className="text-sm text-text-secondary">
                  {subject.yearName} • {subject.fieldName}
                </p>
              </div>

              {/* Subject Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-interactive" />
                    <span className="text-sm font-medium text-text-secondary">Subject Name</span>
                  </div>
                  <p className="text-text-primary font-medium">{subject.name}</p>
                </div>
                
                <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-interactive" />
                    <span className="text-sm font-medium text-text-secondary">Monthly Fee</span>
                  </div>
                  <p className="text-text-primary font-medium">{subject.monthlyFee} DH</p>
                </div>
                
                <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-interactive" />
                    <span className="text-sm font-medium text-text-secondary">Academic Year</span>
                  </div>
                  <p className="text-text-primary font-medium">{subject.yearName}</p>
                </div>
                
                <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-interactive" />
                    <span className="text-sm font-medium text-text-secondary">Field of Study</span>
                  </div>
                  <p className="text-text-primary font-medium">{subject.fieldName}</p>
                </div>

                <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-interactive" />
                    <span className="text-sm font-medium text-text-secondary">Total Groups</span>
                  </div>
                  <p className="text-text-primary font-medium">{subjectGroups.length}</p>
                </div>
                
                <div className="p-4 bg-surface rounded-lg shadow-adaptive-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-interactive" />
                    <span className="text-sm font-medium text-text-secondary">Total Students</span>
                  </div>
                  <p className="text-text-primary font-medium">{totalStudents}</p>
                </div>
              </div>

              {/* Subject Status */}
              <div className="flex justify-center">
                <div className="inline-flex items-center px-3 py-1 bg-surface rounded-full shadow-adaptive-sm">
                  <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
                  <span className="text-sm font-medium text-text-primary">Active Subject</span>
                </div>
              </div>
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="space-y-4">
              {/* Header with Add Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-interactive" />
                  <h3 className="text-lg font-semibold text-text-primary">Subject Groups</h3>
                </div>
                <ModernButton 
                  variant="solid" 
                  size="sm"
                  onClick={() => setIsAddGroupOpen(true)}
                  disabled={groupsLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Group
                </ModernButton>
              </div>

              {/* Groups List */}
              <div className="space-y-3">
                {groupsLoading ? (
                  <div className="text-center py-12 bg-surface rounded-lg shadow-adaptive-sm">
                    <Users className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                    <h4 className="text-lg font-medium text-text-primary mb-2">Loading Groups...</h4>
                    <p className="text-text-secondary">Please wait while we fetch the groups data.</p>
                  </div>
                ) : subjectGroups.length === 0 ? (
                  <div className="text-center py-12 bg-surface rounded-lg shadow-adaptive-sm">
                    <Users className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                    <h4 className="text-lg font-medium text-text-primary mb-2">No Groups Yet</h4>
                    <p className="text-text-secondary mb-4">This subject doesn't have any groups created yet.</p>
                    <ModernButton 
                      variant="outline" 
                      onClick={() => setIsAddGroupOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Group
                    </ModernButton>
                  </div>
                ) : (
                  subjectGroups.map((group) => {
                    const teacher = getGroupTeacher(group.teacherId);
                    const occupancyPercentage = group.capacity > 0 ? ((group.studentCount || 0) / group.capacity) * 100 : 0;
                    
                    return (
                      <div key={group.id} className="bg-surface rounded-lg shadow-adaptive-sm p-4 hover:shadow-adaptive transition-shadow">
                        {/* Group Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-interactive/10 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-interactive" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-text-primary">{group.name}</h4>
                              <p className="text-sm text-text-secondary">Room {group.classNumber}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-text-primary">{group.studentCount || 0}/{group.capacity}</p>
                            <p className="text-xs text-text-secondary">students</p>
                          </div>
                        </div>

                        {/* Group Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-text-muted" />
                            <div>
                              <p className="text-xs text-text-secondary">Schedule</p>
                              <p className="text-sm font-medium text-text-primary">
                                {group.schedules.map((s, index) => (
                                  <span key={index}>
                                    {s.day} {s.startTime}-{s.endTime}
                                    {index < group.schedules.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-text-muted" />
                            <div>
                              <p className="text-xs text-text-secondary">Location</p>
                              <p className="text-sm font-medium text-text-primary">{group.classNumber}</p>
                            </div>
                          </div>
                        </div>

                        {/* Capacity Progress */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-text-secondary">Capacity</span>
                            <span className="text-sm font-medium text-text-primary">{Math.round(occupancyPercentage)}%</span>
                          </div>
                          <div className="w-full bg-surface-secondary rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                occupancyPercentage >= 90 ? 'bg-red-500' : 
                                occupancyPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Teacher Info */}
                        {teacher && (
                          <div className="mb-4 p-3 bg-surface-secondary rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Assigned Teacher</p>
                            <p className="text-sm font-medium text-text-primary">{teacher.name}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2">
                          <ModernButton 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditGroup(group)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </ModernButton>
                          <ModernButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
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

          </div>
        </Tabs>
      </div>

      {/* Add Group Modal */}
      <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Group to {subject.name} - Step {groupFormStep} of 2
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Step Progress Indicator */}
            <div className="flex items-center space-x-4 mb-6">
                <div className={`flex items-center space-x-2 ${groupFormStep >= 1 ? 'text-interactive' : 'text-text-muted'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    groupFormStep >= 1 ? 'bg-interactive text-background' : 'bg-surface-secondary text-text-muted'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Group Details</span>
                </div>
                <div className="flex-1 h-px bg-border"></div>
                <div className={`flex items-center space-x-2 ${groupFormStep >= 2 ? 'text-interactive' : 'text-text-muted'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    groupFormStep >= 2 ? 'bg-interactive text-background' : 'bg-surface-secondary text-text-muted'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Assign Teacher</span>
                </div>
              </div>

              {/* Step 1: Group Details */}
              {groupFormStep === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Group Name" required>
                      <Input
                        value={groupForm.name}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Advanced Math A"
                      />
                    </FormField>
                    
                    <FormField label="Capacity" required>
                      <Input
                        type="number"
                        value={groupForm.capacity}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, capacity: e.target.value }))}
                        placeholder="e.g., 20"
                      />
                    </FormField>
                  </div>
                  
                  <FormField label="Class Number" required>
                    <Input
                      value={groupForm.classNumber}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, classNumber: e.target.value }))}
                      placeholder="e.g., Room 101"
                    />
                  </FormField>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-secondary">Schedules</label>
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() => setGroupForm(prev => ({
                          ...prev,
                          schedules: [...prev.schedules, { day: 'Monday', startTime: '08:00', endTime: '10:00' }]
                        }))}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Day
                      </ModernButton>
                    </div>
                    
                    {groupForm.schedules.map((schedule, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 items-end">
                        <FormField label="Day" required>
                          <Select
                            value={schedule.day}
                            onChange={(e) => setGroupForm(prev => ({
                              ...prev,
                              schedules: prev.schedules.map((s, i) => 
                                i === index ? { ...s, day: e.target.value } : s
                              )
                            }))}
                            options={dayOptions}
                          />
                        </FormField>
                        
                        <FormField label="Start Time" required>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => setGroupForm(prev => ({
                              ...prev,
                              schedules: prev.schedules.map((s, i) => 
                                i === index ? { ...s, startTime: e.target.value } : s
                              )
                            }))}
                          />
                        </FormField>
                        
                        <FormField label="End Time" required>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => setGroupForm(prev => ({
                              ...prev,
                              schedules: prev.schedules.map((s, i) => 
                                i === index ? { ...s, endTime: e.target.value } : s
                              )
                            }))}
                          />
                        </FormField>
                        
                        {groupForm.schedules.length > 1 && (
                          <ModernButton
                            variant="outline"
                            size="sm"
                            onClick={() => setGroupForm(prev => ({
                              ...prev,
                              schedules: prev.schedules.filter((_, i) => i !== index)
                            }))}
                          >
                            <X className="w-4 h-4" />
                          </ModernButton>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Step 2: Teacher Assignment */}
              {groupFormStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Assign Teacher</h3>
                    <p className="text-text-secondary">
                      Choose a teacher to assign to this group. You can search by name, email, or subjects they teach.
                    </p>
                  </div>

                  <FormField label="Search Teachers">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search teachers by name, email, or subjects..."
                        value={teacherSearchQuery}
                        onChange={(e) => setTeacherSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
                      />
                    </div>
                  </FormField>
                  
                  <div className="max-h-96 overflow-y-auto border border-border rounded-lg p-4">
                    <div className="space-y-3">
                      {getFilteredTeachers().length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                          <p className="text-text-secondary">
                            {teacherSearchQuery ? 'No teachers found matching your search.' : 'No teachers available.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* No Teacher Option */}
                          <label className="flex items-center space-x-3 cursor-pointer hover:bg-surface-hover p-4 rounded-lg border border-border">
                            <input
                              type="radio"
                              name="teacher"
                              checked={groupForm.teacherId === ''}
                              onChange={() => setGroupForm(prev => ({ ...prev, teacherId: '' }))}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <span className="text-text-primary font-medium">No teacher assigned</span>
                              <p className="text-xs text-text-secondary">
                                Leave this group without a teacher for now
                              </p>
                            </div>
                          </label>

                          {/* Teacher Options */}
                          {getFilteredTeachers().map(teacher => (
                            <label key={teacher.id} className="flex items-center space-x-3 cursor-pointer hover:bg-surface-hover p-4 rounded-lg border border-border">
                              <input
                                type="radio"
                                name="teacher"
                                checked={groupForm.teacherId === teacher.id}
                                onChange={() => setGroupForm(prev => ({ ...prev, teacherId: teacher.id }))}
                                className="w-4 h-4"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-interactive rounded-lg flex items-center justify-center">
                                    <span className="text-background font-bold text-sm">
                                      {teacher.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-text-primary font-medium">{teacher.name}</span>
                                    <p className="text-xs text-text-secondary">{teacher.email}</p>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <p className="text-xs text-text-secondary">
                                    <strong>Subjects:</strong> {getTeacherSubjects(teacher.subjects)}
                                  </p>
                                  {teacher.bio && (
                                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                      {teacher.bio}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {groupForm.teacherId && (
                    <div className="p-4 bg-surface-secondary rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-interactive rounded-lg flex items-center justify-center">
                          <span className="text-background font-bold text-xs">
                            {getGroupTeacher(groupForm.teacherId)?.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            Selected: {getGroupTeacher(groupForm.teacherId)?.name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {getGroupTeacher(groupForm.teacherId)?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-4 pt-4 border-t border-border">
                <ModernButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsAddGroupOpen(false)}
                >
                  Cancel
                </ModernButton>
                
                {groupFormStep === 2 && (
                  <ModernButton
                    variant="outline"
                    className="flex-1"
                    onClick={handlePreviousStep}
                  >
                    Previous
                  </ModernButton>
                )}
                
                <ModernButton
                  variant="solid"
                  className="flex-1"
                  onClick={groupFormStep === 1 ? handleNextStep : handleSaveGroup}
                  disabled={groupFormStep === 1 && !canProceedToNextStep()}
                >
                  {groupFormStep === 1 ? 'Next' : 'Create Group'}
                </ModernButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Group Modal */}
        <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Group: {selectedGroup?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Group Name" required>
                  <Input
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Advanced Math A"
                  />
                </FormField>
                
                <FormField label="Capacity" required>
                  <Input
                    type="number"
                    value={groupForm.capacity}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="e.g., 20"
                  />
                </FormField>
              </div>
              
              <FormField label="Class Number" required>
                <Input
                  value={groupForm.classNumber}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, classNumber: e.target.value }))}
                  placeholder="e.g., Room 101"
                />
              </FormField>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-secondary">Schedules</label>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupForm(prev => ({
                      ...prev,
                      schedules: [...prev.schedules, { day: 'Monday', startTime: '08:00', endTime: '10:00' }]
                    }))}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Day
                  </ModernButton>
                </div>
                
                {groupForm.schedules.map((schedule, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 items-end">
                    <FormField label="Day" required>
                      <Select
                        value={schedule.day}
                        onChange={(e) => setGroupForm(prev => ({
                          ...prev,
                          schedules: prev.schedules.map((s, i) => 
                            i === index ? { ...s, day: e.target.value } : s
                          )
                        }))}
                        options={dayOptions}
                      />
                    </FormField>
                    
                    <FormField label="Start Time" required>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => setGroupForm(prev => ({
                          ...prev,
                          schedules: prev.schedules.map((s, i) => 
                            i === index ? { ...s, startTime: e.target.value } : s
                          )
                        }))}
                      />
                    </FormField>
                    
                    <FormField label="End Time" required>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => setGroupForm(prev => ({
                          ...prev,
                          schedules: prev.schedules.map((s, i) => 
                            i === index ? { ...s, endTime: e.target.value } : s
                          )
                        }))}
                      />
                    </FormField>
                    
                    {groupForm.schedules.length > 1 && (
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() => setGroupForm(prev => ({
                          ...prev,
                          schedules: prev.schedules.filter((_, i) => i !== index)
                        }))}
                      >
                        <X className="w-4 h-4" />
                      </ModernButton>
                    )}
                  </div>
                ))}
              </div>
              
              <FormField label="Assigned Teacher">
                <Select
                  value={groupForm.teacherId}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, teacherId: e.target.value }))}
                  options={[
                    { value: '', label: 'No teacher assigned' },
                    ...teachers.map(t => ({ value: t.id, label: t.name }))
                  ]}
                />
              </FormField>
              
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <ModernButton 
                  variant="outline" 
                  onClick={() => setIsEditGroupOpen(false)}
                >
                  Cancel
                </ModernButton>
                <ModernButton 
                  variant="solid" 
                  onClick={handleEditGroup}
                >
                  Update Group
                </ModernButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};
