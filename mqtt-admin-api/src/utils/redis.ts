import Redis from 'ioredis';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Redis client instance
let redisClient: Redis | null = null;

// Redis connection configuration
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keyPrefix: 'obedio:mqtt:',
  db: 0,
};

export async function connectRedis(): Promise<Redis | null> {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  try {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      logger.info('Redis connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis connection established');
    });

    redisClient.on('error', (error) => {
      logger.warn('Redis connection error (optional service):', error);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', (time: number) => {
      logger.info(`Redis reconnecting in ${time}ms`);
    });

    // Test connection with timeout
    await Promise.race([
      redisClient.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 2000))
    ]);

    logger.info('Redis connected successfully');
    return redisClient;

  } catch (error) {
    logger.warn('Redis connection failed - running without Redis caching:', error);
    if (redisClient) {
      redisClient.disconnect();
    }
    redisClient = null;
    return null;
  }
}

export const RedisService = {
  async setSession(key: string, value: any, ttl?: number): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        if (ttl) {
          await redisClient.setex(key, ttl, JSON.stringify(value));
        } else {
          await redisClient.set(key, JSON.stringify(value));
        }
      } catch (error) {
        logger.warn('Redis set failed:', error);
      }
    }
  },

  async getSession(key: string): Promise<any> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        logger.warn('Redis get failed:', error);
      }
    }
    return null;
  },

  async deleteSession(key: string): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.del(key);
      } catch (error) {
        logger.warn('Redis delete failed:', error);
      }
    }
  },

  async getCachedDeviceStatus(deviceId: string): Promise<any> {
    return this.getSession(`device:status:${deviceId}`);
  }
};

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

export function getRedisStatus(): string {
  if (!redisClient) {
    return 'disconnected';
  }
  return redisClient.status;
}