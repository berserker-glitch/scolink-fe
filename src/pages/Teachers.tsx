import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { TeacherDetailDrawer } from '@/components/Teacher/TeacherDetailDrawer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Teacher, CreateTeacherRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { generateTeacherSchedulePDF } from '@/utils/pdfGenerator';
import {
  Search,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Users,
  Edit,
  Trash2,
  User,
  FileText,
  GraduationCap
} from 'lucide-react';

// Wrapper component to fetch teacher by ID for the drawer
const TeacherDrawerWithQuery: React.FC<{
  teacherId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ teacherId, isOpen, onClose }) => {
  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teachers', teacherId],
    queryFn: () => apiService.getTeacherById(teacherId),
    enabled: isOpen && !!teacherId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="w-full h-full bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-text-secondary">Loading teacher...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return null;
  }

  return (
    <TeacherDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      teacher={teacher}
    />
  );
};

export const Teachers: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });

  // React Query hooks
  const { data: teachersData, isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiService.getTeachers(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  const teachers = teachersData?.teachers || [];

  // Mutations
  const createTeacherMutation = useMutation({
    mutationFn: (data: CreateTeacherRequest) => apiService.createTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Success', description: 'Teacher created successfully' });
      setIsAddTeacherOpen(false);
      setTeacherForm({ name: '', email: '', phone: '', bio: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create teacher', variant: 'destructive' });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Success', description: 'Teacher updated successfully' });
      setIsEditTeacherOpen(false);
      setEditingTeacher(null);
      setTeacherForm({ name: '', email: '', phone: '', bio: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update teacher', variant: 'destructive' });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Success', description: 'Teacher deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete teacher', variant: 'destructive' });
    },
  });

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveTeacher = () => {
    if (!teacherForm.name || !teacherForm.email) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    createTeacherMutation.mutate({
      name: teacherForm.name,
      email: teacherForm.email,
      phone: teacherForm.phone || undefined,
      bio: teacherForm.bio || undefined,
      isActive: true
    });
  };

  const handleUpdateTeacher = () => {
    if (!editingTeacher) return;

    if (!teacherForm.name || !teacherForm.email) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    updateTeacherMutation.mutate({
      id: editingTeacher.id,
      data: {
        name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone || undefined,
        bio: teacherForm.bio || undefined
      }
    });
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      bio: teacher.bio || ''
    });
    setIsEditTeacherOpen(true);
  };

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacherId(teacher.id);
    setIsDrawerOpen(true);
  };

  const handlePrintSchedule = async (teacher: Teacher) => {
    try {
      // Show loading state
      const loadingToast = { message: 'Generating schedule PDF...', type: 'info' as const };
      
      // Get teacher with groups data
      const teacherWithGroups = await apiService.getTeacherWithGroups(teacher.id);
      
      // Generate PDF
      await generateTeacherSchedulePDF({
        teacher: teacherWithGroups,
        groups: teacherWithGroups.groups
      });
      
    } catch (error) {
      console.error('Error generating schedule PDF:', error);
      alert('Failed to generate schedule PDF. Please try again.');
    }
  };


  const resetTeacherForm = () => {
    setTeacherForm({
      name: '',
      email: '',
      phone: '',
      bio: ''
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className={`transition-all duration-300 overflow-hidden ${isDrawerOpen ? 'w-[60%]' : 'w-full'}`}>
          <div className="p-6 lg:p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Teachers</h1>
          <p className="text-sm text-text-secondary">
            Manage your teaching staff and assign them to subjects and groups.
          </p>
        </div>
        
        <ModernButton 
          variant="solid" 
          icon={Plus}
          iconPosition="left"
          onClick={() => setIsAddTeacherOpen(true)}
        >
          Add Teacher
        </ModernButton>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="bg-surface rounded-lg border border-border p-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search teachers by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background text-text-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authLoading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="text-text-secondary">Authenticating...</div>
          </div>
        ) : !isAuthenticated ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="text-status-error">Please log in to view teachers</div>
          </div>
        ) : teachersLoading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="text-text-secondary">Loading teachers...</div>
          </div>
        ) : teachersError ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="text-status-error">Failed to load teachers</div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-text-secondary">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No teachers found</p>
            <p className="text-sm">Add your first teacher to get started</p>
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className={`surface hover:shadow-adaptive-lg transition-all duration-200 cursor-pointer ${
                selectedTeacherId === teacher.id ? 'ring-2 ring-interactive' : ''
              }`}
              onClick={() => handleTeacherClick(teacher)}
            >
              <CardContent className="p-6">
                {/* Teacher Header */}
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-interactive rounded-xl flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-6 h-6 text-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text-primary text-lg truncate">{teacher.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-medium text-interactive truncate">{teacher.email}</span>
                      </div>
                      {teacher.phone && (
                        <p className="text-xs text-text-muted truncate">{teacher.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTeacher(teacher);
                      }}
                    />
                  </div>
                </div>

                {/* Teacher Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-surface-secondary rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{teacher.subjects?.length || 0}</p>
                    <p className="text-xs text-text-secondary">Subjects</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{teacher.groupsCount || 0}</p>
                    <p className="text-xs text-text-secondary">Groups</p>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      teacher.isActive
                        ? 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400'
                        : 'bg-surface-secondary text-text-primary'
                    }`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t border-border">
                  <ModernButton
                    variant="solid"
                    size="sm"
                    icon={FileText}
                    iconPosition="left"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintSchedule(teacher);
                    }}
                  >
                    Print Schedule
                  </ModernButton>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this teacher?')) {
                        deleteTeacherMutation.mutate(teacher.id);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

          </div>
        </div>

        {/* Inline Drawer */}
        <div className={`w-[40%] transition-all duration-300 ${isDrawerOpen && selectedTeacherId ? 'block' : 'hidden'}`}>
          {selectedTeacherId && (
            <TeacherDrawerWithQuery
              teacherId={selectedTeacherId}
              isOpen={isDrawerOpen}
              onClose={() => {
                setIsDrawerOpen(false);
                setSelectedTeacherId(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Add Teacher Modal */}
      <Modal
        isOpen={isAddTeacherOpen}
        onClose={() => {
          setIsAddTeacherOpen(false);
          resetTeacherForm();
        }}
        title="Add New Teacher"
        size="md"
      >
        <div className="p-6 space-y-6">
          <FormField label="Full Name" required>
            <Input
              value={teacherForm.name}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter teacher's full name"
            />
          </FormField>

          <FormField label="Email Address" required>
            <Input
              type="email"
              value={teacherForm.email}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="teacher@example.com"
            />
          </FormField>

          <FormField label="Phone Number">
            <Input
              type="tel"
              value={teacherForm.phone}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </FormField>

          <FormField label="Bio">
            <Textarea
              value={teacherForm.bio}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Brief description of qualifications and experience"
              rows={3}
            />
          </FormField>

          <div className="flex items-center space-x-4 pt-4">
            <ModernButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsAddTeacherOpen(false)}
            >
              Cancel
            </ModernButton>
            <ModernButton 
              variant="solid" 
              className="flex-1"
              onClick={handleSaveTeacher}
              disabled={createTeacherMutation.isPending}
            >
              {createTeacherMutation.isPending ? 'Adding...' : 'Add Teacher'}
            </ModernButton>
          </div>
        </div>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={isEditTeacherOpen}
        onClose={() => {
          setIsEditTeacherOpen(false);
          setEditingTeacher(null);
          resetTeacherForm();
        }}
        title="Edit Teacher"
        size="md"
      >
        <div className="p-6 space-y-6">
          <FormField label="Full Name" required>
            <Input
              value={teacherForm.name}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter teacher's full name"
            />
          </FormField>

          <FormField label="Email Address" required>
            <Input
              type="email"
              value={teacherForm.email}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="teacher@example.com"
            />
          </FormField>

          <FormField label="Phone Number">
            <Input
              type="tel"
              value={teacherForm.phone}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </FormField>

          <FormField label="Bio">
            <Textarea
              value={teacherForm.bio}
              onChange={(e) => setTeacherForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Brief description of qualifications and experience"
              rows={3}
            />
          </FormField>

          <div className="flex items-center space-x-4 pt-4">
            <ModernButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsEditTeacherOpen(false)}
            >
              Cancel
            </ModernButton>
            <ModernButton 
              variant="solid" 
              className="flex-1"
              onClick={handleUpdateTeacher}
              disabled={updateTeacherMutation.isPending}
            >
              {updateTeacherMutation.isPending ? 'Updating...' : 'Update Teacher'}
            </ModernButton>
          </div>
        </div>
      </Modal>

    </div>
  );
};