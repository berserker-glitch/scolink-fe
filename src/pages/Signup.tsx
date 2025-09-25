import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppInput } from '@/components/ui/AppInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Users, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { apiService, SignupRequest } from '@/services/api';

interface CenterData {
  name: string;
  location: string;
  phoneNumber: string;
  email: string;
}

interface AdminData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    
    if (!centerData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(centerData.email.trim())) {
      newErrors.email = 'Email is invalid';
    }

    if (!centerData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
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

    if (!adminData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateCenterForm()) return;
      setCurrentStep(2);
      setErrors({});
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateAdminForm()) return;

    setIsLoading(true);
    
    try {
      const registrationData: SignupRequest = {
        center: {
          name: centerData.name.trim(),
          location: centerData.location.trim(),
          phoneNumber: centerData.phoneNumber.trim(),
          email: centerData.email.trim(),
        },
        admin: {
          email: adminData.email.trim(),
          password: adminData.password,
          fullName: adminData.fullName.trim(),
          phoneNumber: adminData.phoneNumber.trim(),
        }
      };

      await apiService.signup(registrationData);

      setSuccess(true);
      
      // Show success message and redirect after delay
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registration successful! Please wait for admin approval.' } });
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            currentStep >= 1 ? 'bg-interactive text-white' : 'bg-surface text-text-secondary'
          }`}>
            {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <span className={`ml-3 text-sm font-medium ${
            currentStep >= 1 ? 'text-interactive' : 'text-text-secondary'
          }`}>
            Business Info
          </span>
        </div>
        
        <ArrowRight className="w-5 h-5 text-text-secondary" />
        
        {/* Step 2 */}
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            currentStep >= 2 ? 'bg-interactive text-white' : 'bg-surface text-text-secondary'
          }`}>
            {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
          </div>
          <span className={`ml-3 text-sm font-medium ${
            currentStep >= 2 ? 'text-interactive' : 'text-text-secondary'
          }`}>
            Admin Account
          </span>
        </div>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-purple-50/40 to-blue-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="p-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-semibold text-text-primary mb-4">Registration Successful!</h1>
            <p className="text-text-secondary mb-6">
              Your registration has been submitted successfully. You will be redirected to the login page shortly.
            </p>
            <div className="animate-pulse text-interactive text-sm uppercase tracking-[0.3em]">
              Redirecting...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building2 className="w-16 h-16 text-interactive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary">Business Information</h2>
        <p className="text-text-secondary">Tell us about your educational center</p>
      </div>

      <div className="grid gap-6">
        <div>
          <AppInput 
            placeholder="Center Name *" 
            type="text"
            value={centerData.name}
            onChange={(e) => setCenterData(prev => ({ ...prev, name: e.target.value }))}
            disabled={isLoading}
            required
          />
          {errors.name && <p className="text-sm text-error mt-1">{errors.name}</p>}
        </div>

        <div>
          <Textarea
            placeholder="Full Address *"
            value={centerData.location}
            onChange={(e) => setCenterData(prev => ({ ...prev, location: e.target.value }))}
            disabled={isLoading}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-interactive focus:border-transparent"
          />
          {errors.location && <p className="text-sm text-error mt-1">{errors.location}</p>}
        </div>

        <div>
          <AppInput 
            placeholder="Business Email *" 
            type="email"
            value={centerData.email}
            onChange={(e) => setCenterData(prev => ({ ...prev, email: e.target.value }))}
            disabled={isLoading}
            required
          />
          {errors.email && <p className="text-sm text-error mt-1">{errors.email}</p>}
        </div>

        <div>
          <AppInput 
            placeholder="Phone Number *" 
            type="tel"
            value={centerData.phoneNumber}
            onChange={(e) => setCenterData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            disabled={isLoading}
            required
          />
          {errors.phoneNumber && <p className="text-sm text-error mt-1">{errors.phoneNumber}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleNextStep}
          disabled={isLoading || !centerData.name || !centerData.location || !centerData.email || !centerData.phoneNumber}
          className="group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-interactive px-6 py-3 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-interactive/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Admin Account
          <ArrowRight className="w-4 h-4 ml-2" />
          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
            <div className="relative h-full w-8 bg-white/20" />
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <Users className="w-16 h-16 text-interactive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary">Admin Account</h2>
        <p className="text-text-secondary">
          Create your admin account for <span className="font-semibold">{centerData.name}</span>
        </p>
      </div>

      <div className="grid gap-6">
        <div>
          <AppInput 
            placeholder="Full Name *" 
            type="text"
            value={adminData.fullName}
            onChange={(e) => setAdminData(prev => ({ ...prev, fullName: e.target.value }))}
            disabled={isLoading}
            required
          />
          {errors.fullName && <p className="text-sm text-error mt-1">{errors.fullName}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <AppInput 
              placeholder="Admin Email *" 
              type="email"
              value={adminData.email}
              onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isLoading}
              required
            />
            {errors.email && <p className="text-sm text-error mt-1">{errors.email}</p>}
          </div>
          <div>
            <AppInput 
              placeholder="Phone Number *" 
              type="tel"
              value={adminData.phoneNumber}
              onChange={(e) => setAdminData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              disabled={isLoading}
              required
            />
            {errors.phoneNumber && <p className="text-sm text-error mt-1">{errors.phoneNumber}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <AppInput 
              placeholder="Password *" 
              type="password"
              value={adminData.password}
              onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
              disabled={isLoading}
              required
            />
            {errors.password && <p className="text-sm text-error mt-1">{errors.password}</p>}
          </div>
          <div>
            <AppInput 
              placeholder="Confirm Password *" 
              type="password"
              value={adminData.confirmPassword}
              onChange={(e) => setAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              disabled={isLoading}
              required
            />
            {errors.confirmPassword && <p className="text-sm text-error mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-error bg-error/10">
          <AlertDescription className="text-error">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={handlePreviousStep}
          disabled={isLoading}
          className="group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-surface px-6 py-3 text-sm font-medium text-text-primary border border-border transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Business Info
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className="group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-interactive px-6 py-3 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-interactive/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Complete Registration'
          )}
          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
            <div className="relative h-full w-8 bg-white/20" />
          </div>
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-purple-50/40 to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="relative hidden flex-col justify-between bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-500 p-12 text-white lg:flex">
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.6)_0%,_transparent_55%)]" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <img src="/favicon.svg" alt="Scolink logo" className="h-14 w-14" />
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">Join Scolink</p>
                  <h2 className="text-2xl font-semibold">Educational Center Suite</h2>
                </div>
              </div>

              <h1 className="text-3xl font-semibold leading-tight">
                Onboard your center and empower your administration.
              </h1>

              <div className="space-y-4 text-sm text-white/80">
                <p>
                  Create your center workspace, invite staff, and coordinate operations from one modern platform. Our onboarding flow helps us tailor the experience to your needs.
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Check className="h-4 w-4" />
                    </span>
                    <p>Centralize student records, payments, and academic plans.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Check className="h-4 w-4" />
                    </span>
                    <p>Automate onboarding and approval with guided steps.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Check className="h-4 w-4" />
                    </span>
                    <p>Seamlessly transition to your dashboard once approved.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-10">
              <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                <p className="text-sm text-white/80">
                  “The Scolink onboarding guided our team every step of the way. We were operational in days.”
                </p>
                <div className="mt-4 text-sm font-medium text-white">- Center Director, Casablanca</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-semibold text-text-primary">Create your center account</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Complete the details below. Our team reviews each request to ensure the best fit.
                </p>
              </div>

              <div className="mb-8">
                {renderStepIndicator()}
              </div>

              <div className="text-left">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
              </div>

              <div className="mt-10 text-center text-sm text-text-secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-interactive hover:text-interactive/80"
                >
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
