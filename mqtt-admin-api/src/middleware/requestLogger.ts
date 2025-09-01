import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface RequestWithStartTime extends Request {
  startTime?: number;
}

export function requestLogger(
  req: RequestWithStartTime,
  res: Response,
  next: NextFunction
): void {
  // Record start time
  req.startTime = Date.now();

  // Generate request ID if not present
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Log request start
  logger.info({
    req: {
      id: req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      forwarded: req.headers['x-forwarded-for'],
    },
  }, `${req.method} ${req.url} - Request started`);

  // Capture response end to log completion
  const originalSend = res.send;
  res.send = function(data) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    // Log request completion
    logger.info({
      req: {
        id: req.headers['x-request-id'],
        method: req.method,
        url: req.url,
      },
      res: {
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length'),
      },
      duration,
    }, `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

export default requestLogger;