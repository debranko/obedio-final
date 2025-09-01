import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse } from '@/middleware/errorHandler';
import { db } from '@/models/database';
import { RedisService } from '@/utils/redis';
import { config } from '@/config';

const router = Router();

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
    uptime: process.uptime(),
  };

  res.json(createSuccessResponse(healthData));
}));

// Detailed health check with dependencies
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Check database health
  const dbHealthy = await db.healthCheck();
  const dbInfo = await db.getConnectionInfo();

  // Check Redis health
  const redisHealthy = await RedisService.healthCheck();
  const redisInfo = await RedisService.getInfo();

  const healthData = {
    status: dbHealthy && redisHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
    uptime: process.uptime(),
    checkDuration: Date.now() - startTime,
    dependencies: {
      database: {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        connected: dbInfo.connected,
        database: dbInfo.databaseName,
        version: dbInfo.version?.split(' ')[0],
      },
      redis: {
        status: redisHealthy ? 'healthy' : 'unhealthy',
        version: redisInfo.redis_version,
        memory: redisInfo.used_memory_human,
        uptime: redisInfo.uptime_in_seconds,
      },
    },
  };

  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(createSuccessResponse(healthData));
}));

export default router;