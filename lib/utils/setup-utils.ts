import { SetupConfiguration, ConfigurationSection, SetupState } from '@/types/setup-config';
import { setupConfigSchema } from '@/lib/validation/setup-schemas';
import { ValidationError, createSetupError, ERROR_CODES } from '@/lib/errors/setup-errors';

/**
 * Utility functions for setup configuration management
 */

// Configuration section order for multi-step form
export const CONFIGURATION_SECTIONS: ConfigurationSection[] = [
  'docker',
  'auth',
  'oauth',
  'database',
  'application',
  'logging',
];

// Default configuration template
export const getDefaultConfiguration = (): SetupConfiguration => ({
  docker: {
    socket: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock',
  },
  auth: {
    nextAuthUrl: 'http://localhost:3000',
    nextAuthSecret: generateNextAuthSecret(),
  },
  oauth: {},
  database: {
    url: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: '',
  },
  application: {
    appUrl: 'http://localhost:3000',
    adminEmails: [],
  },
  logging: {
    level: 'INFO',
    enableRequestLogging: true,
    enablePerformanceLogging: true,
    enableDockerLogging: true,
    format: 'pretty',
    maxLogSize: 10485760, // 10MB
    retentionDays: 30,
  },
});

// Generate a secure NextAuth secret
export const generateNextAuthSecret = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
};

// Validate a single configuration section
export const validateConfigurationSection = (
  section: ConfigurationSection,
  data: any
): { isValid: boolean; errors: string[] } => {
  try {
    const sectionSchema = setupConfigSchema.shape[section];
    sectionSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error: any) {
    const errors = error.errors?.map((err: any) => err.message) || ['Validation failed'];
    return { isValid: false, errors };
  }
};

// Merge partial configuration with defaults
export const mergeWithDefaults = (
  partial: Partial<SetupConfiguration>
): SetupConfiguration => {
  const merged = getDefaultConfiguration();
  
  // Merge partial configuration with proper typing
  if (partial.docker) {
    merged.docker = { ...merged.docker, ...partial.docker };
  }
  if (partial.auth) {
    merged.auth = { ...merged.auth, ...partial.auth };
  }
  if (partial.oauth) {
    merged.oauth = { ...merged.oauth, ...partial.oauth };
  }
  if (partial.database) {
    merged.database = { ...merged.database, ...partial.database };
  }
  if (partial.application) {
    merged.application = { ...merged.application, ...partial.application };
  }
  if (partial.logging) {
    merged.logging = { ...merged.logging, ...partial.logging };
  }
  
  return merged;
};

// Check if configuration is complete
export const isConfigurationComplete = (config: Partial<SetupConfiguration>): boolean => {
  try {
    setupConfigSchema.parse(config);
    return true;
  } catch {
    return false;
  }
};

// Get missing configuration sections
export const getMissingConfigurationSections = (
  config: Partial<SetupConfiguration>
): ConfigurationSection[] => {
  const missing: ConfigurationSection[] = [];
  
  CONFIGURATION_SECTIONS.forEach((section) => {
    const sectionData = config[section];
    if (!sectionData || !validateConfigurationSection(section, sectionData).isValid) {
      missing.push(section);
    }
  });
  
  return missing;
};

// Calculate setup progress
export const calculateSetupProgress = (config: Partial<SetupConfiguration>): number => {
  const totalSections = CONFIGURATION_SECTIONS.length;
  const completedSections = totalSections - getMissingConfigurationSections(config).length;
  return Math.round((completedSections / totalSections) * 100);
};

// Create initial setup state
export const createInitialSetupState = (): SetupState => ({
  currentStep: 0,
  totalSteps: CONFIGURATION_SECTIONS.length,
  isLoading: false,
  hasChanges: false,
});

// Update setup state for navigation
export const updateSetupState = (
  currentState: SetupState,
  updates: Partial<SetupState>
): SetupState => ({
  ...currentState,
  ...updates,
});

// Sanitize configuration for logging (remove sensitive data)
export const sanitizeConfigurationForLogging = (
  config: Partial<SetupConfiguration>
): Partial<SetupConfiguration> => {
  const sanitized = JSON.parse(JSON.stringify(config));
  
  // Remove sensitive fields
  if (sanitized.auth?.nextAuthSecret) {
    sanitized.auth.nextAuthSecret = '[REDACTED]';
  }
  
  if (sanitized.oauth?.google?.clientSecret) {
    sanitized.oauth.google.clientSecret = '[REDACTED]';
  }
  
  if (sanitized.oauth?.github?.clientSecret) {
    sanitized.oauth.github.clientSecret = '[REDACTED]';
  }
  
  if (sanitized.oauth?.gitlab?.clientSecret) {
    sanitized.oauth.gitlab.clientSecret = '[REDACTED]';
  }
  
  if (sanitized.database?.supabaseServiceKey) {
    sanitized.database.supabaseServiceKey = '[REDACTED]';
  }
  
  return sanitized;
};

// Sanitize configuration for UI display (show that values are configured)
export const sanitizeConfigurationForUI = (
  config: Partial<SetupConfiguration>
): Partial<SetupConfiguration> => {
  const sanitized = JSON.parse(JSON.stringify(config));
  
  // Replace sensitive fields with placeholder indicating they're configured
  if (sanitized.auth?.nextAuthSecret) {
    sanitized.auth.nextAuthSecret = '••••••••••••••••••••••••••••••••';
  }
  
  if (sanitized.oauth?.google?.clientSecret) {
    sanitized.oauth.google.clientSecret = '••••••••••••••••••••••••••••••••';
  }
  
  if (sanitized.oauth?.github?.clientSecret) {
    sanitized.oauth.github.clientSecret = '••••••••••••••••••••••••••••••••';
  }
  
  if (sanitized.oauth?.gitlab?.clientSecret) {
    sanitized.oauth.gitlab.clientSecret = '••••••••••••••••••••••••••••••••';
  }
  
  if (sanitized.database?.supabaseServiceKey) {
    sanitized.database.supabaseServiceKey = '••••••••••••••••••••••••••••••••';
  }
  
  return sanitized;
};

// Merge configurations while preserving existing secrets when placeholders are provided
export const mergeConfigurationPreservingSecrets = (
  newConfig: Partial<SetupConfiguration>,
  currentConfig: Partial<SetupConfiguration>
): Partial<SetupConfiguration> => {
  const merged = JSON.parse(JSON.stringify(newConfig));
  
  // Preserve NextAuth secret if placeholder is provided
  if (merged.auth?.nextAuthSecret === '••••••••••••••••••••••••••••••••' && currentConfig.auth?.nextAuthSecret) {
    merged.auth.nextAuthSecret = currentConfig.auth.nextAuthSecret;
  }
  
  // Preserve OAuth client secrets if placeholders are provided
  if (merged.oauth?.google?.clientSecret === '••••••••••••••••••••••••••••••••' && currentConfig.oauth?.google?.clientSecret) {
    merged.oauth.google.clientSecret = currentConfig.oauth.google.clientSecret;
  }
  
  if (merged.oauth?.github?.clientSecret === '••••••••••••••••••••••••••••••••' && currentConfig.oauth?.github?.clientSecret) {
    merged.oauth.github.clientSecret = currentConfig.oauth.github.clientSecret;
  }
  
  if (merged.oauth?.gitlab?.clientSecret === '••••••••••••••••••••••••••••••••' && currentConfig.oauth?.gitlab?.clientSecret) {
    merged.oauth.gitlab.clientSecret = currentConfig.oauth.gitlab.clientSecret;
  }
  
  // Preserve Supabase service key if placeholder is provided
  if (merged.database?.supabaseServiceKey === '••••••••••••••••••••••••••••••••' && currentConfig.database?.supabaseServiceKey) {
    merged.database.supabaseServiceKey = currentConfig.database.supabaseServiceKey;
  }
  
  return merged;
};

// Generate configuration summary for display
export const generateConfigurationSummary = (
  config: Partial<SetupConfiguration>
): Record<string, string[]> => {
  const summary: Record<string, string[]> = {};
  
  if (config.docker) {
    summary.docker = [`Socket: ${config.docker.socket}`];
  }
  
  if (config.auth) {
    summary.auth = [
      `URL: ${config.auth.nextAuthUrl}`,
      `Secret: ${config.auth.nextAuthSecret ? 'Configured' : 'Not set'}`,
    ];
  }
  
  if (config.oauth) {
    const providers = [];
    if (config.oauth.google) providers.push('Google');
    if (config.oauth.github) providers.push('GitHub');
    if (config.oauth.gitlab) providers.push('GitLab');
    summary.oauth = providers.length > 0 ? [`Providers: ${providers.join(', ')}`] : ['No providers configured'];
  }
  
  if (config.database) {
    summary.database = [
      `Supabase URL: ${config.database.supabaseUrl || 'Not set'}`,
      `Database URL: ${config.database.url ? 'Configured' : 'Not set'}`,
    ];
  }
  
  if (config.application) {
    summary.application = [
      `App URL: ${config.application.appUrl}`,
      `Admin Emails: ${config.application.adminEmails.length} configured`,
    ];
  }
  
  if (config.logging) {
    summary.logging = [
      `Level: ${config.logging.level}`,
      `Format: ${config.logging.format}`,
      `Request Logging: ${config.logging.enableRequestLogging ? 'Enabled' : 'Disabled'}`,
    ];
  }
  
  return summary;
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL format
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Generate unique backup ID
export const generateBackupId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `backup_${timestamp}_${random}`;
};