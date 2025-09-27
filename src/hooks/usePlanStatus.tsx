import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

export const usePlanStatus = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Only fetch if user is authenticated and not super admin
  const enabled = isAuthenticated && user && user.role !== 'super_admin';
  
  return useQuery({
    queryKey: ['planStatus'],
    queryFn: () => apiService.getCenterPlanStatus(),
    enabled,
    staleTime: 10 * 1000, // 10 seconds (faster for payment detection)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchInterval: 5 * 1000, // Poll every 5 seconds for payment updates
  });
};
