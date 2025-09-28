import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';
import {
  Settings as SettingsIcon,
  Shield,
  Download,
  Users,
  Key,
  FileText,
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  BookOpen,
  ChevronDown,
  ChevronRight,
  User,
  UserPlus,
  Mail,
  Crown
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Year, Field, CreateYearRequest, CreateFieldRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isChangeCodeOpen, setIsChangeCodeOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  
  // Years and Fields Management
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [isEditYearOpen, setIsEditYearOpen] = useState(false);

  const [isEditFieldOpen, setIsEditFieldOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<Year | null>(null);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [selectedYearForField, setSelectedYearForField] = useState<string>('');
  
  const [yearForm, setYearForm] = useState({
    name: '',
    order: 1,
    isActive: true
  });
  
  const [fieldForm, setFieldForm] = useState({
    name: '',
    yearId: '',
    isActive: true
  });

  // React Query hooks - only run when authenticated
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

  const years = yearsData?.years || [];
  const fields = fieldsData?.fields || [];

  // Statistics queries
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiService.getStudents(1, 1),
    enabled: isAuthenticated && !authLoading,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.getSubjects(1, 1),
    enabled: isAuthenticated && !authLoading,
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(1, 1),
    enabled: isAuthenticated && !authLoading,
  });

  // Staff queries (only for admins with staff management access)
  const { data: staffData, isLoading: staffLoading, refetch: refetchStaff } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(1, 100),
    enabled: isAuthenticated && !authLoading && (user?.role === 'super_admin' || user?.role === 'center_admin'),
  });

  // Plan status query
  const { data: planStatus } = useQuery({
    queryKey: ['plan-status'],
    queryFn: () => apiService.getPlanStatus(),
    enabled: isAuthenticated && !authLoading,
  });

  // Mutations for Years
  const createYearMutation = useMutation({
    mutationFn: (data: CreateYearRequest) => apiService.createYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['years'] });
      toast({ title: 'Success', description: 'Year created successfully' });
      setIsAddYearOpen(false);
      setYearForm({ name: '', order: 1, isActive: true });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create year', variant: 'destructive' });
    },
  });

  const updateYearMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateYear(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['years'] });
      toast({ title: 'Success', description: 'Year updated successfully' });
      setIsEditYearOpen(false);
      setEditingYear(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update year', variant: 'destructive' });
    },
  });

  const deleteYearMutation = useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade: boolean }) => apiService.deleteYear(id, cascade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['years'] });
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast({ title: 'Success', description: 'Year deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete year', variant: 'destructive' });
    },
  });

  // Mutations for Fields
  const createFieldMutation = useMutation({
    mutationFn: (data: CreateFieldRequest) => apiService.createField(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast({ title: 'Success', description: 'Field created successfully' });
      setFieldForm({ name: '', yearId: '', isActive: true });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create field', variant: 'destructive' });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateField(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast({ title: 'Success', description: 'Field updated successfully' });
      setIsEditFieldOpen(false);
      setEditingField(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update field', variant: 'destructive' });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteField(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast({ title: 'Success', description: 'Field deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete field', variant: 'destructive' });
    },
  });
  
  const [activeTab, setActiveTab] = useState('profile');
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [addingFieldToYear, setAddingFieldToYear] = useState<string | null>(null);

  // Set default tab for admin users
  useEffect(() => {
    if (user && planStatus && (user.role === 'super_admin' || user.role === 'center_admin')) {
      if (planStatus.hasStaffManagement) {
        setActiveTab('staff');
      } else {
        setActiveTab('profile');
      }
    }
  }, [user, planStatus]);
  

  // Password change state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Staff management state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    email: '',
    fullName: ''
  });


  const handleChangeCode = () => {
    if (newCode !== confirmCode) {
      alert('New codes do not match');
      return;
    }
    console.log('Changing employee code');
    setIsChangeCodeOpen(false);
    setCurrentCode('');
    setNewCode('');
    setConfirmCode('');
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters long', variant: 'destructive' });
      return;
    }

    try {
      await apiService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      
      toast({ title: 'Success', description: 'Password changed successfully' });
      setIsChangePasswordOpen(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to change password', variant: 'destructive' });
    }
  };

  // Staff creation mutation
  const createStaffMutation = useMutation({
    mutationFn: (data: { email: string; fullName?: string }) => apiService.createStaff(data),
    onSuccess: () => {
      refetchStaff();
      toast({ title: 'Success', description: 'Staff member created and notified via email' });
      setIsAddStaffOpen(false);
      setStaffForm({ email: '', fullName: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create staff member', variant: 'destructive' });
    },
  });

  // Staff deletion mutation
  const deleteStaffMutation = useMutation({
    mutationFn: (userId: string) => apiService.deleteUser(userId),
    onSuccess: () => {
      refetchStaff();
      toast({ title: 'Success', description: 'Staff member deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete staff member', variant: 'destructive' });
    },
  });

  const handleAddStaff = () => {
    createStaffMutation.mutate({
      email: staffForm.email,
      fullName: staffForm.fullName || undefined,
    });
  };

  const handleDeleteStaff = (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      deleteStaffMutation.mutate(staffId);
    }
  };




  // Helper functions
  const getFieldsByYear = (yearId: string) => {
    return fields.filter(field => field.yearId === yearId);
  };

  // Years Management Functions
  const handleAddYear = () => {
    createYearMutation.mutate({
      name: yearForm.name,
      order: yearForm.order,
      isActive: yearForm.isActive
    });
  };

  const handleEditYear = (year: Year) => {
    setEditingYear(year);
    setYearForm({
      name: year.name,
      order: year.order,
      isActive: year.isActive
    });
    setIsEditYearOpen(true);
  };

  const handleUpdateYear = () => {
    if (editingYear) {
      updateYearMutation.mutate({
        id: editingYear.id,
        data: {
          name: yearForm.name,
          order: yearForm.order,
          isActive: yearForm.isActive
        }
      });
    }
  };

  const handleDeleteYear = (yearId: string) => {
    const yearFields = getFieldsByYear(yearId);
    const message = yearFields.length > 0 
      ? `Are you sure you want to delete this year? This will also delete ${yearFields.length} associated field(s).`
      : 'Are you sure you want to delete this year?';
      
    if (confirm(message)) {
      deleteYearMutation.mutate({ id: yearId, cascade: true });
    }
  };

  // Fields Management Functions

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setFieldForm({
      name: field.name,
      yearId: field.yearId,
      isActive: field.isActive
    });
    setIsEditFieldOpen(true);
  };

  const handleUpdateField = () => {
    if (editingField) {
      updateFieldMutation.mutate({
        id: editingField.id,
        data: {
          name: fieldForm.name,
          yearId: fieldForm.yearId,
          isActive: fieldForm.isActive
        }
      });
    }
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      deleteFieldMutation.mutate(fieldId);
    }
  };

  // Year expansion management
  const toggleYearExpansion = (yearId: string) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(yearId)) {
        newSet.delete(yearId);
      } else {
        newSet.add(yearId);
      }
      return newSet;
    });
  };

  // Inline field addition
  const handleAddFieldInline = (yearId: string) => {
    if (!fieldForm.name.trim()) return;
    
    createFieldMutation.mutate({
      name: fieldForm.name,
      yearId: yearId,
      isActive: true
    });
    setAddingFieldToYear(null);
  };

  const startAddingField = (yearId: string) => {
    setAddingFieldToYear(yearId);
    setFieldForm({ name: '', yearId: yearId, isActive: true });
  };

  const cancelAddingField = () => {
    setAddingFieldToYear(null);
    setFieldForm({ name: '', yearId: '', isActive: true });
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-sm text-text-secondary">
          Configure system preferences, security settings, and data management.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-8">
          <TabsList className="flex w-full bg-surface-secondary p-1 rounded-lg h-12 shadow-sm">
            <TabsTrigger
              value="profile"
              className="flex-1 flex items-center justify-center gap-2 rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200 px-4 py-2 text-sm font-medium"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            {(user?.role === 'super_admin' || user?.role === 'center_admin') && planStatus?.hasStaffManagement && (
              <TabsTrigger
                value="staff"
                className="flex-1 flex items-center justify-center gap-2 rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200 px-4 py-2 text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                <span>Staff</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="academic"
              className="flex-1 flex items-center justify-center gap-2 rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200 px-4 py-2 text-sm font-medium"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Academic</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Profile Info */}
            <Card className="surface">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Full Name:</span>
                    <span className="text-text-primary font-medium">{user?.fullName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email:</span>
                    <span className="text-text-primary font-medium">{user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Role:</span>
                    <span className="text-text-primary font-medium">
                      {user?.role === 'super_admin' ? 'Super Admin' : 
                       user?.role === 'center_admin' ? 'Center Admin' : 
                       user?.role === 'user' ? 'User' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Phone:</span>
                    <span className="text-text-primary font-medium">{(user as any)?.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status:</span>
                    <span className={`font-medium ${(user as any)?.isActive !== false ? 'text-status-success' : 'text-status-error'}`}>
                      {(user as any)?.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Plan:</span>
                    <span className="text-text-primary font-medium flex items-center gap-2">
                      <Crown className="w-4 h-4 text-interactive" />
                      {planStatus?.plan ? planStatus.plan.charAt(0).toUpperCase() + planStatus.plan.slice(1) : 'Basic'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <ModernButton 
                    variant="outline"
                    icon={Key}
                    iconPosition="left"
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-full"
                  >
                    Change Password
                  </ModernButton>
                </div>
              </CardContent>
            </Card>

            {/* System Statistics */}
            <Card className="surface">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>System Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Students:</span>
                    <span className="text-text-primary font-medium">{studentsData?.pagination?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Subjects:</span>
                    <span className="text-text-primary font-medium">{subjectsData?.pagination?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Groups:</span>
                    <span className="text-text-primary font-medium">{groupsData?.pagination?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Academic Years:</span>
                    <span className="text-text-primary font-medium">{years.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Academic Fields:</span>
                    <span className="text-text-primary font-medium">{fields.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Tab */}
        {(user?.role === 'super_admin' || user?.role === 'center_admin') && planStatus?.hasStaffManagement && (
          <TabsContent value="staff" className="space-y-6">
            <Card className="surface">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Staff Management</span>
                  </CardTitle>
                  <ModernButton 
                    variant="outline"
                    size="sm"
                    icon={UserPlus}
                    iconPosition="left"
                    onClick={() => setIsAddStaffOpen(true)}
                  >
                    Add Staff
                  </ModernButton>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {staffLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-text-secondary">Loading staff...</div>
                  </div>
                ) : staffData?.users?.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No staff members yet</p>
                    <p className="text-sm">Add your first staff member to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {staffData?.users?.filter(staff => staff.role === 'staff').map(staff => (
                      <div key={staff.id} className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg border border-border hover:bg-surface-hover transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${staff.isActive ? 'bg-status-success' : 'bg-status-error'}`}></div>
                          <div>
                            <span className="text-text-primary font-medium">{staff.fullName}</span>
                            <p className="text-sm text-text-secondary flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {staff.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-xs text-text-secondary">
                            Added {new Date(staff.createdAt).toLocaleDateString()}
                          </div>
                          <button 
                            className="p-2 rounded hover:bg-surface text-text-secondary hover:text-status-error transition-colors"
                            onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                            disabled={deleteStaffMutation.isPending}
                            title="Delete staff member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )) || []}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}


        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <Card className="surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Academic Structure</span>
                </CardTitle>
                <ModernButton 
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  iconPosition="left"
                  onClick={() => setIsAddYearOpen(true)}
                >
                  Add Year
                </ModernButton>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {authLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-text-secondary">Authenticating...</div>
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-status-error">Please log in to view academic structure</div>
                </div>
              ) : yearsLoading || fieldsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-text-secondary">Loading academic structure...</div>
                </div>
              ) : yearsError || fieldsError ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-status-error">Failed to load academic structure</div>
                </div>
              ) : years.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No years created yet</p>
                  <p className="text-sm">Add your first academic year to get started</p>
                </div>
              ) : (
                years.sort((a, b) => a.order - b.order).map(year => {
                const yearFields = fields.filter(field => field.yearId === year.id);
                const isExpanded = expandedYears.has(year.id);
                const isAddingField = addingFieldToYear === year.id;
                
                return (
                  <div key={year.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Year Header */}
                    <div 
                      className="flex items-center justify-between p-4 bg-surface-secondary cursor-pointer hover:bg-surface-hover transition-colors"
                      onClick={() => toggleYearExpansion(year.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-text-secondary" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-secondary" />
                        )}
                        <div className={`w-3 h-3 rounded-full ${year.isActive ? 'bg-status-success' : 'bg-status-error'}`}></div>
                        <div>
                          <span className="text-text-primary font-medium">{year.name}</span>
                          <p className="text-xs text-text-secondary">Order: {year.order} • {yearFields.length} fields</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditYear(year);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteYear(year.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Year Content - Fields */}
                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        {/* Fields List */}
                        {yearFields.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {yearFields.map(field => (
                              <div key={field.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded border">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${field.isActive ? 'bg-status-success' : 'bg-status-error'}`}></div>
                                  <span className="text-sm text-text-primary">{field.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button 
                                    className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                                    onClick={() => handleEditField(field)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button 
                                    className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                                    onClick={() => handleDeleteField(field.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Field Section */}
                        {isAddingField ? (
                          <div className="p-3 bg-surface-secondary rounded border border-dashed border-border">
                            <div className="space-y-3">
                              <FormField label="Field Name" required>
                                <Input
                                  value={fieldForm.name}
                                  onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="e.g., Sciences, Literature, etc."
                                  autoFocus
                                />
                              </FormField>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id={`fieldActive-${year.id}`}
                                  checked={fieldForm.isActive}
                                  onChange={(e) => setFieldForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`fieldActive-${year.id}`} className="text-sm text-text-primary">
                                  Active (available for new students)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <ModernButton
                                  variant="solid"
                                  size="sm"
                                  onClick={() => handleAddFieldInline(year.id)}
                                  disabled={!fieldForm.name.trim() || createFieldMutation.isPending}
                                >
                                  Add Field
                                </ModernButton>
                                <ModernButton
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelAddingField}
                                >
                                  Cancel
                                </ModernButton>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="w-full p-3 border border-dashed border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors flex items-center justify-center space-x-2"
                            onClick={() => startAddingField(year.id)}
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Field to {year.name}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Code Modal */}
      <Modal
        isOpen={isChangeCodeOpen}
        onClose={() => setIsChangeCodeOpen(false)}
        title="Change Employee Code"
        size="md"
      >
        <div className="p-6 space-y-6">
          <FormField label="Current Code" required>
            <Input
              type="password"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              placeholder="Enter current code"
            />
          </FormField>

          <FormField label="New Code" required>
            <Input
              type="password"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Enter new code"
            />
          </FormField>

          <FormField label="Confirm New Code" required>
            <Input
              type="password"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Confirm new code"
            />
          </FormField>

          <div className="flex items-center space-x-4">
            <ModernButton
              variant="outline"
              className="flex-1"
              onClick={() => setIsChangeCodeOpen(false)}
            >
              Cancel
            </ModernButton>
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={handleChangeCode}
            >
              Change Code
            </ModernButton>
          </div>
        </div>
      </Modal>



      {/* Add Year Modal */}
      <Modal
        isOpen={isAddYearOpen}
        onClose={() => setIsAddYearOpen(false)}
        title="Add New Year"
        size="md"
      >
        <div className="p-6 space-y-6">
          <FormField label="Year Name" required>
            <Input
              value={yearForm.name}
              onChange={(e) => setYearForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Year 1, First Year, etc."
            />
          </FormField>

          <FormField label="Order" required>
            <Input
              type="number"
              value={yearForm.order}
              onChange={(e) => setYearForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
              placeholder="1"
              min="1"
            />
          </FormField>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="yearActive"
              checked={yearForm.isActive}
              onChange={(e) => setYearForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="yearActive" className="text-sm text-text-primary">
              Active (available for new students)
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <ModernButton
              variant="outline"
              className="flex-1"
              onClick={() => setIsAddYearOpen(false)}
            >
              Cancel
            </ModernButton>
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={handleAddYear}
              disabled={!yearForm.name || createYearMutation.isPending}
            >
              Add Year
            </ModernButton>
          </div>
        </div>
      </Modal>

      {/* Edit Year Modal */}
      <Modal
        isOpen={isEditYearOpen}
        onClose={() => setIsEditYearOpen(false)}
        title="Edit Year"
        size="md"
      >
        <div className="p-6 space-y-6">
          <FormField label="Year Name" required>
            <Input
              value={yearForm.name}
              onChange={(e) => setYearForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Year 1, First Year, etc."
            />
          </FormField>

          <FormField label="Order" required>
            <Input
              type="number"
              value={yearForm.order}
              onChange={(e) => setYearForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
              placeholder="1"
              min="1"
            />
          </FormField>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="editYearActive"
              checked={yearForm.isActive}
              onChange={(e) => setYearForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="editYearActive" className="text-sm text-text-primary">
              Active (available for new students)
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <ModernButton
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditYearOpen(false)}
            >
              Cancel
            </ModernButton>
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={handleUpdateYear}
              disabled={!yearForm.name || updateYearMutation.isPending}
            >
              Update Year
            </ModernButton>
          </div>
        </div>
      </Modal>



      {/* Edit Field Modal */}
      <Modal
        isOpen={isEditFieldOpen}
        onClose={() => setIsEditFieldOpen(false)}
        title="Edit Field"
        size="md"
      >
        <div className="p-6 space-y-6">
          <FormField label="Field Name" required>
            <Input
              value={fieldForm.name}
              onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Sciences, Literature, etc."
            />
          </FormField>

          <FormField label="Year" required>
            <Select
              value={fieldForm.yearId}
              onChange={(e) => setFieldForm(prev => ({ ...prev, yearId: e.target.value }))}
              options={years.filter(y => y.isActive).map(year => ({
                value: year.id,
                label: year.name
              }))}
            />
          </FormField>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="editFieldActive"
              checked={fieldForm.isActive}
              onChange={(e) => setFieldForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="editFieldActive" className="text-sm text-text-primary">
              Active (available for new students)
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <ModernButton
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditFieldOpen(false)}
            >
              Cancel
            </ModernButton>
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={handleUpdateField}
              disabled={!fieldForm.name || !fieldForm.yearId || updateFieldMutation.isPending}
            >
              Update Field
            </ModernButton>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="Change Password"
        size="md"
      >
        <div className="p-6 space-y-6">
          <FormField label="Current Password" required>
            <Input
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
              placeholder="Enter your current password"
            />
          </FormField>

          <FormField label="New Password" required>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new password"
            />
          </FormField>

          <FormField label="Confirm New Password" required>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
            />
          </FormField>

          <div className="flex items-center space-x-4">
            <ModernButton
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsChangePasswordOpen(false);
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
              }}
            >
              Cancel
            </ModernButton>
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={handleChangePassword}
              disabled={!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              Change Password
            </ModernButton>
          </div>
        </div>
      </Modal>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Add Staff Member"
        size="md"
      >
        <div className="p-6 space-y-6">
          <div className="bg-surface-secondary/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">Email Notification</p>
                <p className="text-xs text-text-secondary">
                  The system will generate a secure password and send login credentials to the staff member's email automatically.
                </p>
              </div>
            </div>
          </div>

          <FormField label="Email Address" required>
            <Input
              type="email"
              value={staffForm.email}
              onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="staff@example.com"
            />
          </FormField>

          <FormField label="Full Name" required>
            <Input
              value={staffForm.fullName}
              onChange={(e) => setStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter staff member's full name"
            />
          </FormField>

          <div className="flex items-center space-x-4">
            <ModernButton
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsAddStaffOpen(false);
                setStaffForm({ email: '', fullName: '' });
              }}
            >
              Cancel
            </ModernButton>
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={handleAddStaff}
              disabled={!staffForm.email || !staffForm.fullName || createStaffMutation.isPending}
            >
              {createStaffMutation.isPending ? 'Creating...' : 'Add Staff'}
            </ModernButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};