'use client';

import { useState } from 'react';
import { SetupConfiguration, ValidationResult } from '@/types/setup-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, HardDrive } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DockerConfigStepProps {
  configuration: Partial<SetupConfiguration>;
  validation: ValidationResult;
  onChange: (updates: Partial<SetupConfiguration>) => void;
  isLoading: boolean;
}

export function DockerConfigStep({
  configuration,
  validation,
  onChange,
  isLoading,
}: DockerConfigStepProps) {
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const dockerConfig = configuration.docker || { socket: '' };
  const errors = validation.errors.docker || [];

  const handleSocketChange = (socket: string) => {
    onChange({
      docker: { socket },
    });
  };

  const getDefaultSocket = () => {
    return process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock';
  };

  const handleUseDefault = async () => {
    setIsSettingDefault(true);
    try {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      handleSocketChange(getDefaultSocket());
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-4 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
          <HardDrive className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Docker Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Configure the Docker socket connection for container management
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Docker Socket Path</CardTitle>
          <CardDescription>
            Specify the path to your Docker socket. This is used to communicate with the Docker daemon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="docker-socket">Socket Path</Label>
            <div className="mt-1 flex space-x-2">
              <Input
                id="docker-socket"
                type="text"
                value={dockerConfig.socket}
                onChange={(e) => handleSocketChange(e.target.value)}
                placeholder="Enter Docker socket path"
                disabled={isLoading}
                className={errors.length > 0 ? 'border-destructive' : ''}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUseDefault}
                disabled={isLoading || isSettingDefault}
                className="whitespace-nowrap"
              >
                {isSettingDefault ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Use Default
              </Button>
            </div>
            {errors.length > 0 && (
              <div className="mt-1 text-sm text-destructive">
                {errors.map((error, index) => (
                  <div key={index}>{error.message}</div>
                ))}
              </div>
            )}
          </div>

          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>Platform-specific defaults:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-primary"></span>
                  <span><strong>Windows:</strong> //./pipe/docker_engine</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-primary"></span>
                  <span><strong>Linux/macOS:</strong> /var/run/docker.sock</span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="glass-card bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Docker Requirements</span>
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Docker Desktop must be installed and running</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>The Docker socket must be accessible to the application</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>On Windows, ensure Docker Desktop is configured to expose the daemon</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>On Linux, ensure your user has permission to access the Docker socket</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}