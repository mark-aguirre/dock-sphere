/**
 * Logging middleware for API routes
 * Automatically logs requests, responses, and errors with context
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, LogContext } from '../logger';
import { v4 as uuidv4 } from 'uuid';

export interface RequestContext extends LogContext {
  requestId: string;
  startTime: number;
}

/**
 * Extract request context for logging
 */
export function extractRequestContext(request: NextRequest): RequestContext {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  return {
    requestId,
    startTime,
    method: request.method,
    endpoint: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        request.ip || 
        'unknown'
  };
}

/**
 * Log API request
 */
export function logRequest(request: NextRequest, context: RequestContext): void {
  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  
  logger.apiRequest(context.method!, context.endpoint!, {
    ...context,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined
  });
}

/**
 * Log API response
 */
export function logResponse(
  request: NextRequest, 
  response: NextResponse, 
  context: RequestContext
): void {
  const duration = Date.now() - context.startTime;
  
  logger.apiResponse(
    context.method!, 
    context.endpoint!, 
    response.status, 
    duration, 
    context
  );
  
  // Log performance warning for slow requests
  if (duration > 5000) {
    logger.performance(`${context.method} ${context.endpoint}`, duration, context);
  }
}

/**
 * Log API error
 */
export function logError(
  request: NextRequest, 
  error: Error, 
  context: RequestContext
): void {
  logger.apiError(context.method!, context.endpoint!, error, context);
}

/**
 * Wrapper function to add logging to API route handlers
 */
export function withLogging<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = extractRequestContext(request);
    
    try {
      // Log incoming request
      logRequest(request, context);
      
      // Execute the handler
      const response = await handler(request, ...args);
      
      // Log successful response
      logResponse(request, response, context);
      
      return response;
    } catch (error) {
      // Log error
      logError(request, error as Error, context);
      
      // Re-throw to let the error handler deal with it
      throw error;
    }
  };
}

/**
 * Enhanced error response with logging
 */
export function createErrorResponse(
  error: Error,
  context: RequestContext,
  statusCode: number = 500,
  errorCode?: string
): NextResponse {
  const errorResponse = {
    error: {
      code: errorCode || 'INTERNAL_ERROR',
      message: error.message,
      requestId: context.requestId,
      timestamp: new Date().toISOString()
    }
  };

  // Log the error with full context
  logger.error(`API Error Response: ${statusCode}`, {
    ...context,
    statusCode,
    errorCode: errorCode || 'INTERNAL_ERROR'
  }, error);

  return NextResponse.json(errorResponse, { status: statusCode });
}