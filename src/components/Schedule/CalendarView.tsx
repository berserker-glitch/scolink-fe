import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ModernButton } from '@/components/ui';
import { CalendarDay } from './CalendarDay';

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  events: any[];
  groups: any[];
  selectedDate: Date;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onDateChange,
  onDayClick,
  events,
  groups,
  selectedDate
}) => {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and how many days in month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Days of week headers
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month starts (adjust for Monday start)
  const adjustedStarting = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  for (let i = 0; i < adjustedStarting; i++) {
    calendarDays.push(null);
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date || event.createdAt);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getGroupsForDate = (date: Date) => {
    if (!date) return [];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return groups.filter(group => 
      group.schedules?.some((schedule: any) => schedule.day === dayName)
    );
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onDateChange(newDate);
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="bg-white rounded-xl h-full w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{monthName}</h2>
          
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
            {daysShort.map(day => (
              <div key={day} className="p-1 text-center">
                <span className="text-xs font-medium text-gray-500">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 flex-1 overflow-hidden" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
            {calendarDays.map((date, index) => (
              <CalendarDay
                key={index}
                date={date}
                isToday={date && date.toDateString() === today.toDateString()}
                isSelected={date && date.toDateString() === selectedDate.toDateString()}
                events={date ? getEventsForDate(date) : []}
                groups={date ? getGroupsForDate(date) : []}
                onClick={date ? () => onDayClick(date) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
