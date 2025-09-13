import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import {
  StatCard,
  PerformanceChart,
  KnowledgeCard,
  EventCalendar,
  FinanceCard,
  UpcomingEvents,
  ModernButton
} from '@/components/ui';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600 text-lg">
              Hi, Habib! Welcome to Edu-Center Dashboard
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <select className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>Change Periode</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
            <ModernButton 
              variant="solid" 
              icon={Plus}
              iconPosition="left"
              onClick={() => navigate('/students')}
            >
              New Admission
            </ModernButton>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={analytics.totalStudents}
          change="+8% than last month"
          changeType="positive"
          icon={Users}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Total Teachers"
          value={Math.floor(analytics.totalStudents / 12)}
          change="+3% than last month"
          changeType="positive"
          icon={UserCheck}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />

        <StatCard
          title="Events"
          value={Math.floor(analytics.groupsToday * 49)}
          change="+5% than last month"
          changeType="positive"
          icon={CalendarDays}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />

        <StatCard
          title="Invoice Status"
          value={Math.floor(analytics.totalStudents * 1.8)}
          change="+12% than last month"
          changeType="positive"
          icon={FileText}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <PerformanceChart
          studentsValue={analytics.attendanceRate}
          teachersValue={2}
          currentPeriod="January 2024"
        />

        <KnowledgeCard 
          onButtonClick={() => navigate('/events')}
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <EventCalendar />

        <FinanceCard 
          data={{
            income: analytics.monthlyRevenue,
            expense: Math.floor(analytics.monthlyRevenue * 0.6)
          }}
        />

        <UpcomingEvents 
          onNewEvent={() => navigate('/events')}
        />
      </div>
    </div>
  );
};