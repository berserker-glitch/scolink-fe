import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModernButton } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, type UpdatePaymentRequest, type Payment } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface PaymentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export const PaymentEditModal: React.FC<PaymentEditModalProps> = ({
  isOpen,
  onClose,
  payment
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<UpdatePaymentRequest>({
    amount: 0,
    paidAmount: 0,
    status: 'pending',
    method: undefined,
    paymentDate: undefined,
    note: ''
  });
  
  const [paymentDate, setPaymentDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Initialize form data when payment changes
  useEffect(() => {
    if (payment) {
      setFormData({
        amount: Number(payment.amount),
        paidAmount: Number(payment.paidAmount) || 0,
        status: payment.status as any,
        method: payment.method as any,
        paymentDate: payment.paymentDate,
        note: payment.note || ''
      });
      
      if (payment.paymentDate) {
        setPaymentDate(new Date(payment.paymentDate));
      }
    }
  }, [payment]);

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: (data: UpdatePaymentRequest) => {
      if (!payment) throw new Error('No payment selected');
      return apiService.updatePayment(payment.id, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-summary'] });
      if (payment?.studentId) {
        queryClient.invalidateQueries({ queryKey: ['student-payments', payment.studentId] });
      }
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update payment"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payment) return;

    // Validate form
    if (formData.amount <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Amount must be greater than 0"
      });
      return;
    }

    if (formData.paidAmount < 0) {
      toast({
        variant: "destructive",
        title: "Validation Error", 
        description: "Paid amount cannot be negative"
      });
      return;
    }

    if (formData.paidAmount > formData.amount) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Paid amount cannot exceed total amount"
      });
      return;
    }

    const updateData: UpdatePaymentRequest = {
      ...formData,
      paymentDate: paymentDate?.toISOString()
    };

    updatePaymentMutation.mutate(updateData);
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({
      ...prev,
      status: status as any
    }));

    // Auto-adjust paid amount based on status
    if (status === 'paid' && formData.paidAmount < formData.amount) {
      setFormData(prev => ({
        ...prev,
        paidAmount: prev.amount
      }));
    } else if (status === 'pending' || status === 'overdue') {
      setFormData(prev => ({
        ...prev,
        paidAmount: 0
      }));
    }
  };

  const handlePaidAmountChange = (value: number) => {
    setFormData(prev => ({ ...prev, paidAmount: value }));

    // Auto-adjust status based on paid amount
    if (value >= formData.amount) {
      setFormData(prev => ({ ...prev, status: 'paid' }));
    } else if (value > 0) {
      setFormData(prev => ({ ...prev, status: 'partial' }));
    } else {
      setFormData(prev => ({ ...prev, status: 'pending' }));
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Payment Record
            <Badge variant="outline">
              {new Date(payment.month + '-01').toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Info */}
          <div className="p-4 bg-surface rounded-lg">
            <h4 className="font-medium text-text-primary mb-2">Student</h4>
            <p className="text-text-secondary">
              {(payment as any).student?.firstName} {(payment as any).student?.lastName}
            </p>
          </div>

          {/* Subjects Info */}
          <div className="p-4 bg-surface rounded-lg">
            <h4 className="font-medium text-text-primary mb-3">Subjects</h4>
            <div className="space-y-2">
              {payment.subjects?.map((subject: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-sm">{subject.subjectName || 'Unknown Subject'}</span>
                  <span className="text-sm font-medium">{Number(subject.amount || 0).toLocaleString()} DH</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Total Amount (DH) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  amount: Number(e.target.value) 
                }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Paid Amount (DH) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max={formData.amount}
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) => handlePaidAmountChange(Number(e.target.value))}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Payment Method
              </label>
              <Select 
                value={formData.method || ''} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  method: value as any || undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Payment Date
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <ModernButton
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, 'PPP') : 'Select date'}
                </ModernButton>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => {
                    setPaymentDate(date);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Notes
            </label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Add any notes about this payment..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            <ModernButton
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updatePaymentMutation.isPending}
            >
              Cancel
            </ModernButton>
            <ModernButton
              type="submit"
              variant="solid"
              disabled={updatePaymentMutation.isPending}
            >
              {updatePaymentMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Update Payment
            </ModernButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
