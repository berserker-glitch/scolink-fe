import React from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle } from './ModernCard';
import { ModernButton } from './ModernButton';

interface EventItem {
  date: number;
  day: string;
  title: string;
  subtitle: string;
  additionalInfo?: string;
  moreText?: string;
}

interface UpcomingEventsProps {
  title?: string;
  events?: EventItem[];
  onNewEvent?: () => void;
  newEventButtonText?: string;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  title = "Upcoming Events",
  events = [
    {
      date: 3,
      day: "Wed",
      title: "School Live Concert Choir",
      subtitle: "Charity Event 2022",
      moreText: "9 events more"
    },
    {
      date: 28,
      day: "Fri",
      title: "The Story Of Nayelia Toha",
      subtitle: "(Musical Drama)",
      additionalInfo: "Online Class start from 09:00",
      moreText: "View more"
    }
  ],
  onNewEvent,
  newEventButtonText = "+ New Events"
}) => {
  return (
    <ModernCard padding="md" hover={true}>
      <ModernCardHeader>
        <ModernCardTitle>{title}</ModernCardTitle>
      </ModernCardHeader>
      
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="text-center min-w-0">
              <div className="text-lg font-bold text-text-primary">{event.date}</div>
              <div className="text-xs text-text-muted">{event.day}</div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-text-primary">{event.title}</div>
              <div className="text-sm text-text-muted">{event.subtitle}</div>
              {event.additionalInfo && (
                <div className="text-xs text-text-muted mt-1">{event.additionalInfo}</div>
              )}
              {event.moreText && (
                <div className="text-xs text-blue-600 mt-1">{event.moreText}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <ModernButton 
          variant="solid"
          fullWidth
          onClick={onNewEvent}
        >
          {newEventButtonText}
        </ModernButton>
      </div>
    </ModernCard>
  );
};
