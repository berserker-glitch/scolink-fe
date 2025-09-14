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
  Eye,
  User,
  FileText
} from 'lucide-react';

export const Teachers: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
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

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailDrawerOpen(true);
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

  const handleTeacherDrawerEdit = (updatedTeacher: Teacher) => {
    // The drawer will handle the API call, so we just need to update local state
    setSelectedTeacher(updatedTeacher);
  };

  const handleTeacherDrawerDelete = (teacherId: string) => {
    // Close the drawer and refresh data
    setIsDetailDrawerOpen(false);
    setSelectedTeacher(null);
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
    <div className="min-h-screen bg-background p-6 lg:p-8">
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
      <Card className="surface mb-6">
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
            />
          </div>
        </CardContent>
      </Card>

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
            <Card key={teacher.id} className="surface hover:bg-surface-hover transition-colors">
              <CardContent className="p-6">
                {/* Teacher Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-interactive rounded-lg flex items-center justify-center">
                      <span className="text-background font-bold text-lg">
                        {teacher.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-subheading font-semibold text-text-primary">
                        {teacher.name}
                      </h3>
                      <p className="text-caption text-text-secondary">
                        {teacher.subjects?.length || 0} subject{(teacher.subjects?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={() => handleViewTeacher(teacher)}
                  />
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-caption text-text-secondary">
                    <Mail className="w-4 h-4" />
                    <span>{teacher.email}</span>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center space-x-2 text-caption text-text-secondary">
                      <Phone className="w-4 h-4" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                </div>

                {/* Subject & Group Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-caption text-text-secondary">
                    <BookOpen className="w-4 h-4" />
                    <span>{teacher.subjects?.join(', ') || 'No subjects assigned'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-caption text-text-secondary">
                    <Users className="w-4 h-4" />
                    <span>{teacher.groupsCount || 0} groups</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <ModernButton 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    icon={FileText}
                    iconPosition="left"
                    onClick={() => handlePrintSchedule(teacher)}
                  >
                    Print Schedule
                  </ModernButton>
                  <ModernButton 
                    variant="outline" 
                    size="sm"
                    icon={Edit}
                    onClick={() => handleEditTeacher(teacher)}
                  />
                  <ModernButton 
                    variant="outline" 
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
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

      {/* Teacher Detail Drawer */}
      <TeacherDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        onEdit={handleTeacherDrawerEdit}
        onDelete={handleTeacherDrawerDelete}
      />
    </div>
  );
};