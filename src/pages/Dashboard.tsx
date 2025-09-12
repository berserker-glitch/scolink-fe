import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { getAnalytics } from '@/data/mockData';
import { 
  Users, 
  UserPlus, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Clock,
  Plus,
  FileText,
  CalendarDays,
  CheckCircle2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const analytics = getAnalytics();
  const currentDate = new Date();
  const timeString = currentDate.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const dateString = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const analyticsCards = [
    {
      title: 'Total Students',
      value: analytics.totalStudents,
      icon: Users,
      description: 'Currently enrolled'
    },
    {
      title: 'New This Month',
      value: analytics.newStudentsThisMonth,
      icon: UserPlus,
      description: 'Student registrations'
    },
    {
      title: 'Monthly Revenue',
      value: `${analytics.monthlyRevenue.toLocaleString()} DH`,
      icon: CreditCard,
      description: 'Payments received'
    },
    {
      title: 'Today\'s Groups',
      value: analytics.groupsToday,
      icon: Calendar,
      description: 'Scheduled sessions'
    },
    {
      title: 'Attendance Rate',
      value: `${analytics.attendanceRate}%`,
      icon: TrendingUp,
      description: 'Today\'s attendance'
    }
  ];

  const quickActions = [
    {
      label: 'Add Student',
      icon: Plus,
      variant: 'primary' as const,
      onClick: () => navigate('/students')
    },
    {
      label: 'View Schedule',
      icon: CalendarDays,
      variant: 'outline' as const,
      onClick: () => navigate('/schedule')
    },
    {
      label: 'Attendance List',
      icon: CheckCircle2,
      variant: 'outline' as const,
      onClick: () => navigate('/schedule')
    },
    {
      label: 'Generate Report',
      icon: FileText,
      variant: 'outline' as const,
      onClick: () => navigate('/payments')
    }
  ];

  const recentActivities = [
    'New student Ahmed Benali registered for Mathematics',
    'Payment received from Fatima Alaoui - 650 DH',
    'Attendance marked for Physics Lab A - 18/20 present',
    'New teacher Sara Berrada added to French Department',
    'Science Fair 2024 event created - 50 students enrolled',
    'Monthly report generated for February 2024',
    'Group capacity increased for Advanced Math A'
  ];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-hero text-text-primary mb-2">Dashboard</h1>
            <p className="text-body text-text-secondary">
              Welcome back! Here's what's happening at your educational center today.
            </p>
          </div>
          
          {/* Live Clock */}
          <div className="mt-4 lg:mt-0 text-right">
            <div className="text-2xl font-bold text-text-primary font-mono">{timeString}</div>
            <div className="text-caption text-text-secondary">{dateString}</div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {analyticsCards.map((card, index) => (
          <Card key={index} className="surface">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-micro text-text-muted mb-2">{card.title}</p>
                  <p className="text-2xl font-bold text-text-primary">{card.value}</p>
                  <p className="text-caption text-text-secondary mt-1">{card.description}</p>
                </div>
                <div className="p-3 bg-surface-secondary rounded-lg">
                  <card.icon className="w-6 h-6 text-interactive" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="surface mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {quickActions.map((action, index) => (
              <BrutalistButton
                key={index}
                variant={action.variant}
                className="flex items-center space-x-2"
                onClick={action.onClick}
              >
                <action.icon className="w-4 h-4" />
                <span>{action.label}</span>
              </BrutalistButton>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="surface h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <div className="w-2 h-2 bg-interactive rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-body text-text-secondary">{activity}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Summary */}
        <div className="space-y-6">
          <Card className="surface">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Today's Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-body text-text-secondary">Groups Scheduled</span>
                <span className="text-subheading font-semibold text-text-primary">
                  {analytics.groupsToday}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body text-text-secondary">Students Present</span>
                <span className="text-subheading font-semibold text-text-primary">
                  {analytics.attendanceRate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body text-text-secondary">Payments Today</span>
                <span className="text-subheading font-semibold text-text-primary">
                  {analytics.newPaymentsThisMonth}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="surface">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-body text-text-secondary">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-status-success rounded-full"></div>
                  <span className="text-caption text-status-success font-medium">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body text-text-secondary">Last Backup</span>
                <span className="text-caption text-text-secondary">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body text-text-secondary">Active Users</span>
                <span className="text-caption text-text-primary font-medium">3</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};