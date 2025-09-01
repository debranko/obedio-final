import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse, NotFoundError, ValidationError } from '@/middleware/errorHandler';
import { DatabaseUtils } from '@/models/database';
import { RedisService } from '@/utils/redis';
import {
  TrafficQuerySchema,
  MQTTPublishSchema,
  PaginationSchema,
  DateRangeSchema,
  createValidationMiddleware
} from '@/schemas';
import { logOperation, trafficLogger } from '@/utils/logger';
import { PresenceService } from '@/services/presenceService';

const router = Router();

// GET /api/v1/traffic/live - Live traffic stream info (WebSocket handled separately)
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // Provide information about WebSocket connection for live traffic
  const info = {
    endpoint: '/ws',
    protocols: ['WebSocket', 'SSE'],
    subscriptionTopics: [
      'mqtt:message',
      'device:status',
      'device:data',
      'device:emergency'
    ],
    usage: {
      websocket: 'Connect to /ws and subscribe to topic patterns',
      sse: 'Use Server-Sent Events for real-time updates'
    },
    authentication: 'Use x-auth-bypass header for development',
    examples: {
      subscribe: {
        type: 'subscribe',
        data: { topic: 'mqtt:message' }
      }
    }
  };
  
  res.json(createSuccessResponse(info, 'Live traffic endpoint information'));
}));

// GET /api/v1/traffic/history - Historical traffic data
router.get('/history',
  createValidationMiddleware(TrafficQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { deviceId, topic, direction, qos, startTime, endTime, limit, offset } = req.query as any;
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    
    let trafficData = await DatabaseUtils.getTrafficSummary(hours);
    
    // Apply filters
    if (deviceId) {
      trafficData = trafficData.filter((entry: any) => entry.device_id === deviceId);
    }
    
    if (direction) {
      trafficData = trafficData.filter((entry: any) => entry.direction === direction);
    }
    
    // Apply pagination
    const startIndex = offset || 0;
    const endIndex = startIndex + (limit || 100);
    const paginatedData = trafficData.slice(startIndex, endIndex);
    
    const response = createSuccessResponse(paginatedData, 'Traffic history retrieved successfully');
    response.pagination = {
      limit: limit || 100,
      offset: offset || 0,
      total: trafficData.length,
      filtered: paginatedData.length,
    };
    
    res.json(response);
  })
);

// GET /api/v1/traffic/metrics - Traffic metrics and analytics
router.get('/metrics',
  createValidationMiddleware(DateRangeSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { hours, startDate, endDate } = req.query as any;
    
    const trafficData = await DatabaseUtils.getTrafficSummary(hours || 24);
    
    // Calculate comprehensive metrics
    const totalMessages = trafficData.reduce((sum: number, entry: any) => sum + entry.message_count, 0);
    const totalPayload = trafficData.reduce((sum: number, entry: any) => sum + entry.total_payload_size, 0);
    const avgPayloadSize = totalMessages > 0 ? totalPayload / totalMessages : 0;
    
    // Group by device
    const deviceMetrics = trafficData.reduce((acc: any, entry: any) => {
      if (!acc[entry.device_id]) {
        acc[entry.device_id] = {
          deviceId: entry.device_id,
          totalMessages: 0,
          totalPayload: 0,
          inbound: 0,
          outbound: 0,
        };
      }
      
      acc[entry.device_id].totalMessages += entry.message_count;
      acc[entry.device_id].totalPayload += entry.total_payload_size;
      
      if (entry.direction === 'inbound') {
        acc[entry.device_id].inbound += entry.message_count;
      } else {
        acc[entry.device_id].outbound += entry.message_count;
      }
      
      return acc;
    }, {});
    
    // Group by direction
    const messagesByDirection = trafficData.reduce((acc: any, entry: any) => {
      acc[entry.direction] = (acc[entry.direction] || 0) + entry.message_count;
      return acc;
    }, {});
    
    // Group by hour for time series
    const hourlyMetrics = trafficData.reduce((acc: any, entry: any) => {
      const hour = new Date(entry.hour).toISOString();
      if (!acc[hour]) {
        acc[hour] = {
          timestamp: hour,
          messages: 0,
          payload: 0,
          devices: new Set(),
        };
      }
      
      acc[hour].messages += entry.message_count;
      acc[hour].payload += entry.total_payload_size;
      acc[hour].devices.add(entry.device_id);
      
      return acc;
    }, {});
    
    // Convert hourly metrics to array and calculate device counts
    const timeSeriesData = Object.values(hourlyMetrics).map((entry: any) => ({
      timestamp: entry.timestamp,
      messages: entry.messages,
      payload: entry.payload,
      activeDevices: entry.devices.size,
    }));
    
    const metrics = {
      timeRange: `${hours || 24} hours`,
      summary: {
        totalMessages,
        totalPayloadSize: totalPayload,
        averagePayloadSize: Math.round(avgPayloadSize),
        activeDevices: Object.keys(deviceMetrics).length,
        peakHourMessages: Math.max(...timeSeriesData.map((d: any) => d.messages), 0),
      },
      messagesByDirection,
      deviceMetrics: Object.values(deviceMetrics),
      timeSeries: timeSeriesData.sort((a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      generatedAt: new Date().toISOString(),
    };

    res.json(createSuccessResponse(metrics, 'Traffic metrics calculated successfully'));
  })
);

// GET /api/v1/traffic/devices/:id - Device-specific traffic
router.get('/devices/:id',
  createValidationMiddleware(DateRangeSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const deviceId = req.params.id;
    const { hours } = req.query as any;
    
    // Check if device exists
    const devices = await DatabaseUtils.getDeviceStatusOverview();
    const device = devices.find((d: any) => d.device_id === deviceId);
    
    if (!device) {
      throw new NotFoundError('Device');
    }
    
    // Get device-specific traffic
    const allTrafficData = await DatabaseUtils.getTrafficSummary(hours || 24);
    const deviceTraffic = allTrafficData.filter((entry: any) => entry.device_id === deviceId);
    
    // Calculate device-specific metrics
    const totalMessages = deviceTraffic.reduce((sum: number, entry: any) => sum + entry.message_count, 0);
    const totalPayload = deviceTraffic.reduce((sum: number, entry: any) => sum + entry.total_payload_size, 0);
    
    const summary = {
      deviceId,
      deviceInfo: {
        site: device.site,
        room: device.room,
        type: device.device_type,
        isOnline: device.is_online,
      },
      metrics: {
        totalMessages,
        totalPayload,
        averagePayloadSize: totalMessages > 0 ? Math.round(totalPayload / totalMessages) : 0,
        inboundMessages: deviceTraffic
          .filter((entry: any) => entry.direction === 'inbound')
          .reduce((sum: number, entry: any) => sum + entry.message_count, 0),
        outboundMessages: deviceTraffic
          .filter((entry: any) => entry.direction === 'outbound')
          .reduce((sum: number, entry: any) => sum + entry.message_count, 0),
      },
      traffic: deviceTraffic,
      timeRange: `${hours || 24} hours`,
    };
    
    res.json(createSuccessResponse(summary, 'Device traffic retrieved successfully'));
  })
);

// POST /api/v1/traffic/publish - Publish MQTT message (for testing)
router.post('/publish',
  createValidationMiddleware(MQTTPublishSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { topic, payload, qos, retain } = req.body;
    
    // Validate topic pattern
    if (!topic.startsWith('obedio/')) {
      throw new ValidationError('Topic must start with "obedio/"');
    }
    
    // In a real implementation, this would use the MQTT service
    // For now, we'll simulate the publish and log it
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Store in Redis for recent messages
    await RedisService.cacheMqttMessage(topic, {
      messageId,
      topic,
      payload,
      qos,
      retain,
      publishedAt: new Date().toISOString(),
      source: 'api',
    });
    
    logOperation('mqtt_message_published_via_api', {
      messageId,
      topic,
      qos,
      retain,
      payloadSize: JSON.stringify(payload).length,
    });
    
    res.status(201).json(createSuccessResponse({
      messageId,
      topic,
      status: 'published',
      timestamp: new Date().toISOString(),
    }, 'MQTT message published successfully'));
  })
);

// GET /api/v1/traffic/recent - Get recent MQTT messages
router.get('/recent',
  createValidationMiddleware(PaginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as any;
    const topicPattern = (req.query.topic as string) || 'obedio/#';
    
    // Get recent messages from Redis cache
    const recentMessages = await RedisService.getRecentMessages(topicPattern, limit || 50);
    
    res.json(createSuccessResponse({
      messages: recentMessages,
      topicPattern,
      count: recentMessages.length,
      retrievedAt: new Date().toISOString(),
    }, 'Recent messages retrieved successfully'));
  })
);

// GET /api/v1/traffic/topics - Get active topics
router.get('/topics', asyncHandler(async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  
  // Get traffic data and extract unique topics
  const trafficData = await DatabaseUtils.getTrafficSummary(hours);
  
  // This would normally come from MQTT broker topic discovery
  // For now, we'll simulate based on device types and standard patterns
  const devices = await DatabaseUtils.getDeviceStatusOverview();
  
  const activeTopics = devices.reduce((topics: any[], device: any) => {
    const basePattern = `obedio/${device.site}/${device.room}/${device.device_type}/${device.device_id}`;
    
    topics.push(
      {
        topic: `${basePattern}/status`,
        type: 'status',
        deviceId: device.device_id,
        lastActivity: device.last_mqtt_activity,
        messageCount: Math.floor(Math.random() * 100), // Simulated
      },
      {
        topic: `${basePattern}/data`,
        type: 'data',
        deviceId: device.device_id,
        lastActivity: device.last_mqtt_activity,
        messageCount: Math.floor(Math.random() * 50), // Simulated
      }
    );
    
    return topics;
  }, []);
  
  // Add system topics
  activeTopics.push({
    topic: 'obedio/system/api/status',
    type: 'system',
    deviceId: 'system',
    lastActivity: new Date().toISOString(),
    messageCount: Math.floor(Math.random() * 10),
  });
  
  res.json(createSuccessResponse({
    topics: activeTopics,
    totalTopics: activeTopics.length,
    timeRange: `${hours} hours`,
    generatedAt: new Date().toISOString(),
  }, 'Active topics retrieved successfully'));
}));

// GET /api/v1/traffic/realtime-stats - Get real-time traffic statistics
router.get('/realtime-stats', asyncHandler(async (req: Request, res: Response) => {
  // Get presence statistics
  const presenceService = PresenceService.getInstance();
  const presenceStats = await presenceService.getPresenceStats();
  
  // Get recent traffic (last hour)
  const recentTraffic = await DatabaseUtils.getTrafficSummary(1);
  
  const realtimeStats = {
    presence: presenceStats,
    traffic: {
      lastHour: {
        totalMessages: recentTraffic.reduce((sum: number, entry: any) => sum + entry.message_count, 0),
        totalPayload: recentTraffic.reduce((sum: number, entry: any) => sum + entry.total_payload_size, 0),
        activeDevices: new Set(recentTraffic.map((entry: any) => entry.device_id)).size,
      },
      messagesPerMinute: Math.round(
        recentTraffic.reduce((sum: number, entry: any) => sum + entry.message_count, 0) / 60
      ),
    },
    system: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  };
  
  res.json(createSuccessResponse(realtimeStats, 'Real-time statistics retrieved'));
}));

export default router;