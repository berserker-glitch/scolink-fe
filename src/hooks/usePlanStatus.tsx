import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

export const usePlanStatus = (options?: { enabled?: boolean; refetchOnWindowFocus?: boolean }) => {
  const { isAuthenticated, user } = useAuth();

  // Only fetch if user is authenticated and not super admin
  const enabled = options?.enabled !== false && isAuthenticated && user && user.role !== 'super_admin';

  return useQuery({
    queryKey: ['planStatus'],
    queryFn: () => apiService.getCenterPlanStatus(),
    enabled,
    staleTime: 30 * 1000, // 30 seconds (reduced frequency for non-polling)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false, // Disabled by default
    refetchInterval: false, // Disabled - no continuous polling
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};
