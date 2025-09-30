import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlanStatusCheckerProps {
  children: React.ReactNode;
}

const PlanStatusChecker: React.FC<PlanStatusCheckerProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const previousPlanStatus = useRef<boolean | null>(null);
  const hasShownSuccessMessage = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Only fetch plan status if user is authenticated and not on auth pages
  const shouldCheckPlan = isAuthenticated && user && user.role !== 'super_admin' &&
                          !['/login', '/signup'].includes(location.pathname);

  const { data: planStatus, isLoading, error, refetch } = usePlanStatus({
    refetchOnWindowFocus: location.pathname === '/plan-selection' // Only refetch on focus when on plan selection page
  });

  // Manual polling only when on plan selection page (to detect payment completion)
  useEffect(() => {
    if (location.pathname === '/plan-selection' && shouldCheckPlan) {
      // Start polling every 3 seconds when on plan selection page
      pollingIntervalRef.current = setInterval(() => {
        console.log('Polling plan status for payment completion...');
        refetch();
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      // Clear polling when not on plan selection page
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [location.pathname, shouldCheckPlan, refetch]);

  useEffect(() => {
    // Only check plan status if conditions are met
    if (!shouldCheckPlan) {
      return;
    }

    // Don't check if auth is still loading
    if (authLoading) {
      return;
    }

    // Track plan status changes for success detection
    if (planStatus) {
      const currentNeedsPlan = planStatus.needsPlanSelection;
      
      console.log('PlanStatusChecker debug:', {
        currentNeedsPlan,
        previousNeedsPlan: previousPlanStatus.current,
        hasShownMessage: hasShownSuccessMessage.current,
        planName: planStatus.plan,
        pathname: location.pathname
      });
      
      // Detect successful payment: previously needed plan selection, now doesn't
      // OR if we're on plan-selection page and user now has a plan (payment completed)
      const paymentCompleted = (previousPlanStatus.current === true && currentNeedsPlan === false) ||
                              (location.pathname === '/plan-selection' && currentNeedsPlan === false && planStatus.plan);
      
      if (paymentCompleted && !hasShownSuccessMessage.current) {
        
        // Hide any processing toast
        toast.dismiss();
        
        // Show success message
        toast.success('🎉 Payment successful!', {
          description: `Welcome to your ${planStatus.plan || 'new'} plan! You now have access to all features.`,
          duration: 5000,
        });
        hasShownSuccessMessage.current = true;
        
        console.log('🎉 Payment completed successfully! Plan activated:', planStatus.plan);
        
        // Reset any payment processing state and redirect
        setTimeout(() => {
          // Try to reset payment processing state if we can access it
          const planSelectionElement = document.querySelector('[data-plan-selection]');
          if (planSelectionElement) {
            // Dispatch custom event to reset processing state
            window.dispatchEvent(new CustomEvent('paymentCompleted'));
          }

          // If this is a plan upgrade (user already had a plan), redirect to settings
          // If this is initial plan selection, redirect to dashboard
          const isPlanUpgrade = previousPlanStatus.current === false && currentNeedsPlan === false;
          const redirectPath = isPlanUpgrade ? '/settings' : '/';

          console.log('Redirecting after payment completion:', {
            isPlanUpgrade,
            previousNeedsPlan: previousPlanStatus.current,
            currentNeedsPlan,
            redirectPath
          });

          navigate(redirectPath, { replace: true });
        }, 2000);
      }
      
      // Update previous status
      previousPlanStatus.current = currentNeedsPlan;
    }

    // Don't redirect if already on plan selection page
    if (location.pathname === '/plan-selection') {
      return;
    }

    // If there's an error fetching plan status OR if explicitly needed, redirect to plan selection
    if (error || planStatus?.needsPlanSelection === true) {
      if (error) {
        console.warn('Failed to fetch plan status, redirecting to plan selection:', error);
      }
      navigate('/plan-selection', { replace: true });
      return;
    }

    // If we have data and don't need plan selection, let user continue
    if (planStatus && planStatus.needsPlanSelection === false) {
      // User can continue to dashboard
      return;
    }
  }, [shouldCheckPlan, planStatus, isLoading, authLoading, error, location.pathname, navigate]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Show loading state while checking plan status (only for authenticated users and only for auth loading)
  if (shouldCheckPlan && location.pathname !== '/plan-selection' && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-interactive" />
          <p className="text-body text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PlanStatusChecker;
