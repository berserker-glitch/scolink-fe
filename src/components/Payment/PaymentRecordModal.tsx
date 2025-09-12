import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  DollarSign,
  AlertCircle,
  Calculator
} from 'lucide-react';
import { Student } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface PaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  defaultMonth?: string;
  onPaymentRecorded?: (payment: any) => void;
}

export const PaymentRecordModal: React.FC<PaymentRecordModalProps> = ({
  isOpen,
  onClose,
  student,
  defaultMonth,
  onPaymentRecorded
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'check' | 'other'>('cash');
  const [note, setNote] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate months for the current year
  const generateMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthLabel });
    }
    return months;
  };

  const months = generateMonths();

  // Get student's monthly payment status
  const { data: monthlyStatusData } = useQuery({
    queryKey: ['student-monthly-status', student?.id],
    queryFn: () => student ? apiService.getStudentMonthlyStatus(student.id) : null,
    enabled: isOpen && !!student,
  });

  const monthlyStatus = monthlyStatusData || [];

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (paymentData: any) => apiService.recordPayment(paymentData),
    onSuccess: (payment) => {
      toast({
        title: "Success",
        description: "Payment recorded successfully!"
      });
      
      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-payments', student?.id] });
      queryClient.invalidateQueries({ queryKey: ['student-monthly-status', student?.id] });
      
      if (onPaymentRecorded) {
        onPaymentRecorded(payment);
      }
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to record payment"
      });
    }
  });

  useEffect(() => {
    if (isOpen && student) {
      // Set current month as default or use provided month
      const currentMonth = defaultMonth || new Date().toISOString().slice(0, 7);
      setSelectedMonth(currentMonth);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      
      // Get payment status for the selected month
      const monthStatus = monthlyStatus.find(ms => ms.month === currentMonth);
      if (monthStatus) {
        setSelectedSubjects(monthStatus.subjects.map(s => s.subjectId));
        setPaidAmount(monthStatus.totalAmount);
      }
    }
  }, [isOpen, student, defaultMonth, monthlyStatus]);

  const getSelectedMonthData = () => {
    return monthlyStatus.find(ms => ms.month === selectedMonth);
  };

  const getTotalAmount = () => {
    const monthData = getSelectedMonthData();
    if (!monthData) return 0;
    
    return selectedSubjects.reduce((total, subjectId) => {
      const subject = monthData.subjects.find(s => s.subjectId === subjectId);
      return total + (subject?.amount || 0);
    }, 0);
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      const newSelected = prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId];
      
      // Auto-update paid amount when subjects change
      const monthData = getSelectedMonthData();
      if (monthData) {
        const newTotal = newSelected.reduce((total, id) => {
          const subject = monthData.subjects.find(s => s.subjectId === id);
          return total + (subject?.amount || 0);
        }, 0);
        setPaidAmount(newTotal);
      }
      
      return newSelected;
    });
  };

  const handleRecordPayment = async () => {
    if (!student || selectedSubjects.length === 0 || !selectedMonth) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a month and at least one subject."
      });
      return;
    }

    setIsProcessing(true);

    try {
      await recordPaymentMutation.mutateAsync({
        studentId: student.id,
        month: selectedMonth,
        subjectIds: selectedSubjects,
        paidAmount,
        paymentDate,
        method: paymentMethod,
        note: note.trim() || undefined
      });
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedMonth(defaultMonth || new Date().toISOString().slice(0, 7));
    setSelectedSubjects([]);
    setPaidAmount(0);
    setPaymentMethod('cash');
    setNote('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const monthData = getSelectedMonthData();
  const totalAmount = getTotalAmount();
  const isPaymentValid = selectedMonth && selectedSubjects.length > 0 && paidAmount > 0;

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Record Payment - {student.firstName} {student.lastName}
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
                {months.map((month) => {
                  const status = monthlyStatus.find(ms => ms.month === month.value);
                  const isOverdue = status?.status === 'overdue';
                  const isPaid = status?.status === 'paid';
                  
                  return (
                    <button
                      key={month.value}
                      onClick={() => setSelectedMonth(month.value)}
                      className={`p-3 border rounded-lg text-left transition-all relative ${
                        selectedMonth === month.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-surface-hover'
                      } ${
                        isPaid ? 'bg-green-50 border-green-200' : 
                        isOverdue ? 'bg-red-50 border-red-200' : ''
                      }`}
                    >
                      <div className="font-medium">{month.label}</div>
                      <div className="text-sm text-text-secondary">
                        {status ? `${status.paidAmount}/${status.totalAmount} DH` : 'No data'}
                      </div>
                      {isPaid && (
                        <Badge className="absolute top-1 right-1" variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </Badge>
                      )}
                      {isOverdue && !isPaid && (
                        <Badge className="absolute top-1 right-1" variant="destructive">
                          Overdue
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Subject Selection */}
          {monthData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Select Subjects to Pay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthData.subjects.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject.subjectId);
                    
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
                                {subject.subjectName}
                              </div>
                              <div className="text-sm text-text-secondary">
                                Monthly fee: {subject.amount} DH
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {subject.amount} DH
                              </Badge>
                              {subject.paid && (
                                <Badge variant="default">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Paid
                                </Badge>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Payment Date" required>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </FormField>

                <FormField label="Payment Method" required>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    options={[
                      { value: 'cash', label: 'Cash' },
                      { value: 'transfer', label: 'Bank Transfer' },
                      { value: 'check', label: 'Check' },
                      { value: 'other', label: 'Other' }
                    ]}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Total Amount" required>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={totalAmount}
                      readOnly
                      className="bg-surface text-text-secondary"
                    />
                    <span className="text-sm text-text-secondary">DH</span>
                  </div>
                </FormField>

                <FormField label="Amount Paid" required>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      min={0}
                      max={totalAmount}
                    />
                    <span className="text-sm text-text-secondary">DH</span>
                    <BrutalistButton
                      variant="outline"
                      size="sm"
                      onClick={() => setPaidAmount(totalAmount)}
                    >
                      <Calculator className="w-4 h-4" />
                    </BrutalistButton>
                  </div>
                </FormField>
              </div>

              <FormField label="Note (Optional)">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes about this payment..."
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
                  <span className="text-text-secondary">Total Amount:</span>
                  <span className="font-medium text-text-primary">{totalAmount} DH</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
                  <span className="text-text-secondary">Amount Paid:</span>
                  <span className="font-medium text-primary">{paidAmount} DH</span>
                </div>
                
                {paidAmount !== totalAmount && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-yellow-800">Remaining:</span>
                    <span className="font-medium text-yellow-800">{totalAmount - paidAmount} DH</span>
                  </div>
                )}

                <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
                  <span className="text-text-secondary">Status:</span>
                  <Badge 
                    variant={
                      paidAmount >= totalAmount ? "default" : 
                      paidAmount > 0 ? "secondary" : 
                      "destructive"
                    }
                  >
                    {paidAmount >= totalAmount ? "Fully Paid" : 
                     paidAmount > 0 ? "Partially Paid" : 
                     "Unpaid"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Message */}
          {!isPaymentValid && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Please select a month, at least one subject, and enter a payment amount.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-border">
          <BrutalistButton 
            variant="outline"
            onClick={handleReset}
            disabled={isProcessing}
          >
            Reset
          </BrutalistButton>
          
          <div className="flex gap-3">
            <BrutalistButton 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </BrutalistButton>
            
            <BrutalistButton 
              variant="primary" 
              onClick={handleRecordPayment}
              disabled={!isPaymentValid || isProcessing}
              className="min-w-[120px]"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Payment
                </>
              )}
            </BrutalistButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
