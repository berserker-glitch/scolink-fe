import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { AddStudentWizard } from '@/components/Student/AddStudentWizard';
import { StudentDrawer } from '@/components/Student/StudentDrawer';
import { PaymentModal } from '@/components/Student/PaymentModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Student, Year, Field } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Phone
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading student...</p>
        </div>
      </div>
    );
  }

  if (!student) {
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      // Search immediately for any input (like Subjects page)
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedYear, selectedField]);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const studentsPerPage = 20;

  // Fetch students with pagination and filters
  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students', currentPage, debouncedSearchQuery, selectedYear, selectedField],
    queryFn: () => apiService.getStudents(
      currentPage, 
      studentsPerPage, 
      debouncedSearchQuery || undefined, 
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
      setIsDrawerOpen(false);
      setSelectedStudentId(null);
    },
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData: any) => {
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
        cni: studentData.CNI,
        isActive: true
      };
      return apiService.createStudent(apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddStudentOpen(false);
    },
    onError: (error: any) => {
      console.error('Failed to create student:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create student. Please try again."
      });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: (studentData: any) => {
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
        cni: studentData.CNI,
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

  const handleStudentClick = (student: Student) => {
    setSelectedStudentId(student.id);
    setIsDrawerOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditing(true);
    setIsAddStudentOpen(true);
    setIsDrawerOpen(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student && confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
      deleteStudentMutation.mutate(studentId);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex h-screen">
          {/* Main Content */}
          <div className={`transition-all duration-300 overflow-hidden ${isDrawerOpen ? 'w-[60%]' : 'w-full'}`}>
            <div className="p-6 lg:p-8 h-full overflow-y-auto">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Students Database</h1>
                  <p className="text-sm text-gray-600">
                    {pagination?.total || 0} results • Welcome to Scolink Dashboard
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                  <ModernButton variant="outline" size="sm">
                    Filter
                  </ModernButton>
                  <ModernButton 
                    variant="solid" 
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setIsEditing(false);
                      setEditingStudent(null);
                      setIsAddStudentOpen(true);
                    }}
                  >
                    Add
                  </ModernButton>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, phone, ID card, year, field..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Filters */}
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Years</option>
                      {years.map(year => (
                        <option key={year.id} value={year.id}>{year.name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedField}
                      onChange={(e) => setSelectedField(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Fields</option>
                      {fields.map(field => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentsLoading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            Loading students...
                          </td>
                        </tr>
                      ) : studentsError ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-red-500">
                            Error loading students. Please try again.
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No students found.
                          </td>
                        </tr>
                      ) : (
                        students.map((student) => (
                          <tr 
                            key={student.id} 
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                              selectedStudentId === student.id ? 'bg-purple-50' : ''
                            }`}
                            onClick={() => handleStudentClick(student)}
                          >
                            {/* Full Name */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-gray-600">
                                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Contact */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {student.phone || 'No contact info'}
                              </div>
                            </td>
                            {/* Year */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.yearName || 'N/A'}</div>
                            </td>
                            {/* Field */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.fieldName || 'N/A'}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <ModernButton
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Previous
                      </ModernButton>
                      
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                        const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <ModernButton
                            key={pageNum}
                            variant={currentPage === pageNum ? 'solid' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </ModernButton>
                        );
                      })}
                      
                      <ModernButton
                        variant="outline"
                        size="sm"
                        disabled={currentPage === pagination.totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next
                      </ModernButton>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        {/* Inline Drawer */}
        <div className={`w-[40%] transition-all duration-300 ${isDrawerOpen && selectedStudentId ? 'block' : 'hidden'}`}>
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
        </div>
      </div>

      {/* Modals */}
      <AddStudentWizard
        isOpen={isAddStudentOpen}
        onClose={() => {
          setIsAddStudentOpen(false);
          setIsEditing(false);
          setEditingStudent(null);
        }}
        onSave={(student) => {
          if (isEditing) {
            updateStudentMutation.mutate(student);
          } else {
            createStudentMutation.mutate(student);
          }
        }}
        isLoading={createStudentMutation.isPending || updateStudentMutation.isPending}
        initialStudent={editingStudent}
        isEditing={isEditing}
      />

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