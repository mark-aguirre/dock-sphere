'use client';

import { useState } from 'react';
import { SetupConfiguration, ValidationResult } from '@/types/setup-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, TestTube, Eye, EyeOff, ExternalLink, Info } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DatabaseConfigStepProps {
  configuration: Partial<SetupConfiguration>;
  validation: ValidationResult;
  onChange: (updates: Partial<SetupConfiguration>) => void;
  isLoading: boolean;
}

export function DatabaseConfigStep({
  configuration,
  validation,
  onChange,
  isLoading,
}: DatabaseConfigStepProps) {
  const [showKeys, setShowKeys] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const databaseConfig = configuration.database || {
    url: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: '',
  };
  const errors = validation.errors.database || [];

  const handleDatabaseChange = (field: keyof typeof databaseConfig, value: string) => {
    onChange({
      database: {
        ...databaseConfig,
        [field]: value,
      },
    });
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'database',
          config: databaseConfig,
        }),
      });

      const data = await response.json();
      setTestResult(data.result);
    } catch (error) {
      setTestResult({
        status: 'error',
        message: 'Failed to test database connection',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-4 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
          <Database className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Database Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Configure your Supabase database connection settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>
              PostgreSQL connection string for your Supabase database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="database-url">Database URL</Label>
            <Input
              id="database-url"
              type="text"
              value={databaseConfig.url}
              onChange={(e) => handleDatabaseChange('url', e.target.value)}
              placeholder="postgresql://postgres:password@host:5432/postgres"
              disabled={isLoading}
              className={getFieldError('url') ? 'border-destructive' : ''}
            />
            {getFieldError('url') && (
              <div className="mt-1 text-sm text-destructive">
                {getFieldError('url')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Supabase Configuration</CardTitle>
            <CardDescription>
              Your Supabase project settings and API keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Input
                id="supabase-url"
                type="url"
                value={databaseConfig.supabaseUrl}
                onChange={(e) => handleDatabaseChange('supabaseUrl', e.target.value)}
                placeholder="https://your-project.supabase.co"
                disabled={isLoading}
                className={getFieldError('supabaseUrl') ? 'border-destructive' : ''}
              />
              {getFieldError('supabaseUrl') && (
                <div className="mt-1 text-sm text-destructive">
                  {getFieldError('supabaseUrl')}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="supabase-anon-key">Supabase Anonymous Key</Label>
              <div className="relative">
                <Input
                  id="supabase-anon-key"
                  type={showKeys ? 'text' : 'password'}
                  value={databaseConfig.supabaseAnonKey}
                  onChange={(e) => handleDatabaseChange('supabaseAnonKey', e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  disabled={isLoading}
                  className={getFieldError('supabaseAnonKey') ? 'border-destructive' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {getFieldError('supabaseAnonKey') && (
                <div className="mt-1 text-sm text-destructive">
                  {getFieldError('supabaseAnonKey')}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="supabase-service-key">Supabase Service Role Key</Label>
              <div className="relative">
                <Input
                  id="supabase-service-key"
                  type={showKeys ? 'text' : 'password'}
                  value={databaseConfig.supabaseServiceKey}
                  onChange={(e) => handleDatabaseChange('supabaseServiceKey', e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... or sb_secret_..."
                  disabled={isLoading}
                  className={getFieldError('supabaseServiceKey') ? 'border-destructive' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {getFieldError('supabaseServiceKey') && (
                <div className="mt-1 text-sm text-destructive">
                  {getFieldError('supabaseServiceKey')}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={isLoading || isTesting || !databaseConfig.supabaseUrl || !databaseConfig.supabaseAnonKey}
              >
                {isTesting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Supabase Dashboard
              </Button>
            </div>

            {testResult && (
              <Alert className={testResult.status === 'success' ? 'border-status-running/50 bg-status-running/10' : 'border-destructive/50 bg-destructive/10'}>
                <AlertDescription className={testResult.status === 'success' ? 'text-status-running' : 'text-destructive'}>
                  <strong>{testResult.status === 'success' ? 'Success:' : 'Error:'}</strong> {testResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Where to find your Supabase credentials:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>1. Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a></span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>2. Select your project</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>3. Go to Settings → API</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>4. Copy the Project URL and API keys</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>5. For the database URL, go to Settings → Database and copy the connection string</span>
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="glass-card bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span>Database Requirements</span>
        </h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>A Supabase project with a PostgreSQL database</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>The anonymous key for client-side operations</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>The service role key for server-side operations (bypasses RLS)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>Network access to your Supabase instance</span>
          </li>
        </ul>
      </div>
    </div>
  );
}