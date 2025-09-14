import React, { useState } from 'react';
import { CalendarView } from '@/components/Schedule/CalendarView';
import { DayView } from '@/components/Schedule/DayView';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const Schedule: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Date state - calendar navigation and selected day for day view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  
  // Fetch groups from API
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch subjects from API  
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.getSubjects(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch teachers from API
  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiService.getTeachers(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch events from API
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: () => apiService.getEvents(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  const groups = groupsData?.groups || [];
  const subjects = subjectsData?.subjects || [];
  const teachers = teachersData?.teachers || [];
  const events = eventsData?.events || [];

  // Handle day click from calendar - update day view
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Get events and groups for selected date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      // Check if event has schedules with dates
      if (event.schedules && event.schedules.length > 0) {
        return event.schedules.some((schedule: any) => {
          const eventDate = new Date(schedule.date);
          return eventDate.toDateString() === date.toDateString();
        });
      }
      // Fallback to createdAt if no schedules
      const eventDate = new Date(event.createdAt);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getGroupsForDate = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return groups.filter(group => 
      group.schedules?.some((schedule: any) => schedule.day === dayName)
    );
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden p-4">
      <div 
        className="h-full w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: '60% 39%',
          gridTemplateRows: '1fr',
          height: 'calc(100vh - 2rem)', // Account for padding
          gap: '16px'
        }}
      >
        {/* Left side - Calendar View (60% grid column) */}
        <div 
          style={{ 
            overflow: 'hidden',
            minWidth: 0,
            minHeight: 0
          }}
        >
          <CalendarView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onDayClick={handleDayClick}
            events={events}
            groups={groups}
            selectedDate={selectedDate}
          />
        </div>
        
        {/* Right side - Day View (39% grid column) */}
        <div
          style={{
            overflow: 'hidden',
            minWidth: 0,
            minHeight: 0,
            height: '100%' // Take full height
          }}
          className="flex flex-col"
        >
          <DayView
            selectedDate={selectedDate}
            events={getEventsForDate(selectedDate)}
            groups={getGroupsForDate(selectedDate)}
            subjects={subjects}
            teachers={teachers}
          />
        </div>
      </div>
    </div>
  );
};