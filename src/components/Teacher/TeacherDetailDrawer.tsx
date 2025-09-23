import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModernButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, Teacher, Group } from '@/services/api';
import {
  User,
  BookOpen,
  Users,
  Phone,
  Mail,
  GraduationCap,
  MapPin,
  Clock,
  Calendar,
  X
} from 'lucide-react';

interface TeacherDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}

export const TeacherDetailDrawer: React.FC<TeacherDetailDrawerProps> = ({
  isOpen,
  onClose,
  teacher
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


  if (!teacher) {
    return null;
  }

  return (
    <div className="w-full bg-white h-full overflow-hidden flex flex-col shadow-lg">
      <div className="p-4 shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {teacher.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Teacher Details & Management
            </p>
          </div>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="w-4 h-4" />
          </ModernButton>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'info' | 'groups')} className="h-full flex flex-col">
          <div className="px-6 pt-4 shadow-sm">
            <TabsList className="grid w-full grid-cols-2 bg-surface-secondary p-1 rounded-lg h-12 shadow-sm">
              <TabsTrigger 
                value="info" 
                className="flex items-center justify-center rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200"
              >
                <User className="w-5 h-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="groups" 
                className="flex items-center justify-center rounded-sm data-[state=active]:bg-interactive data-[state=active]:text-white data-[state=inactive]:text-text-muted hover:text-text-primary transition-all duration-200"
              >
                <Users className="w-5 h-5" />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="info" className="space-y-4">
              {/* Profile Header - Minimal */}
              <div className="text-center py-6 bg-surface rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-3 bg-interactive rounded-full flex items-center justify-center shadow-md">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-1">
                  {teacher.name}
                </h2>
                <p className="text-sm text-text-secondary">
                  {teacher.email}
                </p>
                <div className="mt-3">
                  <Badge variant={teacher.isActive ? "default" : "secondary"}>
                    {teacher.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

                {/* Information Grid - Minimal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-interactive" />
                      <span className="text-sm font-medium text-text-secondary">Email</span>
                    </div>
                    <p className="text-text-primary font-medium truncate">{teacher.email}</p>
                  </div>

                  <div className="p-4 bg-surface rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-interactive" />
                      <span className="text-sm font-medium text-text-secondary">Phone</span>
                    </div>
                    <p className="text-text-primary font-medium">{teacher.phone || 'Not provided'}</p>
                  </div>

                  <div className="p-4 bg-surface rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-interactive" />
                      <span className="text-sm font-medium text-text-secondary">Subjects</span>
                    </div>
                    <p className="text-text-primary font-medium">{teacher.subjects?.length || 0} subjects</p>
                  </div>

                  <div className="p-4 bg-surface rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-interactive" />
                      <span className="text-sm font-medium text-text-secondary">Groups</span>
                    </div>
                    <p className="text-text-primary font-medium">{teacher.groupsCount || 0} groups</p>
                  </div>
                </div>

                {/* Bio - Only if exists */}
                {teacher.bio && (
                  <div className="p-4 bg-surface rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-text-muted" />
                      <span className="text-sm font-medium text-text-secondary">Bio</span>
                    </div>
                    <p className="text-text-primary text-sm truncate">{teacher.bio}</p>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-interactive" />
                <h3 className="text-lg font-semibold text-text-primary">
                  Groups Taught ({groupsLoading ? '...' : teacherGroups.length})
                </h3>
              </div>

              {groupsLoading ? (
                <div className="bg-surface rounded-lg shadow-sm p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                  <p className="text-text-secondary">Loading groups...</p>
                </div>
              ) : teacherGroups.length === 0 ? (
                <div className="bg-surface rounded-lg shadow-sm p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-text-muted" />
                  <p className="text-text-secondary">This teacher is not assigned to any groups yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teacherGroups.map((group) => (
                    <div key={group.id} className="bg-surface rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-interactive/10 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-interactive" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary break-words">{group.name}</h4>
                            <p className="text-sm text-text-secondary break-words">{group.subjectName}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {group.studentCount || 0}/{group.capacity} students
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
