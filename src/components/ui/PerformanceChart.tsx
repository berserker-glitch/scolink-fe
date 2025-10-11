import React from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle } from './ModernCard';

interface PerformanceChartProps {
  studentsValue: number;
  teachersValue: number;
  currentPeriod?: string;
  data?: number[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  studentsValue,
  teachersValue,
  currentPeriod = "January 2024",
  data = [37, 28, 45, 32, 25, 40, 35, 30, 42, 38]
}) => {
  return (
    <div className="lg:col-span-2">
      <ModernCard padding="md" hover={true}>
        <ModernCardHeader>
          <div className="flex items-center justify-between">
            <ModernCardTitle>School Performance</ModernCardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-text-secondary">Students</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-text-secondary">Teachers</span>
              </div>
              <select className="text-sm border border-border rounded-lg px-3 py-1">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
          </div>
        </ModernCardHeader>
        
        {/* Simple Chart Visualization */}
        <div className="h-64 flex items-end space-x-2">
          {data.map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-purple-400 to-purple-500 rounded-t-lg mb-1"
                style={{ height: `${height * 2}px` }}
              ></div>
              <div 
                className="w-full bg-gradient-to-t from-green-400 to-green-500 rounded-t-lg"
                style={{ height: `${(height * 0.6)}px` }}
              ></div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{studentsValue}</div>
            <div className="text-sm text-text-muted">Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{teachersValue}</div>
            <div className="text-sm text-text-muted">Teachers</div>
          </div>
          <div className="text-sm text-text-muted">
            {currentPeriod}
          </div>
        </div>
      </ModernCard>
    </div>
  );
};
