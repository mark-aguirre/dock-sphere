'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SetupConfiguration, SetupState, ValidationResult } from '@/types/setup-config';
import { getDefaultConfiguration, CONFIGURATION_SECTIONS } from '@/lib/utils/setup-utils';
import { SetupWizard } from '@/components/setup/SetupWizard';
import { SetupProgress } from '@/components/setup/SetupProgress';
import { SetupHeader } from '@/components/setup/SetupHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppLayout } from '@/components/layout/AppLayout';

/**
 * Setup Page Component
 * Main page for environment configuration setup
 */

export default function SetupPage() {
  const router = useRouter();
  const [setupState, setSetupState] = useState<SetupState>({
    currentStep: 0,
    totalSteps: CONFIGURATION_SECTIONS.length,
    isLoading: true,
    hasChanges: false,
  });
  
  const [configuration, setConfiguration] = useState<Partial<SetupConfiguration>>({});
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: {},
    warnings: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load existing configuration on mount
  useEffect(() => {
    loadCurrentConfiguration();
  }, []);

  const loadCurrentConfiguration = async () => {
    try {
      setSetupState(prev => ({ ...prev, isLoading: true }));
      setError(null);

      const response = await fetch('/api/setup/config');
      const data = await response.json();

      if (data.success) {
        setConfiguration(data.configuration || getDefaultConfiguration());
        setValidation(data.validation || { isValid: false, errors: {}, warnings: {} });
      } else {
        // If no configuration exists, start with defaults
        setConfiguration(getDefaultConfiguration());
      }
    } catch (err) {
      console.error('Failed to load configuration:', err);
      setError('Failed to load existing configuration. Starting with defaults.');
      setConfiguration(getDefaultConfiguration());
    } finally {
      setSetupState(prev => ({ ...prev, isLoading: false }));
      setIsInitialized(true);
    }
  };

  const handleConfigurationChange = (updates: Partial<SetupConfiguration>) => {
    setConfiguration(prev => ({
      ...prev,
      ...updates,
    }));
    setSetupState(prev => ({ ...prev, hasChanges: true }));
  };

  const handleStepChange = (step: number) => {
    setSetupState(prev => ({ ...prev, currentStep: step }));
  };

  const handleSaveConfiguration = async (config: SetupConfiguration) => {
    try {
      setSetupState(prev => ({ ...prev, isLoading: true }));
      setError(null);

      const response = await fetch('/api/setup/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setSetupState(prev => ({ ...prev, hasChanges: false, lastSaved: new Date() }));
        
        // Show Docker-specific success message if applicable
        const successMessage = data.isDocker 
          ? 'Configuration saved successfully! Docker environment detected and settings adjusted automatically.'
          : data.message;
        
        // Redirect to main application after successful setup
        setTimeout(() => {
          router.push('/');
        }, 2000);
        
        return { success: true, message: successMessage };
      } else {
        setValidation({
          isValid: false,
          errors: data.errors || {},
          warnings: data.warnings || {},
        });
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (err) {
      const errorMessage = 'Failed to save configuration. If running in Docker, ensure the container has write permissions to the .env file.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSetupState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancel = () => {
    if (setupState.hasChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }
    
    router.push('/');
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(
      'This will reset all configuration to defaults. Are you sure?'
    );
    if (!confirmReset) return;

    try {
      setSetupState(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch('/api/setup/config', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setConfiguration(getDefaultConfiguration());
        setSetupState(prev => ({ 
          ...prev, 
          currentStep: 0, 
          hasChanges: false,
        }));
      } else {
        setError('Failed to reset configuration');
      }
    } catch (err) {
      setError('Failed to reset configuration');
    } finally {
      setSetupState(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (!isInitialized) {
    return (
      <AppLayout title="Environment Setup" description="Configure your Container Hub Plus environment">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading setup configuration...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Environment Setup" description="Configure your Container Hub Plus environment">
      <div className="max-w-5xl mx-auto">
        <SetupHeader 
          onCancel={handleCancel}
          onReset={handleReset}
          hasChanges={setupState.hasChanges}
          isLoading={setupState.isLoading}
        />

        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="glass-card rounded-lg overflow-hidden">
          <SetupProgress 
            currentStep={setupState.currentStep}
            totalSteps={setupState.totalSteps}
            sections={CONFIGURATION_SECTIONS}
          />

          <div className="p-6">
            <SetupWizard
              configuration={configuration}
              validation={validation}
              setupState={setupState}
              onConfigurationChange={handleConfigurationChange}
              onStepChange={handleStepChange}
              onSave={handleSaveConfiguration}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {setupState.lastSaved && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Last saved: {setupState.lastSaved.toLocaleString()}
          </div>
        )}
      </div>
    </AppLayout>
  );
}