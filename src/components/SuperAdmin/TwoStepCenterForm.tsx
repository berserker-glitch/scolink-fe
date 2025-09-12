import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Users, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { apiService, Center } from '@/services/api';

interface TwoStepCenterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (center: Center, admin: any) => void;
}

interface CenterData {
  name: string;
  location: string;
  phoneNumber?: string;
  email?: string;
}

interface AdminData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
}

export const TwoStepCenterForm: React.FC<TwoStepCenterFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdCenter, setCreatedCenter] = useState<Center | null>(null);
  
  const [centerData, setCenterData] = useState<CenterData>({
    name: '',
    location: '',
    phoneNumber: '',
    email: '',
  });
  
  const [adminData, setAdminData] = useState<AdminData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCenterForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!centerData.name.trim()) {
      newErrors.name = 'Center name is required';
    } else if (centerData.name.trim().length < 2) {
      newErrors.name = 'Center name must be at least 2 characters';
    }
    
    if (!centerData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (centerData.location.trim().length < 5) {
      newErrors.location = 'Location must be at least 5 characters';
    }
    
    if (centerData.email && centerData.email.trim() && !/\S+@\S+\.\S+/.test(centerData.email.trim())) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdminForm = () => {
    const newErrors: Record<string, string> = {};

    if (!adminData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (adminData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!adminData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(adminData.email.trim())) {
      newErrors.email = 'Email is invalid';
    }

    if (!adminData.password) {
      newErrors.password = 'Password is required';
    } else if (adminData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (adminData.password !== adminData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!validateCenterForm()) return;
      
      setLoading(true);
      try {
        const center = await apiService.createCenter({
          name: centerData.name.trim(),
          location: centerData.location.trim(),
          phoneNumber: centerData.phoneNumber?.trim() || undefined,
          email: centerData.email?.trim() || undefined,
        });
        
        setCreatedCenter(center);
        setCurrentStep(2);
      } catch (error) {
        console.error('Error creating center:', error);
        setErrors({ submit: 'Failed to create center. Please try again.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAdminForm() || !createdCenter) return;
    
    setLoading(true);
    try {
      const admin = await apiService.createCenterAdmin(createdCenter.id, {
        email: adminData.email.trim(),
        password: adminData.password,
        fullName: adminData.fullName.trim(),
        phoneNumber: adminData.phoneNumber?.trim() || undefined,
      });
      
      onSuccess(createdCenter, admin);
      handleClose();
    } catch (error) {
      console.error('Error creating center admin:', error);
      setErrors({ submit: 'Failed to create admin. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setErrors({});
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCurrentStep(1);
      setCreatedCenter(null);
      setCenterData({
        name: '',
        location: '',
        phoneNumber: '',
        email: '',
      });
      setAdminData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phoneNumber: '',
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className={`ml-2 text-sm ${
            currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'
          }`}>
            Create Center
          </span>
        </div>
        
        <ArrowRight className="w-4 h-4 text-gray-400" />
        
        {/* Step 2 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className={`ml-2 text-sm ${
            currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'
          }`}>
            Create Admin
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900">Create New Center</h3>
        <p className="text-sm text-gray-600">Enter the basic information for the new center</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Center Name *</Label>
        <Input
          id="name"
          value={centerData.name}
          onChange={(e) => setCenterData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter center name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Textarea
          id="location"
          value={centerData.location}
          onChange={(e) => setCenterData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Enter full address"
          rows={3}
          className={errors.location ? 'border-red-500' : ''}
        />
        {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={centerData.phoneNumber}
            onChange={(e) => setCenterData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="centerEmail">Email</Label>
          <Input
            id="centerEmail"
            type="email"
            value={centerData.email}
            onChange={(e) => setCenterData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={handleNextStep}
          disabled={loading || !centerData.name || !centerData.location}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Creating Center...' : (
            <>
              Next: Create Admin
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmitAdmin} className="space-y-4">
      <div className="text-center mb-4">
        <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900">Create Admin User</h3>
        <p className="text-sm text-gray-600">
          Create an admin account for <span className="font-medium">{createdCenter?.name}</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={adminData.fullName}
          onChange={(e) => setAdminData(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder="Enter full name"
          className={errors.fullName ? 'border-red-500' : ''}
        />
        {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Email *</Label>
          <Input
            id="adminEmail"
            type="email"
            value={adminData.email}
            onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminPhone">Phone Number</Label>
          <Input
            id="adminPhone"
            type="tel"
            value={adminData.phoneNumber}
            onChange={(e) => setAdminData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={adminData.password}
            onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Enter password"
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={adminData.confirmPassword}
            onChange={(e) => setAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Confirm password"
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Center
        </Button>
        
        <Button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? 'Creating Admin...' : 'Complete Setup'}
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Setup New Center & Admin
          </DialogTitle>
          <DialogDescription className="text-center">
            Create a new center and assign an admin user in two simple steps
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStepIndicator()}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
