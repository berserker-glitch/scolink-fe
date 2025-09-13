import React from 'react';

export interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  hover = true
}) => {
  const baseClasses = 'bg-white rounded-2xl border border-gray-100 transition-all duration-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };
  
  const hoverClass = hover ? 'hover:shadow-md' : '';
  
  const classes = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${hoverClass} ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export interface ModernCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModernCardHeader: React.FC<ModernCardHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

export interface ModernCardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const ModernCardTitle: React.FC<ModernCardTitleProps> = ({
  children,
  className = ''
}) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
};

export interface ModernCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ModernCardContent: React.FC<ModernCardContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
