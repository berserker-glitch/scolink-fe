import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModernButton } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { EventDetailDrawer } from '@/components/Event/EventDetailDrawer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Event, Group } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  MapPin,
  Edit,
  Trash2,
  Eye,
  CalendarDays,
  DollarSign,
  Printer
} from 'lucide-react';

export const Events: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [eventForm, setEventForm] = useState({
    name: '',
    type: 'Normal' as 'Normal' | 'TempAdditionalCourseDay',
    fee: '',
    selectedGroups: [] as string[],
    selectedDays: [] as {date: string, startTime: string, endTime: string}[],
    description: ''
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Fetch events from API
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', searchQuery],
    queryFn: () => apiService.getEvents(1, 100, searchQuery || undefined),
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch groups from API  
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(1, 100),
    enabled: isAuthenticated && !authLoading,
  });

  const events = eventsData?.events || [];
  const groups = groupsData?.groups || [];

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: any) => apiService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event created successfully."
      });
      setIsAddEventOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create event. Please try again."
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => 
      apiService.updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event updated successfully."
      });
      setIsEditEventOpen(false);
      setEditingEvent(null);
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update event. Please try again."
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => apiService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event deleted successfully."
      });
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete event. Please try again."
      });
    }
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === '' || event.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'All Students';
    const group = groups.find(g => g.id === groupId);
    if (!group) return 'Unknown Group';
    return `${group.subjectName || 'Unknown'} - ${group.name}`;
  };

  const resetForm = () => {
    setEventForm({
      name: '',
      type: 'Normal',
      fee: '',
      selectedGroups: [],
      selectedDays: [],
      description: ''
    });
    setCurrentStep(1);
    setGroupSearchQuery('');
  };

  const getEventStudents = (event: Event) => {
    return event.enrollments?.map(enrollment => enrollment.student).filter(Boolean) || [];
  };

  const isEventActive = (event: Event) => {
    const now = new Date();
    if (!event.schedules || event.schedules.length === 0) return false;
    
    // Check if any schedule is currently active (today)
    const today = now.toISOString().split('T')[0];
    return event.schedules.some(schedule => schedule.date === today);
  };

  const isEventExpired = (event: Event) => {
    const now = new Date();
    if (!event.schedules || event.schedules.length === 0) return false;
    
    // Event is expired if all schedules are in the past
    const today = now.toISOString().split('T')[0];
    return event.schedules.every(schedule => schedule.date < today);
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
  };

  const handlePrintStudentList = (event: any) => {
    const students = getEventStudents(event);
    const printContent = `
      <html>
        <head>
          <title>Student List - ${event.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .event-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .no-students { text-align: center; color: #666; font-style: italic; padding: 20px; }
          </style>
        </head>
        <body>
          <h1>Student List</h1>
          <div class="event-info">
            <h2>Event Details</h2>
            <p><strong>Event Name:</strong> ${event.name}</p>
            <p><strong>Event Type:</strong> ${event.type}</p>
            <p><strong>Date:</strong> ${event.schedules?.map(s => new Date(s.date).toLocaleDateString()).join(', ') || 'No dates scheduled'}</p>
            ${event.fee && event.fee > 0 ? `<p><strong>Fee:</strong> ${event.fee} DH per student</p>` : ''}
            <p><strong>Total Students:</strong> ${students.length}</p>
          </div>
          
          ${students.length > 0 ? `
            <h2>Enrolled Students</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Year</th>
                  <th>Field</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((student, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${student.firstName} ${student.lastName}</td>
                    <td>${student.yearName || 'Unknown'}</td>
                    <td>${student.fieldName || 'Unknown'}</td>
                    <td>Active</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="no-students">
              <h2>No students enrolled in this event</h2>
            </div>
          `}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleSaveEvent = () => {
    const eventData = {
      name: eventForm.name,
      type: eventForm.type,
      fee: eventForm.type === 'Normal' ? parseFloat(eventForm.fee) : undefined,
      description: eventForm.description || undefined,
      schedules: eventForm.selectedDays.map(day => ({
        date: day.date,
        startTime: day.startTime,
        endTime: day.endTime,
      })),
      groupIds: eventForm.type === 'TempAdditionalCourseDay' ? eventForm.selectedGroups : undefined,
    };
    
    createEventMutation.mutate(eventData);
  };

  const handleAddGroup = (groupId: string) => {
    setEventForm(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
    }));
  };

  const handleAddDay = (date: string, startTime: string = '09:00', endTime: string = '17:00') => {
    setEventForm(prev => ({
      ...prev,
      selectedDays: [...prev.selectedDays, { date, startTime, endTime }]
    }));
  };

  const handleRemoveDay = (index: number) => {
    setEventForm(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateDayTime = (index: number, startTime: string, endTime: string) => {
    setEventForm(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.map((day, i) => 
        i === index ? { ...day, startTime, endTime } : day
      )
    }));
  };

  const getGroupsBySubject = () => {
    const groupsBySubject: {[subjectId: string]: Group[]} = {};
    groups.forEach(group => {
      if (!groupsBySubject[group.subjectId]) {
        groupsBySubject[group.subjectId] = [];
      }
      groupsBySubject[group.subjectId].push(group);
    });
    return groupsBySubject;
  };

  const getStudentsFromSelectedGroups = () => {
    // For now, return empty array since we don't have student enrollment data here
    // This would need to be fetched from the API when groups are selected
    return [];
  };

  const getFilteredGroups = () => {
    if (!groupSearchQuery) return getGroupsBySubject();
    
    const filteredGroups: {[subjectId: string]: Group[]} = {};
    groups.forEach(group => {
      const groupName = group.name.toLowerCase();
      const subjectName = group.subjectName?.toLowerCase() || '';
      const searchTerm = groupSearchQuery.toLowerCase();
      
      if (groupName.includes(searchTerm) || subjectName.includes(searchTerm)) {
        if (!filteredGroups[group.subjectId]) {
          filteredGroups[group.subjectId] = [];
        }
        filteredGroups[group.subjectId].push(group);
      }
    });
    return filteredGroups;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && eventForm.type === 'TempAdditionalCourseDay') {
      setCurrentStep(2);
    } else {
      handleSaveEvent();
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return eventForm.name.trim() !== '' && eventForm.selectedDays.length > 0;
    }
    return true;
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setIsEditEventOpen(true);
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;
    
    const eventData = {
      name: eventForm.name,
      type: eventForm.type,
      fee: eventForm.type === 'Normal' ? parseFloat(eventForm.fee) : undefined,
      description: eventForm.description || undefined,
      schedules: eventForm.selectedDays.map(day => ({
        date: day.date,
        startTime: day.startTime,
        endTime: day.endTime,
      })),
      groupIds: eventForm.type === 'TempAdditionalCourseDay' ? eventForm.selectedGroups : undefined,
    };
    
    updateEventMutation.mutate({ eventId: editingEvent.id, data: eventData });
  };

  const resetEditForm = () => {
    if (editingEvent) {
      setEventForm({
        name: editingEvent.name,
        type: editingEvent.type,
        fee: editingEvent.fee?.toString() || '',
        selectedGroups: editingEvent.groups?.map(g => g.groupId) || [],
        selectedDays: editingEvent.schedules?.map(schedule => ({
          date: schedule.date,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        })) || [],
        description: editingEvent.description || ''
      });
    }
  };

  // Reset form when editing event changes
  useEffect(() => {
    if (editingEvent) {
      resetEditForm();
      setCurrentStep(1);
      setGroupSearchQuery('');
    }
  }, [editingEvent]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className={`transition-all duration-300 overflow-hidden ${isDrawerOpen ? 'w-[60%]' : 'w-full'}`}>
          <div className="p-6 lg:p-8 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Events</h1>
          <p className="text-sm text-text-secondary">
            Manage educational events, special courses, and student activities.
          </p>
        </div>
        
        <ModernButton 
          variant="solid"
          icon={Plus}
          iconPosition="left"
          onClick={() => setIsAddEventOpen(true)}
        >
          Create Event
        </ModernButton>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="bg-surface rounded-lg border border-border p-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search events by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background text-text-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-background text-text-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-48"
              >
                <option value="">All Types</option>
                <option value="Normal">Normal Events</option>
                <option value="TempAdditionalCourseDay">Additional Course Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {eventsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-interactive"></div>
          <p className="text-text-secondary mt-4">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No events found.</p>
          {searchQuery && (
            <p className="text-sm text-text-muted mt-2">
              Try adjusting your search criteria.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
          const students = getEventStudents(event);
          const isActive = isEventActive(event);
          const isExpired = isEventExpired(event);
          
          return (
            <Card
              key={event.id}
              className={`surface hover:shadow-lg transition-all duration-200 cursor-pointer`}
              onClick={() => handleViewEvent(event)}
            >
              <CardContent className="p-6">
                {/* Event Header */}
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-interactive rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text-primary text-lg truncate">{event.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          event.type === 'Normal'
                            ? 'bg-interactive/20 text-interactive'
                            : 'bg-status-warning/20 text-status-warning'
                        }`}>
                          {event.type}
                        </span>
                      </div>
                      {event.schedules && event.schedules.length > 0 && (
                        <p className="text-xs text-text-muted truncate">
                          {event.schedules.length} date{event.schedules.length !== 1 ? 's' : ''} scheduled
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                    />
                  </div>
                </div>

                {/* Event Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-surface-secondary rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{students.length}</p>
                    <p className="text-xs text-text-secondary">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{event.groups?.length || 0}</p>
                    <p className="text-xs text-text-secondary">Groups</p>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-800'
                        : isExpired
                        ? 'bg-surface-secondary text-text-primary'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isActive ? 'Active' : isExpired ? 'Expired' : 'Upcoming'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t border-border">
                  <ModernButton
                    variant="solid"
                    size="sm"
                    icon={Printer}
                    iconPosition="left"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintStudentList(event);
                    }}
                  >
                    Print Student List
                  </ModernButton>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                        deleteEventMutation.mutate(event.id);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}

          </div>
        </div>

        {/* Inline Drawer */}
        <div className={`w-[40%] transition-all duration-300 ${isDrawerOpen && selectedEvent ? 'block' : 'hidden'}`}>
          {selectedEvent && (
            <EventDetailDrawer
              isOpen={isDrawerOpen}
              onClose={() => {
                setIsDrawerOpen(false);
                setSelectedEvent(null);
              }}
              event={selectedEvent}
              onEdit={handleEditEvent}
              isExternalEditOpen={isEditEventOpen}
            />
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        title={`Create New Event - Step ${currentStep}${eventForm.type === 'TempAdditionalCourseDay' ? ' of 2' : ''}`}
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* Step Progress Indicator */}
          {eventForm.type === 'TempAdditionalCourseDay' && (
            <div className="flex items-center space-x-4 mb-6">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-interactive' : 'text-text-muted'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? 'bg-interactive text-background' : 'bg-surface-secondary text-text-muted'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Event Details</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-interactive' : 'text-text-muted'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? 'bg-interactive text-background' : 'bg-surface-secondary text-text-muted'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Select Groups</span>
              </div>
            </div>
          )}

          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <>
              <FormField label="Event Name" required>
                <Input
                  value={eventForm.name}
                  onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Science Fair 2024"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Event Type" required>
                  <Select
                    value={eventForm.type}
                    onChange={(e) => setEventForm(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'Normal' | 'TempAdditionalCourseDay'
                    }))}
                    options={[
                      { value: 'Normal', label: 'Normal Event' },
                      { value: 'TempAdditionalCourseDay', label: 'Additional Course Day' }
                    ]}
                  />
                </FormField>

                {eventForm.type === 'Normal' && (
                  <FormField label="Fee (DH)">
                    <Input
                      type="number"
                      value={eventForm.fee}
                      onChange={(e) => setEventForm(prev => ({ ...prev, fee: e.target.value }))}
                      placeholder="0"
                    />
                  </FormField>
                )}
              </div>

              {/* Date and Time Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-secondary">Event Schedule</label>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    iconPosition="left"
                    onClick={() => setIsDatePickerOpen(true)}
                  >
                    Add Day
                  </ModernButton>
                </div>
                
                {eventForm.selectedDays.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                    <p className="text-text-secondary">No days selected. Click "Add Day" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventForm.selectedDays.map((day, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-text-primary">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => handleUpdateDayTime(index, e.target.value, day.endTime)}
                            className="w-32"
                          />
                          <span className="text-text-muted">to</span>
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => handleUpdateDayTime(index, day.startTime, e.target.value)}
                            className="w-32"
                          />
                        </div>
                        
                        <ModernButton
                          variant="outline"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleRemoveDay(index)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormField label="Description">
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description and details..."
                />
              </FormField>
            </>
          )}

          {/* Step 2: Group Selection (only for Temp Additional Course Day) */}
          {currentStep === 2 && eventForm.type === 'TempAdditionalCourseDay' && (
            <div className="space-y-6">
              <div className="text-center py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Select Groups</h3>
                <p className="text-text-secondary">
                  Choose which groups will participate in this additional course day. 
                  Students from selected groups will be automatically enrolled.
                </p>
              </div>

              <FormField label="Search Groups">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search groups by name or subject..."
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
                  />
                </div>
              </FormField>
              
              <div className="max-h-96 overflow-y-auto border border-border rounded-lg p-4">
                <div className="space-y-4">
                  {Object.keys(getFilteredGroups()).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                      <p className="text-text-secondary">
                        {groupSearchQuery ? 'No groups found matching your search.' : 'No groups available.'}
                      </p>
                    </div>
                  ) : (
                    Object.entries(getFilteredGroups()).map(([subjectId, groups]) => {
                      const subjectName = groups[0]?.subjectName || 'Unknown Subject';
                      return (
                        <div key={subjectId} className="space-y-3">
                          <h4 className="text-sm font-medium text-text-primary border-b border-border pb-2">
                            {subjectName}
                          </h4>
                          <div className="grid grid-cols-1 gap-2 ml-4">
                            {groups.map(group => (
                              <label key={group.id} className="flex items-center space-x-3 cursor-pointer hover:bg-surface-hover p-3 rounded-lg border border-border">
                                <input
                                  type="checkbox"
                                  checked={eventForm.selectedGroups.includes(group.id)}
                                  onChange={() => handleAddGroup(group.id)}
                                  className="w-4 h-4"
                                />
                                <div className="flex-1">
                                  <span className="text-text-primary font-medium">{group.name}</span>
                                  <p className="text-xs text-text-secondary">
                                    {group.capacity || 0} capacity
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {eventForm.selectedGroups.length > 0 && (
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {eventForm.selectedGroups.length} group(s) selected
                      </p>
                      <p className="text-xs text-text-secondary">
                        Auto-enrolling {getStudentsFromSelectedGroups().length} students
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-interactive">
                        {getStudentsFromSelectedGroups().length} students
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4 pt-4 border-t border-border">
            <ModernButton
              variant="outline"
              className="flex-1"
              onClick={() => setIsAddEventOpen(false)}
            >
              Cancel
            </ModernButton>
            
            {currentStep === 2 && (
              <ModernButton
                variant="outline"
                className="flex-1"
                onClick={handlePreviousStep}
              >
                Previous
              </ModernButton>
            )}
            
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={handleNextStep}
              disabled={!canProceedToNextStep()}
            >
              {currentStep === 1 && eventForm.type === 'TempAdditionalCourseDay' 
                ? 'Next' 
                : 'Create Event'
              }
            </ModernButton>
          </div>
        </div>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        title="Select Date"
        size="md"
        zIndex={110}
      >
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {/* Calendar header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-text-muted py-2">
                {day}
              </div>
            ))}
            
            {/* Generate calendar for current month */}
            {(() => {
              const today = new Date();
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              const firstDay = new Date(currentYear, currentMonth, 1);
              const lastDay = new Date(currentYear, currentMonth + 1, 0);
              const daysInMonth = lastDay.getDate();
              const startingDayOfWeek = firstDay.getDay();
              
              const days = [];
              
              // Add empty cells for days before the first day of the month
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(<div key={`empty-${i}`} className="h-10"></div>);
              }
              
              // Add days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = eventForm.selectedDays.some(d => d.date === dateString);
                const isPast = new Date(dateString) < new Date(new Date().setHours(0, 0, 0, 0));
                
                days.push(
                  <button
                    key={day}
                    onClick={() => {
                      if (!isPast && !isSelected) {
                        handleAddDay(dateString);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    disabled={isPast || isSelected}
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-interactive text-background cursor-not-allowed'
                        : isPast
                        ? 'text-text-muted cursor-not-allowed'
                        : 'text-text-primary hover:bg-surface-hover border border-border'
                    }`}
                  >
                    {day}
                  </button>
                );
              }
              
              return days;
            })()}
          </div>
          
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <ModernButton
              variant="outline"
              onClick={() => setIsDatePickerOpen(false)}
            >
              Cancel
            </ModernButton>
          </div>
        </div>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditEventOpen}
        onClose={() => {
          setIsEditEventOpen(false);
          setEditingEvent(null);
        }}
        title={`Edit Event - ${editingEvent?.name || ''}`}
        size="lg"
        zIndex={100}
      >
        <div className="p-6 space-y-6">
          {/* Step Progress Indicator */}
          {editingEvent?.type === 'TempAdditionalCourseDay' && (
            <div className="flex items-center space-x-4 mb-6">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-interactive' : 'text-text-muted'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? 'bg-interactive text-background' : 'bg-surface-secondary text-text-muted'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Event Details</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-interactive' : 'text-text-muted'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? 'bg-interactive text-background' : 'bg-surface-secondary text-text-muted'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Manage Groups</span>
              </div>
            </div>
          )}

          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <>
              <FormField label="Event Name" required>
                <Input
                  value={eventForm.name}
                  onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Science Fair 2024"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Event Type" required>
                  <Input
                    value={eventForm.type}
                    disabled
                    className="bg-surface-secondary text-text-muted cursor-not-allowed"
                  />
                </FormField>

                {eventForm.type === 'Normal' && (
                  <FormField label="Fee (DH)">
                    <Input
                      type="number"
                      value={eventForm.fee}
                      onChange={(e) => setEventForm(prev => ({ ...prev, fee: e.target.value }))}
                      placeholder="0"
                    />
                  </FormField>
                )}
              </div>

              {/* Date and Time Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-secondary">Event Schedule</label>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    iconPosition="left"
                    onClick={() => setIsDatePickerOpen(true)}
                  >
                    Add Day
                  </ModernButton>
                </div>
                
                {eventForm.selectedDays.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                    <p className="text-text-secondary">No days selected. Click "Add Day" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventForm.selectedDays.map((day, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-text-primary">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => handleUpdateDayTime(index, e.target.value, day.endTime)}
                            className="w-32"
                          />
                          <span className="text-text-muted">to</span>
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => handleUpdateDayTime(index, day.startTime, e.target.value)}
                            className="w-32"
                          />
                        </div>
                        
                        <ModernButton
                          variant="outline"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleRemoveDay(index)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormField label="Description">
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description and details..."
                />
              </FormField>
            </>
          )}

          {/* Step 2: Group Management (only for Temp Additional Course Day) */}
          {currentStep === 2 && editingEvent?.type === 'TempAdditionalCourseDay' && (
            <div className="space-y-6">
              <div className="text-center py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Manage Groups</h3>
                <p className="text-text-secondary">
                  Add or remove groups from this additional course day. 
                  Students will be automatically enrolled or unenrolled based on your changes.
                </p>
              </div>

              <FormField label="Search Groups">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search groups by name or subject..."
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
                  />
                </div>
              </FormField>
              
              <div className="max-h-96 overflow-y-auto border border-border rounded-lg p-4">
                <div className="space-y-4">
                  {Object.keys(getFilteredGroups()).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                      <p className="text-text-secondary">
                        {groupSearchQuery ? 'No groups found matching your search.' : 'No groups available.'}
                      </p>
                    </div>
                  ) : (
                    Object.entries(getFilteredGroups()).map(([subjectId, groups]) => {
                      const subjectName = groups[0]?.subjectName || 'Unknown Subject';
                      return (
                        <div key={subjectId} className="space-y-3">
                          <h4 className="text-sm font-medium text-text-primary border-b border-border pb-2">
                            {subjectName}
                          </h4>
                          <div className="grid grid-cols-1 gap-2 ml-4">
                            {groups.map(group => (
                              <label key={group.id} className="flex items-center space-x-3 cursor-pointer hover:bg-surface-hover p-3 rounded-lg border border-border">
                                <input
                                  type="checkbox"
                                  checked={eventForm.selectedGroups.includes(group.id)}
                                  onChange={() => handleAddGroup(group.id)}
                                  className="w-4 h-4"
                                />
                                <div className="flex-1">
                                  <span className="text-text-primary font-medium">{group.name}</span>
                                  <p className="text-xs text-text-secondary">
                                    {group.capacity || 0} capacity
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {eventForm.selectedGroups.length > 0 && (
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {eventForm.selectedGroups.length} group(s) selected
                      </p>
                      <p className="text-xs text-text-secondary">
                        Auto-enrolling {getStudentsFromSelectedGroups().length} students
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-interactive">
                        {getStudentsFromSelectedGroups().length} students
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4 pt-4 border-t border-border">
            <ModernButton
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsEditEventOpen(false);
                setEditingEvent(null);
              }}
            >
              Cancel
            </ModernButton>
            
            {currentStep === 2 && (
              <ModernButton
                variant="outline"
                className="flex-1"
                onClick={handlePreviousStep}
              >
                Previous
              </ModernButton>
            )}
            
            <ModernButton
              variant="solid"
              className="flex-1"
              onClick={currentStep === 1 && editingEvent?.type === 'TempAdditionalCourseDay' 
                ? () => setCurrentStep(2)
                : handleUpdateEvent
              }
              disabled={!canProceedToNextStep()}
            >
              {currentStep === 1 && editingEvent?.type === 'TempAdditionalCourseDay' 
                ? 'Manage Groups' 
                : 'Update Event'
              }
            </ModernButton>
          </div>
        </div>
      </Modal>

    </div>
  );
};