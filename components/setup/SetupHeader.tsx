'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw, X, AlertCircle, Settings } from 'lucide-react';

interface SetupHeaderProps {
  onCancel: () => void;
  onReset: () => void;
  hasChanges: boolean;
  isLoading: boolean;
}

export function SetupHeader({ onCancel, onReset, hasChanges, isLoading }: SetupHeaderProps) {
  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Environment Setup
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your Container Hub Plus environment settings
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="glass-card border-status-warning/50 bg-status-warning/10 rounded-lg p-4 flex items-center space-x-3 mb-4">
          <AlertCircle className="w-5 h-5 text-status-warning flex-shrink-0" />
          <div className="text-status-warning">
            <p className="font-medium">You have unsaved changes</p>
            <p className="text-sm opacity-90">
              Make sure to save your configuration before leaving this page.
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass-card border-primary/20 bg-primary/5 rounded-lg p-4">
        <h3 className="font-medium text-foreground mb-3 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span>Setup Instructions</span>
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>Complete each configuration section step by step</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>Test your connections before saving to ensure everything works</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>Your configuration will be saved to the .env file</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary mt-1">•</span>
            <span>A backup will be created automatically before any changes</span>
          </li>
        </ul>
      </div>
    </div>
  );
}