import React from 'react';
import { TrendingUp, CreditCard } from 'lucide-react';
import { ModernCard, ModernCardHeader, ModernCardTitle } from './ModernCard';
import { ModernButton } from './ModernButton';

interface FinanceData {
  income: number;
  expense: number;
}

interface FinanceCardProps {
  title?: string;
  data: FinanceData;
  chartData?: number[];
  currentPeriod?: 'Monthly' | 'Weekly';
  onPeriodChange?: (period: 'Monthly' | 'Weekly') => void;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({
  title = "School Finance",
  data,
  chartData = [40, 65, 45, 80, 60, 70, 55],
  currentPeriod = 'Weekly',
  onPeriodChange
}) => {
  const expensePercentage = ((data.expense / data.income) * 100).toFixed(2);

  return (
    <ModernCard padding="md" hover={true}>
      <ModernCardHeader>
        <div className="flex items-center justify-between">
          <ModernCardTitle>{title}</ModernCardTitle>
          <div className="flex items-center space-x-2">
            <ModernButton 
              variant={currentPeriod === 'Monthly' ? 'solid' : 'ghost'}
              size="sm"
              onClick={() => onPeriodChange?.('Monthly')}
            >
              Monthly
            </ModernButton>
            <ModernButton 
              variant={currentPeriod === 'Weekly' ? 'solid' : 'ghost'}
              size="sm"
              onClick={() => onPeriodChange?.('Weekly')}
            >
              Weekly
            </ModernButton>
          </div>
        </div>
      </ModernCardHeader>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Income</div>
              <div className="text-sm text-gray-500">100.00%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">$ {data.income.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Expense</div>
              <div className="text-sm text-gray-500">{expensePercentage}%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">$ {data.expense.toLocaleString()}</div>
          </div>
        </div>
      </div>
      
      {/* Simple Finance Chart */}
      <div className="mt-6 h-32 flex items-end space-x-1">
        {chartData.map((height, index) => (
          <div key={index} className="flex-1">
            <div 
              className="w-full bg-gradient-to-t from-green-400 to-green-500 rounded-t-sm"
              style={{ height: `${height}px` }}
            ></div>
          </div>
        ))}
      </div>
    </ModernCard>
  );
};
