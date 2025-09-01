import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
  };
  redis: {
    url: string;
    host: string;
    port: number;
    password?: string;
  };
  mqtt: {
    brokerUrl: string;
    username: string;
    password: string;
    clientId: string;
    keepAlive: number;
    reconnectPeriod: number;
  };
  cors: {
    allowedOrigins: string[];
  };
  rateLimiting: {
    maxRequests: number;
    windowMs: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  encryption: {
    key: string;
  };
  certificates: {
    path: string;
    caFile: string;
    certFile: string;
    keyFile: string;
  };
  logging: {
    level: string;
    prettyPrint: boolean;
  };
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://obedio_user:password@localhost:5432/obedio',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME || 'obedio-api-service',
    password: process.env.MQTT_PASSWORD || 'obedio_secure_password_2024',
    clientId: process.env.MQTT_CLIENT_ID || 'obedio-backend-api',
    keepAlive: parseInt(process.env.MQTT_KEEP_ALIVE || '60', 10),
    reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD || '1000', 10),
  },
  
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001'
    ],
  },
  
  rateLimiting: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your_32_char_encryption_key_here',
  },
  
  certificates: {
    path: process.env.CERTIFICATES_PATH || '/app/certs',
    caFile: process.env.CA_FILE || 'ca.crt',
    certFile: process.env.CERT_FILE || 'server.crt',
    keyFile: process.env.KEY_FILE || 'server.key',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    prettyPrint: process.env.NODE_ENV !== 'production',
  },
};

// Validation
if (!config.database.url) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (!config.jwt.secret || config.jwt.secret === 'your_jwt_secret_key_here_change_in_production') {
  if (config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}

if (!config.encryption.key || config.encryption.key === 'your_32_char_encryption_key_here') {
  if (config.nodeEnv === 'production') {
    throw new Error('ENCRYPTION_KEY must be set in production');
  }
}

export default config;