import React from 'react';
import { Clock, Users } from 'lucide-react';

interface ClassRoutineSidebarProps {
  groups: any[];
  subjects: any[];
  teachers: any[];
}

export const ClassRoutineSidebar: React.FC<ClassRoutineSidebarProps> = ({
  groups,
  subjects,
  teachers
}) => {
  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'No teacher assigned';
    return teachers.find(t => t.id === teacherId)?.name || 'Unknown Teacher';
  };

  const getTeacherAvatar = (teacherId?: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return null;
    
    // Generate avatar based on teacher name
    const initials = teacher.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
    
    const colors = [
      'bg-purple-500', 'bg-violet-500', 'bg-indigo-500', 
      'bg-pink-500', 'bg-amber-500', 'bg-fuchsia-500'
    ];
    
    const colorIndex = teacherId ? teacherId.charCodeAt(0) % colors.length : 0;
    
    return (
      <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-medium`}>
        {initials}
      </div>
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Group subjects by type/category for display
  const groupedSubjects = groups.reduce((acc: any, group) => {
    const subject = subjects.find(s => s.id === group.subjectId);
    if (!subject) return acc;
    
    const key = subject.fieldName || 'General';
    if (!acc[key]) acc[key] = [];
    
    acc[key].push({
      ...group,
      subjectName: subject.name,
      subjectColor: getSubjectColor(subject.name)
    });
    
    return acc;
  }, {});

  function getSubjectColor(subjectName: string) {
    const colors = {
      'Mathematics': 'text-purple-600',
      'Physics': 'text-violet-600',
      'Chemistry': 'text-indigo-600',
      'Biology': 'text-orange-600',
      'Computer Science': 'text-indigo-600',
      'English': 'text-pink-600',
      'History': 'text-yellow-600',
      'Geography': 'text-teal-600'
    };
    
    // Try to match by keywords
    for (const [key, color] of Object.entries(colors)) {
      if (subjectName.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    
    return 'text-gray-600';
  }

  return (
    <div className="w-80 bg-surface border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Class Routine</h2>
        
        <div className="space-y-6">
          {Object.entries(groupedSubjects).map(([category, categoryGroups]: [string, any]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                {category}
              </h3>
              
              <div className="space-y-3">
                {categoryGroups.map((group: any) => (
                  <div key={group.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    {/* Subject indicator */}
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        group.subjectName?.includes('Mathematics') ? 'bg-purple-500' :
                        group.subjectName?.includes('Physics') ? 'bg-violet-500' :
                        group.subjectName?.includes('Chemistry') ? 'bg-indigo-500' :
                        group.subjectName?.includes('Computer') ? 'bg-indigo-500' :
                        group.subjectName?.includes('Biology') ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {group.subjectName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatDate(new Date())}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2">{group.name}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Teacher avatars */}
                          <div className="flex -space-x-1">
                            {getTeacherAvatar(group.teacherId)}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            <span>{group.studentCount || 0}</span>
                          </div>
                        </div>
                        
                        {group.schedules?.[0] && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{group.schedules[0].startTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
