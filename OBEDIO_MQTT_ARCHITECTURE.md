# Obedio MQTT Monitor & Control System Architecture

## Executive Summary

This document outlines the comprehensive architecture for integrating MQTT Monitor & Control capabilities into the existing Obedio Next.js admin panel system. The design supports up to 1000 IoT devices with real-time monitoring, device provisioning, and security management in an on-premises deployment.

## Current System Analysis

### Existing Architecture
- **Frontend**: Next.js 14.1.1 with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: SQLite (development), needs PostgreSQL migration
- **Real-time**: Server-Sent Events (SSE) via `/lib/sseEmitter.ts`
- **Basic MQTT**: Existing handlers in `/lib/mqtt-handlers/` (currently disabled)
- **Device Management**: Existing device, user, location, and request models

### Current MQTT Implementation
- Basic topic structure: `obedio/device/{id}/{action}`
- Device types: BUTTON, SMART_WATCH, REPEATER
- Provisioning system with QR codes
- Virtual device simulator for testing

## High-Level System Architecture

```mermaid
graph TD
    A[IoT Devices] --> B[Mosquitto MQTT Broker]
    B --> C[mqtt-admin-api Service]
    C --> D[PostgreSQL Database]
    C --> E[Redis Cache]
    C --> F[Next.js Admin Panel]
    F --> G[Admin Users]
    H[QR Code Provisioning] --> I[Device Onboarding]
    I --> B
    J[Certificate Authority] --> K[TLS/mTLS Security]
    K --> B
    L[WebSocket Gateway] --> F
    C --> L
```

## Enhanced MQTT Topic Schema

### Standardized Topic Structure
```
obedio/{site}/{room}/{type}/{device_id}/{action}
```

**Components:**
- `site`: Installation identifier (e.g., "yacht-1", "hotel-alpha")
- `room`: Physical location (e.g., "deck-3", "cabin-101", "bridge")
- `type`: Device type (button, watch, repeater, sensor)
- `device_id`: Unique device identifier
- `action`: Command or data type

### Topic Examples
```
# Device telemetry
obedio/yacht-1/deck-3/button/btn-001/status
obedio/yacht-1/cabin-101/watch/watch-005/heartbeat
obedio/yacht-1/bridge/repeater/rpt-001/metrics

# Device commands
obedio/yacht-1/deck-3/button/btn-001/cmd/reset
obedio/yacht-1/cabin-101/watch/watch-005/cmd/config

# System topics
obedio/yacht-1/system/provision/request
obedio/yacht-1/system/security/acl-update
```

### Message Specifications

#### Device Status Message
```json
{
  "timestamp": "2025-08-16T12:00:00Z",
  "device_id": "btn-001",
  "battery": 85,
  "signal_strength": -45,
  "firmware_version": "1.2.3",
  "location": {"lat": 45.123, "lng": -123.456},
  "metadata": {
    "temperature": 23.5,
    "humidity": 60
  }
}
```

#### Button Press Event
```json
{
  "timestamp": "2025-08-16T12:00:00Z",
  "device_id": "btn-001",
  "press_type": "single|double|long",
  "duration": 1500,
  "sequence_id": 12345,
  "priority": "normal|urgent|emergency"
}
```

## Database Schema Extensions

### New Tables

#### MQTTDevice Table
```sql
CREATE TABLE MQTTDevice (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  site VARCHAR(50) NOT NULL,
  room VARCHAR(100) NOT NULL,
  device_type VARCHAR(20) NOT NULL,
  mqtt_client_id VARCHAR(100),
  last_will_topic VARCHAR(255),
  last_will_message TEXT,
  security_profile_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Link to existing Device table
  legacy_device_id INTEGER REFERENCES Device(id),
  
  UNIQUE(site, room, device_type, device_id)
);
```

#### MQTTSecurityProfile Table
```sql
CREATE TABLE MQTTSecurityProfile (
  id SERIAL PRIMARY KEY,
  profile_name VARCHAR(100) UNIQUE NOT NULL,
  acl_pattern TEXT NOT NULL,
  max_qos INTEGER DEFAULT 1,
  max_connections INTEGER DEFAULT 1,
  client_cert_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### MQTTTrafficLog Table
```sql
CREATE TABLE MQTTTrafficLog (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  qos INTEGER,
  payload_size INTEGER,
  direction VARCHAR(10), -- 'inbound' or 'outbound'
  timestamp TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_device_timestamp (device_id, timestamp),
  INDEX idx_topic_timestamp (topic, timestamp)
);
```

### Enhanced Device Table
```sql
-- Add MQTT-specific fields to existing Device table
ALTER TABLE Device ADD COLUMN mqtt_device_id VARCHAR(50);
ALTER TABLE Device ADD COLUMN last_mqtt_activity TIMESTAMP;
ALTER TABLE Device ADD COLUMN mqtt_subscriptions TEXT; -- JSON array
ALTER TABLE Device ADD COLUMN security_profile_id INTEGER;
```

## Docker Infrastructure

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  mosquitto:
    image: eclipse-mosquitto:2.0.18
    container_name: obedio-mosquitto
    ports:
      - "1883:1883"   # MQTT
      - "8883:8883"   # MQTT over TLS
      - "9001:9001"   # WebSocket
    volumes:
      - ./docker/mosquitto/config:/mosquitto/config
      - ./docker/mosquitto/data:/mosquitto/data
      - ./docker/mosquitto/log:/mosquitto/log
      - ./docker/certificates:/mosquitto/certs
    restart: unless-stopped
    networks:
      - obedio-network

  postgresql:
    image: postgres:15-alpine
    container_name: obedio-postgres
    environment:
      POSTGRES_DB: obedio
      POSTGRES_USER: obedio_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d
    restart: unless-stopped
    networks:
      - obedio-network

  redis:
    image: redis:7-alpine
    container_name: obedio-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - obedio-network

  mqtt-admin-api:
    build:
      context: ./mqtt-admin-api
      dockerfile: Dockerfile
    container_name: obedio-mqtt-api
    environment:
      - DATABASE_URL=postgresql://obedio_user:${POSTGRES_PASSWORD}@postgresql:5432/obedio
      - REDIS_URL=redis://redis:6379
      - MQTT_BROKER_URL=mqtt://mosquitto:1883
    ports:
      - "3001:3001"
    depends_on:
      - postgresql
      - redis
      - mosquitto
    volumes:
      - ./docker/certificates:/app/certs
    restart: unless-stopped
    networks:
      - obedio-network

volumes:
  postgres_data:
  redis_data:

networks:
  obedio-network:
    driver: bridge
```

### Mosquitto Configuration
```conf
# mosquitto.conf
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd

# TLS Configuration
listener 8883
cafile /mosquitto/certs/ca.crt
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
require_certificate true

# WebSocket support for browser clients
listener 9001
protocol websockets
allow_anonymous false

# Dynamic security plugin
plugin /usr/lib/mosquitto_dynamic_security.so
plugin_opt_config_file /mosquitto/config/dynamic-security.json

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information
log_timestamp true

# Persistence
persistence true
persistence_location /mosquitto/data/

# Connection limits for 1000 devices
max_connections 1200
max_inflight_messages 100
max_queued_messages 1000
```

## MQTT Admin API Service Architecture

### Service Structure
```
mqtt-admin-api/
├── src/
│   ├── controllers/
│   │   ├── deviceController.ts
│   │   ├── securityController.ts
│   │   ├── trafficController.ts
│   │   └── provisionController.ts
│   ├── services/
│   │   ├── mqttService.ts
│   │   ├── securityService.ts
│   │   ├── deviceService.ts
│   │   └── certificateService.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── rateLimiting.ts
│   ├── models/
│   │   └── prisma.ts
│   ├── websocket/
│   │   ├── gateway.ts
│   │   └── handlers/
│   └── utils/
├── config/
├── tests/
└── docker/
```

### API Endpoints

#### Device Management
```typescript
// Device CRUD operations
GET    /api/v1/devices              // List all MQTT devices
POST   /api/v1/devices              // Create new device
GET    /api/v1/devices/:id          // Get device details
PUT    /api/v1/devices/:id          // Update device
DELETE /api/v1/devices/:id          // Delete device

// Device commands
POST   /api/v1/devices/:id/command  // Send command to device
GET    /api/v1/devices/:id/status   // Get device status
POST   /api/v1/devices/:id/provision // Provision device

// Bulk operations
POST   /api/v1/devices/bulk/command // Bulk command to multiple devices
GET    /api/v1/devices/search       // Search devices with filters
```

#### Security Management
```typescript
// Certificate management
GET    /api/v1/security/certificates     // List certificates
POST   /api/v1/security/certificates     // Generate new certificate
DELETE /api/v1/security/certificates/:id // Revoke certificate

// ACL management
GET    /api/v1/security/acl             // Get ACL rules
POST   /api/v1/security/acl             // Create ACL rule
PUT    /api/v1/security/acl/:id         // Update ACL rule
DELETE /api/v1/security/acl/:id         // Delete ACL rule

// Security profiles
GET    /api/v1/security/profiles        // List security profiles
POST   /api/v1/security/profiles        // Create security profile
```

#### Traffic Monitoring
```typescript
GET    /api/v1/traffic/live             // Live traffic stream (WebSocket)
GET    /api/v1/traffic/history          // Historical traffic data
GET    /api/v1/traffic/metrics          // Traffic metrics and analytics
GET    /api/v1/traffic/devices/:id      // Device-specific traffic
```

## Frontend Integration

### New Routes Structure
```
app/
├── mqtt/
│   ├── dashboard/
│   │   └── page.tsx              // MQTT system overview
│   ├── devices/
│   │   ├── page.tsx              // Device list and management
│   │   ├── [id]/
│   │   │   └── page.tsx          // Device details
│   │   └── provision/
│   │       └── page.tsx          // Device provisioning
│   ├── traffic/
│   │   ├── page.tsx              // Live traffic monitoring
│   │   └── analytics/
│   │       └── page.tsx          // Traffic analytics
│   ├── security/
│   │   ├── page.tsx              // Security overview
│   │   ├── certificates/
│   │   │   └── page.tsx          // Certificate management
│   │   └── acl/
│   │       └── page.tsx          // Access control lists
│   └── settings/
│       └── page.tsx              // MQTT system settings
```

### Key Components

#### Real-time Device Grid
```typescript
// components/mqtt/device-grid.tsx
interface DeviceGridProps {
  devices: MQTTDevice[]
  onDeviceSelect: (device: MQTTDevice) => void
  filters: DeviceFilters
}

export function DeviceGrid({ devices, onDeviceSelect, filters }: DeviceGridProps) {
  // Real-time updates via WebSocket
  // Device status visualization
  // Interactive device cards with status indicators
}
```

#### Live Traffic Monitor
```typescript
// components/mqtt/traffic-monitor.tsx
export function TrafficMonitor() {
  // WebSocket connection for live data
  // Message filtering and search
  // Traffic visualization charts
  // Export capabilities
}
```

#### Device Provisioning Wizard
```typescript
// components/mqtt/provision-wizard.tsx
export function ProvisionWizard() {
  // Step-by-step device setup
  // QR code generation and scanning
  // Certificate assignment
  // Security profile selection
}
```

### Updated Sidebar Navigation
```typescript
// Add to existing sidebar-nav.tsx
const mqttNavItems = [
  {
    title: 'MQTT Dashboard',
    href: '/mqtt/dashboard',
    icon: <Activity className="h-5 w-5" />,
  },
  {
    title: 'Device Management',
    href: '/mqtt/devices',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    title: 'Live Traffic',
    href: '/mqtt/traffic',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    title: 'Security Center',
    href: '/mqtt/security',
    icon: <Shield className="h-5 w-5" />,
  },
]
```

## Security Architecture

### TLS/mTLS Implementation

#### Certificate Authority Structure
```
certificates/
├── ca/
│   ├── ca.crt              # Root CA certificate
│   ├── ca.key              # Root CA private key
│   └── ca.srl              # Serial number file
├── server/
│   ├── server.crt          # MQTT broker certificate
│   ├── server.key          # MQTT broker private key
│   └── server.csr          # Certificate signing request
├── clients/
│   ├── admin/
│   │   ├── admin.crt       # Admin client certificate
│   │   └── admin.key       # Admin client private key
│   └── devices/
│       ├── device-001.crt  # Device certificates
│       └── device-001.key  # Device private keys
└── scripts/
    ├── generate-ca.sh      # CA generation script
    ├── generate-server.sh  # Server certificate script
    └── generate-client.sh  # Client certificate script
```

#### Dynamic Security Configuration
```json
{
  "clients": [
    {
      "username": "admin",
      "password": null,
      "clientid": "mqtt-admin-api",
      "roles": [{"rolename": "admin"}]
    }
  ],
  "groups": [
    {
      "groupname": "devices",
      "roles": [{"rolename": "device"}]
    }
  ],
  "roles": [
    {
      "rolename": "admin",
      "acls": [
        {
          "acltype": "publishClientSend",
          "topic": "obedio/+/+/+/+/cmd/#",
          "allow": true
        },
        {
          "acltype": "subscribePattern",
          "topic": "obedio/#",
          "allow": true
        }
      ]
    },
    {
      "rolename": "device",
      "acls": [
        {
          "acltype": "publishClientSend",
          "topic": "obedio/${site}/${room}/${type}/${clientid}/#",
          "allow": true
        },
        {
          "acltype": "subscribePattern",
          "topic": "obedio/${site}/${room}/${type}/${clientid}/cmd/#",
          "allow": true
        }
      ]
    }
  ]
}
```

### Access Control Patterns

#### Device ACL Template
```typescript
interface DeviceACL {
  deviceId: string
  site: string
  room: string
  type: string
  permissions: {
    publish: string[]     // Topics device can publish to
    subscribe: string[]   // Topics device can subscribe to
    retain: boolean       // Can set retained messages
    maxQoS: 0 | 1 | 2    // Maximum QoS level
  }
}

// Example ACL for a button device
const buttonACL: DeviceACL = {
  deviceId: "btn-001",
  site: "yacht-1",
  room: "deck-3",
  type: "button",
  permissions: {
    publish: [
      "obedio/yacht-1/deck-3/button/btn-001/status",
      "obedio/yacht-1/deck-3/button/btn-001/press",
      "obedio/yacht-1/deck-3/button/btn-001/heartbeat"
    ],
    subscribe: [
      "obedio/yacht-1/deck-3/button/btn-001/cmd/#"
    ],
    retain: false,
    maxQoS: 1
  }
}
```

## Real-time Communication Strategy

### WebSocket Gateway
```typescript
// websocket/gateway.ts
export class WebSocketGateway {
  private wss: WebSocket.Server
  private mqttClient: mqtt.MqttClient
  private redisClient: Redis

  constructor() {
    this.setupWebSocketServer()
    this.setupMQTTBridge()
    this.setupRedisSubscriptions()
  }

  // Bridge MQTT messages to WebSocket clients
  private bridgeMessages() {
    this.mqttClient.on('message', (topic, payload) => {
      const data = {
        type: 'mqtt-message',
        topic,
        payload: payload.toString(),
        timestamp: new Date().toISOString()
      }
      
      this.broadcast(data, this.getSubscribedClients(topic))
    })
  }

  // Handle client subscriptions
  public subscribeToTopic(clientId: string, topicPattern: string) {
    // Store subscription in Redis
    // Filter future messages based on pattern
  }
}
```

### SSE Integration Enhancement
```typescript
// lib/sseEmitter.ts enhancement
export const MQTT_SSE_EVENTS = {
  DEVICE_STATUS: 'mqtt:device-status',
  TRAFFIC_UPDATE: 'mqtt:traffic-update',
  SECURITY_ALERT: 'mqtt:security-alert',
  SYSTEM_HEALTH: 'mqtt:system-health'
} as const

export class MQTTEventEmitter extends EventEmitter {
  emitDeviceStatus(deviceId: string, status: DeviceStatus) {
    this.emitEvent(MQTT_SSE_EVENTS.DEVICE_STATUS, {
      deviceId,
      status,
      timestamp: new Date().toISOString()
    })
  }

  emitTrafficUpdate(traffic: TrafficMetrics) {
    this.emitEvent(MQTT_SSE_EVENTS.TRAFFIC_UPDATE, traffic)
  }
}
```

## Device Provisioning Workflow

### QR Code Generation Enhancement
```typescript
// Enhanced provisioning with MQTT-specific data
interface ProvisioningPayload {
  token: string
  site: string
  room: string
  deviceType: string
  mqttBrokerUrl: string
  securityProfile: string
  certificateDownloadUrl?: string
  configurationHash: string
}

export function generateProvisioningQR(payload: ProvisioningPayload): string {
  const qrData = {
    version: "2.0",
    protocol: "mqtt",
    ...payload
  }
  
  return QRCode.toDataURL(JSON.stringify(qrData))
}
```

### Provisioning API Flow
```mermaid
sequenceDiagram
    participant A as Admin Panel
    participant B as Backend API
    participant C as MQTT Broker
    participant D as Device
    participant E as Certificate Service

    A->>B: Create provision token
    B->>E: Generate device certificate
    E-->>B: Return certificate
    B-->>A: Return QR code with token
    
    A->>D: Show QR code
    D->>D: Scan QR code
    D->>B: Send provision request
    B->>C: Verify broker connection
    C-->>B: Connection confirmed
    B->>B: Assign device to site/room
    B-->>D: Send configuration
    D->>C: Connect with certificate
    C-->>B: Device connected event
    B-->>A: Provisioning complete
```

## PWA Configuration

### Service Worker for Offline Support
```typescript
// public/sw.js
const CACHE_NAME = 'obedio-mqtt-v1'
const OFFLINE_URLS = [
  '/mqtt/dashboard',
  '/mqtt/devices',
  '/offline'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS)
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'device-commands') {
    event.waitUntil(syncDeviceCommands())
  }
})

async function syncDeviceCommands() {
  // Sync queued device commands when back online
  const pendingCommands = await getQueuedCommands()
  for (const command of pendingCommands) {
    await sendDeviceCommand(command)
  }
}
```

### PWA Manifest
```json
{
  "name": "Obedio MQTT Control",
  "short_name": "Obedio MQTT",
  "description": "IoT Device Management and Monitoring",
  "start_url": "/mqtt/dashboard",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#2b97e9",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Device Status",
      "url": "/mqtt/devices",
      "icons": [{"src": "/icons/devices.png", "sizes": "96x96"}]
    },
    {
      "name": "Live Traffic",
      "url": "/mqtt/traffic",
      "icons": [{"src": "/icons/traffic.png", "sizes": "96x96"}]
    }
  ]
}
```

## Testing Strategy

### Unit Testing
```typescript
// tests/unit/mqtt-service.test.ts
describe('MQTTService', () => {
  test('should connect to broker with correct credentials', async () => {
    const service = new MQTTService(mockConfig)
    await service.connect()
    expect(service.isConnected).toBe(true)
  })

  test('should publish message to correct topic', async () => {
    const service = new MQTTService(mockConfig)
    await service.publishDeviceCommand('btn-001', 'reset')
    expect(mockMqttClient.publish).toHaveBeenCalledWith(
      'obedio/yacht-1/deck-3/button/btn-001/cmd/reset',
      expect.any(String)
    )
  })
})
```

### Integration Testing
```typescript
// tests/integration/device-provisioning.test.ts
describe('Device Provisioning Flow', () => {
  test('should complete full provisioning workflow', async () => {
    // Create provision token
    const token = await provisioningAPI.createToken({
      site: 'yacht-1',
      room: 'deck-3',
      deviceType: 'button'
    })

    // Simulate device provisioning
    const result = await provisioningAPI.provisionDevice({
      token: token.token,
      deviceId: 'btn-test-001'
    })

    expect(result.success).toBe(true)
    expect(result.deviceId).toBeDefined()

    // Verify device can connect to MQTT
    const device = await deviceService.getById(result.deviceId)
    expect(device.mqttConnected).toBe(true)
  })
})
```

### E2E Testing with Playwright
```typescript
// tests/e2e/mqtt-dashboard.spec.ts
test('should display real-time device updates', async ({ page }) => {
  await page.goto('/mqtt/dashboard')
  
  // Wait for initial load
  await page.waitForSelector('[data-testid="device-grid"]')
  
  // Simulate device status update
  await mockMQTTMessage({
    topic: 'obedio/yacht-1/deck-3/button/btn-001/status',
    payload: { battery: 75, signal: -50 }
  })
  
  // Verify UI updates
  await expect(page.locator('[data-device-id="btn-001"]')).toContainText('75%')
})
```

## Monitoring and Logging

### Metrics Collection
```typescript
// Prometheus metrics
const deviceMetrics = {
  connectedDevices: new prometheus.Gauge({
    name: 'mqtt_connected_devices_total',
    help: 'Number of connected MQTT devices'
  }),
  
  messageRate: new prometheus.Counter({
    name: 'mqtt_messages_total',
    help: 'Total number of MQTT messages',
    labelNames: ['topic', 'direction', 'qos']
  }),
  
  deviceBattery: new prometheus.Gauge({
    name: 'device_battery_percentage',
    help: 'Device battery percentage',
    labelNames: ['device_id', 'site', 'room']
  })
}

// Update metrics on message received
mqttClient.on('message', (topic, payload) => {
  deviceMetrics.messageRate.inc({ 
    topic: topic.split('/').slice(0, 4).join('/'), 
    direction: 'inbound',
    qos: message.qos 
  })
})
```

### Structured Logging
```typescript
// utils/logger.ts
export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mqtt-admin-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
})

// Device event logging
export function logDeviceEvent(deviceId: string, event: string, metadata?: any) {
  logger.info('Device event', {
    deviceId,
    event,
    metadata,
    timestamp: new Date().toISOString()
  })
}
```

## Migration Plan

### Phase 1: Infrastructure Setup (Week 1-2)
1. Set up Docker Compose environment
2. Configure Mosquitto with basic security
3. Migrate database from SQLite to PostgreSQL
4. Set up Redis for caching and sessions

### Phase 2: Backend API Development (Week 3-4)
1. Develop mqtt-admin-api service
2. Implement device management endpoints
3. Set up WebSocket gateway
4. Basic security implementation

### Phase 3: Frontend Integration (Week 5-6)
1. Create MQTT dashboard routes
2. Implement real-time device monitoring
3. Build device provisioning interface
4. Integrate with existing admin panel

### Phase 4: Security Hardening (Week 7)
1. Implement full TLS/mTLS
2. Set up certificate management
3. Configure dynamic security
4. Penetration testing

### Phase 5: Testing and Deployment (Week 8)
1. Comprehensive testing
2. Performance optimization
3. Documentation
4. Production deployment

### Rollback Strategy
- Maintain existing SQLite system as fallback
- Feature flags for MQTT integration
- Database migration scripts with rollback capability
- Docker Compose profiles for different deployment stages

## Performance Considerations

### Scaling for 1000 Devices
- **Message Rate**: ~10 messages/second per device = 10,000 msg/s peak
- **Storage**: ~1GB per month for traffic logs
- **Memory**: 4GB RAM minimum for Docker services
- **CPU**: 4 cores minimum for processing load
- **Network**: 10Mbps minimum bandwidth

### Optimization Strategies
- Message batching for high-frequency updates
- Redis caching for frequently accessed device data
- Database partitioning for traffic logs
- Connection pooling for database and MQTT connections
- Compression for large payloads

## Security Considerations

### Threat Model
- **Device Impersonation**: mTLS client certificates
- **Message Tampering**: TLS encryption + message signing
- **Unauthorized Access**: Dynamic ACL with role-based permissions
- **DoS Attacks**: Rate limiting and connection limits
- **Certificate Compromise**: Automated rotation and revocation

### Compliance
- Store sensitive data encrypted at rest
- Audit logging for all security events
- Regular security assessments
- Certificate lifecycle management
- Network segmentation recommendations

## Conclusion

This architecture provides a comprehensive foundation for the Obedio MQTT Monitor & Control system, designed to scale efficiently for up to 1000 devices in an on-premises environment. The modular design allows for incremental implementation and testing, while maintaining compatibility with the existing system.

The integration preserves existing authentication, UI patterns, and code organization while adding robust MQTT capabilities, real-time monitoring, and enterprise-grade security features.