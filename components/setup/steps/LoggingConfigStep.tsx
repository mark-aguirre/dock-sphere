'use client';

import { SetupConfiguration, ValidationResult } from '@/types/setup-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Info } from 'lucide-react';

interface LoggingConfigStepProps {
  configuration: Partial<SetupConfiguration>;
  validation: ValidationResult;
  onChange: (updates: Partial<SetupConfiguration>) => void;
  isLoading: boolean;
}

export function LoggingConfigStep({
  configuration,
  validation,
  onChange,
  isLoading,
}: LoggingConfigStepProps) {
  const loggingConfig = configuration.logging || {
    level: 'INFO',
    enableRequestLogging: true,
    enablePerformanceLogging: true,
    enableDockerLogging: true,
    format: 'pretty',
    maxLogSize: 10485760,
    retentionDays: 30,
  };
  const errors = validation.errors.logging || [];

  const handleLoggingChange = (field: keyof typeof loggingConfig, value: any) => {
    onChange({
      logging: {
        ...loggingConfig,
        [field]: value,
      },
    });
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb} MB`;
  };

  const parseBytes = (mbString: string) => {
    const mb = parseFloat(mbString);
    return isNaN(mb) ? 10 : mb * 1024 * 1024;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-4 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
          <FileText className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Logging Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Configure logging preferences and settings for Container Hub Plus
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Log Level & Format</CardTitle>
            <CardDescription>
              Control what gets logged and how log messages are formatted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="log-level">Log Level</Label>
                <Select
                  value={loggingConfig.level}
                  onValueChange={(value) => handleLoggingChange('level', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBUG">DEBUG - Detailed information</SelectItem>
                    <SelectItem value="INFO">INFO - General information</SelectItem>
                    <SelectItem value="WARN">WARN - Warning messages</SelectItem>
                    <SelectItem value="ERROR">ERROR - Error messages only</SelectItem>
                  </SelectContent>
                </Select>
                {getFieldError('level') && (
                  <div className="mt-1 text-sm text-destructive">
                    {getFieldError('level')}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="log-format">Log Format</Label>
                <Select
                  value={loggingConfig.format}
                  onValueChange={(value) => handleLoggingChange('format', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select log format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pretty">Pretty - Human readable</SelectItem>
                    <SelectItem value="json">JSON - Machine readable</SelectItem>
                  </SelectContent>
                </Select>
                {getFieldError('format') && (
                  <div className="mt-1 text-sm text-destructive">
                    {getFieldError('format')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Logging Features</CardTitle>
            <CardDescription>
              Enable or disable specific logging features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Request Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log HTTP requests and responses
                  </p>
                </div>
                <Switch
                  checked={loggingConfig.enableRequestLogging}
                  onCheckedChange={(checked) => handleLoggingChange('enableRequestLogging', checked)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Performance Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log performance metrics and timing information
                  </p>
                </div>
                <Switch
                  checked={loggingConfig.enablePerformanceLogging}
                  onCheckedChange={(checked) => handleLoggingChange('enablePerformanceLogging', checked)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Docker Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log Docker API calls and container operations
                  </p>
                </div>
                <Switch
                  checked={loggingConfig.enableDockerLogging}
                  onCheckedChange={(checked) => handleLoggingChange('enableDockerLogging', checked)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Log Management</CardTitle>
            <CardDescription>
              Configure log file size limits and retention policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max-log-size">Maximum Log File Size (MB)</Label>
                <Input
                  id="max-log-size"
                  type="number"
                  min="1"
                  max="1000"
                  value={Math.round(loggingConfig.maxLogSize / (1024 * 1024))}
                  onChange={(e) => handleLoggingChange('maxLogSize', parseBytes(e.target.value))}
                  disabled={isLoading}
                  className={getFieldError('maxLogSize') ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {formatBytes(loggingConfig.maxLogSize)}
                </p>
                {getFieldError('maxLogSize') && (
                  <div className="mt-1 text-sm text-destructive">
                    {getFieldError('maxLogSize')}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="retention-days">Log Retention (Days)</Label>
                <Input
                  id="retention-days"
                  type="number"
                  min="1"
                  max="365"
                  value={loggingConfig.retentionDays}
                  onChange={(e) => handleLoggingChange('retentionDays', parseInt(e.target.value) || 30)}
                  disabled={isLoading}
                  className={getFieldError('retentionDays') ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long to keep log files before deletion
                </p>
                {getFieldError('retentionDays') && (
                  <div className="mt-1 text-sm text-destructive">
                    {getFieldError('retentionDays')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Logging Best Practices:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>Use INFO level for production environments</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>DEBUG level provides detailed information but increases log size</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>JSON format is better for log aggregation tools</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              <span>Monitor disk space when enabling verbose logging</span>
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="glass-card bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span>Current Configuration Summary</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="space-y-1">
            <p><strong>Level:</strong> {loggingConfig.level}</p>
            <p><strong>Format:</strong> {loggingConfig.format}</p>
            <p><strong>Max Size:</strong> {formatBytes(loggingConfig.maxLogSize)}</p>
          </div>
          <div className="space-y-1">
            <p><strong>Retention:</strong> {loggingConfig.retentionDays} days</p>
            <p><strong>Request Logging:</strong> {loggingConfig.enableRequestLogging ? 'Enabled' : 'Disabled'}</p>
            <p><strong>Docker Logging:</strong> {loggingConfig.enableDockerLogging ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}