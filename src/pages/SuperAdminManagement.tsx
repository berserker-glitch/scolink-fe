import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building2, Users, Settings, Filter, MoreHorizontal, Eye, Edit, Trash2, Shield, ShieldOff } from 'lucide-react';
import { apiService, Center, User } from '@/services/api';
import { TwoStepCenterForm } from '@/components/SuperAdmin/TwoStepCenterForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export const SuperAdminManagement: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'centers' | 'users'>('centers');
  const [selectedItem, setSelectedItem] = useState<Center | User | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading management data...');
      
      const [centersResponse, usersResponse] = await Promise.all([
        apiService.getCenters(1, 50),
        apiService.getUsers(1, 50)
      ]);
      
      console.log('Management - Centers response:', centersResponse);
      console.log('Management - Users response:', usersResponse);
      
      const centers = centersResponse?.centers || [];
      const users = usersResponse?.users || [];
      
      console.log('Management - Parsed centers:', centers);
      console.log('Management - Parsed users:', users);
      
      setCenters(centers);
      setUsers(users);
    } catch (error) {
      console.error('Error loading management data:', error);
      setCenters([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (center: Center, admin: any) => {
    // Refresh the data after successful creation
    loadData();
  };

  const handleView = (item: Center | User) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  const handleEdit = (item: Center | User) => {
    // TODO: Implement edit functionality
    console.log('Edit item:', item);
  };

  const handleDelete = (item: Center | User) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleSuspend = (item: Center | User) => {
    setSelectedItem(item);
    setShowSuspendDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    
    try {
      setActionLoading(true);
      
      if ('location' in selectedItem) {
        // It's a center
        await apiService.deleteCenter(selectedItem.id);
      } else {
        // It's a user
        await apiService.deleteUser(selectedItem.id);
      }
      
      setShowDeleteDialog(false);
      setSelectedItem(null);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmSuspend = async () => {
    if (!selectedItem) return;
    
    try {
      setActionLoading(true);
      
      if ('location' in selectedItem) {
        // It's a center
        if (selectedItem.isActive) {
          await apiService.suspendCenter(selectedItem.id);
        } else {
          await apiService.unsuspendCenter(selectedItem.id);
        }
      } else {
        // It's a user
        if (selectedItem.isActive) {
          await apiService.suspendUser(selectedItem.id);
        } else {
          await apiService.unsuspendUser(selectedItem.id);
        }
      }
      
      setShowSuspendDialog(false);
      setSelectedItem(null);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error suspending/unsuspending item:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Ensure arrays exist before filtering to prevent undefined errors
  const filteredCenters = (centers || []).filter(center =>
    center?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center?.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = (users || []).filter(user =>
    user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TabButton = ({ tab, label, count }: { tab: 'centers' | 'users'; label: string; count: number }) => (
    <ModernButton
      variant={activeTab === tab ? "solid" : "outline"}
      onClick={() => setActiveTab(tab)}
      className="flex-1"
    >
      {label} ({count})
    </ModernButton>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
              <p className="text-gray-600 mt-2">Manage centers, users, and system administration</p>
            </div>
            <ModernButton
              onClick={() => setShowCreateForm(true)}
              variant="solid"
              size="lg"
              icon={Plus}
              className="px-6 py-3 text-lg mx-auto lg:mx-0"
            >
              Create Center & Admin
            </ModernButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search centers and users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Tab Switcher */}
            <div className="flex space-x-2">
              <TabButton tab="centers" label="Centers" count={filteredCenters.length} />
              <TabButton tab="users" label="Users" count={filteredUsers.length} />
            </div>
          </div>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'centers' && (
          <div className="space-y-6">
            {/* Centers Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCenters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCenters.map((center) => (
                  <Card key={center.id} className="hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900 truncate">{center.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{center.location}</p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <ModernButton variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </ModernButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleView(center)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(center)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Center
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSuspend(center)}>
                              {center.isActive ? (
                                <>
                                  <ShieldOff className="w-4 h-4 mr-2" />
                                  Suspend Center
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Unsuspend Center
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(center)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Center
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {center.email && (
                          <p className="flex items-center">
                            <span className="font-medium w-16">Email:</span>
                            <span className="truncate">{center.email}</span>
                          </p>
                        )}
                        {center.phoneNumber && (
                          <p className="flex items-center">
                            <span className="font-medium w-16">Phone:</span>
                            <span>{center.phoneNumber}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <Badge variant="outline">
                          {center.adminCount || 0} admins
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Centers Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'No centers match your search criteria' : 'Create your first center to get started'}
                </p>
                <ModernButton 
                  onClick={() => setShowCreateForm(true)}
                  variant="solid"
                  icon={Plus}
                >
                  Create Center & Admin
                </ModernButton>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  All Users ({filteredUsers.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Center
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.fullName?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                              {user.role?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.centerId ? 
                              centers.find(c => c.id === user.centerId)?.name || 'Unknown' : 
                              'N/A'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <ModernButton variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </ModernButton>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleView(user)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                {user.role !== 'super_admin' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSuspend(user)}>
                                      {user.isActive ? (
                                        <>
                                          <ShieldOff className="w-4 h-4 mr-2" />
                                          Suspend User
                                        </>
                                      ) : (
                                        <>
                                          <Shield className="w-4 h-4 mr-2" />
                                          Unsuspend User
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => handleDelete(user)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No users match your search criteria' : 'No users in the system yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Two Step Form Modal */}
      <TwoStepCenterForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleCreateSuccess}
      />

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {'location' in (selectedItem || {}) ? 'Center Details' : 'User Details'}
            </DialogTitle>
            <DialogDescription>
              View detailed information about this {'location' in (selectedItem || {}) ? 'center' : 'user'}.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {'location' in selectedItem ? (
                // Center details
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg text-gray-900">{selectedItem.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{selectedItem.location}</p>
                  </div>
                  {selectedItem.phoneNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedItem.phoneNumber}</p>
                    </div>
                  )}
                  {selectedItem.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedItem.email}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge variant={selectedItem.isActive ? "default" : "secondary"}>
                      {selectedItem.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-gray-900">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                // User details
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg text-gray-900">{selectedItem.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedItem.email}</p>
                  </div>
                  {selectedItem.phoneNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedItem.phoneNumber}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <Badge variant={selectedItem.role === 'super_admin' ? "destructive" : "default"}>
                      {selectedItem.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge variant={selectedItem.isActive ? "default" : "secondary"}>
                      {selectedItem.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-gray-900">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {'location' in (selectedItem || {}) ? 'center' : 'user'}? 
              {'location' in (selectedItem || {}) ? ' This will also delete all associated admin users.' : ''} 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend/Unsuspend Confirmation Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedItem?.isActive ? 'Suspend' : 'Unsuspend'} {'location' in (selectedItem || {}) ? 'Center' : 'User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedItem?.isActive ? 'suspend' : 'unsuspend'} this {'location' in (selectedItem || {}) ? 'center' : 'user'}?
              {'location' in (selectedItem || {}) && selectedItem?.isActive ? ' This will also suspend all associated admin users and prevent them from logging in.' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSuspend}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : (selectedItem?.isActive ? 'Suspend' : 'Unsuspend')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
