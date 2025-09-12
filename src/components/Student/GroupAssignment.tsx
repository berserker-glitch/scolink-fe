import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Check } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  monthlyFee: number;
}

interface Group {
  id: string;
  name: string;
  subjectId?: string;
  subjectName?: string;
  classNumber: string;
  capacity: number;
  studentCount?: number;
  teacherName?: string;
  schedules?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

interface GroupAssignmentProps {
  selectedSubjects: string[];
  selectedGroups: { [subjectKey: string]: string };
  onGroupSelect: (subjectKey: string, groupId: string) => void;
  errors?: { [key: string]: string };
  showSummary?: boolean;
  studentName?: string;
  availableSubjects?: Subject[];
  availableGroups?: Group[];
}

export const GroupAssignment: React.FC<GroupAssignmentProps> = ({
  selectedSubjects,
  selectedGroups,
  onGroupSelect,
  errors = {},
  showSummary = false,
  studentName,
  availableSubjects = [],
  availableGroups = []
}) => {
  const getTotalFee = () => {
    return selectedSubjects.reduce((total, subjectKey) => {
      const subject = availableSubjects.find(s => s.name === subjectKey || s.id === subjectKey);
      return total + (subject?.monthlyFee || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {selectedSubjects.map(subjectKey => {
        const subject = availableSubjects.find(s => s.name === subjectKey || s.id === subjectKey);
        const subjectGroups = availableGroups.filter(g => 
          g.subjectName === subjectKey || g.subjectId === subjectKey || g.subjectId === subject?.id
        );
        const error = errors[`group_${subjectKey}`];

        return (
          <div key={subjectKey} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text-primary">{subject?.name || subjectKey} - Select Group</h3>
              {error && (
                <span className="text-caption text-status-error">{error}</span>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {subjectGroups.map(group => {
                const isSelected = selectedGroups[subjectKey] === group.id;
                const schedule = group.schedules?.[0];
                
                return (
                  <Card
                    key={group.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-interactive/10 border-interactive'
                        : 'hover:bg-surface-hover'
                    }`}
                    onClick={() => onGroupSelect(subjectKey, group.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-text-primary">{group.name}</h4>
                          <p className="text-caption text-text-secondary">
                            {schedule ? `${schedule.day} ${schedule.startTime}-${schedule.endTime}` : 'Schedule TBD'} • 
                            {group.classNumber} • {group.studentCount || 0}/{group.capacity} students
                          </p>
                          {group.teacherName && (
                            <p className="text-caption text-text-muted">Teacher: {group.teacherName}</p>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 ${
                          isSelected ? 'bg-interactive border-interactive' : 'border-border'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-background m-0.5" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {showSummary && (
        <Card className="surface-secondary">
          <CardContent className="p-6">
            <h3 className="text-subheading font-semibold text-text-primary mb-4">Summary</h3>
            <div className="space-y-2">
              {studentName && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Student:</span>
                  <span className="text-text-primary">{studentName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Subjects:</span>
                <span className="text-text-primary">{selectedSubjects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Monthly Fee:</span>
                <span className="text-subheading font-bold text-text-primary">{getTotalFee()} DH</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
