import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'center_admin' | 'user';
  centerId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Helper function to decode JWT and get expiration time
  const getTokenExpiration = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Helper function to check if token is close to expiry (within 5 minutes)
  const isTokenNearExpiry = (token: string): boolean => {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return (expiration - now) < fiveMinutes;
  };

  // Function to refresh token automatically
  const refreshTokenIfNeeded = async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return true; // Already refreshing
    }

    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken || !refreshToken) {
      return false;
    }

    // Check if token is close to expiry
    if (!isTokenNearExpiry(accessToken)) {
      return true; // Token is still valid
    }

    console.log('Access token is near expiry, refreshing...');
    isRefreshingRef.current = true;

    try {
      const response = await fetch(`${apiService.getBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        console.log('Token refreshed successfully');
        return true;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Function to start the refresh timer
  const startRefreshTimer = () => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Check token every 2 minutes
    refreshTimerRef.current = setInterval(async () => {
      const success = await refreshTokenIfNeeded();
      if (!success) {
        console.log('Token refresh failed, logging out user');
        await logout();
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  };

  // Function to stop the refresh timer
  const stopRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('scolink_user');
        const accessToken = localStorage.getItem('access_token');
        
        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser);
          
          // Try to refresh token if needed first
          const refreshSuccess = await refreshTokenIfNeeded();
          
          if (refreshSuccess) {
            setUser(userData);
            startRefreshTimer(); // Start the automatic refresh timer
            
            // Verify token is still valid by getting profile
            try {
              await apiService.getProfile();
            } catch (error) {
              console.error('Profile fetch failed after refresh:', error);
              // If profile still fails, logout
              await logout();
            }
          } else {
            // Refresh failed, clear storage
            localStorage.removeItem('scolink_user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('scolink_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Cleanup timer on unmount
    return () => {
      stopRefreshTimer();
    };
  }, []);

  // Handle page visibility change - refresh token when user comes back to tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        // User is back on the page, check if we need to refresh token
        const success = await refreshTokenIfNeeded();
        if (!success) {
          console.log('Token refresh failed on visibility change, logging out');
          await logout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await apiService.login({ email, password });
      setUser(response.user as User);
      startRefreshTimer(); // Start automatic token refresh
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Stop the refresh timer immediately
    stopRefreshTimer();
    
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user data and local storage
      setUser(null);
      localStorage.removeItem('scolink_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Redirect will be handled by the routing logic in App.tsx
      window.location.href = '/login';
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
