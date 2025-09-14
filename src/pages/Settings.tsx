import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Year, Field, CreateYearRequest, CreateFieldRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
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
  
  const [activeTab, setActiveTab] = useState('security');
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [addingFieldToYear, setAddingFieldToYear] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    defaultLanguage: 'en',
    notifications: true,
    emailReports: false
  });

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    // Save settings logic here
  };

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



  const handleExportCSV = (type: string) => {
    console.log(`Exporting ${type} as CSV`);
    // CSV export logic
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
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="application" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Application
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Academic
          </TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="surface">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security & Access</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-text-primary">Employee Access Code</h4>
                  <p className="text-caption text-text-secondary">
                    Change the system access code for security
                  </p>
                </div>
                <ModernButton 
                  variant="outline"
                  icon={Key}
                  iconPosition="left"
                  onClick={() => setIsChangeCodeOpen(true)}
                >
                  Change Code
                </ModernButton>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="font-medium text-text-primary mb-4">User Permissions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-text-secondary">Multi-user access</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-text-secondary">Admin approval for new students</span>
                    <input type="checkbox" className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-text-secondary">Require confirmation for payments</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Tab */}
        <TabsContent value="application" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Application Preferences Card */}
            <Card className="surface">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="w-5 h-5" />
                  <span>Application Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Default Language">
                  <Select
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'ar', label: 'العربية' },
                      { value: 'fr', label: 'Français' }
                    ]}
                  />
                </FormField>

                <div className="space-y-3">
                  <h4 className="font-medium text-text-primary">Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-text-secondary">Enable system notifications</span>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                        className="w-4 h-4" 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-text-secondary">Email daily reports</span>
                      <input 
                        type="checkbox" 
                        checked={settings.emailReports}
                        onChange={(e) => setSettings(prev => ({ ...prev, emailReports: e.target.checked }))}
                        className="w-4 h-4" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <ModernButton variant="solid" onClick={handleSaveSettings} className="w-full">
                    Save Preferences
                  </ModernButton>
                </div>
              </CardContent>
            </Card>

            {/* Data Export Card */}
            <Card className="surface">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Data Export</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ModernButton 
                  variant="outline" 
                  className="w-full"
                  icon={Download}
                  iconPosition="left"
                  onClick={() => handleExportCSV('students')}
                >
                  Export Students
                </ModernButton>
                
                <ModernButton 
                  variant="outline" 
                  className="w-full"
                  icon={Download}
                  iconPosition="left"
                  onClick={() => handleExportCSV('payments')}
                >
                  Export Payments
                </ModernButton>
                
                <ModernButton 
                  variant="outline" 
                  className="w-full"
                  icon={Download}
                  iconPosition="left"
                  onClick={() => handleExportCSV('attendance')}
                >
                  Export Attendance
                </ModernButton>
              </CardContent>
            </Card>

            {/* System Info Card */}
            <Card className="surface">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>System Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-caption text-text-secondary">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="text-status-success">Online</span>
                </div>
                <div className="flex justify-between">
                  <span>Students:</span>
                  <span>200</span>
                </div>
                <div className="flex justify-between">
                  <span>Teachers:</span>
                  <span>10</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Groups:</span>
                  <span>25</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
    </div>
  );
};