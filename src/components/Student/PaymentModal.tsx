import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModernButton } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Student } from '@/services/api';
import { 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onPaymentComplete: (payment: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  student,
  onPaymentComplete
}) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const months = [
    { value: '2024-01', label: 'January 2024' },
    { value: '2024-02', label: 'February 2024' },
    { value: '2024-03', label: 'March 2024' },
    { value: '2024-04', label: 'April 2024' },
    { value: '2024-05', label: 'May 2024' },
    { value: '2024-06', label: 'June 2024' },
    { value: '2024-07', label: 'July 2024' },
    { value: '2024-08', label: 'August 2024' },
    { value: '2024-09', label: 'September 2024' },
    { value: '2024-10', label: 'October 2024' },
    { value: '2024-11', label: 'November 2024' },
    { value: '2024-12', label: 'December 2024' }
  ];

  useEffect(() => {
    if (isOpen && student) {
      // Set current month as default
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(currentMonth);
      
      // Set all subjects as selected by default
      const subjects = student.subjects || [];
      setSelectedSubjects(subjects.map(sub => sub.subjectId));
    }
  }, [isOpen, student]);

  const getSubjectFee = (subjectId: string) => {
    // TODO: Implement API call to get subject fee
    return 100; // Default fee
  };

  const getTotalAmount = () => {
    return selectedSubjects.reduce((total, subjectId) => {
      return total + getSubjectFee(subjectId);
    }, 0);
  };

  const getSubjectName = (subjectId: string) => {
    // TODO: Implement API call to get subject name
    return 'Subject'; // Default name
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handlePayment = async () => {
    if (!student || selectedSubjects.length === 0 || !selectedMonth) return;

    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const payment = {
        id: `payment_${Date.now()}`,
        month: selectedMonth,
        subjectIds: selectedSubjects,
        amount: getTotalAmount(),
        date: new Date().toISOString(),
        status: 'paid' as const
      };

      onPaymentComplete(payment);
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isPaymentValid = selectedMonth && selectedSubjects.length > 0;

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Make Payment - {student.firstName} {student.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Month Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {months.map((month) => (
                  <button
                    key={month.value}
                    onClick={() => setSelectedMonth(month.value)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      selectedMonth === month.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-surface-hover'
                    }`}
                  >
                    <div className="font-medium">{month.label}</div>
                    <div className="text-sm text-text-secondary">
                      {getTotalAmount()} DH
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Select Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(student.subjects || []).map((subject) => {
                  const isSelected = selectedSubjects.includes(subject.subjectId);
                  const fee = getSubjectFee(subject.subjectId);
                  
                  return (
                    <div key={subject.subjectId} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                      <Checkbox
                        id={subject.subjectId}
                        checked={isSelected}
                        onCheckedChange={() => handleSubjectToggle(subject.subjectId)}
                      />
                      <label 
                        htmlFor={subject.subjectId} 
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-text-primary">
                              {getSubjectName(subject.subjectId)}
                            </div>
                            <div className="text-sm text-text-secondary">
                              Group: {subject.groupId}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {fee} DH
                          </Badge>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <span className="text-text-secondary">Selected Month:</span>
                  <span className="font-medium text-text-primary">
                    {months.find(m => m.value === selectedMonth)?.label || 'Not selected'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <span className="text-text-secondary">Subjects:</span>
                  <span className="font-medium text-text-primary">
                    {selectedSubjects.length} selected
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <span className="text-text-secondary">Total Amount:</span>
                  <span className="text-xl font-bold text-primary">
                    {getTotalAmount()} DH
                  </span>
                </div>

                {selectedSubjects.length > 0 && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="text-sm font-medium text-primary mb-2">Selected Subjects:</div>
                    <div className="space-y-1">
                      {selectedSubjects.map(subjectId => (
                        <div key={subjectId} className="flex items-center justify-between text-sm">
                          <span className="text-text-primary">{getSubjectName(subjectId)}</span>
                          <span className="text-text-secondary">{getSubjectFee(subjectId)} DH</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Message */}
          {!isPaymentValid && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Please select a month and at least one subject to proceed with payment.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <ModernButton 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </ModernButton>
          
          <ModernButton 
            variant="solid" 
            onClick={handlePayment}
            disabled={!isPaymentValid || isProcessing}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Payment
              </>
            )}
          </ModernButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
