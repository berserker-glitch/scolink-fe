import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Settings, TrendingUp, Activity, Calendar, Plus } from 'lucide-react';
import { apiService, Center, User } from '@/services/api';
import { useNavigate } from 'react-router-dom';

export const SuperAdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalCenters: 0,
    totalUsers: 0,
    totalAdmins: 0,
    activeUsers: 0,
    planStats: {} as Record<string, number>,
  });
  const [recentCenters, setRecentCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading overview data...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      console.log('Auth token exists:', !!token);
      console.log('Auth token value:', token);
      
      if (!token) {
        console.error('No authentication token found! User needs to login first.');
        setLoading(false);
        return;
      }
      
      const [centersResponse, usersResponse] = await Promise.all([
        apiService.getCenters(1, 50), // Get all centers for stats
        apiService.getUsers(1, 50)    // Get all users for stats
      ]);
      
      console.log('Centers response:', centersResponse);
      console.log('Users response:', usersResponse);
      
      const centers = centersResponse?.centers || [];
      const users = usersResponse?.users || [];
      
      console.log('Parsed centers:', centers);
      console.log('Parsed users:', users);
      
      // Get recent 5 centers for display
      setRecentCenters(centers.slice(0, 5));
      
      // Calculate plan statistics
      const planStats = centers.reduce((acc, center) => {
        acc[center.plan] = (acc[center.plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setStats({
        totalCenters: centers.length,
        totalUsers: users.length,
        totalAdmins: users.filter(u => u.role === 'center_admin' || u.role === 'super_admin').length,
        activeUsers: users.filter(u => u.isActive).length,
        planStats,
      });
    } catch (error) {
      console.error('Error loading overview data:', error);
      // Set empty arrays on error
      setRecentCenters([]);
      setStats({
        totalCenters: 0,
        totalUsers: 0,
        totalAdmins: 0,
        activeUsers: 0,
        planStats: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, description, color }: {
    icon: any;
    title: string;
    value: string | number;
    description: string;
    color: string;
  }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'lifetime':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const isPlanExpired = (plan: string, planExpiresAt?: string) => {
    if (plan === 'basic' || plan === 'lifetime') return false;
    if (!planExpiresAt) return true;
    return new Date() > new Date(planExpiresAt);
  };

  const formatExpiryDate = (planExpiresAt?: string) => {
    if (!planExpiresAt) return null;
    return new Date(planExpiresAt).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Super Admin Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Manage and oversee all centers, users, and system operations from this central hub.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <ModernButton 
                onClick={() => navigate('/super-admin/management')}
                variant="solid"
                size="lg"
                icon={Plus}
                className="px-6 py-3 text-lg"
              >
                Create New Center
              </ModernButton>
              <ModernButton 
                variant="outline" 
                onClick={() => navigate('/super-admin/management')}
                icon={Settings}
                size="lg"
                className="px-6 py-3 text-lg"
              >
                Manage System
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Building2}
            title="Total Centers"
            value={loading ? '...' : stats.totalCenters}
            description="Active learning centers"
            color="bg-blue-500"
          />
          
          <StatCard
            icon={Users}
            title="Total Users"
            value={loading ? '...' : stats.totalUsers}
            description="All system users"
            color="bg-green-500"
          />
          
          <StatCard
            icon={Settings}
            title="Admin Users"
            value={loading ? '...' : stats.totalAdmins}
            description="Center & super admins"
            color="bg-purple-500"
          />
          
          <StatCard
            icon={Activity}
            title="Active Users"
            value={loading ? '...' : stats.activeUsers}
            description="Currently active"
            color="bg-orange-500"
          />
        </div>

        {/* Plan Distribution */}
        {Object.keys(stats.planStats).length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(stats.planStats).map(([plan, count]) => (
              <Card key={plan} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {formatPlanName(plan)} Plan
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(plan)}`}>
                    {formatPlanName(plan)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Centers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Recent Centers</CardTitle>
              <ModernButton 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/super-admin/management')}
              >
                View All
              </ModernButton>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentCenters.length > 0 ? (
                <div className="space-y-4">
                  {recentCenters.map((center) => (
                    <div key={center.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{center.name}</h4>
                        <p className="text-sm text-gray-500 truncate">{center.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {center.adminCount || 0} admins
                          </Badge>
                          {center.plan && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(center.plan)}`}>
                              {formatPlanName(center.plan)}
                            </span>
                          )}
                          {center.plan !== 'basic' && center.plan !== 'lifetime' && (
                            <span className="text-xs text-gray-500">
                              {isPlanExpired(center.plan, center.planExpiresAt) ? (
                                <span className="text-red-600 font-medium">Expired</span>
                              ) : center.planExpiresAt ? (
                                `Exp: ${formatExpiryDate(center.planExpiresAt)}`
                              ) : (
                                <span className="text-red-600">No expiry</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Centers Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first center to get started</p>
                  <ModernButton 
                    onClick={() => navigate('/super-admin/management')}
                    variant="solid"
                    icon={Plus}
                  >
                    Create Center
                  </ModernButton>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <ModernButton 
                  variant="outline" 
                  className="h-16 justify-start text-left p-4"
                  onClick={() => navigate('/super-admin/management')}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Manage Centers</div>
                      <div className="text-sm text-gray-500">View and edit all centers</div>
                    </div>
                  </div>
                </ModernButton>

                <ModernButton 
                  variant="outline" 
                  className="h-16 justify-start text-left p-4"
                  onClick={() => navigate('/super-admin/management')}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Manage Users</div>
                      <div className="text-sm text-gray-500">View and manage all users</div>
                    </div>
                  </div>
                </ModernButton>

                <ModernButton 
                  variant="outline" 
                  className="h-16 justify-start text-left p-4"
                  onClick={() => navigate('/super-admin/management')}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Plus className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Create Center & Admin</div>
                      <div className="text-sm text-gray-500">Set up new center with admin</div>
                    </div>
                  </div>
                </ModernButton>

                <ModernButton 
                  variant="outline" 
                  className="h-16 justify-start text-left p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Activity className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">System Reports</div>
                      <div className="text-sm text-gray-500">View activity and analytics</div>
                    </div>
                  </div>
                </ModernButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                  <p className="text-gray-500">System activity will appear here once centers are created</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
