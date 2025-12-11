'use client';

import { ConfigurationSection } from '@/types/setup-config';
import { Check } from 'lucide-react';

interface SetupProgressProps {
  currentStep: number;
  totalSteps: number;
  sections: ConfigurationSection[];
}

const sectionLabels: Record<ConfigurationSection, string> = {
  docker: 'Docker',
  auth: 'Authentication',
  oauth: 'OAuth Providers',
  database: 'Database',
  application: 'Application',
  logging: 'Logging',
};

const sectionDescriptions: Record<ConfigurationSection, string> = {
  docker: 'Configure Docker connection settings',
  auth: 'Set up NextAuth configuration',
  oauth: 'Configure OAuth providers (Google, GitHub, GitLab)',
  database: 'Set up Supabase database connection',
  application: 'Configure application settings and admin users',
  logging: 'Configure logging preferences',
};

export function SetupProgress({ currentStep, totalSteps, sections }: SetupProgressProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="bg-muted/30 px-6 py-4 border-b border-border">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Setup Progress</span>
          <span>{currentStep + 1} of {totalSteps}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {sections.map((section, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div
              key={section}
              className={`flex flex-col items-center space-y-2 ${
                sections.length > 4 ? 'flex-1' : ''
              }`}
            >
              {/* Step Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  isCompleted
                    ? 'bg-status-running text-white'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-status-running'
                      : 'text-muted-foreground'
                  }`}
                >
                  {sectionLabels[section]}
                </div>
                {isCurrent && (
                  <div className="text-xs text-muted-foreground mt-1 max-w-24 leading-tight">
                    {sectionDescriptions[section]}
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < sections.length - 1 && (
                <div
                  className={`hidden sm:block absolute top-4 w-full h-0.5 -z-10 ${
                    index < currentStep ? 'bg-status-running' : 'bg-muted'
                  }`}
                  style={{
                    left: '50%',
                    width: `calc(100% / ${sections.length} - 2rem)`,
                    marginLeft: '1rem',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}