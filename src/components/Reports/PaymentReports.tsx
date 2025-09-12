
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiService, type PaymentFilters } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  Printer,
  Mail
} from 'lucide-react';

interface PaymentReportsProps {
  onExport?: (reportType: string, data: any) => void;
}

export const PaymentReports: React.FC<PaymentReportsProps> = ({
  onExport
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'current_month' | 'last_month' | 'current_year' | 'custom'>('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedReport, setSelectedReport] = useState<string>('summary');

  // Generate date ranges
  const getDateRange = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'current_month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          start: lastMonth,
          end: new Date(now.getFullYear(), now.getMonth(), 0),
          label: lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
      case 'current_year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
          label: now.getFullYear().toString()
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : new Date(),
          end: customEndDate ? new Date(customEndDate) : new Date(),
          label: `${customStartDate} to ${customEndDate}`
        };
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          label: 'Current Month'
        };
    }
  };

  const dateRange = getDateRange();

  // Fetch payment data for reports
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payment-reports', selectedPeriod, customStartDate, customEndDate],
    queryFn: async () => {
      const filters: PaymentFilters = {
        limit: 1000 // Get all payments for reporting
      };

      // Add date filtering logic here when backend supports it
      // For now, we'll get all payments and filter client-side
      
      const [payments, summary] = await Promise.all([
        apiService.getPayments(filters),
        apiService.getPaymentSummary()
      ]);

      return {
        payments: payments.payments || [],
        summary: summary || {
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          paymentCount: 0,
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0
        }
      };
    },
    staleTime: 60000,
  });

  const payments = paymentsData?.payments || [];
  const summary = paymentsData?.summary || {
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paymentCount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0
  };

  // Generate report data
  const reportData = useMemo(() => {
    // Filter payments by date range
    const filteredPayments = payments.filter((payment: any) => {
      const paymentDate = new Date(payment.createdAt);
      return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
    });

    // Calculate metrics
    const metrics = {
      totalRevenue: filteredPayments.reduce((sum: number, p: any) => sum + Number(p.paidAmount || 0), 0),
      expectedRevenue: filteredPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      totalPayments: filteredPayments.length,
      paidPayments: filteredPayments.filter((p: any) => p.status === 'paid' || p.status === 'PAID').length,
      partialPayments: filteredPayments.filter((p: any) => p.status === 'partial' || p.status === 'PARTIAL').length,
      overduePayments: filteredPayments.filter((p: any) => p.status === 'overdue' || p.status === 'OVERDUE').length,
      pendingPayments: filteredPayments.filter((p: any) => p.status === 'pending' || p.status === 'PENDING').length,
      averagePayment: filteredPayments.length > 0 ? filteredPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0) / filteredPayments.length : 0,
      collectionRate: 0
    };

    metrics.collectionRate = metrics.expectedRevenue > 0 ? (metrics.totalRevenue / metrics.expectedRevenue) * 100 : 0;

    // Group by month for trends
    const monthlyData = filteredPayments.reduce((acc: any, payment: any) => {
      const month = payment.month;
      if (!acc[month]) {
        acc[month] = {
          month,
          totalAmount: 0,
          paidAmount: 0,
          paymentCount: 0,
          paidCount: 0
        };
      }
      
      acc[month].totalAmount += Number(payment.amount);
      acc[month].paidAmount += Number(payment.paidAmount || 0);
      acc[month].paymentCount += 1;
      if (payment.status === 'paid' || payment.status === 'PAID') {
        acc[month].paidCount += 1;
      }
      
      return acc;
    }, {});

    // Group by status
    const statusBreakdown = {
      paid: filteredPayments.filter((p: any) => p.status === 'paid' || p.status === 'PAID'),
      partial: filteredPayments.filter((p: any) => p.status === 'partial' || p.status === 'PARTIAL'),
      pending: filteredPayments.filter((p: any) => p.status === 'pending' || p.status === 'PENDING'),
      overdue: filteredPayments.filter((p: any) => p.status === 'overdue' || p.status === 'OVERDUE')
    };

    // Group by payment method
    const methodBreakdown = filteredPayments.reduce((acc: any, payment: any) => {
      const method = payment.method || 'unspecified';
      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          amount: 0
        };
      }
      acc[method].count += 1;
      acc[method].amount += Number(payment.paidAmount || 0);
      return acc;
    }, {});

    return {
      payments: filteredPayments,
      metrics,
      monthlyData: Object.values(monthlyData),
      statusBreakdown,
      methodBreakdown: Object.values(methodBreakdown)
    };
  }, [payments, dateRange]);

  // Export functions
  const exportToCSV = (reportType: string) => {
    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'payments':
        csvContent = generatePaymentsCSV();
        filename = `payments_${dateRange.label.replace(/\s+/g, '_')}.csv`;
        break;
      case 'summary':
        csvContent = generateSummaryCSV();
        filename = `payment_summary_${dateRange.label.replace(/\s+/g, '_')}.csv`;
        break;
      case 'monthly':
        csvContent = generateMonthlyCSV();
        filename = `monthly_report_${dateRange.label.replace(/\s+/g, '_')}.csv`;
        break;
      default:
        return;
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Complete",
      description: `${filename} has been downloaded.`
    });

    if (onExport) {
      onExport(reportType, reportData);
    }
  };

  const generatePaymentsCSV = () => {
    const headers = ['Student Name', 'Month', 'Amount', 'Paid Amount', 'Status', 'Method', 'Payment Date', 'Due Date'];
    const rows = reportData.payments.map((payment: any) => [
      `"${payment.student?.firstName || ''} ${payment.student?.lastName || ''}"`,
      payment.month,
      Number(payment.amount).toFixed(2),
      Number(payment.paidAmount || 0).toFixed(2),
      payment.status,
      payment.method || '',
      payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '',
      payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const generateSummaryCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Period', `"${dateRange.label}"`],
      ['Total Payments', reportData.metrics.totalPayments],
      ['Expected Revenue (DH)', reportData.metrics.expectedRevenue.toFixed(2)],
      ['Actual Revenue (DH)', reportData.metrics.totalRevenue.toFixed(2)],
      ['Collection Rate (%)', reportData.metrics.collectionRate.toFixed(2)],
      ['Paid Payments', reportData.metrics.paidPayments],
      ['Partial Payments', reportData.metrics.partialPayments],
      ['Pending Payments', reportData.metrics.pendingPayments],
      ['Overdue Payments', reportData.metrics.overduePayments],
      ['Average Payment (DH)', reportData.metrics.averagePayment.toFixed(2)]
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const generateMonthlyCSV = () => {
    const headers = ['Month', 'Total Amount', 'Paid Amount', 'Payment Count', 'Paid Count', 'Collection Rate'];
    const rows = (reportData.monthlyData as any[]).map((month: any) => [
      month.month,
      month.totalAmount.toFixed(2),
      month.paidAmount.toFixed(2),
      month.paymentCount,
      month.paidCount,
      month.totalAmount > 0 ? ((month.paidAmount / month.totalAmount) * 100).toFixed(2) + '%' : '0%'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const printReport = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-surface rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-surface rounded"></div>
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
          <h3 className="text-xl font-semibold text-text-primary mb-2">Payment Reports</h3>
          <p className="text-text-secondary">
            Generate and export detailed payment reports for analysis
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <BrutalistButton variant="outline" onClick={printReport}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </BrutalistButton>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Time Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
              >
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="current_year">Current Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Report Type
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
              >
                <option value="summary">Summary Report</option>
                <option value="payments">Detailed Payments</option>
                <option value="monthly">Monthly Breakdown</option>
                <option value="status">Status Analysis</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <span className="text-sm text-text-secondary">
              Report Period: {dateRange.label} | {reportData.payments.length} payments
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.metrics.totalRevenue.toLocaleString()} DH
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Collection Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reportData.metrics.collectionRate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Payments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {reportData.metrics.totalPayments}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Average Payment</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reportData.metrics.averagePayment.toLocaleString()} DH
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {reportData.statusBreakdown.paid.length}
              </div>
              <div className="text-sm text-green-600">Paid</div>
              <div className="text-xs text-text-muted">
                {reportData.metrics.totalPayments > 0 ? 
                  Math.round((reportData.statusBreakdown.paid.length / reportData.metrics.totalPayments) * 100) : 0}%
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {reportData.statusBreakdown.partial.length}
              </div>
              <div className="text-sm text-blue-600">Partial</div>
              <div className="text-xs text-text-muted">
                {reportData.metrics.totalPayments > 0 ? 
                  Math.round((reportData.statusBreakdown.partial.length / reportData.metrics.totalPayments) * 100) : 0}%
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {reportData.statusBreakdown.pending.length}
              </div>
              <div className="text-sm text-yellow-600">Pending</div>
              <div className="text-xs text-text-muted">
                {reportData.metrics.totalPayments > 0 ? 
                  Math.round((reportData.statusBreakdown.pending.length / reportData.metrics.totalPayments) * 100) : 0}%
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">
                {reportData.statusBreakdown.overdue.length}
              </div>
              <div className="text-sm text-red-600">Overdue</div>
              <div className="text-xs text-text-muted">
                {reportData.metrics.totalPayments > 0 ? 
                  Math.round((reportData.statusBreakdown.overdue.length / reportData.metrics.totalPayments) * 100) : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BrutalistButton
              variant="outline"
              onClick={() => exportToCSV('summary')}
              className="flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Summary CSV
            </BrutalistButton>

            <BrutalistButton
              variant="outline"
              onClick={() => exportToCSV('payments')}
              className="flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Payments CSV
            </BrutalistButton>

            <BrutalistButton
              variant="outline"
              onClick={() => exportToCSV('monthly')}
              className="flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Monthly CSV
            </BrutalistButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
