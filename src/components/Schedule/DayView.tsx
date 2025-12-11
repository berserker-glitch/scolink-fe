import React, { useRef, useState, useEffect } from 'react';
import { Users, MapPin, User, ClipboardList } from 'lucide-react';
import { AttendanceModal } from './AttendanceModal';

interface DayViewProps {
  selectedDate: Date;
  events: any[];
  groups: any[];
  subjects: any[];
  teachers: any[];
}

export const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  events,
  groups,
  subjects,
  teachers
}) => {
  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean;
    groupId: string;
    groupName: string;
    subject: string;
    teacher: string;
  }>({
    isOpen: false,
    groupId: '',
    groupName: '',
    subject: '',
    teacher: ''
  });
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayGroups = groups.filter(group => 
    group.schedules?.some((schedule: any) => schedule.day === dayName)
  );

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'No teacher assigned';
    return teachers.find(t => t.id === teacherId)?.name || 'Unknown Teacher';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleTakeAttendance = (group: any) => {
    setAttendanceModal({
      isOpen: true,
      groupId: group.id,
      groupName: group.name,
      subject: getSubjectName(group.subjectId),
      teacher: getTeacherName(group.teacherId)
    });
  };

  const closeAttendanceModal = () => {
    setAttendanceModal({
      isOpen: false,
      groupId: '',
      groupName: '',
      subject: '',
      teacher: ''
    });
  };

  // Generate dynamic time slots based on schedule content
  const generateTimeSlots = () => {
    const slots = [];

    // Get all schedule times for this day
    const allSchedules = dayGroups.flatMap(group =>
      group.schedules?.filter((schedule: any) => schedule.day === dayName) || []
    );

    // Add events times too
    events.forEach(event => {
      if (event.schedules) {
        event.schedules.forEach((schedule: any) => {
          allSchedules.push(schedule);
        });
      }
    });

    // Extract unique start and end times
    const scheduleTimes = new Set<string>();
    allSchedules.forEach(schedule => {
      scheduleTimes.add(schedule.startTime);
      scheduleTimes.add(schedule.endTime);
    });

    // Convert to minutes and find min/max times
    const timeMinutes = Array.from(scheduleTimes)
      .map(time => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      })
      .sort((a, b) => a - b);

    // Default range: 3 PM (15:00) to 12 AM (24:00)
    let startHour = 15; // 3 PM
    let endHour = 24; // 12 AM

    if (timeMinutes.length > 0) {
      const earliestMinute = timeMinutes[0];
      const latestMinute = timeMinutes[timeMinutes.length - 1];

      // Include early morning if there's content (like 8 AM)
      if (earliestMinute < 15 * 60) { // Before 3 PM
        startHour = Math.floor(earliestMinute / 60);
        // Round down to nearest hour
        startHour = Math.max(0, startHour);
      }

      // Extend to late night if there's content
      if (latestMinute > 24 * 60) { // After 12 AM
        endHour = Math.ceil(latestMinute / 60);
      } else if (latestMinute > 18 * 60) { // After 6 PM
        endHour = Math.max(endHour, Math.ceil(latestMinute / 60));
      }
    }

    // Generate hourly slots
    for (let hour = startHour; hour <= endHour; hour++) {
      const actualHour = hour === 24 ? 0 : hour;
      const displayHour = actualHour === 0 ? 12 : (actualHour > 12 ? actualHour - 12 : actualHour);
      const ampm = actualHour === 0 || actualHour < 12 ? 'AM' : 'PM';
      const time12 = actualHour === 0 ? '12:00 AM' : `${displayHour}:00 ${ampm}`;
      const time24 = actualHour === 24 ? '00:00' : `${actualHour.toString().padStart(2, '0')}:00`;

      slots.push({ display: time12, value: time24, hour: actualHour });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Convert time string to minutes since the first time slot
  const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const baseHour = timeSlots.length > 0 ? timeSlots[0].hour : 15; // Default to 3 PM
    const baseMinutes = baseHour * 60;
    return totalMinutes - baseMinutes;
  };

  // Calculate position and duration for classes
  const getClassPosition = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    const topOffset = (startMinutes / 60) * 80;
    const height = ((endMinutes - startMinutes) / 60) * 80;
    
    return { 
      top: topOffset, 
      height: Math.max(height, 40),
      startMinutes,
      endMinutes
    };
  };

  // Check if two time ranges overlap
  const hasTimeOverlap = (start1: number, end1: number, start2: number, end2: number) => {
    return start1 < end2 && start2 < end1;
  };

  // Simplified and fixed layout algorithm for overlapping classes
  const calculateClassLayout = () => {
    const classItems = dayGroups.map(group => {
      const daySchedule = group.schedules.find((s: any) => s.day === dayName);
      if (!daySchedule) return null;
      
      const position = getClassPosition(daySchedule.startTime, daySchedule.endTime);
      return {
        type: 'class' as const,
        data: group,
        schedule: daySchedule,
        position,
        column: 0,
        totalColumns: 1
      };
    }).filter(Boolean);

    // Sort by start time, then by end time
    classItems.sort((a, b) => {
      if (a.position.startMinutes !== b.position.startMinutes) {
        return a.position.startMinutes - b.position.startMinutes;
      }
      return a.position.endMinutes - b.position.endMinutes;
    });

    // Build overlap matrix
    const n = classItems.length;
    const overlapMatrix: boolean[][] = Array(n).fill(null).map(() => Array(n).fill(false));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const overlap = hasTimeOverlap(
          classItems[i].position.startMinutes,
          classItems[i].position.endMinutes,
          classItems[j].position.startMinutes,
          classItems[j].position.endMinutes
        );
        overlapMatrix[i][j] = overlap;
        overlapMatrix[j][i] = overlap;
      }
    }

    // Assign columns using graph coloring algorithm
    const columns: number[] = Array(n).fill(-1);
    
    for (let i = 0; i < n; i++) {
      // Find used colors by neighbors
      const usedColumns = new Set<number>();
      for (let j = 0; j < n; j++) {
        if (overlapMatrix[i][j] && columns[j] !== -1) {
          usedColumns.add(columns[j]);
        }
      }
      
      // Find first available column
      let column = 0;
      while (usedColumns.has(column)) {
        column++;
      }
      columns[i] = column;
    }

    // Calculate total columns needed
    const maxColumn = Math.max(...columns);
    const totalColumns = maxColumn + 1;

    // Apply column assignments
    classItems.forEach((item, index) => {
      item.column = columns[index];
      item.totalColumns = totalColumns;
    });

    return classItems;
  };

  // Get all scheduled items with proper layout
  const scheduledItems = [
    ...calculateClassLayout(),
    ...events.map(event => {
      return {
        type: 'event' as const,
        data: event,
        position: { top: 0, height: 40, startMinutes: 0, endMinutes: 60 },
        column: 0,
        totalColumns: 1
      };
    })
  ];

  // Calculate the minimum width needed for the schedule area
  const maxColumns = Math.max(1, ...scheduledItems.map(item => item.totalColumns || 1));
  const columnWidth = 280; // Fixed column width
  const scheduleWidth = Math.max(400, maxColumns * columnWidth);

  // Mouse drag scrolling functionality using native DOM events
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Find the scrollable content area within the container
    const scrollableArea = container.querySelector('.ml-20.overflow-auto') as HTMLElement;
    if (!scrollableArea) return;

    let isDragging = false;
    let startX: number, startY: number, scrollLeft: number, scrollTop: number;

    const handleMouseDown = (e: MouseEvent) => {
      // Only start dragging if not clicking on a class/event item or button
      const target = e.target as HTMLElement;
      const isClickableItem = target.closest('.absolute') !== null;
      const isButton = target.tagName === 'BUTTON' || target.closest('button') !== null;
      // Allow dragging from time labels area too for better UX
      const isTimeLabelArea = target.closest('.w-20') !== null;

      if (isClickableItem || isButton) return; // Allow dragging from time labels

      isDragging = true;
      startX = e.pageX - scrollableArea.offsetLeft;
      startY = e.pageY - scrollableArea.offsetTop;
      scrollLeft = scrollableArea.scrollLeft;
      scrollTop = scrollableArea.scrollTop;
      scrollableArea.style.cursor = 'grabbing';
      scrollableArea.style.userSelect = 'none';
      document.body.style.userSelect = 'none';

      // Add visual feedback (removed blue background)

      // Prevent default to avoid text selection and other unwanted behaviors
      e.preventDefault();
    };

    const handleMouseUp = () => {
      isDragging = false;
      scrollableArea.style.cursor = 'grab';
      scrollableArea.style.userSelect = 'none';
      document.body.style.userSelect = 'auto';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const x = e.pageX - scrollableArea.offsetLeft;
      const y = e.pageY - scrollableArea.offsetTop;
      const deltaX = x - startX;
      const deltaY = y - startY;

      // Increased sensitivity for more responsive dragging
      const sensitivity = 3; // Higher value = more responsive

      // Only scroll if there's actually content to scroll
      if (scrollableArea.scrollWidth > scrollableArea.clientWidth) {
        scrollableArea.scrollLeft = scrollLeft - (deltaX * sensitivity);
      }
      if (scrollableArea.scrollHeight > scrollableArea.clientHeight) {
        scrollableArea.scrollTop = scrollTop - (deltaY * sensitivity);
      }
    };

    const handleMouseLeave = () => {
      if (isDragging) {
        isDragging = false;
        scrollableArea.style.cursor = 'grab';
        scrollableArea.style.userSelect = 'none';
        document.body.style.userSelect = 'auto';
      }
    };

    // Touch event handlers for mobile support
    let touchStartX: number, touchStartY: number;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartX = touch.pageX - scrollableArea.offsetLeft;
        touchStartY = touch.pageY - scrollableArea.offsetTop;
        scrollLeft = scrollableArea.scrollLeft;
        scrollTop = scrollableArea.scrollTop;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const x = touch.pageX - scrollableArea.offsetLeft;
        const y = touch.pageY - scrollableArea.offsetTop;
        const sensitivity = 3; // Higher value = more responsive
        const walkX = (x - touchStartX) * sensitivity;
        const walkY = (y - touchStartY) * sensitivity;

        scrollableArea.scrollLeft = scrollLeft - walkX;
        scrollableArea.scrollTop = scrollTop - walkY;
      }
    };

    // Attach native DOM event listeners
    scrollableArea.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    scrollableArea.addEventListener('mouseleave', handleMouseLeave);

    // Touch events for mobile
    scrollableArea.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollableArea.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Cleanup
    return () => {
      scrollableArea.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      scrollableArea.removeEventListener('mouseleave', handleMouseLeave);
      scrollableArea.removeEventListener('touchstart', handleTouchStart);
      scrollableArea.removeEventListener('touchmove', handleTouchMove);
      document.body.style.userSelect = 'auto';
    };
  }, []);

  return (
    <div className="relative">
      <div className="h-full w-full bg-surface rounded-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-4 flex-shrink-0">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary">
            {formatDate(selectedDate)}
          </h2>
          <p className="text-sm text-text-muted">
            {dayGroups.length} classes • {events.length} events
          </p>
        </div>
      </div>

      {/* Timeline View - Draggable scrollable area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative hide-scrollbar"
        style={{
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'pan-y pan-x pinch-zoom',
          WebkitOverflowScrolling: 'touch',
          height: '100%', // Take full remaining height
          minHeight: `${Math.max(400, timeSlots.length * 80)}px` // Fallback dynamic height
        }}
      >
        {/* Time labels - Absolutely positioned and always visible */}
        <div
          className="absolute left-0 top-0 w-20 bg-surface z-30 border-r border-border"
          style={{
            height: `${Math.max(600, timeSlots.length * 80)}px` // Match the content area height
          }}
        >
          {timeSlots.map((slot, index) => (
            <div key={slot.value} className="h-20 flex items-start justify-end pr-4 pt-2">
              <span className="text-sm font-medium text-text-muted">
                {slot.display}
                </span>
            </div>
          ))}
        </div>

        {/* Scrollable content area with left padding for time labels */}
        <div
          className="relative flex-1 ml-20 overflow-auto hide-scrollbar"
          style={{
            height: `${Math.max(600, timeSlots.length * 80)}px`,
            cursor: 'grab'
          }}
        >
          <div
            className="relative border-l border-border"
            style={{
              minWidth: `${scheduleWidth}px`,
              height: '100%'
            }}
          >
            {/* Hour grid lines */}
            {timeSlots.map((slot, index) => (
              <div key={index} className="h-20 border-b border-border relative">
                {/* 30-minute mark */}
                <div className="absolute top-10 left-0 right-0 h-px bg-background"></div>
              </div>
            ))}
          </div>

          {/* Current time indicator */}
                {(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinutes = now.getMinutes();
                  const isToday = now.toDateString() === selectedDate.toDateString();

                  // Check if current time is within the displayed time range
                  if (timeSlots.length > 0) {
                    const baseHour = timeSlots[0].hour;
                    const lastHour = timeSlots[timeSlots.length - 1].hour;

                    // Handle midnight (0) as 24 for comparison
                    const adjustedCurrentHour = currentHour === 0 ? 24 : currentHour;
                    const adjustedLastHour = lastHour === 0 ? 24 : lastHour;

                    if (isToday && adjustedCurrentHour >= baseHour && adjustedCurrentHour <= adjustedLastHour) {
                      const position = ((adjustedCurrentHour - baseHour) * 80) + (currentMinutes / 60 * 80);
                      return (
                        <div
                          className="absolute left-0 right-0 z-10 flex items-center"
                          style={{ top: `${position}px` }}
                        >
                          <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 border-2 border-white shadow"></div>
                          <div className="flex-1 h-0.5 bg-red-500"></div>
                              </div>
                      );
                    }
                  }
                  return null;
                })()}
                
                {/* Scheduled classes with column layout */}
                {scheduledItems.map((item, index) => {
                  if (item.type === 'event') {
                    return (
                      <div
                        key={`event-${index}`}
                        className="absolute bg-purple-100 border border-purple-300 rounded-lg p-2 z-5"
                        style={{ 
                          top: `${item.position.top}px`,
                          height: `${Math.max(item.position.height, 40)}px`,
                          left: '8px',
                          right: '8px',
                          pointerEvents: 'auto' // Re-enable pointer events for event items
                        }}
                      >
                        <div className="text-sm font-medium text-purple-900">
                          📅 {item.data.name}
                            </div>
                        {item.data.description && (
                          <div className="text-xs text-purple-700 mt-1">
                            {item.data.description}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  const group = item.data;
                  const schedule = item.schedule;
                  
                  // Calculate column-based positioning
                  const itemColumnWidth = 280;
                  const leftPosition = item.column * itemColumnWidth + 8;
                  const width = itemColumnWidth - 16;
                  
                  return (
                    <div
                      key={group.id}
                      className="absolute bg-purple-50 border border-purple-200 rounded-lg p-3 shadow-adaptive-sm hover:shadow-adaptive transition-shadow z-5"
                      style={{ 
                        top: `${item.position.top}px`,
                        height: `${Math.max(item.position.height - 4, 60)}px`,
                        left: `${leftPosition}px`,
                        width: `${width}px`,
                        pointerEvents: 'auto' // Re-enable pointer events for schedule items
                      }}
                    >
                      <div className="h-full flex flex-col p-1">
                        {/* Time at top */}
                        <div className="text-xs font-semibold text-purple-800 mb-2">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        
                        {/* Subject and group */}
                        <div className="flex-1">
                          <div className="font-medium text-purple-900 text-sm mb-1 leading-tight">
                            {getSubjectName(group.subjectId)}
                          </div>
                          <div className="text-xs text-purple-700 mb-2 leading-tight">
                            {group.name}
                          </div>
                          
                          {/* Compact details */}
                          <div className="space-y-1 text-xs text-text-secondary">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate text-xs">{getTeacherName(group.teacherId)}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span>{group.studentCount || 0}/{group.capacity}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span>{group.classNumber || 'TBD'}</span>
                              </div>
                            </div>
                            
                            {/* Take Attendance Button */}
                            <div className="pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTakeAttendance(group);
                                }}
                                className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded text-xs font-medium transition-colors"
                              >
                                <ClipboardList className="w-3 h-3" />
                                Take Attendance
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Empty state */}
                {scheduledItems.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📅</div>
                      <div className="text-lg font-medium text-text-primary mb-2">
                        Free day ahead!
                      </div>
                      <div className="text-text-muted">
                        No classes or events scheduled for {dayName.toLowerCase()}.
                      </div>
                    </div>
                  </div>
                )}

          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      <AttendanceModal
        groupId={attendanceModal.groupId}
        groupName={attendanceModal.groupName}
        subject={attendanceModal.subject}
        teacher={attendanceModal.teacher}
        isOpen={attendanceModal.isOpen}
        onClose={closeAttendanceModal}
      />
    </div>
  );
};
