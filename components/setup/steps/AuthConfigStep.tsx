'use client';

import { useState } from 'react';
import { SetupConfiguration, ValidationResult } from '@/types/setup-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, RefreshCw, Eye, EyeOff, Info } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthConfigStepProps {
  configuration: Partial<SetupConfiguration>;
  validation: ValidationResult;
  onChange: (updates: Partial<SetupConfiguration>) => void;
  isLoading: boolean;
}

export function AuthConfigStep({
  configuration,
  validation,
  onChange,
  isLoading,
}: AuthConfigStepProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const authConfig = configuration.auth || { nextAuthUrl: '', nextAuthSecret: '' };
  const errors = validation.errors.auth || [];

  const handleAuthChange = (field: keyof typeof authConfig, value: string) => {
    onChange({
      auth: {
        ...authConfig,
        [field]: value,
      },
    });
  };

  const isPlaceholderValue = (value: string) => {
    return value === '••••••••••••••••••••••••••••••••';
  };

  const generateSecret = async () => {
    setIsGenerating(true);
    try {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a secure random secret
      const crypto = require('crypto');
      const secret = crypto.randomBytes(32).toString('base64');
      handleAuthChange('nextAuthSecret', secret);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-4 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Authentication Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Configure NextAuth settings for secure user authentication
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>NextAuth URL</CardTitle>
            <CardDescription>
              The base URL of your application. This should match your deployment URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="nextauth-url">Application URL</Label>
            <Input
              id="nextauth-url"
              type="url"
              value={authConfig.nextAuthUrl}
              onChange={(e) => handleAuthChange('nextAuthUrl', e.target.value)}
              placeholder="https://your-app.com or http://localhost:3000"
              disabled={isLoading}
              className={getFieldError('nextAuthUrl') ? 'border-destructive' : ''}
            />
            {getFieldError('nextAuthUrl') && (
              <div className="mt-1 text-sm text-destructive">
                {getFieldError('nextAuthUrl')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>NextAuth Secret</CardTitle>
            <CardDescription>
              A secure random string used to encrypt JWT tokens and session data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="nextauth-secret">Secret Key</Label>
                {isPlaceholderValue(authConfig.nextAuthSecret) && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✓ Configured
                  </span>
                )}
              </div>
              <div className="mt-1 flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="nextauth-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={authConfig.nextAuthSecret}
                    onChange={(e) => handleAuthChange('nextAuthSecret', e.target.value)}
                    placeholder={isPlaceholderValue(authConfig.nextAuthSecret) ? "Secret is configured (clear to change)" : "Enter a secure secret key"}
                    disabled={isLoading}
                    className={getFieldError('nextAuthSecret') ? 'border-destructive' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSecret}
                  disabled={isLoading || isGenerating}
                >
                  {isGenerating ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
              {getFieldError('nextAuthSecret') && (
                <div className="mt-1 text-sm text-destructive">
                  {getFieldError('nextAuthSecret')}
                </div>
              )}
            </div>

            <Alert className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription>
                <strong>Security Requirements:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Must be at least 32 characters long</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Should be cryptographically random</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Keep this secret secure and never share it</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Use the "Generate" button for a secure random secret</span>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <div className="glass-card bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span>NextAuth Configuration</span>
        </h4>
        <p className="text-sm text-muted-foreground mb-3">
          NextAuth.js is used for authentication in Container Hub Plus. These settings configure
          the core authentication system.
        </p>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>The URL must match your deployment environment</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>The secret is used to sign and encrypt tokens</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>Changing the secret will invalidate all existing sessions</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>In production, use HTTPS URLs for security</span>
          </li>
        </ul>
      </div>
    </div>
  );
}