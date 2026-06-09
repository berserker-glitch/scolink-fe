import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, type PaymentFilters } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  X
} from 'lucide-react';

export const Payments: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 20;

  // Make Payment modal state
  const [isMakePaymentOpen, setIsMakePaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    month: new Date().toISOString().slice(0, 7),
    amount: '',
    method: 'cash' as 'cash' | 'transfer' | 'check' | 'other',
    note: ''
  });
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const filters: PaymentFilters = {
    page: currentPage,
    limit: paymentsPerPage,
    ...(searchQuery && { search: searchQuery }),
    ...(statusFilter && { status: statusFilter as any }),
    ...(monthFilter && { month: monthFilter })
  };

  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => apiService.getPayments(filters),
    staleTime: 30000,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['payments-summary', monthFilter],
    queryFn: () => apiService.getPaymentSummary(monthFilter || undefined),
    staleTime: 60000,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-search', studentSearchQuery],
    queryFn: () => apiService.getStudents(1, 20, studentSearchQuery || undefined),
    enabled: isMakePaymentOpen,
    staleTime: 30000,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => apiService.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-summary'] });
      toast({ title: 'Success', description: 'Payment recorded successfully' });
      setIsMakePaymentOpen(false);
      setPaymentForm({ studentId: '', month: new Date().toISOString().slice(0, 7), amount: '', method: 'cash', note: '' });
      setStudentSearchQuery('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to record payment', variant: 'destructive' });
    }
  });

  const payments = paymentsData?.payments || [];
  const pagination = paymentsData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const summary = summaryData;

  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast({ title: 'No data', description: 'No payments to export', variant: 'destructive' });
      return;
    }

    const headers = ['Student', 'Month', 'Subjects', 'Amount', 'Status', 'Payment Date'];
    const rows = payments.map((p: any) => [
      `${p.student?.firstName || ''} ${p.student?.lastName || ''}`.trim(),
      p.month,
      (p.subjects || []).map((s: any) => s.subjectName || 'Unknown').join('; '),
      p.amount,
      p.status,
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments_${monthFilter || new Date().toISOString().slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRecordPayment = () => {
    if (!paymentForm.studentId || !paymentForm.month || !paymentForm.amount) {
      toast({ title: 'Error', description: 'Student, month, and amount are required', variant: 'destructive' });
      return;
    }
    recordPaymentMutation.mutate({
      studentId: paymentForm.studentId,
      month: paymentForm.month,
      subjectIds: [],
      paidAmount: parseFloat(paymentForm.amount),
      paymentDate: new Date().toISOString().split('T')[0],
      method: paymentForm.method,
      note: paymentForm.note || undefined
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'pending': return <Clock className="w-4 h-4 text-status-warning" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-status-error" />;
      default: return null;
    }
  };

  const selectedStudent = studentsData?.students?.find(s => s.id === paymentForm.studentId);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Payments</h1>
            <p className="text-sm text-text-secondary">
              {pagination.total} records • {monthFilter ? new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'All months'}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <ModernButton variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
              Export CSV
            </ModernButton>
            <ModernButton variant="solid" size="sm" icon={Plus} onClick={() => setIsMakePaymentOpen(true)}>
              Make Payment
            </ModernButton>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-surface border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Paid</p>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{summary?.paidCount ?? '—'}</p>
              <p className="text-xs text-text-muted mt-1">{summary ? Number(summary.paidAmount).toLocaleString() + ' DH' : 'Loading...'}</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Pending</p>
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{summary?.pendingCount ?? '—'}</p>
              <p className="text-xs text-text-muted mt-1">{summary ? Number(summary.pendingAmount).toLocaleString() + ' DH' : 'Loading...'}</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Overdue</p>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{summary?.overdueCount ?? '—'}</p>
              <p className="text-xs text-text-muted mt-1">{summary ? Number(summary.overdueAmount).toLocaleString() + ' DH' : 'Loading...'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-purple-100 uppercase tracking-wide">Total Revenue</p>
                <TrendingUp className="w-4 h-4 text-purple-200" />
              </div>
              <p className="text-2xl font-bold">{summary ? Number(summary.paidAmount).toLocaleString() : '—'}</p>
              <p className="text-xs text-purple-200 mt-1">DH collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="bg-surface rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-background text-text-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {(searchQuery || statusFilter || monthFilter) && (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter(''); setMonthFilter(''); setCurrentPage(1); }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Subjects</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Loading payments...</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-red-500">Error loading payments. Please try again.</td></tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <CreditCard className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
                      <p className="text-text-muted">No payments found</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-background transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-surface-secondary rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-xs font-medium text-text-secondary">
                              {payment.student?.firstName?.charAt(0) || 'S'}{payment.student?.lastName?.charAt(0) || ''}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-text-primary">
                            {payment.student?.firstName} {payment.student?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary">
                        {new Date(payment.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-text-primary max-w-48 truncate block">
                          {(payment.subjects || []).map((s: any) => s.subjectName || 'Unknown').join(', ') || 'No subjects'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        {Number(payment.amount).toLocaleString()} DH
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            payment.status?.toLowerCase() === 'paid' ? 'default' :
                            payment.status?.toLowerCase() === 'pending' ? 'secondary' :
                            payment.status?.toLowerCase() === 'partial' ? 'outline' : 'destructive'
                          }
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(payment.status)}
                          <span className="capitalize">{payment.status?.toLowerCase()}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-background border-t border-border flex items-center justify-between">
              <span className="text-sm text-text-primary">
                {((currentPage - 1) * paymentsPerPage) + 1}–{Math.min(currentPage * paymentsPerPage, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center space-x-2">
                <ModernButton variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</ModernButton>
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const p = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (p > pagination.totalPages) return null;
                  return (
                    <ModernButton key={p} variant={currentPage === p ? 'solid' : 'outline'} size="sm" onClick={() => setCurrentPage(p)}>{p}</ModernButton>
                  );
                })}
                <ModernButton variant="outline" size="sm" disabled={currentPage === pagination.totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</ModernButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Make Payment Modal */}
      <Modal isOpen={isMakePaymentOpen} onClose={() => { setIsMakePaymentOpen(false); setStudentSearchQuery(''); }} title="Record Payment" size="md">
        <div className="p-6 space-y-5">
          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Student <span className="text-red-500">*</span></label>
            {selectedStudent ? (
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-text-primary">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p className="text-xs text-text-secondary">{selectedStudent.yearName} • {selectedStudent.fieldName}</p>
                </div>
                <button onClick={() => setPaymentForm(p => ({ ...p, studentId: '' }))} className="p-1 hover:bg-purple-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search student by name..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {studentSearchQuery && studentsData?.students && studentsData.students.length > 0 && (
                  <div className="mt-1 border border-border rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                    {studentsData.students.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setPaymentForm(p => ({ ...p, studentId: s.id })); setStudentSearchQuery(''); }}
                        className="w-full px-3 py-2.5 text-left hover:bg-surface-secondary transition-colors border-b border-border last:border-0"
                      >
                        <p className="text-sm font-medium text-text-primary">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-text-secondary">{s.yearName} • {s.fieldName}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Month <span className="text-red-500">*</span></label>
            <input
              type="month"
              value={paymentForm.month}
              onChange={(e) => setPaymentForm(p => ({ ...p, month: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Amount (DH) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Payment Method</label>
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm(p => ({ ...p, method: e.target.value as any }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Note</label>
            <textarea
              value={paymentForm.note}
              onChange={(e) => setPaymentForm(p => ({ ...p, note: e.target.value }))}
              placeholder="Optional note..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <ModernButton variant="outline" className="flex-1" onClick={() => setIsMakePaymentOpen(false)}>Cancel</ModernButton>
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={handleRecordPayment}
              disabled={recordPaymentMutation.isPending}
            >
              {recordPaymentMutation.isPending ? 'Saving...' : 'Record Payment'}
            </ModernButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
