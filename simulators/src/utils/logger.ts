import winston from 'winston';
import { config } from '@/config/index.js';

// Create custom formatter for console output
const consoleFormatter = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, deviceId, deviceType, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;
    
    if (deviceId) {
      logMessage += ` [${deviceType || 'DEVICE'}:${deviceId}]`;
    }
    
    logMessage += ` ${message}`;
    
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create file formatter
const fileFormatter = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.getLogLevel(),
  format: winston.format.errors({ stack: true }),
  defaultMeta: { service: 'obedio-simulator' },
  transports: []
});

// Add console transport if enabled
if (config.isConsoleLogEnabled()) {
  logger.add(new winston.transports.Console({
    format: consoleFormatter
  }));
}

// Add file transport if enabled
if (config.isFileLogEnabled()) {
  const logFilePath = config.getLogFilePath();
  
  // Ensure logs directory exists
  import('fs').then(fs => {
    const path = require('path');
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  });
  
  logger.add(new winston.transports.File({
    filename: logFilePath,
    format: fileFormatter,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));
}

// Device-specific logger class
export class DeviceLogger {
  private deviceId: string;
  private deviceType: string;
  
  constructor(deviceId: string, deviceType: string) {
    this.deviceId = deviceId;
    this.deviceType = deviceType;
  }
  
  private log(level: string, message: string, meta: any = {}) {
    logger.log(level, message, {
      deviceId: this.deviceId,
      deviceType: this.deviceType,
      ...meta
    });
  }
  
  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }
  
  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }
  
  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }
  
  error(message: string, error?: Error | any, meta?: any) {
    const errorMeta = error instanceof Error ? { 
      error: error.message, 
      stack: error.stack 
    } : { error };
    
    this.log('error', message, { ...errorMeta, ...meta });
  }
  
  mqtt(direction: 'SEND' | 'RECV', topic: string, payload: any) {
    this.log('debug', `MQTT ${direction}`, {
      topic,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      direction
    });
  }
  
  event(eventType: string, data: any) {
    this.log('info', `EVENT ${eventType}`, { eventType, data });
  }
  
  metrics(metrics: any) {
    this.log('debug', 'METRICS', metrics);
  }
}

// Export main logger for non-device specific logging
export { logger };

// Utility functions
export const createDeviceLogger = (deviceId: string, deviceType: string): DeviceLogger => {
  return new DeviceLogger(deviceId, deviceType);
};

export const logStartup = (message: string, meta?: any) => {
  logger.info(`🚀 ${message}`, { component: 'startup', ...meta });
};

export const logShutdown = (message: string, meta?: any) => {
  logger.info(`🛑 ${message}`, { component: 'shutdown', ...meta });
};

export const logError = (message: string, error: Error, meta?: any) => {
  logger.error(message, { 
    error: error.message, 
    stack: error.stack,
    ...meta 
  });
};

export const logPerformance = (operation: string, duration: number, meta?: any) => {
  logger.info(`⏱️  ${operation} completed in ${duration}ms`, { 
    operation, 
    duration,
    performance: true,
    ...meta 
  });
};