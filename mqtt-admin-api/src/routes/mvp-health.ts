import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse } from '../middleware/errorHandler';

const router = Router();

// MVP Health endpoint that handles query parameter routing
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;
  
  switch (type) {
    case 'repeaters':
      // Return mock repeater health data for MVP demo
      const repeaters = [
        {
          id: 'repeater_lobby',
          name: 'Lobby Repeater #1',
          location: 'Main Lobby',
          status: 'online',
          health: 95,
          lastSeen: new Date().toISOString(),
          connectedDevices: 12,
          signalStrength: -45,
          uptime: 72.5,
          throughput: {
            in: 1245,
            out: 987
          },
          errors: 0,
          warnings: 1,
          firmware: '2.1.4',
          ip: '192.168.1.101'
        },
        {
          id: 'repeater_floor2',
          name: 'Floor 2 Repeater',
          location: 'Second Floor Corridor',
          status: 'online',
          health: 87,
          lastSeen: new Date(Date.now() - 30000).toISOString(),
          connectedDevices: 8,
          signalStrength: -52,
          uptime: 168.2,
          throughput: {
            in: 892,
            out: 734
          },
          errors: 2,
          warnings: 0,
          firmware: '2.1.3',
          ip: '192.168.1.102'
        },
        {
          id: 'repeater_service',
          name: 'Service Area Repeater',
          location: 'Service Corridor',
          status: 'warning',
          health: 71,
          lastSeen: new Date(Date.now() - 120000).toISOString(),
          connectedDevices: 5,
          signalStrength: -68,
          uptime: 45.1,
          throughput: {
            in: 456,
            out: 321
          },
          errors: 1,
          warnings: 3,
          firmware: '2.0.8',
          ip: '192.168.1.103'
        }
      ];
      
      const repeaterSummary = {
        total: repeaters.length,
        online: repeaters.filter(r => r.status === 'online').length,
        warning: repeaters.filter(r => r.status === 'warning').length,
        offline: repeaters.filter(r => r.status === 'offline').length,
        avgHealth: Math.round(repeaters.reduce((sum, r) => sum + r.health, 0) / repeaters.length),
        totalDevices: repeaters.reduce((sum, r) => sum + r.connectedDevices, 0),
        totalThroughput: {
          in: repeaters.reduce((sum, r) => sum + r.throughput.in, 0),
          out: repeaters.reduce((sum, r) => sum + r.throughput.out, 0)
        }
      };
      
      return res.json(createSuccessResponse({ 
        repeaters, 
        summary: repeaterSummary 
      }, 'Repeater health data retrieved'));
      
    case 'system':
      // Return mock system health for MVP demo
      const systemHealth = {
        broker: {
          status: 'running',
          uptime: 345.6,
          connections: 25,
          messagesPerSecond: 45.2,
          memory: {
            used: '156MB',
            total: '512MB',
            percentage: 30
          },
          cpu: {
            usage: 15.4,
            cores: 4
          }
        },
        database: {
          status: 'connected',
          responseTime: 12,
          connections: 5,
          storage: {
            used: '2.1GB',
            total: '10GB',
            percentage: 21
          }
        },
        network: {
          status: 'healthy',
          latency: 8,
          packetLoss: 0.1,
          bandwidth: {
            used: '45Mbps',
            total: '100Mbps'
          }
        },
        security: {
          status: 'secure',
          activeCertificates: 12,
          expiringSoon: 2,
          securityEvents: 0,
          lastScan: new Date(Date.now() - 3600000).toISOString()
        }
      };
      
      return res.json(createSuccessResponse(systemHealth, 'System health retrieved'));
      
    case 'metrics':
      // Return mock performance metrics
      const metrics = {
        performance: {
          avgResponseTime: 45.2,
          throughput: 234.5,
          errorRate: 0.02,
          availability: 99.98
        },
        resources: {
          cpu: 15.4,
          memory: 30.2,
          disk: 21.1,
          network: 8.7
        },
        trends: {
          daily: [95, 97, 94, 98, 96, 99, 97],
          weekly: [96, 95, 98, 97, 94, 96, 98],
          monthly: [95, 96, 97, 98, 96, 97]
        }
      };
      
      return res.json(createSuccessResponse(metrics, 'Performance metrics retrieved'));
      
    default:
      // Return general health overview
      const overview = {
        status: 'healthy',
        uptime: 345.6,
        version: '2.1.4',
        environment: 'production',
        components: {
          mqtt: 'healthy',
          database: 'healthy',
          redis: 'healthy',
          security: 'healthy'
        },
        metrics: {
          devices: 25,
          repeaters: 3,
          messages: 12456,
          errors: 3
        },
        lastCheck: new Date().toISOString()
      };
      
      return res.json(createSuccessResponse(overview, 'Health overview retrieved'));
  }
}));

export default router;