import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Calendar,
  X,
  Settings,
  Filter
} from 'lucide-react';

interface PaymentNotificationsProps {
  onNotificationClick?: (notification: any) => void;
  showSettings?: boolean;
}

interface NotificationItem {
  id: string;
  type: 'overdue' | 'due_soon' | 'partial_payment' | 'payment_reminder';
  title: string;
  message: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  month: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: string;
}

export const PaymentNotifications: React.FC<PaymentNotificationsProps> = ({
  onNotificationClick,
  showSettings = true
}) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'overdue'>('all');
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  // Fetch payment summary and overdue payments
  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => apiService.getPaymentSummary(),
    staleTime: 60000,
  });

  const { data: overduePayments } = useQuery({
    queryKey: ['overdue-payments'],
    queryFn: () => apiService.getPayments({ 
      status: 'overdue',
      limit: 50
    }),
    staleTime: 60000,
  });

  const { data: dueSoonPayments } = useQuery({
    queryKey: ['due-soon-payments'],
    queryFn: () => {
      // Get payments due in next 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const currentMonth = `${threeDaysFromNow.getFullYear()}-${String(threeDaysFromNow.getMonth() + 1).padStart(2, '0')}`;
      
      return apiService.getPayments({ 
        status: 'pending',
        month: currentMonth,
        limit: 50
      });
    },
    staleTime: 60000,
  });

  const { data: partialPayments } = useQuery({
    queryKey: ['partial-payments'],
    queryFn: () => apiService.getPayments({ 
      status: 'partial',
      limit: 50
    }),
    staleTime: 60000,
  });

  // Generate notifications from payment data
  const generateNotifications = (): NotificationItem[] => {
    const notifications: NotificationItem[] = [];
    const now = new Date();

    // Overdue payment notifications
    if (overduePayments?.payments) {
      overduePayments.payments.forEach((payment: any) => {
        notifications.push({
          id: `overdue-${payment.id}`,
          type: 'overdue',
          title: 'Overdue Payment',
          message: `${payment.student?.firstName} ${payment.student?.lastName} has an overdue payment of ${Number(payment.amount).toLocaleString()} DH`,
          studentId: payment.studentId,
          studentName: `${payment.student?.firstName} ${payment.student?.lastName}`,
          amount: Number(payment.amount),
          dueDate: payment.dueDate,
          month: payment.month,
          priority: 'high',
          isRead: false,
          createdAt: now.toISOString()
        });
      });
    }

    // Due soon notifications (payments due in next 3 days)
    if (dueSoonPayments?.payments) {
      dueSoonPayments.payments.forEach((payment: any) => {
        const dueDate = new Date(payment.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          notifications.push({
            id: `due-soon-${payment.id}`,
            type: 'due_soon',
            title: 'Payment Due Soon',
            message: `${payment.student?.firstName} ${payment.student?.lastName} has a payment of ${Number(payment.amount).toLocaleString()} DH due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
            studentId: payment.studentId,
            studentName: `${payment.student?.firstName} ${payment.student?.lastName}`,
            amount: Number(payment.amount),
            dueDate: payment.dueDate,
            month: payment.month,
            priority: daysUntilDue === 0 ? 'high' : 'medium',
            isRead: false,
            createdAt: now.toISOString()
          });
        }
      });
    }

    // Partial payment notifications
    if (partialPayments?.payments) {
      partialPayments.payments.forEach((payment: any) => {
        const remaining = Number(payment.amount) - Number(payment.paidAmount || 0);
        notifications.push({
          id: `partial-${payment.id}`,
          type: 'partial_payment',
          title: 'Partial Payment',
          message: `${payment.student?.firstName} ${payment.student?.lastName} has a remaining balance of ${remaining.toLocaleString()} DH`,
          studentId: payment.studentId,
          studentName: `${payment.student?.firstName} ${payment.student?.lastName}`,
          amount: remaining,
          dueDate: payment.dueDate,
          month: payment.month,
          priority: 'medium',
          isRead: false,
          createdAt: now.toISOString()
        });
      });
    }

    // Sort by priority and creation date
    return notifications
      .filter(n => !dismissedNotifications.includes(n.id))
      .sort((a, b) => {
        // Priority order: high, medium, low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  };

  const notifications = generateNotifications();

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'overdue':
        return notification.type === 'overdue';
      default:
        return true;
    }
  });

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className={`w-5 h-5 ${priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />;
      case 'due_soon':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'partial_payment':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleDismissNotification = (notificationId: string) => {
    setDismissedNotifications(prev => [...prev, notificationId]);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const summary = {
    total: notifications.length,
    overdue: notifications.filter(n => n.type === 'overdue').length,
    dueSoon: notifications.filter(n => n.type === 'due_soon').length,
    partial: notifications.filter(n => n.type === 'partial_payment').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold text-text-primary">Payment Notifications</h3>
          {summary.total > 0 && (
            <Badge variant="destructive" className="ml-2">
              {summary.total}
            </Badge>
          )}
        </div>
        
        {showSettings && (
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 border border-border rounded-lg bg-background text-text-primary text-sm"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Overdue</p>
                <p className="text-xl font-bold text-red-600">{summary.overdue}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Due Soon</p>
                <p className="text-xl font-bold text-yellow-600">{summary.dueSoon}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Partial</p>
                <p className="text-xl font-bold text-blue-600">{summary.partial}</p>
              </div>
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total</p>
                <p className="text-xl font-bold text-text-primary">{summary.total}</p>
              </div>
              <Bell className="w-6 h-6 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Recent Notifications ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <Bell className="w-12 h-12 opacity-50 mb-3 mx-auto" />
              <p className="text-lg mb-2">No notifications</p>
              <p className="text-sm">All payments are up to date!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 hover:bg-surface-hover transition-colors cursor-pointer ${getPriorityColor(notification.priority)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-text-primary">{notification.title}</h4>
                          <Badge 
                            variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-text-secondary mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(notification.month + '-01').toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{notification.amount.toLocaleString()} DH</span>
                          </div>
                          <div>
                            Due: {new Date(notification.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <ModernButton
                      variant="outline"
                      size="sm"
                      icon={X}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissNotification(notification.id);
                      }}
                      className="ml-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
