import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, type Student } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { PaymentRecordModal } from './PaymentRecordModal';

interface MonthlyPaymentTrackerProps {
  centerId?: string;
}

export const MonthlyPaymentTracker: React.FC<MonthlyPaymentTrackerProps> = ({
  centerId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);

  // Generate month options for the current year
  const generateMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = -2; i <= 10; i++) { // 2 months back, current, and 10 months forward
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthLabel });
    }
    return months;
  };

  const months = generateMonthOptions();

  // Fetch students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiService.getStudents(1, 1000),
    staleTime: 300000, // 5 minutes
  });

  const students = studentsData?.students || [];

  // Fetch monthly payment status for all students
  const { data: monthlyStatusData, isLoading: statusLoading, error } = useQuery({
    queryKey: ['monthly-payment-status', selectedMonth],
    queryFn: async () => {
      const monthsToCheck = [selectedMonth];
      const statusPromises = students.map(async (student: Student) => {
        try {
          const status = await apiService.getStudentMonthlyStatus(student.id);
          const monthStatus = status.find(s => s.month === selectedMonth);
          return {
            student,
            status: monthStatus || {
              month: selectedMonth,
              studentId: student.id,
              totalAmount: 0,
              paidAmount: 0,
              status: 'pending',
              dueDate: new Date().toISOString(),
              subjects: []
            }
          };
        } catch (error) {
          // Fallback for students without payment records
          return {
            student,
            status: {
              month: selectedMonth,
              studentId: student.id,
              totalAmount: 0,
              paidAmount: 0,
              status: 'pending',
              dueDate: new Date().toISOString(),
              subjects: []
            }
          };
        }
      });
      
      return await Promise.all(statusPromises);
    },
    enabled: students.length > 0 && !!selectedMonth,
    staleTime: 60000, // 1 minute
  });

  const monthlyData = monthlyStatusData || [];

  // Filter and search logic
  const filteredData = useMemo(() => {
    return monthlyData.filter(({ student, status }) => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const statusMatch = statusFilter === 'all' || status.status === statusFilter;
      
      return searchMatch && statusMatch;
    });
  }, [monthlyData, searchQuery, statusFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalStudents = filteredData.length;
    const paidCount = filteredData.filter(({ status }) => status.status === 'paid').length;
    const partialCount = filteredData.filter(({ status }) => status.status === 'partial').length;
    const pendingCount = filteredData.filter(({ status }) => status.status === 'pending').length;
    const overdueCount = filteredData.filter(({ status }) => status.status === 'overdue').length;
    
    const totalExpected = filteredData.reduce((sum, { status }) => sum + (status.totalAmount || 0), 0);
    const totalCollected = filteredData.reduce((sum, { status }) => sum + (status.paidAmount || 0), 0);
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    
    return {
      totalStudents,
      paidCount,
      partialCount,
      pendingCount,
      overdueCount,
      totalExpected,
      totalCollected,
      collectionRate: Math.round(collectionRate * 10) / 10
    };
  }, [filteredData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'partial':
        return 'outline';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'partial':
        return <DollarSign className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleRecordPayment = (student: Student) => {
    setSelectedStudent(student);
    setIsPaymentModalOpen(true);
  };

  const handleViewDetails = (studentData: any) => {
    setSelectedStudentDetails(studentData);
    setIsDetailsModalOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['monthly-payment-status'] });
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  if (studentsLoading || statusLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-surface rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-surface rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Monthly Payment Tracking
          </h3>
          <p className="text-text-secondary">
            Track payment status for all students by month
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          
          <BrutalistButton variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </BrutalistButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">TOTAL STUDENTS</p>
                <p className="text-2xl font-bold text-text-primary">{summary.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">COLLECTION RATE</p>
                <p className="text-2xl font-bold text-text-primary">{summary.collectionRate}%</p>
              </div>
              <TrendingUp className={`w-8 h-8 ${summary.collectionRate >= 80 ? 'text-status-success' : summary.collectionRate >= 60 ? 'text-status-warning' : 'text-status-error'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">EXPECTED</p>
                <p className="text-2xl font-bold text-text-primary">{summary.totalExpected.toLocaleString()} DH</p>
              </div>
              <Calendar className="w-8 h-8 text-text-muted" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">COLLECTED</p>
                <p className="text-2xl font-bold text-status-success">{summary.totalCollected.toLocaleString()} DH</p>
              </div>
              <DollarSign className="w-8 h-8 text-status-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Payment Status ({filteredData.length} students)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Student</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Expected</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Paid</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Status</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-secondary">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 opacity-50 mb-3" />
                        <p className="text-lg mb-2">No students found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map(({ student, status }) => (
                    <tr key={student.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-text-primary">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {student.yearName} - {student.fieldName}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-text-primary">
                          {status.totalAmount.toLocaleString()} DH
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-text-primary">
                          {status.paidAmount.toLocaleString()} DH
                        </div>
                        {status.paidAmount > 0 && status.paidAmount < status.totalAmount && (
                          <div className="text-xs text-text-secondary">
                            {Math.round((status.paidAmount / status.totalAmount) * 100)}% paid
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={getStatusColor(status.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(status.status)}
                          <span className="capitalize">{status.status}</span>
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <BrutalistButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails({ student, status })}
                          >
                            View
                          </BrutalistButton>
                          {status.status !== 'paid' && (
                            <BrutalistButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleRecordPayment(student)}
                            >
                              Pay
                            </BrutalistButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Record Modal */}
      <PaymentRecordModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        defaultMonth={selectedMonth}
        onPaymentRecorded={() => {
          queryClient.invalidateQueries({ queryKey: ['monthly-payment-status'] });
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }}
      />

      {/* Student Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Payment Details - {selectedStudentDetails?.student?.firstName} {selectedStudentDetails?.student?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudentDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Student Info</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-text-secondary">Name:</span> {selectedStudentDetails.student.firstName} {selectedStudentDetails.student.lastName}</p>
                    <p><span className="text-text-secondary">Year:</span> {selectedStudentDetails.student.yearName}</p>
                    <p><span className="text-text-secondary">Field:</span> {selectedStudentDetails.student.fieldName}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Payment Status</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-text-secondary">Status:</span> 
                      <Badge variant={getStatusColor(selectedStudentDetails.status.status)} className="ml-2">
                        {selectedStudentDetails.status.status}
                      </Badge>
                    </p>
                    <p><span className="text-text-secondary">Expected:</span> {selectedStudentDetails.status.totalAmount.toLocaleString()} DH</p>
                    <p><span className="text-text-secondary">Paid:</span> {selectedStudentDetails.status.paidAmount.toLocaleString()} DH</p>
                  </div>
                </div>
              </div>
              
              {selectedStudentDetails.status.subjects.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-primary mb-3">Subjects</h4>
                  <div className="grid gap-2">
                    {selectedStudentDetails.status.subjects.map((subject: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-surface rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{subject.subjectName}</span>
                          {subject.paid && <CheckCircle2 className="w-4 h-4 text-status-success" />}
                        </div>
                        <span className="font-medium">{subject.amount.toLocaleString()} DH</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
