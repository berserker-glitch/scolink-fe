import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'solid',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  children,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    solid: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 shadow-sm',
    outline: 'border-2 border-purple-600 text-purple-600 bg-transparent hover:bg-purple-50 focus:ring-purple-500',
    ghost: 'text-purple-600 bg-transparent hover:bg-purple-50 focus:ring-purple-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

  return (
    <button className={classes} {...props}>
      {Icon && iconPosition === 'left' && (
        <Icon className={`${iconSize} ${children ? 'mr-2' : ''}`} />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className={`${iconSize} ${children ? 'ml-2' : ''}`} />
      )}
    </button>
  );
};
