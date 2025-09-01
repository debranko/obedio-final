# MQTT Admin API

A comprehensive Node.js/TypeScript backend service for managing MQTT infrastructure, device provisioning, and real-time communication in the Obedio IoT ecosystem.

## Features

- **MQTT Integration**: Full MQTT client with reconnection logic and message processing
- **Device Management**: Complete CRUD operations for IoT devices
- **Real-time Communication**: WebSocket gateway for live traffic monitoring
- **Device Provisioning**: QR code generation and secure device onboarding
- **Security Management**: ACL rules, certificates, and security profiles
- **Presence Tracking**: Real-time device presence monitoring
- **Traffic Analytics**: Comprehensive traffic metrics and analytics
- **Production Ready**: Comprehensive error handling, logging, and security

## Architecture

```
mqtt-admin-api/
├── src/
│   ├── config/           # Configuration management
│   ├── middleware/       # Express middleware
│   ├── models/          # Database models and utilities
│   ├── routes/          # API route handlers
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   ├── websocket/       # WebSocket gateway
│   └── server.ts        # Main application entry
├── Dockerfile           # Docker configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## API Endpoints

### Devices
- `GET /api/v1/devices` - List all devices
- `POST /api/v1/devices` - Create new device
- `GET /api/v1/devices/:id` - Get device details
- `PUT /api/v1/devices/:id` - Update device
- `DELETE /api/v1/devices/:id` - Delete device
- `POST /api/v1/devices/:id/command` - Send command to device
- `GET /api/v1/devices/:id/status` - Get device status
- `GET /api/v1/devices/:id/history` - Get device activity history
- `GET /api/v1/devices/:id/presence` - Get device presence info

### Security
- `GET /api/v1/security/certificates` - List certificates
- `POST /api/v1/security/certificates` - Generate certificate
- `DELETE /api/v1/security/certificates/:id` - Revoke certificate
- `GET /api/v1/security/acl` - Get ACL rules
- `POST /api/v1/security/acl` - Create ACL rule
- `GET /api/v1/security/profiles` - List security profiles
- `POST /api/v1/security/profiles` - Create security profile
- `POST /api/v1/security/validate` - Validate security configuration

### Provisioning
- `POST /api/v1/provision/request` - Device provisioning request
- `GET /api/v1/provision/tokens` - List provision tokens
- `POST /api/v1/provision/tokens` - Create provision token
- `GET /api/v1/provision/tokens/:token` - Get token details
- `DELETE /api/v1/provision/tokens/:token` - Revoke token
- `POST /api/v1/provision/qr-code` - Generate custom QR code
- `GET /api/v1/provision/validate/:token` - Validate token

### Traffic Monitoring
- `GET /api/v1/traffic/live` - Live traffic stream info
- `GET /api/v1/traffic/history` - Historical traffic data
- `GET /api/v1/traffic/metrics` - Traffic metrics and analytics
- `GET /api/v1/traffic/devices/:id` - Device-specific traffic
- `POST /api/v1/traffic/publish` - Publish MQTT message
- `GET /api/v1/traffic/recent` - Get recent messages
- `GET /api/v1/traffic/topics` - Get active topics
- `GET /api/v1/traffic/realtime-stats` - Real-time statistics

### Health & System
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies

## WebSocket API

### Connection
Connect to `/ws` for real-time updates.

### Message Types

#### Subscribe to Topics
```json
{
  "type": "subscribe",
  "data": { "topic": "mqtt:message" }
}
```

#### Publish MQTT Message
```json
{
  "type": "mqtt:publish",
  "data": {
    "topic": "obedio/site1/room1/button/dev1/command",
    "payload": { "command": "ping" },
    "qos": 1
  }
}
```

#### Send Device Command
```json
{
  "type": "device:command",
  "data": {
    "deviceId": "site1-room1-button-dev1",
    "command": "restart",
    "params": {}
  }
}
```

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://obedio_user:password@postgres:5432/obedio

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# MQTT Broker
MQTT_BROKER_URL=mqtt://mosquitto:1883
MQTT_USERNAME=obedio-api-service
MQTT_PASSWORD=obedio_secure_password_2024
MQTT_CLIENT_ID=obedio-backend-api

# Security
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_32_char_encryption_key_here

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Provisioning
PROVISION_BASE_URL=https://provision.obedio.com

# Logging
LOG_LEVEL=debug
```

## MQTT Topic Schema

The service follows a standardized MQTT topic schema:

```
obedio/{site}/{room}/{type}/{id}/{action}
```

### Examples:
- `obedio/hotel/room101/button/btn001/status`
- `obedio/hospital/icu/watch/watch001/emergency`
- `obedio/office/floor2/repeater/rep001/relay`
- `obedio/system/api/status`

### Message Types:
- `status` - Device online/offline status
- `heartbeat` - Regular device heartbeat
- `data` - General device data
- `battery` - Battery level updates
- `signal` - Signal strength updates
- `emergency` - Emergency alerts
- `command` - Device commands
- `config` - Configuration updates

## Device Types

### Button Devices
- Emergency buttons
- Service request buttons
- General purpose buttons

### Watch Devices
- Smart watches with GPS
- Nurse call pendants
- Staff communication devices

### Repeater Devices
- Mesh network repeaters
- Range extenders
- Bridge devices

### Sensor Devices
- Environmental sensors
- Motion detectors
- Contact sensors

## Security Features

### Dynamic Security (Mosquitto dynsec)
- Dynamic client management
- ACL rule enforcement
- Role-based permissions
- Real-time security updates

### Certificate Management
- X.509 certificate generation
- Certificate revocation
- PKI infrastructure support
- Secure device authentication

### Rate Limiting
- API rate limiting
- MQTT message rate limiting
- DDoS protection
- Per-client limits

## Development

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Docker Deployment

### Build Image
```bash
docker build -t obedio-mqtt-api .
```

### Run Container
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_HOST=redis \
  -e MQTT_BROKER_URL=mqtt://mosquitto:1883 \
  obedio-mqtt-api
```

### Docker Compose
The service is designed to work with the provided Docker Compose setup:

```bash
docker-compose -f docker-compose.mqtt.yml up -d
```

## Integration

### With Mosquitto MQTT Broker
- Connects to broker with authentication
- Subscribes to device topic patterns
- Processes messages and updates database
- Implements dynamic security control

### With PostgreSQL Database
- Uses provided MQTT schema
- Stores device metadata and logs
- Maintains traffic analytics
- Handles device registration

### With Redis Cache
- Caches device presence status
- Stores WebSocket connections
- Rate limiting data
- Session management

### With Next.js Frontend
- RESTful API for device management
- WebSocket for real-time updates
- Standardized response format
- CORS configuration for frontend

## Production Considerations

### Security
- Change default JWT secret and encryption key
- Use strong MQTT credentials
- Enable HTTPS/TLS
- Configure firewall rules
- Regular security audits

### Performance
- Database connection pooling
- Redis clustering for scale
- Load balancing multiple instances
- Message queue for high throughput

### Monitoring
- Structured logging with Pino
- Health check endpoints
- Metrics collection
- Error tracking
- Performance monitoring

### Maintenance
- Regular database cleanup
- Log rotation
- Certificate renewal
- Security updates
- Backup procedures

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "details": [...]
  }
}
```

## License

MIT License - see LICENSE file for details.