import React from 'react';

interface TaskIndicatorProps {
  count: number;
  label: string;
  color: 'green' | 'orange' | 'blue' | 'purple' | 'yellow';
  size?: 'sm' | 'md';
}

export const TaskIndicator: React.FC<TaskIndicatorProps> = ({
  count,
  label,
  color,
  size = 'sm'
}) => {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-700 shadow-purple-100',
    orange: 'bg-orange-50 text-orange-700 shadow-orange-100',
    violet: 'bg-violet-50 text-violet-700 shadow-violet-100',
    indigo: 'bg-indigo-50 text-indigo-700 shadow-indigo-100',
    yellow: 'bg-yellow-50 text-yellow-700 shadow-yellow-100'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 rounded-lg',
    md: 'text-sm px-3 py-1.5 rounded-lg'
  };

  return (
    <div className={`
      ${colorClasses[color]} 
      ${sizeClasses[size]} 
      shadow-sm inline-flex items-center justify-center font-medium whitespace-nowrap truncate
    `}>
      {count} {label}
    </div>
  );
};
