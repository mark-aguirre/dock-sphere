/**
 * Configuration types for the environment setup system
 */

export interface DockerConfiguration {
  socket: string;
}

export interface AuthConfiguration {
  nextAuthUrl: string;
  nextAuthSecret: string;
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl?: string;
}

export interface OAuthConfiguration {
  google?: OAuthProviderConfig;
  github?: OAuthProviderConfig;
  gitlab?: OAuthProviderConfig;
}

export interface DatabaseConfiguration {
  url: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
}

export interface ApplicationConfiguration {
  appUrl: string;
  adminEmails: string[];
}

export interface LoggingConfiguration {
  level: string;
  enableRequestLogging: boolean;
  enablePerformanceLogging: boolean;
  enableDockerLogging: boolean;
  format: string;
  maxLogSize: number;
  retentionDays: number;
}

export interface SetupConfiguration {
  docker: DockerConfiguration;
  auth: AuthConfiguration;
  oauth: OAuthConfiguration;
  database: DatabaseConfiguration;
  application: ApplicationConfiguration;
  logging: LoggingConfiguration;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, ValidationError[]>;
  warnings: Record<string, ValidationError[]>;
}

export interface ConnectionTestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ConfigurationBackup {
  id: string;
  timestamp: Date;
  configuration: SetupConfiguration;
  description?: string;
}

export interface SetupState {
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  hasChanges: boolean;
  lastSaved?: Date;
}

export interface SetupFormData extends Partial<SetupConfiguration> {
  // Form-specific fields that might not be in the final config
  confirmPassword?: string;
  testConnection?: boolean;
}

export type ConfigurationSection = 
  | 'docker'
  | 'auth' 
  | 'oauth'
  | 'database'
  | 'application'
  | 'logging';

export interface SetupError extends Error {
  code: string;
  field?: string;
  section?: ConfigurationSection;
}