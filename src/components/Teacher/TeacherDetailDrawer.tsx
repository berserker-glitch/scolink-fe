import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Teacher, Group } from '@/services/api';
import { 
  User, 
  BookOpen, 
  Users, 
  Trash2, 
  Phone,
  Mail,
  GraduationCap,
  MapPin,
  Clock,
  Calendar
} from 'lucide-react';

interface TeacherDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  onEdit?: (teacher: Teacher) => void;
  onDelete?: (teacherId: string) => void;
}

export const TeacherDetailDrawer: React.FC<TeacherDetailDrawerProps> = ({
  isOpen,
  onClose,
  teacher,
  onEdit,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'groups'>('info');

  const queryClient = useQueryClient();

  // Get all groups and filter by teacher ID
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(1, 100),
    enabled: isOpen,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.getSubjects(1, 100),
    enabled: isOpen,
  });

  const teacherGroups = groupsData?.groups?.filter(group => group.teacherId === teacher?.id) || [];
  const subjects = subjectsData?.subjects || [];

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: () => apiService.deleteTeacher(teacher!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      onClose();
      if (onDelete && teacher) {
        onDelete(teacher.id);
      }
    },
  });

  const handleDeleteTeacher = () => {
    if (!teacher || !confirm('Are you sure you want to delete this teacher?')) return;
    deleteTeacherMutation.mutate();
  };

  if (!teacher) {
    return null;
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="!w-[50%] !max-w-[50vw] h-full overflow-hidden" style={{ width: '50%', maxWidth: '50vw' }}>
          <SheetHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" />
                  {teacher.name}
                </SheetTitle>
                <p className="text-sm text-text-secondary mt-1">
                  Teacher Details & Groups
                </p>
              </div>
              <div className="flex items-center gap-2">
                <BrutalistButton
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteTeacher}
                  disabled={deleteTeacherMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </BrutalistButton>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'info' | 'groups')} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Teacher Info
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Groups Taught ({teacherGroups.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="flex-1 overflow-y-auto p-6 mt-0">
                {/* Personal Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Full Name</label>
                        <p className="text-text-primary font-medium">{teacher.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Email</label>
                        <p className="text-text-primary font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {teacher.email}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Phone</label>
                        <p className="text-text-primary font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {teacher.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Groups Count</label>
                        <p className="text-text-primary font-medium">
                          {teacher.groupsCount || 0} groups
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Bio</label>
                        <p className="text-text-primary font-medium">
                          {teacher.bio || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Status</label>
                        <Badge variant={teacher.isActive ? "default" : "secondary"}>
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Teacher ID</label>
                        <p className="text-text-primary font-mono text-sm">{teacher.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Created</label>
                        <p className="text-text-primary text-sm">{new Date(teacher.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Last Updated</label>
                        <p className="text-text-primary text-sm">{new Date(teacher.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="groups" className="flex-1 overflow-y-auto p-6 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Groups Taught ({groupsLoading ? '...' : teacherGroups.length})
                  </h3>
                </div>

                {groupsLoading ? (
                  <Card className="surface-secondary">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                      <p className="text-text-secondary">Loading groups...</p>
                    </CardContent>
                  </Card>
                ) : teacherGroups.length === 0 ? (
                  <Card className="surface-secondary">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                      <p className="text-text-secondary">This teacher is not assigned to any groups yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {teacherGroups.map((group) => (
                      <Card key={group.id} className="surface-secondary hover:bg-surface-hover transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-text-primary">
                                  {group.name}
                                </h4>
                                <Badge variant="outline">
                                  {group.subjectName}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-text-secondary">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {group.schedules?.map((schedule, index) => (
                                        <span key={index}>
                                          {schedule.day} {schedule.startTime}-{schedule.endTime}
                                          {index < group.schedules!.length - 1 ? ', ' : ''}
                                        </span>
                                      ))}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-text-secondary">
                                    <MapPin className="w-4 h-4" />
                                    <span>{group.classNumber}</span>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-text-secondary">
                                    <Users className="w-4 h-4" />
                                    <span>{group.studentCount || 0}/{group.capacity} students</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
};
