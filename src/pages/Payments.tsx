import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiService, type PaymentFilters } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Download
} from 'lucide-react';

export const Payments: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  const payments = paymentsData?.payments || [];
  const pagination = paymentsData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="p-6 lg:p-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payments Database</h1>
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
              icon={Download}
            >
              Export CSV
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
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Filters */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                      Error loading payments. Please try again.
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-600">
                              {payment.student?.firstName?.charAt(0) || 'S'}{payment.student?.lastName?.charAt(0) || 'T'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.student?.firstName} {payment.student?.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.month + '-01').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-48 truncate">
                          {getSubjectNames(payment.subjects)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {Number(payment.amount).toLocaleString()} DH
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
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
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.paymentDate ? 
                            new Date(payment.paymentDate).toLocaleDateString() : 
                            'Not paid'
                          }
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
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * paymentsPerPage) + 1} to {Math.min(currentPage * paymentsPerPage, pagination.total)} of {pagination.total} results
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

  );
};