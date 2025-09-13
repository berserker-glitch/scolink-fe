import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModernButton } from '@/components/ui';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface AddStudentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: any) => void;
  isLoading?: boolean;
  initialStudent?: any; // Student data for editing
  isEditing?: boolean;
}

interface StudentData {
  firstName: string;
  lastName: string;
  sex: 'M' | 'F';
  yearId: string;
  fieldId: string;
  phone: string;
  parentPhone: string;
  parentType: 'Mother' | 'Father' | 'Guardian';
  tag: 'normal' | 'ss';
  CNI: string;
  selectedSubjects: string[];
  selectedGroups: { [subjectId: string]: string };
}

const STEPS = [
  { id: 'info', title: 'Student Information', icon: User }
];

export const AddStudentWizard: React.FC<AddStudentWizardProps> = ({ isOpen, onClose, onSave, isLoading = false, initialStudent, isEditing = false }) => {
  // Fetch years and fields from API
  const { data: yearsData } = useQuery({
    queryKey: ['years'],
    queryFn: () => apiService.getYears(),
    enabled: isOpen,
  });

  const { data: fieldsData } = useQuery({
    queryKey: ['fields'],
    queryFn: () => apiService.getFields(),
    enabled: isOpen,
  });

  const years = yearsData?.years?.filter(y => y.isActive) || [];
  const fields = fieldsData?.fields?.filter(f => f.isActive) || [];

  const [studentData, setStudentData] = useState<StudentData>({
    firstName: '',
    lastName: '',
    sex: 'M',
    yearId: '',
    fieldId: '',
    phone: '',
    parentPhone: '',
    parentType: 'Father',
    tag: 'normal',
    CNI: '',
    selectedSubjects: [],
    selectedGroups: {}
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Set initial values when modal opens for editing
  useEffect(() => {
    if (isOpen && initialStudent && isEditing) {
      setStudentData({
        firstName: initialStudent.firstName || '',
        lastName: initialStudent.lastName || '',
        sex: initialStudent.sex || 'M',
        yearId: initialStudent.yearId || '',
        fieldId: initialStudent.fieldId || '',
        phone: initialStudent.phone || '',
        parentPhone: initialStudent.parentPhone || '',
        parentType: initialStudent.parentType || 'Father',
        tag: initialStudent.tag || 'normal',
        CNI: initialStudent.cni || '',
        selectedSubjects: [],
        selectedGroups: {}
      });
    }
  }, [isOpen, initialStudent?.id, isEditing]); // Only depend on modal opening and student ID

  // Set default year/field when creating new student
  useEffect(() => {
    if (years.length > 0 && fields.length > 0 && !isEditing && isOpen) {
      const firstYear = years[0];
      const availableFields = fields.filter(f => f.yearId === firstYear.id);
      
      setStudentData(prev => {
        // Only update if yearId and fieldId are empty (new student)
        if (!prev.yearId && !prev.fieldId) {
          return {
            ...prev,
            yearId: firstYear.id,
            fieldId: availableFields[0]?.id || ''
          };
        }
        return prev;
      });
    }
  }, [years, fields, isEditing, isOpen]);

  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      // Reset form to initial state when modal closes
      setStudentData({
        firstName: '',
        lastName: '',
        sex: 'M',
        yearId: '',
        fieldId: '',
        phone: '',
        parentPhone: '',
        parentType: 'Father',
        tag: 'normal',
        CNI: '',
        selectedSubjects: [],
        selectedGroups: {}
      });
    }
  }, [isOpen]);

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!studentData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!studentData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!studentData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!studentData.parentPhone.trim()) newErrors.parentPhone = 'Parent phone is required';
    if (!studentData.CNI.trim()) newErrors.CNI = 'CNI is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      handleSave();
    }
  };



  const handleSave = () => {
    // Pass the form data and student ID (if editing) to parent component for API call
    const dataToSave = isEditing 
      ? { ...studentData, id: initialStudent?.id }
      : studentData;
    
    onSave(dataToSave);
    
    // Reset form only if not editing (editing form will be closed by parent)
    if (!isEditing) {
      setStudentData({
        firstName: '',
        lastName: '',
        sex: 'M',
        yearId: '',
        fieldId: '',
        phone: '',
        parentPhone: '',
        parentType: 'Father',
        tag: 'normal',
        CNI: '',
        selectedSubjects: [],
        selectedGroups: {}
      });
      setErrors({});
    }
  };





  const renderStepContent = () => {
    return (
      <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" required error={errors.firstName}>
                <Input
                  value={studentData.firstName}
                  onChange={(e) => setStudentData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                  error={!!errors.firstName}
                />
              </FormField>
              <FormField label="Last Name" required error={errors.lastName}>
                <Input
                  value={studentData.lastName}
                  onChange={(e) => setStudentData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                  error={!!errors.lastName}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Gender" required>
                <Select
                  value={studentData.sex}
                  onChange={(e) => setStudentData(prev => ({ ...prev, sex: e.target.value as 'M' | 'F' }))}
                  options={[
                    { value: 'M', label: 'Male' },
                    { value: 'F', label: 'Female' }
                  ]}
                />
              </FormField>
              <FormField label="Year of Study" required>
                <Select
                  value={studentData.yearId}
                  onChange={(e) => {
                    const selectedYearId = e.target.value;
                    const availableFields = fields.filter(f => f.yearId === selectedYearId);
                    setStudentData(prev => ({ 
                      ...prev, 
                      yearId: selectedYearId,
                      fieldId: availableFields[0]?.id || ''
                    }));
                  }}
                  options={years.map(year => ({
                    value: year.id,
                    label: year.name
                  }))}
                />
              </FormField>
            </div>

            <FormField label="Field of Study" required>
              <Select
                value={studentData.fieldId}
                onChange={(e) => setStudentData(prev => ({ ...prev, fieldId: e.target.value }))}
                options={fields.filter(f => f.yearId === studentData.yearId).map(field => ({
                  value: field.id,
                  label: field.name
                }))}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Student Phone" required error={errors.phone}>
                <Input
                  value={studentData.phone}
                  onChange={(e) => setStudentData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+212 6 XX XX XX XX"
                  error={!!errors.phone}
                />
              </FormField>
              <FormField label="Parent Phone" required error={errors.parentPhone}>
                <Input
                  value={studentData.parentPhone}
                  onChange={(e) => setStudentData(prev => ({ ...prev, parentPhone: e.target.value }))}
                  placeholder="+212 6 XX XX XX XX"
                  error={!!errors.parentPhone}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Parent Type" required>
                <Select
                  value={studentData.parentType}
                  onChange={(e) => setStudentData(prev => ({ ...prev, parentType: e.target.value as any }))}
                  options={[
                    { value: 'Father', label: 'Father' },
                    { value: 'Mother', label: 'Mother' },
                    { value: 'Guardian', label: 'Guardian' }
                  ]}
                />
              </FormField>
              <FormField label="CNI" required error={errors.CNI}>
                <Input
                  value={studentData.CNI}
                  onChange={(e) => setStudentData(prev => ({ ...prev, CNI: e.target.value }))}
                  placeholder="AB123456"
                  error={!!errors.CNI}
                />
              </FormField>
            </div>

            <FormField label="Student Tag">
              <Select
                value={studentData.tag}
                onChange={(e) => setStudentData(prev => ({ ...prev, tag: e.target.value as 'normal' | 'ss' }))}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'ss', label: 'Special Schedule' }
                ]}
              />
            </FormField>
          </div>
        );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={isEditing ? "Edit Student" : "Add New Student"}>
      <div className="p-6">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary">Student Information</h2>
          <p className="text-sm text-text-secondary mt-1">
            {isEditing ? "Update the student's information" : "Enter the student's basic information"}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <ModernButton
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </ModernButton>

          <ModernButton 
            variant="solid" 
            onClick={handleNext}
            disabled={isLoading}
          >
            {isLoading 
              ? (isEditing ? 'Updating Student...' : 'Creating Student...') 
              : (isEditing ? 'Update Student' : 'Save Student')
            }
          </ModernButton>
        </div>
      </div>
    </Modal>
  );
};