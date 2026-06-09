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
      const baseUrl = apiService.getBaseUrl().replace(/\/api\/v1\/?$/, '');
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();

      setStatus(data.success ? 'Backend connection successful' : 'Backend connection failed');
    } catch (error) {
      setStatus(`Connection error: ${error}`);
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
        <Button
          onClick={testBackendConnection}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </Button>

        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">Status:</p>
          <p className="text-sm">{status}</p>
        </div>
      </CardContent>
    </Card>
  );
};
