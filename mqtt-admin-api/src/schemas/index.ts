import { z } from 'zod';

// Common schemas
export const PaginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  hours: z.string().optional().transform(val => val ? parseInt(val, 10) : 24),
});

// Device schemas
export const DeviceTypeSchema = z.enum(['button', 'watch', 'repeater', 'sensor', 'gateway']);

export const DeviceLocationSchema = z.object({
  site: z.string().min(1).max(100),
  room: z.string().min(1).max(100),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
});

export const CreateDeviceSchema = z.object({
  deviceId: z.string().min(1).max(255).regex(/^[a-zA-Z0-9\-_]+$/),
  site: z.string().min(1).max(100),
  room: z.string().min(1).max(100),
  deviceType: DeviceTypeSchema,
  securityProfileName: z.string().min(1).max(100).optional(),
  metadata: z.record(z.any()).optional(),
  description: z.string().max(500).optional(),
});

export const UpdateDeviceSchema = z.object({
  site: z.string().min(1).max(100).optional(),
  room: z.string().min(1).max(100).optional(),
  deviceType: DeviceTypeSchema.optional(),
  securityProfileName: z.string().min(1).max(100).optional(),
  metadata: z.record(z.any()).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const DeviceCommandSchema = z.object({
  command: z.string().min(1).max(100),
  params: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  timeout: z.number().min(1000).max(60000).default(5000), // milliseconds
});

// Security schemas
export const SecurityProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1),
  restrictions: z.object({
    maxConnections: z.number().min(1).max(1000).optional(),
    allowedTopics: z.array(z.string()).optional(),
    deniedTopics: z.array(z.string()).optional(),
    rateLimit: z.object({
      messagesPerSecond: z.number().min(1).max(10000),
      bytesPerSecond: z.number().min(100).max(1000000),
    }).optional(),
  }).optional(),
});

export const CreateSecurityProfileSchema = SecurityProfileSchema;
export const UpdateSecurityProfileSchema = SecurityProfileSchema.partial();

export const ACLRuleSchema = z.object({
  username: z.string().min(1).max(100),
  topic: z.string().min(1).max(500),
  access: z.enum(['read', 'write', 'readwrite', 'deny']),
  priority: z.number().min(0).max(999).default(100),
});

export const CreateACLRuleSchema = ACLRuleSchema;
export const UpdateACLRuleSchema = ACLRuleSchema.partial();

export const CertificateRequestSchema = z.object({
  commonName: z.string().min(1).max(253).optional(),
  deviceId: z.string().min(1).max(255).regex(/^[a-zA-Z0-9\-_]+$/).optional(),
  deviceType: z.enum(['button', 'watch', 'sensor', 'gateway', 'admin', 'service', 'device']).default('device'),
  organizationUnit: z.string().max(100).optional(),
  organization: z.string().max(100).default('OBEDIO'),
  locality: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().length(2).default('US'),
  validityDays: z.number().min(1).max(3650).default(365),
  keyUsage: z.array(z.string()).optional(),
  extendedKeyUsage: z.array(z.string()).optional(),
  subjectAltNames: z.array(z.string()).optional(),
  keySize: z.number().min(1024).max(8192).default(2048),
});

// Provisioning schemas
export const CreateProvisionTokenSchema = z.object({
  site: z.string().min(1).max(100),
  room: z.string().min(1).max(100),
  deviceType: DeviceTypeSchema,
  description: z.string().max(500).optional(),
  expiresIn: z.number().min(300).max(86400).default(3600), // seconds (5 min to 24 hours)
  maxUses: z.number().min(1).max(100).default(1),
  metadata: z.record(z.any()).optional(),
});

export const ProvisionRequestSchema = z.object({
  token: z.string().min(1),
  deviceId: z.string().min(1).max(255).regex(/^[a-zA-Z0-9\-_]+$/),
  deviceInfo: z.object({
    model: z.string().max(100).optional(),
    firmwareVersion: z.string().max(50).optional(),
    hardwareRevision: z.string().max(50).optional(),
    serialNumber: z.string().max(100).optional(),
    macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  }).optional(),
});

export const QRCodeRequestSchema = z.object({
  data: z.string().min(1).max(2048),
  size: z.number().min(64).max(1024).default(256),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  margin: z.number().min(0).max(20).default(4),
  darkColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
  lightColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
});

// Traffic and monitoring schemas
export const TrafficQuerySchema = z.object({
  deviceId: z.string().optional(),
  topic: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  qos: z.enum(['0', '1', '2']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
});

export const MQTTPublishSchema = z.object({
  topic: z.string().min(1).max(500),
  payload: z.any(),
  qos: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(1),
  retain: z.boolean().default(false),
});

// WebSocket message schemas
export const WebSocketSubscribeSchema = z.object({
  topic: z.string().min(1).max(500),
  qos: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(1),
});

export const WebSocketMessageSchema = z.object({
  type: z.string().min(1).max(100),
  data: z.any().optional(),
  id: z.string().optional(),
});

// System health schemas
export const HealthCheckQuerySchema = z.object({
  includeDetails: z.string().optional().transform(val => val === 'true'),
  checkDependencies: z.string().optional().transform(val => val === 'true'),
});

// User and authentication schemas (for future use)
export const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(8).max(255),
  remember: z.boolean().default(false),
});

export const TokenRefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// Rate limiting schemas
export const RateLimitConfigSchema = z.object({
  windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
  maxRequests: z.number().min(1).max(10000),
  message: z.string().max(500).optional(),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
});

// Configuration schemas
export const MQTTConfigSchema = z.object({
  brokerUrl: z.string().url(),
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(255),
  clientId: z.string().min(1).max(100),
  keepAlive: z.number().min(10).max(300),
  reconnectPeriod: z.number().min(100).max(30000),
});

export const DatabaseConfigSchema = z.object({
  url: z.string().min(1),
  maxConnections: z.number().min(1).max(100).optional(),
  connectionTimeout: z.number().min(1000).max(60000).optional(),
});

export const RedisConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  password: z.string().optional(),
  database: z.number().min(0).max(15).default(0),
});

// Error response schemas
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    timestamp: z.string().datetime(),
    details: z.any().optional(),
    requestId: z.string().optional(),
  }),
});

// Success response schemas
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }).optional(),
});

// Type exports for TypeScript
export type CreateDeviceRequest = z.infer<typeof CreateDeviceSchema>;
export type UpdateDeviceRequest = z.infer<typeof UpdateDeviceSchema>;
export type DeviceCommand = z.infer<typeof DeviceCommandSchema>;
export type SecurityProfile = z.infer<typeof SecurityProfileSchema>;
export type ACLRule = z.infer<typeof ACLRuleSchema>;
export type ProvisionToken = z.infer<typeof CreateProvisionTokenSchema>;
export type ProvisionRequest = z.infer<typeof ProvisionRequestSchema>;
export type TrafficQuery = z.infer<typeof TrafficQuerySchema>;
export type MQTTPublish = z.infer<typeof MQTTPublishSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;
export type DateRangeParams = z.infer<typeof DateRangeSchema>;

// Validation middleware helper
export const validateSchema = (schema: z.ZodSchema) => {
  return (data: any) => {
    try {
      return {
        success: true,
        data: schema.parse(data),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        };
      }
      return {
        success: false,
        errors: [{ message: 'Unknown validation error' }],
      };
    }
  };
};

// Express middleware factory for validation
export const createValidationMiddleware = (schema: z.ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const validation = validateSchema(schema)(req[target]);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          timestamp: new Date().toISOString(),
          details: validation.errors,
        },
      });
    }
    
    // Replace the original data with parsed/transformed data
    req[target] = validation.data;
    next();
  };
};

export default {
  // Device schemas
  CreateDeviceSchema,
  UpdateDeviceSchema,
  DeviceCommandSchema,
  
  // Security schemas
  CreateSecurityProfileSchema,
  UpdateSecurityProfileSchema,
  CreateACLRuleSchema,
  UpdateACLRuleSchema,
  CertificateRequestSchema,
  
  // Provisioning schemas
  CreateProvisionTokenSchema,
  ProvisionRequestSchema,
  QRCodeRequestSchema,
  
  // Traffic schemas
  TrafficQuerySchema,
  MQTTPublishSchema,
  
  // Common schemas
  PaginationSchema,
  DateRangeSchema,
  HealthCheckQuerySchema,
  
  // Validation helpers
  validateSchema,
  createValidationMiddleware,
};