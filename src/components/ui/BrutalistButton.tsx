import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold uppercase tracking-wide transition-all duration-150 focus-brutalist disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'btn-brutalist-fill',
    secondary: 'bg-surface-secondary text-text-primary border-2 border-border hover:bg-surface-hover',
    outline: 'btn-brutalist',
    ghost: 'text-text-primary hover:bg-surface-hover border-2 border-transparent',
    danger: 'bg-status-error text-background border-2 border-status-error hover:bg-transparent hover:text-status-error'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};