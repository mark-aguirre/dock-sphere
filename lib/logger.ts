/**
 * Enhanced logging system for Container Hub Plus
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  containerId?: string;
  imageId?: string;
  volumeId?: string;
  networkId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    
    if (this.isDevelopment) {
      // Pretty format for development
      let output = `[${timestamp}] ${levelName}: ${entry.message}`;
      
      if (entry.context) {
        const contextStr = Object.entries(entry.context)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${value}`)
          .join(' ');
        if (contextStr) {
          output += ` | ${contextStr}`;
        }
      }
      
      if (entry.error) {
        output += `\nError: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\nStack: ${entry.error.stack}`;
        }
      }
      
      if (entry.metadata) {
        output += `\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}`;
      }
      
      return output;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      };
    }

    const formattedLog = this.formatLogEntry(entry);

    // Output to appropriate console method
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(formattedLog);
        break;
      default:
        console.log(formattedLog);
    }
  }

  error(message: string, context?: LogContext, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  trace(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context, undefined, metadata);
  }

  // Convenience methods for API logging
  apiRequest(method: string, endpoint: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      operation: 'api_request'
    });
  }

  apiResponse(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${endpoint} - ${statusCode}`, {
      ...context,
      method,
      endpoint,
      statusCode,
      duration,
      operation: 'api_response'
    });
  }

  apiError(method: string, endpoint: string, error: Error, context?: LogContext): void {
    this.error(`API Error: ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      operation: 'api_error'
    }, error);
  }

  dockerOperation(operation: string, resource: string, resourceId?: string, context?: LogContext): void {
    this.info(`Docker Operation: ${operation} ${resource}`, {
      ...context,
      operation: `docker_${operation}`,
      resource,
      resourceId
    });
  }

  dockerError(operation: string, resource: string, error: Error, context?: LogContext): void {
    this.error(`Docker Error: ${operation} ${resource}`, {
      ...context,
      operation: `docker_${operation}_error`,
      resource
    }, error);
  }

  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      operation: `perf_${operation}`,
      duration
    });
  }
}

// Create singleton instance
export const logger = new Logger();