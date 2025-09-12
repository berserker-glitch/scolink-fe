import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { AddStudentWizard } from '@/components/Student/AddStudentWizard';
import { StudentDrawer } from '@/components/Student/StudentDrawer';
import { PaymentModal } from '@/components/Student/PaymentModal';
import { Student as MockStudent } from '@/data/mockData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Student, Year, Field } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Eye,
  Download
} from 'lucide-react';

// Wrapper component to fetch student by ID for the drawer
const StudentDrawerWithQuery: React.FC<{
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onPayment: () => void;
}> = ({ studentId, isOpen, onClose, onEdit, onDelete, onPayment }) => {
  const { data: student, isLoading } = useQuery({
    queryKey: ['students', studentId],
    queryFn: () => apiService.getStudentById(studentId),
    enabled: isOpen && !!studentId,
  });

  if (isLoading || !student) {
    return null;
  }

  return (
    <StudentDrawer
      isOpen={isOpen}
      onClose={onClose}
      student={student as any}
      onEdit={onEdit}
      onDelete={onDelete}
      onOpenPaymentModal={onPayment}
    />
  );
};

// Wrapper component to fetch student by ID for the payment modal
const PaymentModalWithQuery: React.FC<{
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (payment: any) => void;
}> = ({ studentId, isOpen, onClose, onPaymentComplete }) => {
  const { data: student, isLoading } = useQuery({
    queryKey: ['students', studentId],
    queryFn: () => apiService.getStudentById(studentId),
    enabled: isOpen && !!studentId,
  });

  if (isLoading || !student) {
    return null;
  }

  return (
    <PaymentModal
      isOpen={isOpen}
      onClose={onClose}
      student={student as any}
      onPaymentComplete={onPaymentComplete}
    />
  );
};

export const Students: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const studentsPerPage = 20;

  // Fetch students with pagination and filters
  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students', currentPage, searchQuery, selectedYear, selectedField],
    queryFn: () => apiService.getStudents(
      currentPage, 
      studentsPerPage, 
      searchQuery || undefined, 
      selectedYear || undefined, 
      selectedField || undefined,
      true // only active students
    ),
    enabled: isAuthenticated,
  });

  // Fetch years for filter
  const { data: yearsData } = useQuery({
    queryKey: ['years'],
    queryFn: () => apiService.getYears(),
    enabled: isAuthenticated,
  });

  // Fetch fields for filter
  const { data: fieldsData } = useQuery({
    queryKey: ['fields'],
    queryFn: () => apiService.getFields(),
    enabled: isAuthenticated,
  });

  const students = studentsData?.students || [];
  const pagination = studentsData?.pagination;
  const years = yearsData?.years?.filter(y => y.isActive) || [];
  const fields = fieldsData?.fields?.filter(f => f.isActive) || [];

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (studentId: string) => apiService.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData: any) => {
      // Map the form data to the API expected format
      const apiData = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        sex: studentData.sex,
        yearId: studentData.yearId,
        fieldId: studentData.fieldId,
        phone: studentData.phone,
        parentPhone: studentData.parentPhone,
        parentType: studentData.parentType,
        tag: studentData.tag,
        cni: studentData.CNI, // Note: API uses 'cni' (lowercase), form uses 'CNI'
        isActive: true
      };
      return apiService.createStudent(apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddStudentOpen(false);
    },
    onError: (error) => {
      console.error('Failed to create student:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create student. Please try again."
      });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: (studentData: any) => {
      // Map the form data to the API expected format
      const apiData = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        sex: studentData.sex,
        yearId: studentData.yearId,
        fieldId: studentData.fieldId,
        phone: studentData.phone,
        parentPhone: studentData.parentPhone,
        parentType: studentData.parentType,
        tag: studentData.tag,
        cni: studentData.CNI, // Note: API uses 'cni' (lowercase), form uses 'CNI'
        isActive: true
      };
      return apiService.updateStudent(studentData.id, apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddStudentOpen(false);
      setIsEditing(false);
      setEditingStudent(null);
    },
    onError: (error) => {
      console.error('Failed to update student:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update student. Please try again."
      });
    },
  });

  const getStudentSubjects = (enrollments?: Array<{groupName?: string; subjectName?: string}>) => {
    if (!enrollments || enrollments.length === 0) {
      return <span className="text-text-secondary italic">No subjects enrolled</span>;
    }
    
    return (
      <div className="space-y-1">
        {enrollments.map((enrollment, index) => (
          <div key={index} className="text-sm">
            <span className="font-medium">{enrollment.subjectName}</span>
            {enrollment.groupName && (
              <span className="text-text-secondary ml-1">({enrollment.groupName})</span>
            )}
          </div>
        ))}
      </div>
    );
  };



  const handleViewStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    setIsDrawerOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    console.log('Edit student:', student);
    setEditingStudent(student);
    setIsEditing(true);
    setIsAddStudentOpen(true);
    setIsDrawerOpen(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student && confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
      deleteStudentMutation.mutate(studentId);
      setIsDrawerOpen(false);
    }
  };

  const handlePaymentComplete = (payment: any) => {
    // TODO: Update student payment records
    console.log('Payment completed:', payment);
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-hero text-text-primary mb-2">Students</h1>
          <p className="text-body text-text-secondary">
            Manage and monitor all student information, subjects, and payments.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <BrutalistButton variant="outline" size="md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </BrutalistButton>
          <BrutalistButton 
            variant="primary" 
            size="md"
            onClick={() => {
              setIsEditing(false);
              setEditingStudent(null);
              setIsAddStudentOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </BrutalistButton>
        </div>
      </div>

      {/* Filters */}
      <Card className="surface mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
              />
            </div>

            {/* Field Filter */}
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
            >
              <option value="">All Fields</option>
              {fields.map(field => (
                <option key={field.id} value={field.id}>{field.name}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>


          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="surface">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Students List ({pagination?.total || 0})</span>
            <span className="text-caption text-text-secondary font-normal">
              Page {currentPage} of {pagination?.totalPages || 1}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Student</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Contact</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Academic</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Subjects</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-secondary">
                      Loading students...
                    </td>
                  </tr>
                ) : studentsError ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-red-600">
                      Error loading students. Please try again.
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-secondary">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-text-primary">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-caption text-text-secondary">
                            {student.sex} • {student.tag === 'ss' ? 'Special Schedule' : 'Regular'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-caption text-text-secondary">
                          <div>{student.phone}</div>
                          <div>Parent: {student.parentPhone}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-caption text-text-secondary">
                          <div>{student.yearName || 'Unknown Year'}</div>
                          <div>{student.fieldName || 'Unknown Field'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-caption text-text-primary max-w-48">
                          {getStudentSubjects(student.enrollments)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <button 
                          className="p-2 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary focus-brutalist transition-colors"
                          onClick={() => handleViewStudent(student)}
                          title="View Student Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="text-caption text-text-secondary">
                Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, pagination.total)} of {pagination.total} students
              </div>
              <div className="flex items-center space-x-2">
                <BrutalistButton
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </BrutalistButton>
                
                {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                  const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <BrutalistButton
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </BrutalistButton>
                  );
                })}
                
                <BrutalistButton
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </BrutalistButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddStudentWizard
        isOpen={isAddStudentOpen}
        onClose={() => {
          setIsAddStudentOpen(false);
          setIsEditing(false);
          setEditingStudent(null);
        }}
        onSave={(student) => {
          if (isEditing) {
            console.log('Updating student:', student);
            updateStudentMutation.mutate(student);
          } else {
            console.log('Creating student:', student);
            createStudentMutation.mutate(student);
          }
        }}
        isLoading={createStudentMutation.isPending || updateStudentMutation.isPending}
        initialStudent={editingStudent}
        isEditing={isEditing}
      />

      {selectedStudentId && (
        <StudentDrawerWithQuery
          studentId={selectedStudentId}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedStudentId(null);
          }}
          onEdit={handleEditStudent as any}
          onDelete={handleDeleteStudent}
          onPayment={() => setIsPaymentModalOpen(true)}
        />
      )}

      {selectedStudentId && (
        <PaymentModalWithQuery
          studentId={selectedStudentId}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentComplete={(payment: any) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['students', selectedStudentId] });
            setIsPaymentModalOpen(false);
          }}
        />
      )}
    </div>
  );
};