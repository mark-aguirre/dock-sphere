'use client';

import { SetupConfiguration, ValidationResult } from '@/types/setup-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key } from 'lucide-react';

interface OAuthConfigStepProps {
  configuration: Partial<SetupConfiguration>;
  validation: ValidationResult;
  onChange: (updates: Partial<SetupConfiguration>) => void;
  isLoading: boolean;
}

export function OAuthConfigStep({
  configuration,
  validation,
  onChange,
  isLoading,
}: OAuthConfigStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white-900">OAuth Providers</h2>
        <p className="text-gray-600 mt-2">
          Configure OAuth providers for user authentication
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OAuth Configuration</CardTitle>
          <CardDescription>
            OAuth provider configuration will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">OAuth configuration form coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}