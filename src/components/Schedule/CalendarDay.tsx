import React from 'react';

interface CalendarDayProps {
  date: Date | null;
  isToday: boolean;
  isSelected?: boolean;
  events: any[];
  groups: any[];
  onClick?: () => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isToday,
  isSelected = false,
  events,
  groups,
  onClick
}) => {
  if (!date) {
    return (
      <div className="w-full h-full min-h-[60px] p-1 rounded-lg bg-gray-50">
      </div>
    );
  }

  const dayNumber = date.getDate();

  // Calculate total students expected
  const totalStudents = groups.reduce((sum, group) => sum + (group.studentCount || group.capacity || 0), 0);

  return (
    <div
      onClick={onClick}
      className={`w-full h-full min-h-[60px] p-1.5 rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md border-2 ${
        isSelected
          ? 'bg-purple-100 border-purple-500 shadow-purple-200'
          : isToday
          ? 'bg-purple-50 border-purple-200 shadow-purple-100'
          : 'bg-white border-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Day number */}
        <div className={`text-sm font-medium mb-1 flex-shrink-0 ${
          isSelected ? 'text-purple-700' : isToday ? 'text-purple-600' : 'text-gray-900'
        }`}>
          {dayNumber}
        </div>

        {/* Simple stats display */}
        <div className="flex-1 flex flex-col gap-0.5 overflow-hidden min-h-0">
          {/* Groups count */}
          {groups.length > 0 && (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              {groups.length} {groups.length === 1 ? 'group' : 'groups'}
            </div>
          )}

          {/* Students count */}
          {totalStudents > 0 && (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0"></div>
              {totalStudents} students
            </div>
          )}

          {/* Events indicator */}
          {events.length > 0 && (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
