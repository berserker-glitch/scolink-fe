import React from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Clock,
  School
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';

export const Dashboard: React.FC = () => {

  // Fetch data
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiService.getStudents(1, 1000),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiService.getTeachers(1, 1000),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(1, 1000),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiService.getSubjects(1, 1000),
  });

  const totalStudents = studentsData?.pagination?.total || 0;
  const totalTeachers = teachersData?.pagination?.total || 0;
  const totalGroups = groupsData?.pagination?.total || 0;
  const totalSubjects = subjectsData?.pagination?.total || 0;

  // Get today's data
  const today = new Date();
  const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Filter today's groups
  const todayGroups = groupsData?.groups?.filter(group => 
    group.schedules?.some(schedule => schedule.day === todayDayName)
  ) || [];

  // Get unique subjects for today
  const subjects = subjectsData?.subjects || [];
  const todaySubjectIds = new Set(todayGroups.map(g => g.subjectId).filter(Boolean));
  const todaySubjects = subjects.filter(s => todaySubjectIds.has(s.id)).map(s => s.name);

  // Get unique teachers for today
  const teachers = teachersData?.teachers || [];
  const todayTeacherIds = new Set(todayGroups.map(g => g.teacherId).filter(Boolean));
  const todayTeachers = teachers.filter(t => todayTeacherIds.has(t.id)).map(t => t.name);

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Dashboard</h1>
        <p className="text-sm text-text-secondary">{dateString}</p>
      </div>

      {/* Grid Layout - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Students */}
        <div className="space-y-4">
          {/* Total Students Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-surface/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">{totalStudents}</p>
                  <p className="text-sm text-blue-100 mt-1">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Students List */}
          <Card className="bg-surface shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-text-primary">Students Today</h3>
              </div>
              {todayGroups.length > 0 ? (
                <div className="space-y-2">
                  {todayGroups.slice(0, 5).map((group, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 dark:bg-blue-950/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 dark:hover:bg-blue-950/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-50 dark:bg-blue-950/200 rounded-full"></div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{group.name}</p>
                          <p className="text-xs text-text-muted">{group.studentCount || 0} students</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {todayGroups.length > 5 && (
                    <p className="text-xs text-text-muted text-center pt-2">
                      +{todayGroups.length - 5} more groups
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No students scheduled today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Teachers */}
        <div className="space-y-4">
          {/* Total Teachers Card */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-surface/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">{totalTeachers}</p>
                  <p className="text-sm text-green-100 mt-1">Total Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Teachers List */}
          <Card className="bg-surface shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-green-600" />
                <h3 className="text-base font-bold text-text-primary">Teachers Today</h3>
              </div>
              {todayTeachers.length > 0 ? (
                <div className="space-y-2">
                  {todayTeachers.slice(0, 8).map((teacher, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors">
                      <div className="w-8 h-8 bg-green-50 dark:bg-green-950/200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{teacher.charAt(0)}</span>
                      </div>
                      <p className="text-sm font-medium text-text-primary truncate">{teacher}</p>
                    </div>
                  ))}
                  {todayTeachers.length > 8 && (
                    <p className="text-xs text-text-muted text-center pt-2">
                      +{todayTeachers.length - 8} more teachers
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No teachers scheduled today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Groups & Subjects */}
        <div className="space-y-4">
          {/* Total Groups & Subjects Card */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-surface/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <School className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">{totalGroups}</p>
                  <p className="text-sm text-purple-100 mt-1">{totalSubjects} Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Classes & Subjects List */}
          <Card className="bg-surface shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-text-primary">Today's Classes</h3>
              </div>
              
              {todayGroups.length > 0 ? (
                <div className="space-y-3">
                  {/* Classes */}
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Scheduled Classes</p>
                    <div className="space-y-2">
                      {todayGroups.slice(0, 5).map((group, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <School className="w-4 h-4 text-purple-600" />
                            <p className="text-sm font-medium text-text-primary">{group.name}</p>
                          </div>
                          <span className="text-xs text-text-muted">{group.studentCount || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subjects */}
                  {todaySubjects.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase mb-2">Subjects</p>
                      <div className="flex flex-wrap gap-2">
                        {todaySubjects.slice(0, 6).map((subject, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            <BookOpen className="w-3 h-3" />
                            {subject}
                          </span>
                        ))}
                        {todaySubjects.length > 6 && (
                          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-text-secondary rounded-full text-xs font-medium">
                            +{todaySubjects.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <School className="w-12 h-12 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No classes scheduled today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};