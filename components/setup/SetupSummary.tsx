'use client';

import { SetupConfiguration } from '@/types/setup-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateConfigurationSummary } from '@/lib/utils/setup-utils';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SetupSummaryProps {
  configuration: Partial<SetupConfiguration>;
}

export function SetupSummary({ configuration }: SetupSummaryProps) {
  const summary = generateConfigurationSummary(configuration);
  const sections = Object.keys(summary);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>Configuration Summary</span>
        </CardTitle>
        <CardDescription>
          Review your configuration before saving
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 capitalize mb-2">
                {section}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {summary[section].map((item, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-blue-800">
              <p className="font-medium">Ready to Save</p>
              <p className="text-sm mt-1">
                Your configuration will be saved to the .env file. A backup of the current
                configuration will be created automatically.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}