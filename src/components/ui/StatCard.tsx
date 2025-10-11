import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ModernCard } from './ModernCard';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600'
}) => {
  const changeColorClass = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-text-secondary'
  }[changeType];

  return (
    <ModernCard padding="md" hover={true}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className={`text-sm font-medium ${changeColorClass}`}>{change}</p>
        </div>
        <div className={`p-4 ${iconBgColor} rounded-2xl`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
      </div>
    </ModernCard>
  );
};
