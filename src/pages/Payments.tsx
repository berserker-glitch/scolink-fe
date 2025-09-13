import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentRecordModal } from '@/components/Payment/PaymentRecordModal';
import { PaymentAnalytics } from '@/components/Analytics/PaymentAnalytics';
import { PaymentEditModal } from '@/components/Payment/PaymentEditModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, type PaymentFilters, type PaymentSummary } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Download,
  TrendingUp,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  RefreshCw
} from 'lucide-react';

export const Payments: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [isPaymentRecordModalOpen, setIsPaymentRecordModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPaymentDetailModalOpen, setIsPaymentDetailModalOpen] = useState(false);
  const [isPaymentEditModalOpen, setIsPaymentEditModalOpen] = useState(false);
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const paymentsPerPage = 20;
  
  // Build filters for API
  const filters: PaymentFilters = {
    page: currentPage,
    limit: paymentsPerPage,
    ...(searchQuery && { search: searchQuery }),
    ...(statusFilter && { status: statusFilter as any }),
    ...(monthFilter && { month: monthFilter })
  };

  // Fetch payments data
  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => apiService.getPayments(filters),
    staleTime: 30000, // 30 seconds
  });

  // Fetch payment summary
  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary', monthFilter],
    queryFn: () => apiService.getPaymentSummary(monthFilter || undefined),
    staleTime: 60000, // 1 minute
  });

  // Fetch students for payment modal
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiService.getStudents(1, 1000),
    staleTime: 300000, // 5 minutes
  });

  const payments = paymentsData?.payments || [];
  const pagination = paymentsData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const summary: PaymentSummary = paymentSummary || {
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paymentCount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0
  };
  const students = studentsData?.students || [];

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => apiService.deletePayment(paymentId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment deleted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-summary'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete payment"
      });
    }
  });

  const getSubjectNames = (subjects: any[]) => {
    if (!subjects || subjects.length === 0) return 'No subjects';
    return subjects.map(s => s.subjectName || 'Unknown').join(', ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-status-warning" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-status-error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-status-success bg-status-success/10';
      case 'pending':
        return 'text-status-warning bg-status-warning/10';
      case 'overdue':
        return 'text-status-error bg-status-error/10';
      default:
        return 'text-text-muted bg-surface-secondary';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      await queryClient.invalidateQueries({ queryKey: ['payment-summary'] });
      toast({
        title: "Refreshed",
        description: "Payment data has been refreshed."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh data"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      deletePaymentMutation.mutate(paymentId);
    }
  };

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsPaymentDetailModalOpen(true);
  };

  const handleOpenPaymentRecord = (student?: any) => {
    setSelectedStudentForPayment(student);
    setIsPaymentRecordModalOpen(true);
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPaymentForEdit(payment);
    setIsPaymentEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-hero text-text-primary mb-2">Payments</h1>
          <p className="text-body text-text-secondary">
            Track student payments, manage billing, and monitor revenue.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <ModernButton 
            variant="outline"
            icon={TrendingUp}
            iconPosition="left"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </ModernButton>
          <ModernButton 
            variant="outline"
            icon={RefreshCw}
            iconPosition="left"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={isRefreshing ? '[&_svg]:animate-spin' : ''}
          >
            Refresh
          </ModernButton>
          <ModernButton 
            variant="solid"
            icon={Plus}
            iconPosition="left"
            onClick={() => handleOpenPaymentRecord()}
          >
            Record Payment
          </ModernButton>
          <ModernButton 
            variant="outline"
            icon={Download}
            iconPosition="left"
          >
            Export CSV
          </ModernButton>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">TOTAL REVENUE</p>
                <p className="text-2xl font-bold text-text-primary">{summary.paidAmount.toLocaleString()} DH</p>
              </div>
              <TrendingUp className="w-8 h-8 text-status-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">PENDING</p>
                <p className="text-2xl font-bold text-status-warning">{summary.pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-status-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-micro text-text-muted mb-1">OVERDUE</p>
                <p className="text-2xl font-bold text-status-error">{summary.overdueCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-status-error" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="surface mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History ({pagination.total})</CardTitle>
            {isLoading && (
              <div className="flex items-center text-text-secondary">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Student</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Month</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Subjects</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Amount</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Status</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Payment Date</th>
                  <th className="text-left p-4 text-micro text-text-muted font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary">
                      <div className="flex flex-col items-center">
                        <CreditCard className="w-12 h-12 opacity-50 mb-3" />
                        <p className="text-lg mb-2">No payments found</p>
                        <p className="text-sm">Try adjusting your filters or record a new payment.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: any) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-text-primary">
                          {payment.student?.firstName} {payment.student?.lastName}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-caption text-text-secondary">
                          {new Date(payment.month + '-01').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-caption text-text-secondary max-w-48 truncate">
                          {getSubjectNames(payment.subjects)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-text-primary">
                            {Number(payment.amount).toLocaleString()} DH
                          </div>
                          {payment.paidAmount && payment.paidAmount < payment.amount && (
                            <div className="text-xs text-text-secondary">
                              Paid: {Number(payment.paidAmount).toLocaleString()} DH
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            payment.status === 'PAID' || payment.status === 'paid' ? 'default' : 
                            payment.status === 'PENDING' || payment.status === 'pending' ? 'secondary' :
                            payment.status === 'PARTIAL' || payment.status === 'partial' ? 'outline' :
                            'destructive'
                          }
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(payment.status.toLowerCase())}
                          <span className="capitalize">{payment.status.toLowerCase()}</span>
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-caption text-text-secondary">
                          {payment.paymentDate ? 
                            new Date(payment.paymentDate).toLocaleDateString() : 
                            'Not paid'
                          }
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <ModernButton
                            variant="outline"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleViewPayment(payment)}
                            title="View Details"
                          />
                          <ModernButton
                            variant="outline"
                            size="sm"
                            icon={Edit}
                            onClick={() => handleEditPayment(payment)}
                            title="Edit Payment"
                          />
                          <ModernButton
                            variant="outline"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeletePayment(payment.id)}
                            title="Delete Payment"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="text-caption text-text-secondary">
                Showing {(currentPage - 1) * paymentsPerPage + 1} to {Math.min(currentPage * paymentsPerPage, pagination.total)} of {pagination.total} payments
              </div>
              <div className="flex items-center space-x-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || isLoading}
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
                      disabled={isLoading}
                    >
                      {pageNum}
                    </ModernButton>
                  );
                })}
                
                <ModernButton
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages || isLoading}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </ModernButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Record Modal */}
      <PaymentRecordModal
        isOpen={isPaymentRecordModalOpen}
        onClose={() => {
          setIsPaymentRecordModalOpen(false);
          setSelectedStudentForPayment(null);
        }}
        student={selectedStudentForPayment}
        onPaymentRecorded={() => {
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['payment-summary'] });
        }}
      />

      {/* Payment Detail Modal */}
      <Dialog open={isPaymentDetailModalOpen} onOpenChange={setIsPaymentDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-text-primary mb-3">Student Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-text-secondary">Name:</span>
                      <p className="font-medium">{selectedPayment.student?.firstName} {selectedPayment.student?.lastName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-text-secondary">Month:</span>
                      <p className="font-medium">
                        {new Date(selectedPayment.month + '-01').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-text-primary mb-3">Payment Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-text-secondary">Status:</span>
                      <div className="mt-1">
                        <Badge 
                          variant={
                            selectedPayment.status === 'PAID' || selectedPayment.status === 'paid' ? 'default' : 
                            selectedPayment.status === 'PENDING' || selectedPayment.status === 'pending' ? 'secondary' :
                            selectedPayment.status === 'PARTIAL' || selectedPayment.status === 'partial' ? 'outline' :
                            'destructive'
                          }
                        >
                          {selectedPayment.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-text-secondary">Amount:</span>
                      <p className="font-medium text-lg">{Number(selectedPayment.amount).toLocaleString()} DH</p>
                    </div>
                    {selectedPayment.paidAmount && (
                      <div>
                        <span className="text-sm text-text-secondary">Paid Amount:</span>
                        <p className="font-medium text-primary">{Number(selectedPayment.paidAmount).toLocaleString()} DH</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-text-primary mb-3">Subjects</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedPayment.subjects?.map((subject: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-surface rounded-lg">
                      <span>{subject.subjectName || 'Unknown Subject'}</span>
                      <span className="font-medium">{Number(subject.amount || 0).toLocaleString()} DH</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedPayment.note && (
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Notes</h4>
                  <p className="text-text-secondary bg-surface p-3 rounded-lg">{selectedPayment.note}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-text-secondary pt-4 border-t border-border">
                <div>
                  Recorded: {new Date(selectedPayment.createdAt).toLocaleString()}
                </div>
                {selectedPayment.paymentDate && (
                  <div>
                    Payment Date: {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Edit Modal */}
      <PaymentEditModal
        isOpen={isPaymentEditModalOpen}
        onClose={() => {
          setIsPaymentEditModalOpen(false);
          setSelectedPaymentForEdit(null);
        }}
        payment={selectedPaymentForEdit}
      />
    </div>
  );
};