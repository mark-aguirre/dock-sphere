/**
 * Logging configuration and utilities
 */

export interface LoggingConfig {
  level: string;
  enableRequestLogging: boolean;
  enablePerformanceLogging: boolean;
  enableDockerLogging: boolean;
  logFormat: 'json' | 'pretty';
  maxLogSize?: number;
  logRetentionDays?: number;
}

export const defaultLoggingConfig: LoggingConfig = {
  level: process.env.LOG_LEVEL || 'INFO',
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
  enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING !== 'false',
  enableDockerLogging: process.env.ENABLE_DOCKER_LOGGING !== 'false',
  logFormat: (process.env.LOG_FORMAT as 'json' | 'pretty') || 
    (process.env.NODE_ENV === 'production' ? 'json' : 'pretty'),
  maxLogSize: parseInt(process.env.MAX_LOG_SIZE || '10485760'), // 10MB default
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30')
};

/**
 * Sensitive data patterns to redact from logs
 */
export const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /credential/i
];

/**
 * Redact sensitive information from objects
 */
export function redactSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const redacted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

/**
 * Format file size for logging
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration for logging
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}