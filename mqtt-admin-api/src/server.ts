import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { connectDatabase } from '@/models/database';
import { connectRedis } from '@/utils/redis';
import { MqttService } from '@/services/mqttService';
import { WebSocketGateway } from '@/websocket/gateway';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { requestLogger } from '@/middleware/requestLogger';

// Import routes
import deviceRoutes from '@/routes/devices';
// import securityRoutes from '@/routes/security';
// import certificateRoutes from '@/routes/certificates';
// import trafficRoutes from '@/routes/traffic';
// import provisionRoutes from '@/routes/provision';
// import healthRoutes from '@/routes/health';

// Import MVP routes for simplified API
import mvpSecurityRoutes from './routes/mvp-security';
import mvpHealthRoutes from './routes/mvp-health';

// Load environment variables
dotenv.config();

class Application {
  public app: express.Application;
  public server: any;
  private mqttService: MqttService | null = null;
  private wsGateway: WebSocketGateway | null = null;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-bypass'],
    }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimiting.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging (temporarily disabled)
    // this.app.use(requestLogger);

    // Trust proxy for rate limiting behind reverse proxy
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API routes - v1 (full API) - Disabled for MVP
    this.app.use('/api/v1/devices', deviceRoutes);
    // this.app.use('/api/v1/security', securityRoutes);
    // this.app.use('/api/v1/certificates', certificateRoutes);
    // this.app.use('/api/v1/traffic', trafficRoutes);
    // this.app.use('/api/v1/provision', provisionRoutes);
    
    // Simplified API routes for UI (MVP)
    this.app.use('/api/devices', deviceRoutes);
    this.app.use('/api/security', mvpSecurityRoutes);
    this.app.use('/api/health', mvpHealthRoutes);
    this.app.use('/health', mvpHealthRoutes);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Obedio MQTT Admin API',
        version: process.env.npm_package_version || '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      logger.info('Database connected successfully');

      // Connect to Redis (optional for MVP)
      const redisClient = await connectRedis();
      if (redisClient) {
        logger.info('Redis connected successfully');
      } else {
        logger.warn('Running without Redis caching - MVP mode');
      }

      // Initialize MQTT service (optional for MVP)
      if (process.env.MQTT_ENABLED === 'true') {
        try {
          this.mqttService = new MqttService();
          await this.mqttService.connect();
          logger.info('MQTT service connected successfully');
        } catch (error) {
          logger.warn('MQTT service connection failed - running without MQTT:', error);
          this.mqttService = null;
        }
      } else {
        logger.info('MQTT service disabled - running in MVP mode without MQTT');
        this.mqttService = null;
      }

      // Create HTTP server
      this.server = createServer(this.app);

      // Initialize WebSocket gateway (only if MQTT is available)
      if (this.mqttService) {
        this.wsGateway = new WebSocketGateway(this.server, this.mqttService);
        logger.info('WebSocket gateway initialized');
      } else {
        logger.warn('WebSocket gateway disabled - MQTT service unavailable');
      }

      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  public start(): void {
    const port = config.port;

    this.server.listen(port, () => {
      logger.info(`🚀 MQTT Admin API server is running on port ${port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // Close server
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Close WebSocket connections
    if (this.wsGateway) {
      await this.wsGateway.close();
      logger.info('WebSocket gateway closed');
    }

    // Disconnect MQTT
    if (this.mqttService) {
      await this.mqttService.disconnect();
      logger.info('MQTT service disconnected');
    }

    // Close database connections
    // Note: Database and Redis disconnection will be handled by their respective services

    logger.info('Graceful shutdown completed');
    process.exit(0);
  }
}

// Start application
async function bootstrap() {
  try {
    const app = new Application();
    await app.initialize();
    
    // Wrap server start in try-catch to catch port binding issues
    try {
      app.start();
    } catch (startError) {
      logger.error('Failed to start server:', {
        message: startError instanceof Error ? startError.message : String(startError),
        stack: startError instanceof Error ? startError.stack : 'No stack trace',
        code: startError instanceof Error && 'code' in startError ? startError.code : 'Unknown'
      });
      process.exit(1);
    }
  } catch (error) {
    logger.error('Failed to initialize application:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown Error'
    });
    process.exit(1);
  }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason,
    promise: promise,
    stack: reason instanceof Error ? reason.stack : 'No stack trace'
  });
  process.exit(1);
});

// Start the application
bootstrap();