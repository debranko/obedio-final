import { Request, Response } from 'express';
import { createErrorResponse } from './errorHandler';

export function notFoundHandler(req: Request, res: Response): void {
  const response = createErrorResponse(
    'NOT_FOUND',
    `Route ${req.method} ${req.path} not found`,
    404,
    {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    }
  );

  res.status(404).json(response);
}

export default notFoundHandler;