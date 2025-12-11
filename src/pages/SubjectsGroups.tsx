import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { SubjectDetailDrawer } from '@/components/Subject/SubjectDetailDrawer';
import { GroupDetailDrawer } from '@/components/Subject/GroupDetailDrawer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Subject, Teacher, Group, CreateGroupRequest, GroupSchedule } from '@/services/api';
import type { CreateSubjectRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Users, 
  Clock, 
  MapPin,
  Edit,
  Trash2,
  Eye,
  Filter
} from 'lucide-react';

export const SubjectsGroups: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      // Search immediately for any input
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isModalSubjectDrawerOpen, setIsModalSubjectDrawerOpen] = useState(false);
  const [isGroupDrawerOpen, setIsGroupDrawerOpen] = useState(false);
  const [selectedSubjectForDrawer, setSelectedSubjectForDrawer] = useState<Subject | null>(null);
  const [selectedGroupForDrawer, setSelectedGroupForDrawer] = useState<Group | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [isEditSubjectMode, setIsEditSubjectMode] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    monthlyFee: '',
    yearId: '',
    fieldId: ''
  });
  
  const [groupForm, setGroupForm] = useState({
    subjectId: '',
    name: '',
    capacity: '',
    classNumber: '',
    schedules: [{ day: 'Monday', startTime: '08:00', endTime: '10:00' }] as GroupSchedule[],
    teacherId: ''
  });
  
  const [groupFormStep, setGroupFormStep] = useState(1);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  
  // UI State Management for better UX
  const [subjectFilter, setSubjectFilter] = useState('all');
  
  // Split Layout State (like Students tab)
  const [isSubjectDrawerOpen, setIsSubjectDrawerOpen] = useState(false);
  const [selectedSubjectForSplit, setSelectedSubjectForSplit] = useState<Subject | null>(null);

  const dayOptions = [
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' }
  ];

  // React Query hooks
  const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.getSubjects(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  const { data: teachersData, isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiService.getTeachers(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  const { data: yearsData, isLoading: yearsLoading, error: yearsError } = useQuery({
    queryKey: ['years'],
    queryFn: () => apiService.getYears(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  const { data: fieldsData, isLoading: fieldsLoading, error: fieldsError } = useQuery({
    queryKey: ['fields'],
    queryFn: () => apiService.getFields(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  const subjects = subjectsData?.subjects || [];
  const groups = groupsData?.groups || [];
  const teachers = teachersData?.teachers || [];
  const years = yearsData?.years || [];
  const fields = fieldsData?.fields || [];

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    subject.yearName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    subject.fieldName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  // Mutations
  const createSubjectMutation = useMutation({
    mutationFn: (data: CreateSubjectRequest) => apiService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'Success', description: 'Subject created successfully' });
      setIsAddSubjectOpen(false);
      setSubjectForm({ name: '', monthlyFee: '', yearId: '', fieldId: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create subject', variant: 'destructive' });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: CreateGroupRequest) => apiService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Success', description: 'Group created successfully' });
      setIsAddGroupOpen(false);
      setGroupForm({ subjectId: '', name: '', capacity: '', classNumber: '', schedules: [{ day: 'Monday', startTime: '08:00', endTime: '10:00' }], teacherId: '' });
      setGroupFormStep(1);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create group', variant: 'destructive' });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'Success', description: 'Subject updated successfully' });
      setIsAddSubjectOpen(false);
      setIsEditSubjectMode(false);
      setEditingSubjectId(null);
      setSubjectForm({ name: '', monthlyFee: '', yearId: '', fieldId: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update subject', variant: 'destructive' });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Success', description: 'Group updated successfully' });
      setIsAddGroupOpen(false);
      setIsEditMode(false);
      setEditingGroupId(null);
      setGroupForm({ subjectId: '', name: '', capacity: '', classNumber: '', schedules: [{ day: 'Monday', startTime: '08:00', endTime: '10:00' }], teacherId: '' });
      setGroupFormStep(1);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update group', variant: 'destructive' });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade: boolean }) => apiService.deleteSubject(id, cascade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Success', description: 'Subject deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete subject', variant: 'destructive' });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Success', description: 'Group deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete group', variant: 'destructive' });
    },
  });

  // Helper functions
  const getSubjectGroups = (subjectId: string) => {
    return groups.filter(group => group.subjectId === subjectId);
  };

  const getGroupTeacher = (teacherId?: string) => {
    if (!teacherId) return null;
    return teachers.find(t => t.id === teacherId);
  };

  const getTeacherSubjects = (subjectIds: string[]) => {
    return subjectIds.map(id => {
      const subject = subjects.find(s => s.id === id);
      return subject?.name || 'Unknown';
    }).join(', ');
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

  const getFieldsByYear = (yearId: string) => {
    return fields.filter(field => field.yearId === yearId);
  };

  const canProceedToNextStep = () => {
    if (groupFormStep === 1) {
      return groupForm.subjectId && groupForm.name && groupForm.capacity && groupForm.classNumber && groupForm.schedules.length > 0;
    }
    return true;
  };

  // UX Helper Functions
  const getFilteredSubjectsWithGroups = () => {
    let filtered = subjects.filter(subject =>
      subject.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      subject.yearName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      subject.fieldName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    // Apply subject filter
    if (subjectFilter !== 'all') {
      if (subjectFilter === 'with-groups') {
        filtered = filtered.filter(subject => getSubjectGroups(subject.id).length > 0);
      } else if (subjectFilter === 'without-groups') {
        filtered = filtered.filter(subject => getSubjectGroups(subject.id).length === 0);
      }
    }

    return filtered;
  };

  const getAllGroups = () => {
    return groups.filter(group => {
      const subject = subjects.find(s => s.id === group.subjectId);
      if (!subject) return false;
      
      return subject.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
             subject.yearName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
             subject.fieldName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
             group.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    });
  };

  const handleNextStep = () => {
    if (groupFormStep === 1) {
      setGroupFormStep(2);
    }
  };

  const handlePreviousStep = () => {
    setGroupFormStep(1);
  };

  const handleSaveSubject = () => {
    if (!subjectForm.name || !subjectForm.monthlyFee || !subjectForm.yearId || !subjectForm.fieldId) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const subjectData = {
      name: subjectForm.name,
      monthlyFee: parseFloat(subjectForm.monthlyFee),
      yearId: subjectForm.yearId,
      fieldId: subjectForm.fieldId,
      isActive: true
    };

    if (isEditSubjectMode && editingSubjectId) {
      updateSubjectMutation.mutate({
        id: editingSubjectId,
        data: subjectData
      });
    } else {
      createSubjectMutation.mutate(subjectData);
    }
  };

  const handleSaveGroup = () => {
    if (!groupForm.subjectId || !groupForm.name || !groupForm.capacity || !groupForm.classNumber || groupForm.schedules.length === 0) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const groupData = {
      name: groupForm.name,
      capacity: parseInt(groupForm.capacity),
      classNumber: groupForm.classNumber,
      subjectId: groupForm.subjectId,
      teacherId: groupForm.teacherId || undefined,
      schedules: groupForm.schedules,
      isActive: true
    };

    if (isEditMode && editingGroupId) {
      updateGroupMutation.mutate({
        id: editingGroupId,
        data: groupData
      });
    } else {
      createGroupMutation.mutate(groupData);
    }
  };

  const openSubjectDrawer = (subject: any) => {
    setSelectedSubjectForDrawer(subject);
    setIsModalSubjectDrawerOpen(true);
  };

  const openGroupDrawer = (group: any) => {
    setSelectedGroupForDrawer(group);
    setIsGroupDrawerOpen(true);
  };

  // Split Layout Handlers (like Students tab)
  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubjectForSplit(subject);
    setIsSubjectDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className={`transition-all duration-300 overflow-hidden ${isSubjectDrawerOpen ? 'w-[60%]' : 'w-full'}`}>
          <div className="p-6 lg:p-8 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Subjects & Groups</h1>
                <p className="text-sm text-text-secondary">
                  Manage subjects, organize groups, and assign teachers to classes. • {getFilteredSubjectsWithGroups().length} subjects • {getAllGroups().length} groups
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <ModernButton 
                  variant="outline" 
                  icon={Plus}
                  iconPosition="left"
                  onClick={() => setIsAddGroupOpen(true)}
                >
                  Add Group
                </ModernButton>
                <ModernButton 
                  variant="solid" 
                  icon={Plus}
                  iconPosition="left"
                  onClick={() => setIsAddSubjectOpen(true)}
                >
                  Add Subject
                </ModernButton>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="mb-6">
              <div className="bg-surface rounded-lg border border-border p-4">
                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search subjects by name, year, or field..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background text-text-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-text-muted" />
                    <Select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'All Subjects' },
                        { value: 'with-groups', label: 'With Groups' },
                        { value: 'without-groups', label: 'Without Groups' }
                      ]}
                      className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects List */}
            <div className="space-y-6">
              {authLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-text-secondary">Authenticating...</div>
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-status-error">Please log in to view subjects</div>
                </div>
              ) : subjectsLoading || groupsLoading || teachersLoading || yearsLoading || fieldsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-text-secondary">Loading subjects and groups...</div>
                </div>
              ) : subjectsError || groupsError || teachersError || yearsError || fieldsError ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-status-error">Failed to load data</div>
                </div>
              ) : getFilteredSubjectsWithGroups().length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <div className="max-w-md mx-auto">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      {debouncedSearchQuery || subjectFilter !== 'all' ? 'No subjects found' : 'No subjects yet'}
                    </h3>
                    <p className="text-sm mb-6">
                      {debouncedSearchQuery 
                        ? 'Try adjusting your search terms or filters'
                        : subjectFilter !== 'all'
                        ? 'No subjects match the selected filter'
                        : 'Create your first subject to organize your curriculum'
                      }
                    </p>
                    {!debouncedSearchQuery && subjectFilter === 'all' && (
                      <ModernButton 
                        variant="solid" 
                        icon={Plus}
                        iconPosition="left"
                        onClick={() => setIsAddSubjectOpen(true)}
                      >
                        Create First Subject
                      </ModernButton>
                    )}
                  </div>
                </div>
              ) : (
                // Subjects Grid
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {getFilteredSubjectsWithGroups().map((subject) => {
                    const groups = getSubjectGroups(subject.id);
                    const totalStudents = groups.reduce((sum, g) => sum + (g.studentCount || 0), 0);
                    const totalCapacity = groups.reduce((sum, g) => sum + g.capacity, 0);
                    const groupsWithTeachers = groups.filter(g => g.teacherId).length;
                    
                    return (
                      <Card 
                        key={subject.id} 
                        className={`surface hover:shadow-adaptive-lg transition-all duration-200 cursor-pointer ${
                          selectedSubjectForSplit?.id === subject.id ? 'ring-2 ring-interactive' : ''
                        }`}
                        onClick={() => handleSubjectClick(subject)}
                      >
                        <CardContent className="p-6">
                          {/* Subject Header */}
                          <div className="flex items-start justify-between mb-4 gap-3">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-interactive rounded-xl flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-6 h-6 text-background" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-text-primary text-lg truncate">{subject.name}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-sm font-medium text-interactive truncate">{subject.monthlyFee} DH/month</span>
                                  <span className="text-text-muted">•</span>
                                  <span className="text-xs text-text-secondary truncate">{subject.yearName}</span>
                                </div>
                                <p className="text-xs text-text-muted truncate">{subject.fieldName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <ModernButton 
                                variant="ghost" 
                                size="sm"
                                icon={Edit}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSubjectForm({
                                    name: subject.name,
                                    monthlyFee: subject.monthlyFee.toString(),
                                    yearId: subject.yearId,
                                    fieldId: subject.fieldId
                                  });
                                  setIsEditSubjectMode(true);
                                  setEditingSubjectId(subject.id);
                                  setIsAddSubjectOpen(true);
                                }}
                              />
                            </div>
                          </div>

                          {/* Subject Stats */}
                          <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-surface-secondary rounded-lg">
                            <div className="text-center">
                              <p className="text-lg font-bold text-text-primary">{groups.length}</p>
                              <p className="text-xs text-text-secondary">Groups</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-text-primary">{totalStudents}/{totalCapacity}</p>
                              <p className="text-xs text-text-secondary">Students</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-text-primary">{groupsWithTeachers}/{groups.length}</p>
                              <p className="text-xs text-text-secondary">With Teacher</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 pt-2 border-t border-border">
                            <ModernButton
                              variant="solid"
                              size="sm"
                              icon={Plus}
                              iconPosition="left"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupForm(prev => ({ ...prev, subjectId: subject.id }));
                                setIsEditMode(false);
                                setEditingGroupId(null);
                                setIsAddGroupOpen(true);
                              }}
                            >
                              Add Group
                            </ModernButton>
                            <ModernButton 
                              variant="outline" 
                              size="sm"
                              icon={Trash2}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this subject? This will also delete all associated groups.')) {
                                  deleteSubjectMutation.mutate({ id: subject.id, cascade: true });
                                }
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline Subject Drawer */}
        <div className={`w-[40%] transition-all duration-300 bg-background border-l border-border ${
          isSubjectDrawerOpen && selectedSubjectForSplit ? 'block' : 'hidden'
        }`}>
          {selectedSubjectForSplit && (
            <div className="h-full overflow-y-auto">
              <SubjectDetailDrawer
                isOpen={isSubjectDrawerOpen}
                onClose={() => {
                  setIsSubjectDrawerOpen(false);
                  setSelectedSubjectForSplit(null);
                }}
                subject={selectedSubjectForSplit}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Subject Modal */}
      <Modal 
        isOpen={isAddSubjectOpen} 
        onClose={() => {
          setIsAddSubjectOpen(false);
          setIsEditSubjectMode(false);
          setEditingSubjectId(null);
          setSubjectForm({ name: '', monthlyFee: '', yearId: '', fieldId: '' });
        }}
        title={isEditSubjectMode ? "Edit Subject" : "Add New Subject"}
        size="md"
      >
        <div className="p-6 space-y-6">
          <FormField label="Subject Name" required>
            <Input
              value={subjectForm.name}
              onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Advanced Mathematics"
            />
          </FormField>

          
          <FormField label="Monthly Fee (DH)" required>
            <Input
              type="number"
              value={subjectForm.monthlyFee}
              onChange={(e) => setSubjectForm(prev => ({ ...prev, monthlyFee: e.target.value }))}
              placeholder="e.g., 350"
            />
          </FormField>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Year of Study" required>
              <Select
                value={subjectForm.yearId}
                onChange={(e) => {
                  setSubjectForm(prev => ({ ...prev, yearId: e.target.value, fieldId: '' }));
                }}
                options={[
                  { value: '', label: 'Select a year' },
                  ...years.filter(y => y.isActive).map(year => ({
                    value: year.id,
                    label: year.name
                  }))
                ]}
              />
            </FormField>
            
            <FormField label="Field of Study" required>
              <Select
                value={subjectForm.fieldId}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, fieldId: e.target.value }))}
                options={[
                  { value: '', label: subjectForm.yearId ? 'Select a field' : 'Select a year first' },
                  ...getFieldsByYear(subjectForm.yearId).filter(f => f.isActive).map(field => ({
                    value: field.id,
                    label: field.name
                  }))
                ]}
                disabled={!subjectForm.yearId}
              />
            </FormField>
          </div>
          
          <div className="flex items-center space-x-4 pt-4">
            <ModernButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsAddSubjectOpen(false)}
            >
              Cancel
            </ModernButton>
            <ModernButton 
              variant="solid" 
              className="flex-1"
              onClick={handleSaveSubject}
              disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
            >
              {createSubjectMutation.isPending || updateSubjectMutation.isPending 
                ? (isEditSubjectMode ? 'Updating...' : 'Saving...') 
                : (isEditSubjectMode ? 'Update Subject' : 'Save Subject')
              }
            </ModernButton>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Group Modal */}
      <Modal 
        isOpen={isAddGroupOpen} 
        onClose={() => {
          setIsAddGroupOpen(false);
          setIsEditMode(false);
          setEditingGroupId(null);
          setGroupFormStep(1);
          setTeacherSearchQuery('');
          setGroupForm({
            subjectId: '',
            name: '',
            capacity: '',
            classNumber: '',
            schedules: [{ day: 'Monday', startTime: '08:00', endTime: '10:00' }],
            teacherId: ''
          });
        }}
        title={isEditMode ? "Edit Group" : `Add New Group - Step ${groupFormStep} of 2`}
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* Step Progress Indicator */}
          {!isEditMode && (
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
          )}

          {/* Step 1: Group Details */}
          {groupFormStep === 1 && (
            <>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Subject" required>
              <Select
                value={groupForm.subjectId}
                onChange={(e) => setGroupForm(prev => ({ ...prev, subjectId: e.target.value }))}
                options={[
                  { value: '', label: 'Select subject' },
                  ...subjects.map(s => ({ value: s.id, label: `${s.name} (${s.yearName} - ${s.fieldName})` }))
                ]}
              />
            </FormField>
            
            <FormField label="Group Name" required>
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Advanced Math A"
              />
            </FormField>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Capacity" required>
              <Input
                type="number"
                value={groupForm.capacity}
                onChange={(e) => setGroupForm(prev => ({ ...prev, capacity: e.target.value }))}
                placeholder="e.g., 20"
              />
            </FormField>
            
            <FormField label="Class Number" required>
              <Input
                value={groupForm.classNumber}
                onChange={(e) => setGroupForm(prev => ({ ...prev, classNumber: e.target.value }))}
                placeholder="e.g., Room 101"
              />
            </FormField>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-secondary">Schedule</label>
              <ModernButton
                variant="outline"
                size="sm"
                icon={Plus}
                iconPosition="left"
                onClick={() => setGroupForm(prev => ({
                  ...prev,
                  schedules: [...prev.schedules, { day: 'Monday', startTime: '08:00', endTime: '10:00' }]
                }))}
              >
                Add Day
              </ModernButton>
            </div>
            
            {groupForm.schedules.map((schedule, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 border border-border rounded-lg">
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
            
            <div className="flex items-end">
              {groupForm.schedules.length > 1 && (
                <ModernButton
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setGroupForm(prev => ({
                    ...prev,
                    schedules: prev.schedules.filter((_, i) => i !== index)
                  }))}
                  className="w-full"
                />
              )}
            </div>
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
              disabled={
                (groupFormStep === 1 && !canProceedToNextStep()) || 
                (groupFormStep === 2 && (createGroupMutation.isPending || updateGroupMutation.isPending))
              }
            >
              {groupFormStep === 1 
                ? 'Next' 
                : (createGroupMutation.isPending || updateGroupMutation.isPending)
                  ? (isEditMode ? 'Updating...' : 'Creating...')
                  : (isEditMode ? 'Update Group' : 'Create Group')
              }
            </ModernButton>
          </div>
        </div>
      </Modal>

      {/* Subject Detail Drawer */}
      {selectedSubjectForDrawer && (
        <SubjectDetailDrawer
          isOpen={isModalSubjectDrawerOpen}
          onClose={() => {
            setIsModalSubjectDrawerOpen(false);
            setSelectedSubjectForDrawer(null);
          }}
          subject={selectedSubjectForDrawer}
        />
      )}

      {/* Group Detail Drawer */}
      {selectedGroupForDrawer && (
        <GroupDetailDrawer
          isOpen={isGroupDrawerOpen}
          onClose={() => {
            setIsGroupDrawerOpen(false);
            setSelectedGroupForDrawer(null);
          }}
          group={{
            ...selectedGroupForDrawer,
            schedule: selectedGroupForDrawer.schedules,
            studentIds: [] // TODO: Add student IDs when students are implemented
          }}
        />
      )}
    </div>
  );
};