import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, ArrowRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PLANS, initializePaddle, openPaddleCheckout } from '@/lib/paddle';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

const PlanSelection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Get current plan status (with manual refetch capability)
  const { data: planStatus, refetch: refetchPlanStatus } = usePlanStatus({
    refetchOnWindowFocus: true // Refetch when window gets focus to check for payment completion
  });

  // Initialize Paddle on component mount
  React.useEffect(() => {
    const initPaddle = async () => {
      const paddle = await initializePaddle();
      if (!paddle) {
        setError('Failed to initialize payment system. Please try again later.');
      }
    };
    initPaddle();
  }, []);

  // Listen for payment completion event
  React.useEffect(() => {
    const handlePaymentCompleted = () => {
      setIsPaymentProcessing(false);
      console.log('Payment processing state reset');
    };

    window.addEventListener('paymentCompleted', handlePaymentCompleted);
    
    return () => {
      window.removeEventListener('paymentCompleted', handlePaymentCompleted);
    };
  }, []);

  // Define plans with the same structure as Pricing.tsx
  const plans = [
    {
      name: 'Basic',
      price: '$0',
      period: '/month',
      description: 'Perfect for small educational centers getting started',
      features: [
        { name: 'Up to 100 students', included: true },
        { name: 'Student management', included: true },
        { name: 'Basic payment tracking', included: true },
        { name: 'Basic group & scheduling', included: true },
        { name: 'No attendance taking', included: false },
        { name: 'No staff accounts', included: false },
        { name: 'No teacher accounts', included: false }
      ],
      buttonText: 'Start Free',
      popular: false,
      planId: 'basic'
    },
    {
      name: 'Professional',
      price: '$25',
      period: '/month',
      description: 'Ideal for growing educational institutions',
      features: [
        { name: 'Up to 1500 students', included: true },
        { name: 'Student management', included: true },
        { name: 'Fluid payment tracking', included: true },
        { name: 'Full group scheduling', included: true },
        { name: 'Staff accounts', included: true },
        { name: 'Attendance taking', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'No teacher accounts', included: false },
        { name: 'No unlimited subjects', included: false }
      ],
      buttonText: 'Start Professional Plan',
      popular: true,
      planId: 'professional'
    },
    {
      name: 'Premium',
      price: '$50',
      period: '/month',
      description: 'Complete solution for large educational institutions',
      features: [
        { name: 'Unlimited subjects & students', included: true },
        { name: 'Student management', included: true },
        { name: 'Everything fluid', included: true },
        { name: 'Teacher accounts', included: true },
        { name: 'Student accounts', included: true },
        { name: 'Staff accounts', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Dedicated account manager', included: true }
      ],
      buttonText: 'Start Premium Plan',
      popular: false,
      planId: 'premium'
    },
    {
      name: 'Lifetime',
      price: '$500',
      period: ' one-time',
      description: 'Same as Premium but pay once, use forever',
      features: [
        { name: 'Unlimited subjects & students', included: true },
        { name: 'Student management', included: true },
        { name: 'Everything fluid', included: true },
        { name: 'Teacher accounts', included: true },
        { name: 'Student accounts', included: true },
        { name: 'Staff accounts', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Beta features access', included: true }
      ],
      buttonText: 'Get Lifetime Access',
      popular: false,
      planId: 'lifetime'
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    if (isProcessing) return;
    
    setSelectedPlan(planId);
    setError('');
    setIsProcessing(true);

    try {
      // If Basic plan, update center directly and redirect
      if (planId === 'basic') {
        await apiService.updateCenterPlan(planId);
        // Manual refetch to get updated plan status immediately
        await refetchPlanStatus();
        // Invalidate other caches to ensure fresh data
        await queryClient.invalidateQueries({ queryKey: ['planStatus'] });
        // Small delay to ensure cache invalidation completes
        setTimeout(() => {
          // If user already had a plan, this is a downgrade - redirect to settings
          // If user didn't have a plan, this is initial selection - redirect to dashboard
          const isPlanChange = planStatus?.plan && planStatus.plan !== 'basic';
          const redirectPath = isPlanChange ? '/settings' : '/';
          navigate(redirectPath);
        }, 100);
        return;
      }

      // For paid plans, open Paddle checkout
      const plan = PLANS.find(p => p.id === planId);
      if (!plan?.paddlePriceId) {
        throw new Error('Invalid plan selected');
      }

      const checkoutData = {
        priceId: plan.paddlePriceId,
        customer: user?.email ? {
          email: user.email,
          name: user?.fullName
        } : undefined,
        customData: {
          centerId: user?.centerId,
          userId: user?.id,
          planId: planId
        },
        successCallback: async (data: any) => {
          console.log('Checkout success:', data);
          
          // Set payment processing state
          setIsPaymentProcessing(true);
          setIsProcessing(false);
          setSelectedPlan(null);
          
          // Try to close Paddle popup (if possible)
          try {
            // Close Paddle overlay if available
            const paddleOverlay = document.querySelector('.paddle-overlay, [data-paddle-overlay]');
            if (paddleOverlay) {
              paddleOverlay.remove();
            }
            
            // Hide body scroll lock that Paddle might have added
            document.body.style.overflow = '';
            
            console.log('Paddle popup closed, showing processing state');
          } catch (error) {
            console.log('Could not close Paddle popup automatically:', error);
          }
          
          // Show processing toast
          toast.info('💳 Processing your payment...', {
            description: 'Please wait while we confirm your payment.',
            duration: 10000,
          });
          
          // Fallback: automatically clear processing state after 60 seconds
          setTimeout(() => {
            if (isPaymentProcessing) {
              setIsPaymentProcessing(false);
              console.log('Payment processing timeout - clearing state');
            }
          }, 60000);
        },
        errorCallback: (error: any) => {
          console.error('Payment failed:', error);
          setError('Payment failed. Please try again.');
          
          // Show error toast
          toast.error('❌ Payment failed', {
            description: 'Your payment could not be processed. Please try again or contact support.',
            duration: 6000,
          });
          
          setIsProcessing(false);
          setSelectedPlan(null);
          setIsPaymentProcessing(false); // Clear processing state on error
        }
      };

      try {
        await openPaddleCheckout(checkoutData);
      } catch (error) {
        console.error('Failed to open checkout:', error);
        setError('Failed to open payment checkout. Please try again.');
        setIsProcessing(false);
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error('Plan selection error:', error);
      setError('Failed to process plan selection. Please try again.');
    } finally {
      // Only reset processing if it wasn't a checkout (which handles its own state)
      if (planId === 'basic') {
        setIsProcessing(false);
        setSelectedPlan(null);
      }
    }
  };


  return (
    <div className="min-h-screen" data-plan-selection>
      {/* Payment Processing Overlay */}
      {isPaymentProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-interactive" />
            <h2 className="text-2xl font-bold mb-2 text-text-primary">Processing Payment</h2>
            <p className="text-text-secondary mb-4">
              Please wait while we confirm your payment. This may take a few moments...
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
              <div className="w-2 h-2 bg-interactive rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-interactive rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-interactive rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <section className="pt-8 pb-4">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          </div>
        </section>
      )}

      {/* Title */}
      <section className="pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-black">
              {planStatus?.plan ? 'Change Your Plan' : 'Choose Your Plan'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {planStatus?.plan
                ? 'Upgrade or modify your current subscription to better fit your needs.'
                : 'Select the perfect plan for your educational institution.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="grid md:grid-cols-4 gap-6 max-w-7xl">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className="hover-lift border-0 shadow-lg relative rounded-lg"
                style={{
                  background: plan.popular
                    ? 'linear-gradient(135deg, hsl(258 90% 66%), hsl(258 90% 80%))'
                    : 'linear-gradient(145deg, hsl(307 100% 99%), hsl(258 30% 98%))'
                }}
              >
                {planStatus?.plan === plan.planId && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1 text-sm font-semibold">
                      Current Plan
                    </Badge>
                  </div>
                )}
                {plan.popular && planStatus?.plan !== plan.planId && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-black px-4 py-1 text-sm font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className={`text-2xl font-bold ${plan.popular ? 'text-white' : ''}`}>
                    {plan.name}
                  </CardTitle>
                  <div className={`text-5xl font-black mt-4 ${plan.popular ? 'text-white' : 'text-primary'}`}>
                    {plan.price}
                    <span className={`text-lg font-normal ${plan.popular ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`mt-4 text-sm ${plan.popular ? 'text-white/90' : 'text-muted-foreground'}`}>
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        {feature.included ? (
                          <CheckCircle className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-green-600'}`} />
                        ) : (
                          <X className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-white/50' : 'text-gray-400'}`} />
                        )}
                        <span className={`text-sm ${plan.popular ? 'text-white' : feature.included ? '' : 'text-muted-foreground line-through'}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full mt-6 ${plan.popular ? 'bg-surface hover:bg-surface/90' : 'hover:bg-primary/90'}`}
                    style={{
                      backgroundColor: planStatus?.plan === plan.planId
                        ? 'hsl(142 76% 36%)'
                        : plan.popular ? 'white' : 'hsl(258 90% 66%)',
                      color: planStatus?.plan === plan.planId
                        ? 'white'
                        : plan.popular ? 'hsl(258 90% 66%)' : 'white'
                    }}
                    onClick={() => handlePlanSelect(plan.planId)}
                    disabled={isProcessing || planStatus?.plan === plan.planId}
                  >
                    {isProcessing && selectedPlan === plan.planId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : planStatus?.plan === plan.planId ? (
                      <>
                        Current Plan
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        {plan.buttonText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlanSelection;