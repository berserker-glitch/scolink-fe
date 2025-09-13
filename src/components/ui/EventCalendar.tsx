import React from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle } from './ModernCard';

interface CalendarEvent {
  date: number;
  type?: 'green' | 'purple' | 'orange';
}

interface EventCalendarProps {
  title?: string;
  currentMonth?: string;
  currentYear?: string;
  events?: CalendarEvent[];
  daysInMonth?: number;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({
  title = "School Event Calendar",
  currentMonth = "January",
  currentYear = "2024",
  events = [
    { date: 3, type: 'green' },
    { date: 18, type: 'purple' },
    { date: 26, type: 'orange' }
  ],
  daysInMonth = 31
}) => {
  const getEventClass = (dayNumber: number) => {
    const event = events.find(e => e.date === dayNumber);
    if (!event) return 'text-gray-700';
    
    const typeClasses = {
      green: 'bg-green-100 text-green-600 font-semibold',
      purple: 'bg-purple-100 text-purple-600 font-semibold',
      orange: 'bg-orange-100 text-orange-600 font-semibold'
    };
    
    return typeClasses[event.type];
  };

  return (
    <ModernCard padding="md" hover={true}>
      <ModernCardHeader>
        <div className="flex items-center justify-between">
          <ModernCardTitle>{title}</ModernCardTitle>
          <div className="flex items-center space-x-2">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1">
              <option>{currentMonth}</option>
              <option>February</option>
              <option>March</option>
              <option>April</option>
              <option>May</option>
              <option>June</option>
              <option>July</option>
              <option>August</option>
              <option>September</option>
              <option>October</option>
              <option>November</option>
              <option>December</option>
            </select>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1">
              <option>{currentYear}</option>
              <option>2025</option>
              <option>2023</option>
            </select>
          </div>
        </div>
      </ModernCardHeader>
      
      {/* Mini Calendar */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="p-2 font-medium text-gray-600">{day}</div>
        ))}
        {Array.from({length: daysInMonth}, (_, i) => (
          <div key={i} className={`p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${getEventClass(i + 1)}`}>
            {i + 1}
          </div>
        ))}
      </div>
    </ModernCard>
  );
};
