import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  CalendarDays,
  UserCheck,
  Settings,
  Globe,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Subjects & Groups', href: '/subjects', icon: BookOpen },
  { name: 'Schedule & Attendance', href: '/schedule', icon: Calendar },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Events', href: '/events', icon: CalendarDays },
  { name: 'Teachers', href: '/teachers', icon: UserCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDark, onThemeToggle }) => {
  const { user, logout } = useAuth();
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen w-64 sidebar-bg border-r border-purple-400/20 transform transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold sidebar-text">Scolink</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-white/10 focus-brutalist"
          >
            <X className="w-5 h-5 sidebar-text" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-6 py-8">
          <p className="text-xs font-semibold sidebar-text-secondary uppercase tracking-wider mb-6">Main Menu</p>
          <div className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/20 sidebar-text font-semibold backdrop-blur-sm'
                      : 'sidebar-text-secondary hover:bg-white/10 hover:sidebar-text'
                  }`
                }
                onClick={() => window.innerWidth < 1024 && onClose()}
              >
                <item.icon className="w-5 h-5 mr-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-6 border-t border-white/10 space-y-4">
          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold sidebar-text">
                  {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium sidebar-text truncate">{user.fullName}</p>
                <p className="text-xs sidebar-text-secondary truncate">{user.email}</p>
              </div>
            </div>
          )}
          
          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="flex items-center w-full px-4 py-3 sidebar-text-secondary hover:bg-white/10 hover:sidebar-text rounded-xl transition-all duration-200"
          >
            {isDark ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
            <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          {/* Logout */}
          <button 
            onClick={logout}
            className="flex items-center w-full px-4 py-3 sidebar-text-secondary hover:bg-white/10 hover:sidebar-text rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};