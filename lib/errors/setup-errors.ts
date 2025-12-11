import { ConfigurationSection } from '@/types/setup-config';

/**
 * Error handling utilities for the setup system
 */

export class SetupError extends Error {
  public readonly code: string;
  public readonly field?: string;
  public readonly section?: ConfigurationSection;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = 'SETUP_ERROR',
    field?: string,
    section?: ConfigurationSection,
    details?: any
  ) {
    super(message);
    this.name = 'SetupError';
    this.code = code;
    this.field = field;
    this.section = section;
    this.details = details;
  }
}

export class ValidationError extends SetupError {
  constructor(message: string, field?: string, section?: ConfigurationSection) {
    super(message, 'VALIDATION_ERROR', field, section);
    this.name = 'ValidationError';
  }
}

export class ConnectionError extends SetupError {
  constructor(message: string, service: string, details?: any) {
    super(message, 'CONNECTION_ERROR', service, undefined, details);
    this.name = 'ConnectionError';
  }
}

export class ConfigurationError extends SetupError {
  constructor(message: string, section?: ConfigurationSection, details?: any) {
    super(message, 'CONFIGURATION_ERROR', undefined, section, details);
    this.name = 'ConfigurationError';
  }
}

export class BackupError extends SetupError {
  constructor(message: string, details?: any) {
    super(message, 'BACKUP_ERROR', undefined, undefined, details);
    this.name = 'BackupError';
  }
}

// Error code constants
export const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FORMAT: 'INVALID_FORMAT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  
  // Connection errors
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  OAUTH_CONNECTION_FAILED: 'OAUTH_CONNECTION_FAILED',
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Configuration errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  CONFIGURATION_CONFLICT: 'CONFIGURATION_CONFLICT',
  MISSING_CONFIGURATION: 'MISSING_CONFIGURATION',
  
  // Backup errors
  BACKUP_ERROR: 'BACKUP_ERROR',
  BACKUP_CREATION_FAILED: 'BACKUP_CREATION_FAILED',
  BACKUP_RESTORE_FAILED: 'BACKUP_RESTORE_FAILED',
  
  // System errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  FILE_ACCESS_ERROR: 'FILE_ACCESS_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
} as const;

// Error message templates
export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed for the provided configuration',
  [ERROR_CODES.INVALID_FORMAT]: 'The provided value has an invalid format',
  [ERROR_CODES.REQUIRED_FIELD]: 'This field is required',
  
  [ERROR_CODES.CONNECTION_ERROR]: 'Failed to establish connection',
  [ERROR_CODES.OAUTH_CONNECTION_FAILED]: 'OAuth provider connection failed',
  [ERROR_CODES.DATABASE_CONNECTION_FAILED]: 'Database connection failed',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error occurred',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Connection timed out',
  
  [ERROR_CODES.CONFIGURATION_ERROR]: 'Configuration error occurred',
  [ERROR_CODES.INVALID_CONFIGURATION]: 'The configuration is invalid',
  [ERROR_CODES.CONFIGURATION_CONFLICT]: 'Configuration conflict detected',
  [ERROR_CODES.MISSING_CONFIGURATION]: 'Required configuration is missing',
  
  [ERROR_CODES.BACKUP_ERROR]: 'Backup operation failed',
  [ERROR_CODES.BACKUP_CREATION_FAILED]: 'Failed to create configuration backup',
  [ERROR_CODES.BACKUP_RESTORE_FAILED]: 'Failed to restore configuration from backup',
  
  [ERROR_CODES.SYSTEM_ERROR]: 'System error occurred',
  [ERROR_CODES.FILE_ACCESS_ERROR]: 'Failed to access configuration file',
  [ERROR_CODES.PERMISSION_ERROR]: 'Insufficient permissions for this operation',
} as const;

// Error handling utilities
export const createSetupError = (
  code: keyof typeof ERROR_CODES,
  customMessage?: string,
  field?: string,
  section?: ConfigurationSection,
  details?: any
): SetupError => {
  const message = customMessage || ERROR_MESSAGES[code];
  return new SetupError(message, code, field, section, details);
};

export const isSetupError = (error: unknown): error is SetupError => {
  return error instanceof SetupError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isConnectionError = (error: unknown): error is ConnectionError => {
  return error instanceof ConnectionError;
};

export const isConfigurationError = (error: unknown): error is ConfigurationError => {
  return error instanceof ConfigurationError;
};

export const isBackupError = (error: unknown): error is BackupError => {
  return error instanceof BackupError;
};

// Error formatting for API responses
export const formatErrorResponse = (error: unknown) => {
  if (isSetupError(error)) {
    return {
      error: true,
      code: error.code,
      message: error.message,
      field: error.field,
      section: error.section,
      details: error.details,
    };
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return {
      error: true,
      code: ERROR_CODES.SYSTEM_ERROR,
      message: error.message,
    };
  }
  
  // Handle unknown errors
  return {
    error: true,
    code: ERROR_CODES.SYSTEM_ERROR,
    message: 'An unknown error occurred',
  };
};

// Error logging helper
export const logSetupError = (error: unknown, context?: string) => {
  const errorInfo = formatErrorResponse(error);
  console.error(`[Setup Error${context ? ` - ${context}` : ''}]:`, errorInfo);
  return errorInfo;
};