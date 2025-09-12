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
  X
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
        fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border transform transition-transform duration-300 ease-in-out z-50 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <h1 className="text-heading font-bold text-text-primary">EduCenter</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-surface-hover focus-brutalist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'bg-interactive text-background font-medium'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`
                }
                onClick={() => window.innerWidth < 1024 && onClose()}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="flex items-center w-full px-4 py-3 text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-lg transition-colors duration-150"
          >
            {isDark ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
            <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          {/* Language Selector */}
          <div className="flex items-center px-4 py-3 text-text-secondary">
            <Globe className="w-5 h-5 mr-3" />
            <select className="bg-transparent border-none outline-none font-medium focus-brutalist">
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
            </select>
          </div>
          
          {/* User Info */}
          {user && (
            <div className="px-4 py-2 text-sm text-text-secondary border-b border-border mb-2">
              <p className="font-medium text-text-primary">{user.name}</p>
              <p className="text-xs">{user.email}</p>
            </div>
          )}
          
          {/* Logout */}
          <button 
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-lg transition-colors duration-150"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};