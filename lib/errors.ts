/**
 * Custom error classes for consistent error handling
 */

export class AppError extends Error {
  statusCode: number;
  code: string;
  details: Record<string, any>;
  suggestions: string[];

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details: Record<string, any> = {},
    suggestions: string[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.suggestions = suggestions;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, any> = {}, suggestions: string[] = []) {
    super(message, 400, 'VALIDATION_ERROR', details, suggestions);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string, suggestions: string[] = []) {
    super(
      `${resource} not found: ${identifier}`,
      404,
      'NOT_FOUND',
      { resource, identifier },
      suggestions
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details: Record<string, any> = {}, suggestions: string[] = []) {
    super(message, 409, 'CONFLICT', details, suggestions);
  }
}

export class DockerError extends AppError {
  constructor(message: string, originalError?: Error, suggestions: string[] = []) {
    super(
      message,
      500,
      'DOCKER_ERROR',
      { originalError: originalError?.message },
      suggestions
    );
  }
}
