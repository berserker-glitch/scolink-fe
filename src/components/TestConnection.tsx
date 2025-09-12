import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiService } from '@/services/api';

export const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<string>('Not tested');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    try {
      // Test basic connection
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      
      if (data.success) {
        setStatus('✅ Backend connection successful');
      } else {
        setStatus('❌ Backend connection failed');
      }
    } catch (error) {
      setStatus(`❌ Connection error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSuperAdminLogin = async () => {
    setLoading(true);
    try {
      const response = await apiService.login({
        email: 'admin@admin.com',
        password: 'D8fd5D5694'
      });
      
      if (response.user) {
        setStatus(`✅ Super Admin login successful! User: ${response.user.fullName} (${response.user.role})`);
      } else {
        setStatus('❌ Login failed - no user data');
      }
    } catch (error) {
      setStatus(`❌ Login error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Backend Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={testBackendConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Backend Connection'}
          </Button>
          
          <Button 
            onClick={testSuperAdminLogin} 
            disabled={loading}
            className="w-full"
            variant="secondary"
          >
            {loading ? 'Testing...' : 'Test Super Admin Login'}
          </Button>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">Status:</p>
          <p className="text-sm">{status}</p>
        </div>
      </CardContent>
    </Card>
  );
};
