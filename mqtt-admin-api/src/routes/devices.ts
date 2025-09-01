import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse, NotFoundError, ValidationError } from '@/middleware/errorHandler';
import { DeviceService } from '@/services/deviceService';
import { 
  CreateDeviceSchema, 
  UpdateDeviceSchema, 
  DeviceCommandSchema,
  PaginationSchema,
  createValidationMiddleware 
} from '@/schemas';
import { logOperation } from '@/utils/logger';

const router = Router();

// GET /api/devices - Get all devices for UI dashboard
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await DeviceService.listDevices();
      
      logOperation('devices_fetched', {
        count: result.devices.length,
      });

      res.json(createSuccessResponse({
        devices: result.devices.map((device: any) => ({
          id: device.id,
          clientId: device.clientId,
          name: device.name,
          type: device.type.toUpperCase(),
          status: device.isOnline ? 'online' : 'offline',
          site: device.site,
          room: device.room,
          lastSeen: device.lastSeen || device.createdAt,
          battery: device.battery,
          signal: device.signal,
          firmware: device.firmware,
          createdAt: device.createdAt
        })),
        total: result.pagination.total
      }, 'Devices fetched successfully'));
      
    } catch (error: any) {
      throw error;
    }
  })
);

// POST /api/devices/register - Register new device with password authentication
router.post('/register',
  createValidationMiddleware(CreateDeviceSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const deviceData = req.body;
    
    try {
      const credentials = await DeviceService.registerDevice(deviceData);
      
      logOperation('device_registered', {
        deviceId: deviceData.deviceId,
        site: deviceData.site,
        room: deviceData.room,
        type: deviceData.deviceType,
      });

      res.status(201).json(createSuccessResponse({
        device: {
          deviceId: credentials.deviceId,
          username: credentials.username,
          site: deviceData.site,
          room: deviceData.room,
          deviceType: deviceData.deviceType
        },
        credentials: {
          expiresAt: credentials.expiresAt,
          qrCode: credentials.qrCode,
          config: credentials.mqttConfig
        }
      }, 'Device registered successfully with credentials'));
      
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  })
);

// GET /api/v1/devices - List all MQTT devices
router.get('/', 
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 50 } = req.query as any;
    
    const result = await DeviceService.listDevices(page, limit);
    
    const response = createSuccessResponse(result.devices, 'Devices retrieved successfully');
    response.pagination = result.pagination;
    
    res.json(response);
  })
);

// GET /api/v1/devices/:id - Get device details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.id;
  
  const device = await DeviceService.getDevice(deviceId);
  
  if (!device) {
    throw new NotFoundError('Device');
  }
  
  res.json(createSuccessResponse(device, 'Device details retrieved'));
}));

// POST /api/v1/devices/:id/rotate - Rotate device credentials
router.post('/:id/rotate', asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.id;
  
  try {
    const credentials = await DeviceService.rotateCredentials(deviceId);
    
    logOperation('device_credentials_rotated', { deviceId });
    
    res.json(createSuccessResponse({
      credentials: {
        expiresAt: credentials.expiresAt,
        qrCode: credentials.qrCode,
        config: credentials.mqttConfig
      }
    }, 'Device credentials rotated successfully'));
    
  } catch (error: any) {
    if (error.message.includes('not found')) {
      throw new NotFoundError('Device');
    }
    throw error;
  }
}));

// GET /api/v1/devices/:id/credentials - Get device credentials (one-time view)
router.get('/:id/credentials', asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.id;
  
  const credentials = await DeviceService.getDeviceCredentials(deviceId);
  
  if (!credentials) {
    throw new NotFoundError('Device credentials not found or expired');
  }
  
  logOperation('device_credentials_viewed', { deviceId });
  
  res.json(createSuccessResponse({
    credentials: {
      username: credentials.username,
      password: credentials.password,
      qrCode: credentials.qrCode,
      config: credentials.mqttConfig,
      expiresAt: credentials.expiresAt
    }
  }, 'Device credentials retrieved (one-time view)'));
}));

// PUT /api/v1/devices/:id - Update device
router.put('/:id', 
  createValidationMiddleware(UpdateDeviceSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const deviceId = req.params.id;
    const updateData = req.body;
    
    // Check if device exists
    const device = await DeviceService.getDevice(deviceId);
    
    if (!device) {
      throw new NotFoundError('Device');
    }
    
    // For MVP, we'll just log the update operation
    // In a full implementation, this would update the database
    logOperation('device_updated', {
      deviceId,
      updatedFields: Object.keys(updateData),
    });
    
    res.json(createSuccessResponse({ id: deviceId }, 'Device updated successfully'));
  })
);

// DELETE /api/v1/devices/:id - Deactivate device
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.id;
  
  const device = await DeviceService.getDevice(deviceId);
  
  if (!device) {
    throw new NotFoundError('Device');
  }
  
  // For MVP, we'll just log the deactivation
  // In a full implementation, this would set isActive = false
  logOperation('device_deactivated', { deviceId });
  
  res.json(createSuccessResponse(null, 'Device deactivated successfully'));
}));

// POST /api/v1/devices/:id/command - Send command to device
router.post('/:id/command', 
  createValidationMiddleware(DeviceCommandSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const deviceId = req.params.id;
    const { command, params, priority = 'normal', timeout = 30000 } = req.body;
    
    const device = await DeviceService.getDevice(deviceId);
    
    if (!device) {
      throw new NotFoundError('Device');
    }
    
    if (!device.isOnline) {
      throw new ValidationError('Device is not online');
    }
    
    // Generate command ID for tracking
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // For MVP, we'll simulate command sending
    logOperation('device_command_sent', {
      deviceId,
      command,
      commandId,
      priority,
    });
    
    res.json(createSuccessResponse({ 
      commandId,
      status: 'sent',
      timeout 
    }, 'Command sent successfully'));
  })
);

// GET /api/v1/devices/:id/status - Get device status
router.get('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.id;
  
  const device = await DeviceService.getDevice(deviceId);
  
  if (!device) {
    throw new NotFoundError('Device');
  }
  
  const status = {
    deviceId,
    isOnline: device.isOnline,
    lastSeen: device.lastSeen,
    presence: device.presence,
    connectionStatus: device.presence?.status || 'unknown',
    lastUpdated: new Date().toISOString(),
  };
  
  res.json(createSuccessResponse(status, 'Device status retrieved'));
}));

// GET /api/v1/devices/:id/history - Get device activity history
router.get('/:id/history', 
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const deviceId = req.params.id;
    const { page = 1, limit = 50 } = req.query as any;
    
    const device = await DeviceService.getDevice(deviceId);
    
    if (!device) {
      throw new NotFoundError('Device');
    }
    
    // Get traffic history (simplified for MVP)
    const history = device.traffic || [];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHistory = history.slice(startIndex, endIndex);
    
    const response = createSuccessResponse(paginatedHistory, 'Device history retrieved');
    response.pagination = {
      page,
      limit,
      total: history.length,
      pages: Math.ceil(history.length / limit),
    };
    
    res.json(response);
  })
);

// GET /api/v1/devices/:id/presence - Get device presence information
router.get('/:id/presence', asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.id;
  
  const device = await DeviceService.getDevice(deviceId);
  
  if (!device) {
    throw new NotFoundError('Device');
  }
  
  const presence = {
    deviceId,
    isOnline: device.isOnline,
    lastSeen: device.lastSeen,
    status: device.presence?.status || 'unknown',
    battery: device.presence?.battery,
    rssi: device.presence?.rssi,
    connectedAt: device.presence?.connectedAt,
    disconnectedAt: device.presence?.disconnectedAt,
    metadata: device.presence?.metadata ? JSON.parse(device.presence.metadata) : null,
    timestamp: new Date().toISOString(),
  };
  
  res.json(createSuccessResponse(presence, 'Device presence retrieved'));
}));

// POST /api/v1/devices/cleanup - Clean up expired credentials (admin endpoint)
router.post('/cleanup', asyncHandler(async (req: Request, res: Response) => {
  await DeviceService.cleanupExpiredCredentials();
  
  logOperation('credentials_cleanup_performed', {});
  
  res.json(createSuccessResponse(null, 'Expired credentials cleaned up successfully'));
}));

export default router;