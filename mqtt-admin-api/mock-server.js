const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock devices data
const mockDevices = [
  {
    id: 'btn_001',
    clientId: 'button_lobby_001',
    name: 'Lobby Emergency Button',
    type: 'BUTTON',
    status: 'online',
    site: 'Main Hotel',
    room: 'Lobby',
    lastSeen: new Date().toISOString(),
    battery: 85,
    signal: -45,
    firmware: '2.1.4',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'watch_002',
    clientId: 'smartwatch_002',
    name: 'Staff Watch #002',
    type: 'SMARTWATCH',
    status: 'online',
    site: 'Main Hotel',
    room: 'Floor 2',
    lastSeen: new Date(Date.now() - 30000).toISOString(),
    battery: 72,
    signal: -52,
    firmware: '1.8.2',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'rep_003',
    clientId: 'repeater_service_003',
    name: 'Service Area Repeater',
    type: 'REPEATER',
    status: 'warning',
    site: 'Main Hotel',
    room: 'Service Area',
    lastSeen: new Date(Date.now() - 120000).toISOString(),
    battery: 45,
    signal: -68,
    firmware: '2.0.8',
    createdAt: new Date(Date.now() - 259200000).toISOString()
  }
];

// Mock security profiles
const mockSecurityProfiles = [
  {
    id: 'button_default',
    name: 'Button Device Default',
    description: 'Default security profile for emergency buttons',
    level: 'standard',
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
    level: 'enhanced',
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
  }
];

// Routes
app.get('/api/devices', (req, res) => {
  res.json({
    success: true,
    data: {
      devices: mockDevices,
      total: mockDevices.length
    },
    message: 'Devices fetched successfully'
  });
});

app.post('/api/devices/register', (req, res) => {
  const deviceData = req.body;
  const newDevice = {
    id: `dev_${Date.now()}`,
    clientId: deviceData.deviceId,
    name: deviceData.name || `Device ${deviceData.deviceId}`,
    type: deviceData.deviceType || 'BUTTON',
    status: 'provisioning',
    site: deviceData.site,
    room: deviceData.room,
    lastSeen: new Date().toISOString(),
    battery: Math.floor(Math.random() * 100),
    signal: -Math.floor(Math.random() * 50 + 30),
    firmware: '2.1.4',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: {
      device: newDevice,
      credentials: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        qrCode: `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" fill="black">QR Code</text></svg>').toString('base64')}`,
        config: {
          broker: 'mqtt.obedio.local',
          port: 8883,
          username: `device_${newDevice.id}`,
          password: 'mock_password'
        }
      }
    },
    message: 'Device registered successfully'
  });
});

app.get('/api/security', (req, res) => {
  const { type } = req.query;
  
  if (type === 'profiles') {
    return res.json({
      success: true,
      data: { profiles: mockSecurityProfiles },
      message: 'Security profiles retrieved'
    });
  }
  
  if (type === 'certificates') {
    return res.json({
      success: true,
      data: { 
        certificates: [
          {
            id: 'cert_ca_root',
            name: 'Obedio Root CA',
            type: 'ca',
            subject: 'CN=Obedio Root CA,O=Obedio,C=US',
            validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }
        ]
      },
      message: 'Certificates retrieved'
    });
  }
  
  res.json({
    success: true,
    data: {
      profiles: 3,
      activeCertificates: 12,
      aclRules: 8,
      securityEvents: 45,
      lastSecurityScan: new Date().toISOString(),
      threatLevel: 'low'
    },
    message: 'Security overview retrieved'
  });
});

app.get('/api/health', (req, res) => {
  const { type } = req.query;
  
  if (type === 'repeaters') {
    return res.json({
      success: true,
      data: {
        repeaters: [
          {
            id: 'repeater_lobby',
            name: 'Lobby Repeater #1',
            location: 'Main Lobby',
            status: 'online',
            health: 95,
            connectedDevices: 12,
            signalStrength: -45
          }
        ],
        summary: {
          total: 3,
          online: 2,
          warning: 1,
          offline: 0,
          avgHealth: 87
        }
      },
      message: 'Repeater health data retrieved'
    });
  }
  
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: 345.6,
      version: '2.1.4',
      environment: 'production',
      components: {
        mqtt: 'healthy',
        database: 'healthy',
        security: 'healthy'
      }
    },
    message: 'Health overview retrieved'
  });
});

// MQTT Devices endpoint
app.get('/api/mqtt/devices', (req, res) => {
  const mqttDevices = [
    {
      id: 'mqtt_001',
      clientId: 'obedio_button_room101',
      name: 'Emergency Button Room 101',
      type: 'BUTTON',
      status: 'online',
      site: 'yacht-1',
      room: 'Room 101',
      lastSeen: new Date().toISOString(),
      battery: 85,
      signal: 72,
      firmware: '2.1.4',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'mqtt_002',
      clientId: 'obedio_watch_staff001',
      name: 'Staff Watch - John',
      type: 'SMARTWATCH',
      status: 'online',
      site: 'yacht-1',
      room: 'Bridge',
      lastSeen: new Date(Date.now() - 30000).toISOString(),
      battery: 67,
      signal: 85,
      firmware: '2.1.3',
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'mqtt_003',
      clientId: 'obedio_repeater_deck2',
      name: 'Deck 2 Repeater',
      type: 'REPEATER',
      status: 'offline',
      site: 'yacht-1',
      room: 'Deck 2',
      lastSeen: new Date(Date.now() - 1800000).toISOString(),
      signal: 45,
      firmware: '2.0.8',
      createdAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: {
      devices: mqttDevices,
      total: mqttDevices.length
    },
    message: 'MQTT devices retrieved successfully'
  });
});

// MQTT WebSocket info endpoint
app.get('/api/mqtt/ws', (req, res) => {
  res.json({
    success: true,
    data: {
      endpoints: {
        devices: 'ws://localhost:3001/ws/devices',
        traffic: 'ws://localhost:3001/ws/traffic',
        health: 'ws://localhost:3001/ws/health'
      }
    },
    message: 'WebSocket endpoints provided'
  });
});

// MQTT Traffic endpoint
app.get('/api/mqtt/traffic', (req, res) => {
  const mockMessages = [
    {
      id: 'msg_001',
      timestamp: new Date().toISOString(),
      topic: 'obedio/yacht-1/room101/button_001/status',
      clientId: 'obedio_button_room101',
      qos: 1,
      retain: false,
      payload: '{"status":"online","battery":85}',
      size: 35,
      direction: 'inbound'
    },
    {
      id: 'msg_002',
      timestamp: new Date(Date.now() - 15000).toISOString(),
      topic: 'obedio/yacht-1/bridge/watch_001/command',
      clientId: 'obedio_watch_staff001',
      qos: 0,
      retain: false,
      payload: '{"command":"status_update"}',
      size: 28,
      direction: 'outbound'
    }
  ];
  
  res.json({
    success: true,
    data: {
      messages: mockMessages,
      stats: {
        totalMessages: 1247,
        messagesPerSecond: 2.3,
        totalBytes: 45632,
        bytesPerSecond: 156,
        connectedClients: 3,
        activeTopics: ['obedio/+/+/status', 'obedio/+/+/telemetry', 'obedio/+/+/command']
      }
    },
    message: 'MQTT traffic data retrieved'
  });
});

// MQTT Health endpoint
app.get('/api/mqtt/health', (req, res) => {
  const { type } = req.query;
  
  if (type === 'repeaters') {
    const mockRepeaters = [
      {
        id: 'rep_001',
        name: 'Main Deck Repeater',
        location: 'Main Deck',
        ipAddress: '192.168.1.100',
        macAddress: '00:1B:44:11:3A:B7',
        status: 'online',
        uptime: 72.5,
        lastSeen: new Date().toISOString(),
        firmware: '2.1.4',
        metrics: {
          cpu: 25,
          memory: 45,
          temperature: 42,
          signalStrength: 78,
          connectedDevices: 8,
          messagesProcessed: 15420,
          errorRate: 0.2
        },
        networkInfo: {
          meshRole: 'coordinator',
          childDevices: ['mqtt_001', 'mqtt_002'],
          hopCount: 1
        }
      },
      {
        id: 'rep_002',
        name: 'Upper Deck Repeater',
        location: 'Upper Deck',
        ipAddress: '192.168.1.101',
        macAddress: '00:1B:44:11:3A:B8',
        status: 'degraded',
        uptime: 156.2,
        lastSeen: new Date(Date.now() - 120000).toISOString(),
        firmware: '2.1.3',
        metrics: {
          cpu: 65,
          memory: 78,
          temperature: 58,
          signalStrength: 45,
          connectedDevices: 3,
          messagesProcessed: 8930,
          errorRate: 3.1
        },
        networkInfo: {
          meshRole: 'router',
          parentDevice: 'rep_001',
          childDevices: ['mqtt_003'],
          hopCount: 2
        }
      }
    ];
    
    return res.json({
      success: true,
      data: {
        repeaters: mockRepeaters
      },
      message: 'MQTT repeater health data retrieved'
    });
  }
  
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: 345.6,
      version: '2.1.4',
      environment: 'production',
      components: {
        mqtt: 'healthy',
        database: 'healthy',
        security: 'healthy'
      }
    },
    message: 'MQTT health overview retrieved'
  });
});

// MQTT Provisioning endpoint for MVP
app.post('/api/mqtt/provision', (req, res) => {
  const { name, type, site, room, description } = req.body;
  
  const deviceId = `${type.toLowerCase()}_${Date.now()}`;
  const clientId = `obedio_${deviceId}`;
  const username = `${type.toLowerCase()}_${name.toLowerCase().replace(/\s+/g, '_')}`;
  const password = generateSecurePassword();
  
  const provisioningData = {
    deviceId,
    clientId,
    username,
    password,
    mqttHost: 'mqtt.obedio.local',
    mqttPort: 1883, // Standard MQTT port for MVP (non-TLS)
    topics: {
      command: `obedio/${site}/${room}/${deviceId}/command`,
      telemetry: `obedio/${site}/${room}/${deviceId}/telemetry`,
      status: `obedio/${site}/${room}/${deviceId}/status`
    }
  };
  
  res.json({
    success: true,
    data: provisioningData,
    message: 'Device provisioning data generated successfully'
  });
});

// Helper function to generate secure passwords
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

app.get('/', (req, res) => {
  res.json({
    name: 'Obedio MQTT Mock API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Mock MQTT API server running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🔗 Health check: http://localhost:${PORT}`);
});