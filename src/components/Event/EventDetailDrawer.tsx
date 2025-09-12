import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { 
  Calendar, 
  Users, 
  Clock, 
  Edit, 
  Trash2, 
  MapPin,
  DollarSign,
  CalendarDays,
  Plus,
  Search
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Event, Student, Group } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EventDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  defaultTab?: 'details' | 'students';
  onEdit?: (event: Event) => void;
  isExternalEditOpen?: boolean;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  isOpen,
  onClose,
  event,
  defaultTab = 'details',
  onEdit,
  isExternalEditOpen = false
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'details' | 'students'>(defaultTab);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Fetch students for enrollment
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiService.getStudents(1, 1000),
    enabled: isAuthenticated && isOpen,
  });

  const students = studentsData?.students || [];
  const eventStudents = event?.enrollments?.map(e => e.student).filter(Boolean) || [];
  
  // Enroll student mutation
  const enrollStudentMutation = useMutation({
    mutationFn: ({ eventId, studentId }: { eventId: string; studentId: string }) =>
      apiService.enrollStudentInEvent(eventId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Student enrolled successfully."
      });
    },
    onError: (error) => {
      console.error('Error enrolling student:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enroll student."
      });
    }
  });

  // Unenroll student mutation
  const unenrollStudentMutation = useMutation({
    mutationFn: ({ eventId, studentId }: { eventId: string; studentId: string }) =>
      apiService.unenrollStudentFromEvent(eventId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success", 
        description: "Student unenrolled successfully."
      });
    },
    onError: (error) => {
      console.error('Error unenrolling student:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unenroll student."
      });
    }
  });

  // Bulk enroll students mutation
  const bulkEnrollMutation = useMutation({
    mutationFn: ({ eventId, studentIds }: { eventId: string; studentIds: string[] }) =>
      apiService.bulkEnrollStudentsInEvent(eventId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedStudents([]);
      toast({
        title: "Success",
        description: "Students enrolled successfully."
      });
    },
    onError: (error) => {
      console.error('Error enrolling students:', error);
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Failed to enroll students."
      });
    }
  });

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isRemoveStudentOpen, setIsRemoveStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Event form state for editing (in modal)
  const [eventForm, setEventForm] = useState({
    name: event?.name || '',
    type: event?.type || 'Normal' as 'Normal' | 'TempAdditionalCourseDay',
    fee: event?.fee?.toString() || '',
    description: event?.description || '',
    selectedStudents: [] as string[]
  });

  // Helper functions
  const getGroupNames = () => {
    if (!event?.groups || event.groups.length === 0) return 'All Students';
    return event.groups.map(eg => `${eg.group?.subjectName || 'Unknown'} - ${eg.group?.name || 'Unknown'}`).join(', ');
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

  const handleEditEvent = () => {
    if (onEdit && event) {
      onEdit(event);
      setIsEditOpen(false);
    }
  };

  const handleDeleteEvent = () => {
    // TODO: Implement actual event deletion logic
    console.log('Deleting event:', event.id);
    onClose();
  };

  const handleAddStudent = (studentId: string) => {
    if (eventForm.type === 'Normal') {
      setEventForm(prev => ({
        ...prev,
        selectedStudents: prev.selectedStudents.includes(studentId)
          ? prev.selectedStudents.filter(id => id !== studentId)
          : [...prev.selectedStudents, studentId]
      }));
    }
  };

  const handleAddStudentToEvent = (studentId: string) => {
    if (event) {
      enrollStudentMutation.mutate({ eventId: event.id, studentId });
      setIsAddStudentOpen(false);
    }
  };

  const handleRemoveStudentFromEvent = (studentId: string) => {
    if (event) {
      unenrollStudentMutation.mutate({ eventId: event.id, studentId });
    }
  };

  const getFilteredAvailableStudents = () => {
    const enrolledStudentIds = new Set(eventStudents.map(s => s?.id).filter(Boolean));
    const availableStudents = students.filter(student => !enrolledStudentIds.has(student.id));
    
    if (!studentSearchQuery) return availableStudents;
    
    return availableStudents.filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const searchTerm = studentSearchQuery.toLowerCase();
      
      return fullName.includes(searchTerm) || 
             student.yearName?.toLowerCase().includes(searchTerm) || 
             student.fieldName?.toLowerCase().includes(searchTerm);
    });
  };

  if (!event) return null;

  const isActive = isEventActive(event);
  const isExpired = isEventExpired(event);

  const handleOpenChange = (open: boolean) => {
    // Don't close the drawer if external edit modal is open
    if (!open && isExternalEditOpen) {
      return;
    }
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="!w-[50%] !max-w-[50vw] h-full flex flex-col" style={{ width: '50%', maxWidth: '50vw' }} disablePointerEvents={isEditOpen || isExternalEditOpen}>
        <SheetHeader className="border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                {event.name}
              </SheetTitle>
              <p className="text-sm text-text-secondary mt-1">
                Event Details & Management
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-caption px-2 py-1 rounded-full ${
                event.type === 'Normal' 
                  ? 'bg-interactive/20 text-interactive'
                  : 'bg-status-warning/20 text-status-warning'
              }`}>
                {event.type}
              </span>
              {isActive && (
                <span className="text-caption px-2 py-1 rounded-full bg-status-success/20 text-status-success">
                  Active
                </span>
              )}
              {isExpired && (
                <span className="text-caption px-2 py-1 rounded-full bg-text-muted/20 text-text-muted">
                  Expired
                </span>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-interactive border-b-2 border-interactive'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Event Details
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'students'
                ? 'text-interactive border-b-2 border-interactive'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Students ({students.length})
          </button>
        </div>

        {/* Tab Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {activeTab === 'details' ? (
            <>
              {/* Event Information Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Event Name</label>
                      <p className="text-text-primary font-medium">{event.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Event Type</label>
                      <p className="text-text-primary font-medium">{event.type}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-text-secondary">Event Schedules</label>
                      <div className="mt-2 space-y-2">
                        {event.schedules?.map((schedule, index) => (
                          <div key={index} className="flex items-center space-x-2 text-text-primary">
                            <Calendar className="w-4 h-4 text-text-muted" />
                            <span className="font-medium">
                              {new Date(schedule.date).toLocaleDateString()}
                            </span>
                            <Clock className="w-4 h-4 text-text-muted ml-4" />
                            <span>{schedule.startTime} - {schedule.endTime}</span>
                          </div>
                        )) || (
                          <p className="text-text-muted">No schedules set</p>
                        )}
                      </div>
                    </div>
                    {event.fee && event.fee > 0 && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Fee</label>
                        <p className="text-text-primary font-medium">{event.fee} DH per student</p>
                      </div>
                    )}
                    {event.groups && event.groups.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Target Groups</label>
                        <p className="text-text-primary font-medium">{getGroupNames()}</p>
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Description</label>
                      <p className="text-text-primary">{event.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Statistics Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Event Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Total Enrolled</label>
                      <p className="text-2xl font-bold text-text-primary">{students.length}</p>
                    </div>
                    {event.fee && event.fee > 0 && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Total Revenue</label>
                        <p className="text-2xl font-bold text-text-primary">
                          {(students.length * event.fee).toLocaleString()} DH
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <BrutalistButton 
                  variant="outline" 
                  onClick={() => onEdit ? onEdit(event) : setIsEditOpen(true)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Event
                </BrutalistButton>
                <BrutalistButton 
                  variant="danger" 
                  onClick={handleDeleteEvent}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Event
                </BrutalistButton>
              </div>
            </>
          ) : (
            /* Students Tab */
            <div className="space-y-6">
              {/* Student List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Enrolled Students ({students.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <BrutalistButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddStudentOpen(true);
                          setStudentSearchQuery('');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                      </BrutalistButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {eventStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                      <p className="text-text-secondary">No students enrolled in this event yet.</p>
                      <BrutalistButton
                        variant="primary"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setIsAddStudentOpen(true);
                          setStudentSearchQuery('');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Student
                      </BrutalistButton>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[75vh] overflow-y-auto">
                      {eventStudents.map(student => (
                        <Card key={student.id} className="surface-secondary">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-text-primary">
                                  {student.firstName} {student.lastName}
                                </h4>
                                <p className="text-sm text-text-secondary">
                                  {student.yearName || 'Unknown Year'} • {student.fieldName || 'Unknown Field'}
                                </p>
                                {/* Phone removed as it's not in the Student type */}
                              </div>
                              <div className="flex items-center gap-2">
                                {event.fee && event.fee > 0 && (
                                  <span className="px-2 py-1 rounded-full bg-interactive/20 text-interactive text-xs font-medium">
                                    {event.fee} DH
                                  </span>
                                )}
                                <BrutalistButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                // Properly type the student for removal
                                const fullStudent: Student = {
                                  ...student,
                                  sex: 'M',
                                  yearId: '',
                                  fieldId: '',
                                  phone: '',
                                  parentPhone: '',
                                  parentType: 'Guardian',
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                  centerId: '',
                                  isActive: true,
                                  tag: 'normal'
                                };
                                setSelectedStudent(fullStudent);
                                setIsRemoveStudentOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </BrutalistButton>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Edit Event Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Event: {event.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
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

                {/* Group selection removed - managed through main Events page */}
              </div>

              {/* Date and time fields removed - managed through main Events page */}

              <FormField label="Description">
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description and details..."
                />
              </FormField>

              {eventForm.type === 'Normal' && (
                <FormField label="Select Students">
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-2">
                      {students.slice(0, 20).map(student => (
                        <label key={student.id} className="flex items-center space-x-3 cursor-pointer hover:bg-surface-hover p-2 rounded">
                          <input
                            type="checkbox"
                            checked={eventForm.selectedStudents.includes(student.id)}
                            onChange={() => handleAddStudent(student.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-caption text-text-primary">
                            {student.firstName} {student.lastName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </FormField>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <BrutalistButton 
                  variant="outline" 
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </BrutalistButton>
                <BrutalistButton 
                  variant="primary" 
                  onClick={handleEditEvent}
                >
                  Update Event
                </BrutalistButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Student Modal */}
        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Student to Event
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <FormField label="Search Students">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search students by name, year, field..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text-primary focus-brutalist"
                  />
                </div>
              </FormField>

              <div className="max-h-96 overflow-y-auto border border-border rounded-lg p-4">
                <div className="grid grid-cols-1 gap-2">
                  {getFilteredAvailableStudents().length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                      <p className="text-text-secondary">
                        {studentSearchQuery ? 'No students found matching your search.' : 'No available students to add.'}
                      </p>
                    </div>
                  ) : (
                    getFilteredAvailableStudents().map(student => (
                      <label key={student.id} className="flex items-center space-x-3 cursor-pointer hover:bg-surface-hover p-3 rounded-lg border border-border">
                        <input
                          type="radio"
                          name="selectedStudent"
                          value={student.id}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-interactive rounded-lg flex items-center justify-center">
                              <span className="text-background font-bold text-sm">
                                {student.firstName[0]}{student.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-primary font-medium">
                                {student.firstName} {student.lastName}
                              </span>
                              <p className="text-sm text-text-secondary">
                                {student.yearName || 'Unknown Year'} • {student.fieldName || 'Unknown Field'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <BrutalistButton 
                  variant="outline" 
                  onClick={() => {
                    setIsAddStudentOpen(false);
                    setStudentSearchQuery('');
                  }}
                >
                  Cancel
                </BrutalistButton>
                <BrutalistButton 
                  variant="primary" 
                  onClick={() => {
                    const selectedElement = document.querySelector('input[name="selectedStudent"]:checked') as HTMLInputElement;
                    if (selectedElement?.value) {
                      handleAddStudentToEvent(selectedElement.value);
                    }
                  }}
                >
                  Add Student
                </BrutalistButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Remove Student Modal */}
        <Dialog open={isRemoveStudentOpen} onOpenChange={setIsRemoveStudentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Remove Student from Event
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {selectedStudent && (
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium text-text-primary">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {selectedStudent.yearName || 'Unknown Year'} • {selectedStudent.fieldName || 'Unknown Field'}
                  </p>
                </div>
              )}
              
              <p className="text-text-secondary">
                Are you sure you want to remove this student from the event? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <BrutalistButton 
                  variant="outline" 
                  onClick={() => setIsRemoveStudentOpen(false)}
                >
                  Cancel
                </BrutalistButton>
                <BrutalistButton 
                  variant="danger" 
                  onClick={() => {
                    if (selectedStudent) {
                      handleRemoveStudentFromEvent(selectedStudent.id);
                    }
                  }}
                >
                  Remove Student
                </BrutalistButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
};
