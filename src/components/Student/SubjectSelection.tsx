import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Check } from 'lucide-react';

interface SubjectSelectionProps {
  selectedSubjects: string[];
  onSubjectToggle: (subjectId: string) => void;
  error?: string;
  showTotalFee?: boolean;
}

export const SubjectSelection: React.FC<SubjectSelectionProps> = ({
  selectedSubjects,
  onSubjectToggle,
  error,
  showTotalFee = false
}) => {
  const getTotalFee = () => {
    return selectedSubjects.reduce((total, subjectId) => {
      const subject = mockSubjects.find(s => s.id === subjectId);
      return total + (subject?.monthlyFee || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
          <p className="text-caption text-status-error">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockSubjects.map(subject => (
          <Card 
            key={subject.id}
            className={`cursor-pointer transition-all ${
              selectedSubjects.includes(subject.id)
                ? 'bg-interactive/10 border-interactive'
                : 'hover:bg-surface-hover'
            }`}
            onClick={() => onSubjectToggle(subject.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-text-primary">{subject.name}</h3>
                  <p className="text-caption text-text-secondary">{subject.monthlyFee} DH/month</p>
                </div>
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                  selectedSubjects.includes(subject.id)
                    ? 'bg-interactive border-interactive'
                    : 'border-border'
                }`}>
                  {selectedSubjects.includes(subject.id) && (
                    <Check className="w-4 h-4 text-background" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showTotalFee && selectedSubjects.length > 0 && (
        <Card className="surface-secondary">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-text-primary">Total Monthly Fee:</span>
              <span className="text-subheading font-bold text-text-primary">
                {getTotalFee()} DH
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
