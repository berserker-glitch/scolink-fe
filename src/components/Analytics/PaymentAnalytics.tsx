import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService, type PaymentSummary } from '@/services/api';

interface PaymentAnalyticsProps {
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
}

export const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({
  selectedMonth,
  onMonthChange
}) => {
  const [timeRange, setTimeRange] = useState<'current' | 'last3' | 'last6' | 'year'>('current');
  
  // Generate month options for the current year
  const generateMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthLabel });
    }
    return months;
  };

  const months = generateMonthOptions();
  
  // Fetch payment summary for selected period
  const { data: paymentSummary, isLoading } = useQuery({
    queryKey: ['payment-analytics', selectedMonth],
    queryFn: () => apiService.getPaymentSummary(selectedMonth),
    staleTime: 60000, // 1 minute
  });

  // Fetch comparison data (previous month/period)
  const getPreviousMonth = () => {
    if (!selectedMonth) return undefined;
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 2, 1); // -2 because month is 1-indexed
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const { data: previousSummary } = useQuery({
    queryKey: ['payment-analytics-previous', selectedMonth],
    queryFn: () => apiService.getPaymentSummary(getPreviousMonth()),
    enabled: !!selectedMonth,
    staleTime: 60000,
  });

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

  // Calculate metrics
  const collectionRate = summary.totalAmount > 0 ? 
    Math.round((summary.paidAmount / summary.totalAmount) * 100) : 0;
  
  const averagePayment = summary.paidCount > 0 ? 
    Math.round(summary.paidAmount / summary.paidCount) : 0;

  // Calculate growth/change from previous period
  const getGrowthMetrics = () => {
    if (!previousSummary) return null;
    
    const revenueGrowth = previousSummary.paidAmount > 0 ? 
      ((summary.paidAmount - previousSummary.paidAmount) / previousSummary.paidAmount) * 100 : 0;
    
    const studentGrowth = previousSummary.paidCount > 0 ? 
      ((summary.paidCount - previousSummary.paidCount) / previousSummary.paidCount) * 100 : 0;
    
    return {
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      studentGrowth: Math.round(studentGrowth * 10) / 10
    };
  };

  const growthMetrics = getGrowthMetrics();

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    trendLabel?: string;
    color?: 'default' | 'success' | 'warning' | 'error';
  }> = ({ title, value, icon, trend, trendLabel, color = 'default' }) => {
    const colorClasses = {
      default: 'text-text-primary',
      success: 'text-status-success',
      warning: 'text-status-warning',
      error: 'text-status-error'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-micro text-text-muted mb-2">{title}</p>
              <p className={`text-2xl font-bold ${colorClasses[color]}`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend !== undefined && (
                <div className="flex items-center mt-2">
                  {trend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-status-success mr-1" />
                  ) : trend < 0 ? (
                    <TrendingDown className="w-4 h-4 text-status-error mr-1" />
                  ) : (
                    <Activity className="w-4 h-4 text-text-muted mr-1" />
                  )}
                  <span className={`text-sm ${
                    trend > 0 ? 'text-status-success' : 
                    trend < 0 ? 'text-status-error' : 
                    'text-text-muted'
                  }`}>
                    {trend > 0 ? '+' : ''}{trend}% {trendLabel}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg bg-surface ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-surface rounded mb-4"></div>
                <div className="h-8 bg-surface rounded mb-2"></div>
                <div className="h-4 bg-surface rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-text-primary">Payment Analytics</h3>
          {selectedMonth && (
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange?.(e.target.value)}
              className="px-3 py-1 border border-border rounded-lg bg-background text-text-primary text-sm"
            >
              <option value="">All Time</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <BrutalistButton variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </BrutalistButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`${summary.paidAmount.toLocaleString()} DH`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={growthMetrics?.revenueGrowth}
          trendLabel="vs last month"
          color="success"
        />
        
        <MetricCard
          title="Students Paid"
          value={summary.paidCount}
          icon={<Users className="w-6 h-6" />}
          trend={growthMetrics?.studentGrowth}
          trendLabel="vs last month"
          color="default"
        />
        
        <MetricCard
          title="Collection Rate"
          value={`${collectionRate}%`}
          icon={<BarChart3 className="w-6 h-6" />}
          color={collectionRate >= 80 ? 'success' : collectionRate >= 60 ? 'warning' : 'error'}
        />
        
        <MetricCard
          title="Average Payment"
          value={`${averagePayment} DH`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="default"
        />
      </div>

      {/* Payment Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Payment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{summary.paidCount}</div>
                <div className="text-sm text-green-600">Paid</div>
                <div className="text-xs text-text-muted">
                  {summary.paymentCount > 0 ? Math.round((summary.paidCount / summary.paymentCount) * 100) : 0}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{summary.pendingCount}</div>
                <div className="text-sm text-yellow-600">Pending</div>
                <div className="text-xs text-text-muted">
                  {summary.paymentCount > 0 ? Math.round((summary.pendingCount / summary.paymentCount) * 100) : 0}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{summary.overdueCount}</div>
                <div className="text-sm text-red-600">Overdue</div>
                <div className="text-xs text-text-muted">
                  {summary.paymentCount > 0 ? Math.round((summary.overdueCount / summary.paymentCount) * 100) : 0}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{summary.paymentCount}</div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-xs text-text-muted">
                  100%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
                <span className="text-text-secondary">Expected Revenue</span>
                <span className="font-medium text-text-primary">
                  {summary.totalAmount.toLocaleString()} DH
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Collected</span>
                <span className="font-medium text-green-800">
                  {summary.paidAmount.toLocaleString()} DH
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700">Pending</span>
                <span className="font-medium text-yellow-800">
                  {summary.pendingAmount.toLocaleString()} DH
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">Overdue</span>
                <span className="font-medium text-red-800">
                  {summary.overdueAmount.toLocaleString()} DH
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Collection Rate</span>
                <Badge 
                  variant={collectionRate >= 80 ? 'default' : collectionRate >= 60 ? 'secondary' : 'destructive'}
                  className="text-lg px-3 py-1"
                >
                  {collectionRate}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      {growthMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Month-over-Month Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-surface rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {growthMetrics.revenueGrowth > 0 ? (
                    <TrendingUp className="w-8 h-8 text-status-success" />
                  ) : growthMetrics.revenueGrowth < 0 ? (
                    <TrendingDown className="w-8 h-8 text-status-error" />
                  ) : (
                    <Activity className="w-8 h-8 text-text-muted" />
                  )}
                </div>
                <div className={`text-3xl font-bold ${
                  growthMetrics.revenueGrowth > 0 ? 'text-status-success' : 
                  growthMetrics.revenueGrowth < 0 ? 'text-status-error' : 
                  'text-text-muted'
                }`}>
                  {growthMetrics.revenueGrowth > 0 ? '+' : ''}{growthMetrics.revenueGrowth}%
                </div>
                <div className="text-text-secondary">Revenue Growth</div>
              </div>
              
              <div className="text-center p-6 bg-surface rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {growthMetrics.studentGrowth > 0 ? (
                    <TrendingUp className="w-8 h-8 text-status-success" />
                  ) : growthMetrics.studentGrowth < 0 ? (
                    <TrendingDown className="w-8 h-8 text-status-error" />
                  ) : (
                    <Activity className="w-8 h-8 text-text-muted" />
                  )}
                </div>
                <div className={`text-3xl font-bold ${
                  growthMetrics.studentGrowth > 0 ? 'text-status-success' : 
                  growthMetrics.studentGrowth < 0 ? 'text-status-error' : 
                  'text-text-muted'
                }`}>
                  {growthMetrics.studentGrowth > 0 ? '+' : ''}{growthMetrics.studentGrowth}%
                </div>
                <div className="text-text-secondary">Student Growth</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
