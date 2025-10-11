import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Settings, Users, Building2, Home, Database } from 'lucide-react';
import { ModernButton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export const SuperAdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setIsDark(saved === 'dark');
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-text-primary">Scolink Admin</h1>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="space-y-1">
              <div className="px-3 py-2 text-sm font-medium text-text-muted uppercase tracking-wider">
                Navigation
              </div>
              
              <ModernButton
                variant={location.pathname === '/super-admin' || location.pathname === '/' ? "solid" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => {
                  navigate('/super-admin');
                  closeSidebar();
                }}
                icon={Home}
              >
                Dashboard
              </ModernButton>
              
              <ModernButton
                variant={location.pathname === '/super-admin/management' ? "solid" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => {
                  navigate('/super-admin/management');
                  closeSidebar();
                }}
                icon={Database}
              >
                Management
              </ModernButton>
            </div>
          </nav>

          {/* User Info & Actions */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.fullName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.fullName || 'Super Admin'}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {user?.email || 'admin@admin.com'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <ModernButton
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={toggleTheme}
                icon={Settings}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </ModernButton>
              
              <ModernButton
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
                icon={LogOut}
              >
                Logout
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Window Controls - Only show on desktop */}
        <div className="hidden lg:flex fixed top-0 right-0 z-50 bg-surface border-b border-l border-border">
        </div>
        
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-surface border-b border-border flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Scolink Admin</h1>
          <div className="w-10" /> {/* Spacer for balance */}
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
        </div>
      </div>
    </div>
  );
};
