# OBEDIO Device Simulators

A comprehensive device simulation infrastructure for testing and demonstrating the OBEDIO MQTT Monitor & Control system. This package provides realistic IoT device simulators that connect to your MQTT broker and simulate real-world device behavior patterns.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (optional)
- Access to MQTT broker (Mosquitto)
- PostgreSQL database with OBEDIO schema

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Basic Usage

```bash
# Seed the database with test data
npm run seed

# Start a single button device simulator
npm run sim:button

# Start a smart watch simulator
npm run sim:watch

# Start multiple devices with load testing
npm run test:load

# Run all performance tests
npm run test:performance
```

## 📋 Overview

The OBEDIO Device Simulator provides:

- **🔘 Button Devices**: Emergency buttons with press patterns and voice functionality
- **⌚ Smart Watches**: Health monitoring with heart rate, steps, and fall detection
- **📡 Repeater Devices**: Mesh network repeaters with topology management
- **🔧 Generic Devices**: Configurable template-based simulators
- **📊 Performance Testing**: Load testing and metrics collection
- **🐳 Docker Integration**: Containerized deployment options
- **📈 Real-time Metrics**: System monitoring and alerting

## 🏗️ Architecture

```
simulators/
├── src/
│   ├── core/                 # Base simulator framework
│   ├── simulators/           # Device-specific implementations
│   ├── config/              # Configuration management
│   ├── utils/               # Utilities (logging, metrics)
│   ├── scripts/             # Database seeding & testing
│   └── types/               # TypeScript definitions
├── logs/                    # Log files and metrics
├── docker-compose.yml       # Docker configuration
└── README.md               # This file
```

### Core Components

- **BaseDeviceSimulator**: Abstract base class for all simulators
- **MultiDeviceRunner**: Management and orchestration of multiple simulators
- **MetricsCollector**: System performance monitoring and alerting
- **ConfigManager**: Centralized configuration with environment support

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# MQTT Configuration
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=admin
MQTT_CLIENT_ID_PREFIX=sim

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/obedio
PRISMA_DATABASE_URL=postgresql://postgres:password@localhost:5432/obedio

# Logging
LOG_LEVEL=info
LOG_DIR=logs

# Performance
METRICS_ENABLED=true
METRICS_INTERVAL=5000
METRICS_RETENTION=3600000
```

### Device Configuration

Configure devices in [`src/config/devices.json`](src/config/devices.json):

```json
{
  "button": {
    "batteryDrainRate": 0.001,
    "signalStrength": { "min": 80, "max": 100 },
    "pressPatterns": {
      "emergency": 0.05,
      "assistance": 0.3,
      "general": 0.65
    }
  },
  "watch": {
    "healthMetrics": {
      "heartRate": { "min": 60, "max": 100 },
      "steps": { "dailyGoal": 10000 }
    }
  }
}
```

## 📱 Device Types

### Button Devices

Emergency buttons with realistic press patterns:

```typescript
import { ButtonSimulator } from './simulators/button-simulator.js';

const button = new ButtonSimulator({
  deviceId: 'BTN001',
  siteId: 'hotel-alpha',
  roomId: 'room-101',
  batteryLevel: 85,
  signalStrength: 95
});

await button.start();
```

**Features:**
- Single, double, long, and emergency press patterns
- Voice ready simulation and command handling
- Battery drain simulation
- Signal strength fluctuation
- Automatic status reporting

### Smart Watches

Health monitoring devices with comprehensive metrics:

```typescript
import { WatchSimulator } from './simulators/watch-simulator.js';

const watch = new WatchSimulator({
  deviceId: 'WATCH001',
  siteId: 'hotel-alpha',
  roomId: 'crew-quarters',
  userId: 'user123'
});

await watch.start();
```

**Features:**
- Heart rate monitoring with realistic patterns
- Step counting and activity tracking
- Location services with movement simulation
- Fall detection with emergency alerts
- Charging cycles and power management
- Health trend analysis

### Repeater Devices

Mesh network repeaters for signal extension:

```typescript
import { RepeaterSimulator } from './simulators/repeater-simulator.js';

const repeater = new RepeaterSimulator({
  deviceId: 'REP001',
  siteId: 'hotel-alpha',
  roomId: 'corridor-1',
  coverageArea: 50,
  maxConnections: 20
});

await repeater.start();
```

**Features:**
- Network topology management
- Device connectivity simulation
- Power source monitoring (AC/UPS/Battery)
- Frequency management and interference detection
- Mesh routing optimization

### Generic Devices

Template-based configurable simulators:

```typescript
import { GenericDeviceSimulator } from './simulators/generic-device-simulator.js';

const device = new GenericDeviceSimulator({
  deviceId: 'SENSOR001',
  template: {
    sensors: [
      {
        name: 'temperature',
        type: 'float',
        range: { min: 18, max: 26 },
        unit: '°C'
      }
    ],
    events: [
      {
        name: 'reading',
        interval: 30000,
        payload: {
          temperature: '{{sensors.temperature}}'
        }
      }
    ]
  }
});
```

## 🔄 Multi-Device Management

### Basic Multi-Device Setup

```typescript
import { MultiDeviceRunner } from './multi-device-runner.js';

const runner = new MultiDeviceRunner();

// Add devices
await runner.addDevice('button', { deviceId: 'BTN001', siteId: 'site1' });
await runner.addDevice('watch', { deviceId: 'WATCH001', siteId: 'site1' });
await runner.addDevice('repeater', { deviceId: 'REP001', siteId: 'site1' });

// Start all devices
await runner.startAll();

// Stop all devices
await runner.stopAll();
```

### Load Testing

```typescript
const loadConfig = {
  duration: 600000,        // 10 minutes
  rampUpTime: 60000,      // 1 minute ramp-up
  maxDevices: 100,        // 100 simulated devices
  messageRate: 20,        // 20 messages per second
  deviceTypes: ['button', 'watch', 'repeater'],
  scenario: 'stress'
};

await runner.runLoadTest(loadConfig);
```

### Lifecycle Testing

```typescript
const lifecycleConfig = {
  cycles: 50,             // 50 connect/disconnect cycles
  connectDuration: 60000, // 1 minute connected
  disconnectDuration: 10000, // 10 seconds disconnected
  deviceCount: 20,        // 20 devices
  validateMessages: true  // Verify message delivery
};

await runner.runLifecycleTest(lifecycleConfig);
```

## 📊 Performance Testing

### Running Performance Tests

```bash
# List available test scenarios
npm run test:performance -- list

# Run specific scenario
npm run test:performance -- run basic_load

# Run all scenarios
npm run test:performance -- run-all

# Custom load test
npm run test:performance -- custom --duration 300000 --max-devices 50
```

### Available Test Scenarios

- **basic_load**: 20 devices for 5 minutes
- **high_load**: 100 devices for 10 minutes  
- **stress_test**: 200 devices for 15 minutes
- **endurance_test**: 50 devices for 2 hours
- **lifecycle_basic**: 10 connect/disconnect cycles
- **lifecycle_stress**: 50 cycles with 100 devices

### Metrics Collection

The system automatically collects:

- **System Metrics**: CPU, Memory, Network usage
- **MQTT Metrics**: Message counts, connection status, errors
- **Device Metrics**: Active devices, errors, status
- **Performance Alerts**: Threshold-based alerting

```typescript
import { MetricsCollector } from './utils/metrics-collector.js';

const metrics = new MetricsCollector({
  collectionInterval: 5000,
  alertThresholds: {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 }
  }
});

metrics.start();

// Listen for alerts
metrics.on('alert', (alert) => {
  console.log(`Alert: ${alert.message}`);
});
```

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f simulators

# Scale simulators
docker-compose up -d --scale button-simulator=3

# Stop services
docker-compose down
```

### Docker Services

- **button-simulator**: Button device simulator
- **watch-simulator**: Smart watch simulator  
- **repeater-simulator**: Repeater device simulator
- **load-tester**: Load testing service
- **metrics-collector**: Metrics collection service

### Custom Docker Configuration

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  button-simulator:
    environment:
      - DEVICE_COUNT=10
      - BATTERY_DRAIN_RATE=0.002
    deploy:
      replicas: 2
```

## 🛠️ Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Adding New Device Types

1. Create device simulator class extending `BaseDeviceSimulator`
2. Define device-specific configuration types
3. Implement device behavior in simulator methods
4. Add device template to configuration
5. Update multi-device runner support

Example:

```typescript
export class CustomDeviceSimulator extends BaseDeviceSimulator {
  protected deviceType = 'custom' as const;
  
  protected async initializeDevice(): Promise<void> {
    // Device-specific initialization
  }
  
  protected async simulateDeviceBehavior(): Promise<void> {
    // Device behavior simulation
  }
  
  protected async handleCommand(command: MqttCommand): Promise<void> {
    // Command handling logic
  }
}
```

## 📚 API Reference

### BaseDeviceSimulator

Core simulator functionality:

```typescript
class BaseDeviceSimulator {
  // Lifecycle management
  async start(): Promise<void>
  async stop(): Promise<void>
  
  // MQTT communication
  async publishMessage(topic: string, payload: any): Promise<void>
  protected handleCommand(command: MqttCommand): Promise<void>
  
  // Status management
  isRunning(): boolean
  getStatus(): DeviceStatus
  updateBattery(level: number): void
  updateSignal(strength: number): void
}
```

### MultiDeviceRunner

Multi-device orchestration:

```typescript
class MultiDeviceRunner {
  // Device management
  async addDevice(type: DeviceType, config: DeviceConfig): Promise<string>
  async removeDevice(deviceId: string): Promise<void>
  async startAll(): Promise<void>
  async stopAll(): Promise<void>
  
  // Testing
  async runLoadTest(config: LoadTestConfig): Promise<void>
  async runLifecycleTest(config: LifecycleTestConfig): Promise<void>
  
  // Monitoring
  getDeviceStatus(deviceId: string): DeviceStatus | null
  getAllDevices(): DeviceInfo[]
}
```

## 🔍 Troubleshooting

### Common Issues

**MQTT Connection Failed**
```
Error: Connection refused
```
- Verify MQTT broker is running
- Check MQTT_BROKER URL in .env
- Ensure firewall allows MQTT port (1883/8883)

**Database Connection Error**
```
Error: Can't connect to database
```
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run database migrations: `npx prisma migrate dev`

**High Memory Usage**
```
Warning: Memory usage above threshold
```
- Reduce number of simultaneous devices
- Adjust metrics retention period
- Monitor for memory leaks in custom simulators

**Device Not Responding**
```
Warning: Device BTN001 not responding
```
- Check device configuration
- Verify MQTT topic structure
- Review device logs for errors

### Performance Optimization

1. **Reduce Log Verbosity**: Set `LOG_LEVEL=warn` in production
2. **Optimize Metrics**: Increase `METRICS_INTERVAL` for less frequent collection
3. **Device Batching**: Start devices in batches rather than all at once
4. **Resource Limits**: Use Docker resource constraints in production

### Debugging

Enable debug logging:

```bash
# Environment variable
DEBUG=obedio:* npm run sim:button

# Or in .env file
LOG_LEVEL=debug
```

View detailed logs:

```bash
# Follow logs in real-time
tail -f logs/device-button-BTN001.log

# Search for errors
grep -i error logs/*.log

# Performance metrics
cat logs/metrics/*.json | jq '.summary'
```

## 📝 Examples

### Complete Testing Workflow

```bash
#!/bin/bash
# complete-test.sh

echo "🚀 Starting OBEDIO Device Simulator Testing"

# 1. Seed database
echo "📊 Seeding database..."
npm run seed

# 2. Start basic devices
echo "🔘 Starting button simulators..."
npm run sim:button &
BUTTON_PID=$!

echo "⌚ Starting watch simulators..."
npm run sim:watch &
WATCH_PID=$!

# 3. Wait for devices to connect
sleep 10

# 4. Run load test
echo "📈 Running load test..."
npm run test:performance -- run basic_load

# 5. Run lifecycle test
echo "🔄 Running lifecycle test..."
npm run test:performance -- run lifecycle_basic

# 6. Generate report
echo "📄 Generating performance report..."
npm run test:performance -- run-all --report complete-test-report.md

# 7. Cleanup
echo "🧹 Cleaning up..."
kill $BUTTON_PID $WATCH_PID

echo "✅ Testing completed! Check logs/ directory for results."
```

### Custom Device Template

```json
{
  "name": "Smart Thermostat",
  "type": "thermostat",
  "sensors": [
    {
      "name": "temperature",
      "type": "float",
      "range": { "min": 16, "max": 30 },
      "unit": "°C",
      "precision": 1
    },
    {
      "name": "humidity",
      "type": "float", 
      "range": { "min": 30, "max": 70 },
      "unit": "%",
      "precision": 0
    }
  ],
  "events": [
    {
      "name": "sensor_reading",
      "interval": 60000,
      "payload": {
        "temperature": "{{sensors.temperature}}",
        "humidity": "{{sensors.humidity}}",
        "timestamp": "{{timestamp}}"
      }
    },
    {
      "name": "temperature_alert",
      "condition": "sensors.temperature > 28",
      "payload": {
        "alert": "High temperature detected",
        "value": "{{sensors.temperature}}"
      }
    }
  ],
  "commands": [
    {
      "name": "set_temperature",
      "parameters": ["target_temp"],
      "response": {
        "status": "ok",
        "target": "{{parameters.target_temp}}"
      }
    }
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-simulator`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add new simulator'`
6. Push branch: `git push origin feature/new-simulator`
7. Create Pull Request

## 📄 License

This project is part of the OBEDIO system and follows the same licensing terms.

## 🆘 Support

For support and questions:

- Check the [Troubleshooting](#-troubleshooting) section
- Review logs in the `logs/` directory
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ for the OBEDIO IoT ecosystem**