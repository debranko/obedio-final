import pino from 'pino';
import { config } from '@/config';

// Create logger instance based on environment
export const logger = pino({
  level: config.logging.level,
  ...(config.logging.prettyPrint && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    },
  }),
  base: {
    service: 'mqtt-admin-api',
    environment: config.nodeEnv,
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    req: (req) => ({
      method: req?.method,
      url: req?.url,
      headers: req?.headers ? {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
      } : {},
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// MQTT specific logger
export const mqttLogger = createModuleLogger('mqtt');

// WebSocket specific logger
export const wsLogger = createModuleLogger('websocket');

// Database specific logger
export const dbLogger = createModuleLogger('database');

// Security specific logger
export const securityLogger = createModuleLogger('security');

// Traffic monitoring logger
export const trafficLogger = createModuleLogger('traffic');

// Provisioning logger
export const provisionLogger = createModuleLogger('provision');

// Error logging helper
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(
    {
      err: error,
      context,
    },
    error.message
  );
};

// Request logging helper for important operations
export const logOperation = (
  operation: string,
  details: Record<string, any>,
  level: 'info' | 'debug' | 'warn' = 'info'
) => {
  logger[level](
    {
      operation,
      ...details,
    },
    `Operation: ${operation}`
  );
};

// Performance logging helper
export const logPerformance = (
  operation: string,
  startTime: number,
  additionalData?: Record<string, any>
) => {
  const duration = Date.now() - startTime;
  logger.info(
    {
      operation,
      duration,
      ...additionalData,
    },
    `Performance: ${operation} completed in ${duration}ms`
  );
};

// Security event logging
export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
) => {
  securityLogger.warn(
    {
      securityEvent: event,
      severity,
      ...details,
    },
    `Security Event: ${event}`
  );
};

// MQTT message logging (debug only)
export const logMqttMessage = (
  direction: 'inbound' | 'outbound',
  topic: string,
  payload?: any,
  metadata?: Record<string, any>
) => {
  if (config.logging.level === 'debug') {
    mqttLogger.debug(
      {
        direction,
        topic,
        payloadSize: payload ? JSON.stringify(payload).length : 0,
        ...metadata,
      },
      `MQTT ${direction}: ${topic}`
    );
  }
};

export default logger;