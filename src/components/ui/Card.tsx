import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'hover';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'default',
  onClick 
}) => {
  const baseClasses = 'rounded-lg border transition-all duration-150';
  
  const variants = {
    default: 'surface border-border',
    secondary: 'surface-secondary border-border',
    hover: 'surface border-border hover:bg-surface-hover cursor-pointer'
  };

  return (
    <div 
      className={cn(baseClasses, variants[variant], className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn('p-6 pb-3', className)}>
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn('p-6 pt-0', className)}>
    {children}
  </div>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={cn('text-lg font-semibold text-text-primary', className)}>
    {children}
  </h3>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => (
  <p className={cn('text-sm text-text-secondary mt-1', className)}>
    {children}
  </p>
);