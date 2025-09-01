import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { config } from '@/config';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class HttpError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code || 'HTTP_ERROR';
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized access') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Access forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends HttpError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(503, message, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

// Global error handler middleware
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Set default values
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_SERVER_ERROR';
  let message = error.message || 'Internal Server Error';
  let details = error.details;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  // Log error details
  const errorInfo = {
    error: {
      name: error.name,
      message: error.message,
      code,
      statusCode,
      stack: config.nodeEnv === 'development' ? error.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
      },
      body: config.nodeEnv === 'development' ? req.body : undefined,
      params: req.params,
      query: req.query,
    },
  };

  // Log at appropriate level based on status code
  if (statusCode >= 500) {
    logger.error(errorInfo, `Server Error: ${message}`);
  } else if (statusCode >= 400) {
    logger.warn(errorInfo, `Client Error: ${message}`);
  } else {
    logger.info(errorInfo, `Handled Error: ${message}`);
  }

  // Create error response
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  // Include additional details in development
  if (config.nodeEnv === 'development') {
    errorResponse.error.details = details;
    errorResponse.error.stack = error.stack;
  }

  // Include request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id'];
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

// Async error wrapper for route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create standardized error responses
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
) {
  return {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      details,
    },
  };
}

// Create standardized success responses
export function createSuccessResponse(data: any, message?: string) {
  const response: any = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  return response;
}

export default errorHandler;