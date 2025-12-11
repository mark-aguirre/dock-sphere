'use client';

import { useState } from 'react';
import { SetupConfiguration, SetupState, ValidationResult, ConfigurationSection } from '@/types/setup-config';
import { CONFIGURATION_SECTIONS } from '@/lib/utils/setup-utils';
import { DockerConfigStep } from './steps/DockerConfigStep';
import { AuthConfigStep } from './steps/AuthConfigStep';
import { OAuthConfigStep } from './steps/OAuthConfigStep';
import { DatabaseConfigStep } from './steps/DatabaseConfigStep';
import { ApplicationConfigStep } from './steps/ApplicationConfigStep';
import { LoggingConfigStep } from './steps/LoggingConfigStep';
import { SetupSummary } from './SetupSummary';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, TestTube } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SetupWizardProps {
  configuration: Partial<SetupConfiguration>;
  validation: ValidationResult;
  setupState: SetupState;
  onConfigurationChange: (updates: Partial<SetupConfiguration>) => void;
  onStepChange: (step: number) => void;
  onSave: (config: SetupConfiguration) => Promise<{ success: boolean; message: string; errors?: any }>;
  onCancel: () => void;
}

export function SetupWizard({
  configuration,
  validation,
  setupState,
  onConfigurationChange,
  onStepChange,
  onSave,
  onCancel,
}: SetupWizardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const currentSection = CONFIGURATION_SECTIONS[setupState.currentStep];
  const isLastStep = setupState.currentStep === setupState.totalSteps - 1;
  const isFirstStep = setupState.currentStep === 0;

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(setupState.currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(setupState.currentStep - 1);
    }
  };

  const handleTestConnections = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      const response = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'all',
          config: configuration,
        }),
      });

      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Failed to test connections',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (skipConnectionTests = false) => {
    setSaveResult(null);
    
    // Always allow saving - let the API handle validation
    const configToSave = {
      ...configuration,
      forceSkipConnectionTests: skipConnectionTests,
    } as SetupConfiguration;

    const result = await onSave(configToSave);
    setSaveResult(result);
  };

  const isConfigurationComplete = (config: Partial<SetupConfiguration>): config is SetupConfiguration => {
    const hasSecret = config.auth?.nextAuthSecret && 
      (config.auth.nextAuthSecret !== '' && config.auth.nextAuthSecret !== '••••••••••••••••••••••••••••••••');
    const hasServiceKey = config.database?.supabaseServiceKey && 
      (config.database.supabaseServiceKey !== '' && config.database.supabaseServiceKey !== '••••••••••••••••••••••••••••••••');
    
    return !!(
      config.docker?.socket &&
      config.auth?.nextAuthUrl &&
      (hasSecret || config.auth?.nextAuthSecret === '••••••••••••••••••••••••••••••••') &&
      config.database?.url &&
      config.database?.supabaseUrl &&
      config.database?.supabaseAnonKey &&
      (hasServiceKey || config.database?.supabaseServiceKey === '••••••••••••••••••••••••••••••••') &&
      config.application?.appUrl &&
      config.logging?.level
    );
  };

  const renderCurrentStep = () => {
    const stepProps = {
      configuration,
      validation,
      onChange: onConfigurationChange,
      isLoading: setupState.isLoading,
    };

    switch (currentSection) {
      case 'docker':
        return <DockerConfigStep {...stepProps} />;
      case 'auth':
        return <AuthConfigStep {...stepProps} />;
      case 'oauth':
        return <OAuthConfigStep {...stepProps} />;
      case 'database':
        return <DatabaseConfigStep {...stepProps} />;
      case 'application':
        return <ApplicationConfigStep {...stepProps} />;
      case 'logging':
        return <LoggingConfigStep {...stepProps} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Connection Test Results</h3>
          {testResults.success ? (
            <div className="space-y-2">
              {testResults.results?.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 text-sm ${
                    result.status === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <span className="capitalize">{result.service}:</span>
                  <span>{result.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-600 text-sm">{testResults.message}</div>
          )}
        </div>
      )}

      {/* Save Result */}
      {saveResult && (
        <div className={`rounded-lg p-4 ${
          saveResult.success ? 'bg-status-running/10 text-status-running border border-status-running/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          {saveResult.message}
          {saveResult.success && (
            <div className="mt-2 text-sm opacity-90">
              Redirecting to main application...
            </div>
          )}
          {!saveResult.success && (saveResult as any).canSkipTests && (
            <div className="mt-3 flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={setupState.isLoading}
              >
                Save Without Testing
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSaveResult(null)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || setupState.isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {!isLastStep && (
            <Button
              onClick={handleNext}
              disabled={setupState.isLoading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleTestConnections}
            disabled={setupState.isLoading || isTesting}
          >
            {isTesting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Test Connections
          </Button>

          <Button
            onClick={() => handleSave(false)}
            disabled={setupState.isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {setupState.isLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </Button>

          <Button
            variant="outline"
            onClick={onCancel}
            disabled={setupState.isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Configuration Summary */}
      {isLastStep && (
        <div className="mt-8">
          <SetupSummary configuration={configuration} />
        </div>
      )}
    </div>
  );
}