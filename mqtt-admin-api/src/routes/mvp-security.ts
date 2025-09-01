import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse } from '../middleware/errorHandler';

const router = Router();

// MVP Security endpoint that handles query parameter routing
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;
  
  switch (type) {
    case 'profiles':
      // Return mock security profiles for MVP demo
      const profiles = [
        {
          id: 'button_default',
          name: 'Button Device Default',
          description: 'Default security profile for emergency buttons',
          level: 'standard' as const,
          permissions: {
            publish: ['status', 'emergency'],
            subscribe: ['command'],
            connect: true
          },
          restrictions: {
            ipWhitelist: [],
            timeRestrictions: false,
            maxConnections: 1
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deviceCount: 12
        },
        {
          id: 'watch_premium',
          name: 'Premium Watch Profile',
          description: 'Enhanced security for premium smartwatch devices',
          level: 'enhanced' as const,
          permissions: {
            publish: ['status', 'location', 'biometrics'],
            subscribe: ['command', 'notification'],
            connect: true
          },
          restrictions: {
            ipWhitelist: ['10.0.0.0/24'],
            timeRestrictions: false,
            maxConnections: 1
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deviceCount: 8
        },
        {
          id: 'repeater_critical',
          name: 'Critical Infrastructure',
          description: 'High-security profile for network repeaters',
          level: 'critical' as const,
          permissions: {
            publish: ['network', 'topology', 'health'],
            subscribe: ['management', 'config'],
            connect: true
          },
          restrictions: {
            ipWhitelist: ['192.168.1.0/24'],
            timeRestrictions: true,
            maxConnections: 2
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deviceCount: 3
        }
      ];
      return res.json(createSuccessResponse({ profiles }, 'Security profiles retrieved'));
      
    case 'acl':
      // Return mock ACL rules for MVP demo
      const aclRules = [
        {
          id: 'acl_1',
          type: 'allow' as const,
          target: 'user' as const,
          pattern: 'device_*',
          action: 'publish' as const,
          topic: 'obedio/+/+/+/status',
          priority: 100,
          enabled: true
        },
        {
          id: 'acl_2',
          type: 'allow' as const,
          target: 'role' as const,
          pattern: 'admin',
          action: 'both' as const,
          topic: 'obedio/#',
          priority: 1,
          enabled: true
        },
        {
          id: 'acl_3',
          type: 'deny' as const,
          target: 'ip' as const,
          pattern: '192.168.100.0/24',
          action: 'both' as const,
          topic: 'obedio/+/+/+/emergency',
          priority: 200,
          enabled: true
        }
      ];
      return res.json(createSuccessResponse({ aclRules }, 'ACL rules retrieved'));
      
    case 'certificates':
      // Return mock certificates for MVP demo
      const certificates = [
        {
          id: 'cert_ca_root',
          name: 'Obedio Root CA',
          type: 'ca',
          subject: 'CN=Obedio Root CA,O=Obedio,C=US',
          issuer: 'CN=Obedio Root CA,O=Obedio,C=US',
          validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          serialNumber: 'A1B2C3D4E5F6',
          fingerprint: 'SHA256:1234567890ABCDEF...',
          keyUsage: ['keyCertSign', 'cRLSign'],
          devices: []
        },
        {
          id: 'cert_server_mqtt',
          name: 'MQTT Broker Certificate',
          type: 'server',
          subject: 'CN=mqtt.obedio.local,O=Obedio,C=US',
          issuer: 'CN=Obedio Root CA,O=Obedio,C=US',
          validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          serialNumber: 'B2C3D4E5F6A1',
          fingerprint: 'SHA256:ABCDEF1234567890...',
          keyUsage: ['digitalSignature', 'keyEncipherment'],
          devices: []
        },
        {
          id: 'cert_client_watch01',
          name: 'Smartwatch Client #001',
          type: 'client',
          subject: 'CN=watch_001,O=Obedio,C=US',
          issuer: 'CN=Obedio Root CA,O=Obedio,C=US',
          validFrom: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          serialNumber: 'C3D4E5F6A1B2',
          fingerprint: 'SHA256:567890ABCDEF1234...',
          keyUsage: ['digitalSignature'],
          devices: ['watch_001']
        }
      ];
      return res.json(createSuccessResponse({ certificates }, 'Certificates retrieved'));
      
    case 'authorities':
      // Return mock certificate authorities for MVP demo
      const authorities = [
        {
          id: 'ca_root',
          name: 'Obedio Root CA',
          subject: 'CN=Obedio Root CA,O=Obedio,C=US',
          validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          issuedCertificates: 15,
          revokedCertificates: 2
        }
      ];
      return res.json(createSuccessResponse({ authorities }, 'Certificate authorities retrieved'));
      
    default:
      // Return general security overview
      const overview = {
        profiles: 3,
        activeCertificates: 12,
        aclRules: 8,
        securityEvents: 45,
        lastSecurityScan: new Date().toISOString(),
        threatLevel: 'low'
      };
      return res.json(createSuccessResponse(overview, 'Security overview retrieved'));
  }
}));

// POST endpoint for creating security items
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;
  const data = req.body;
  
  // For MVP, just return success with mock data
  const mockResponse = {
    id: `${type}_${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
    status: 'created'
  };
  
  res.status(201).json(createSuccessResponse(mockResponse, `${type} created successfully`));
}));

export default router;