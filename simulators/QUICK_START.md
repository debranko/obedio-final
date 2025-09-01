# OBEDIO Device Simulators - Quick Start Guide

Get up and running with the OBEDIO Device Simulators in just a few minutes.

## 🚀 Quick Setup (5 minutes)

### 1. Prerequisites Check

Ensure you have the required software:

```bash
# Check Node.js version (requires 18+)
node --version

# Check if you have npm
npm --version

# Optional: Check Docker (for containerized deployment)
docker --version
docker-compose --version
```

### 2. Clone and Install

```bash
# Navigate to the simulators directory
cd simulators

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Configure Environment

Edit the `.env` file with your settings:

```bash
# Required settings
MQTT_BROKER=mqtt://localhost:1883
DATABASE_URL=postgresql://postgres:password@localhost:5432/obedio

# Optional: Adjust logging
LOG_LEVEL=info
```

### 4. Build the Project

```bash
# Build TypeScript to JavaScript
npm run build
```

### 5. Seed Database (Optional)

```bash
# Add test data to your database
npm run seed
```

## ⚡ Quick Tests

### Test 1: Single Device (30 seconds)

```bash
# Start a button device simulator
npm run sim:button
```

You should see:
- ✅ Connection to MQTT broker
- 📊 Device status updates
- 🔘 Simulated button press events

### Test 2: Multiple Devices (2 minutes)

```bash
# In separate terminals, or use the multi-device runner
npm run sim:watch &
npm run sim:repeater &

# Or use the multi-device example
node examples/basic-usage.js
```

### Test 3: Load Testing (5 minutes)

```bash
# Run a quick load test
npm run test:performance -- run basic_load
```

## 🐳 Docker Quick Start

### Option A: Basic Docker

```bash
# Setup and start with Docker
./examples/docker-deployment.sh setup
./examples/docker-deployment.sh start
```

### Option B: Full Docker Stack

```bash
# Start all services including monitoring
./examples/docker-deployment.sh start-all

# Scale up devices
./examples/docker-deployment.sh scale 5 3 2
```

## 📱 Verify Everything Works

### Check MQTT Messages

If you have an MQTT client (like `mosquitto_sub`):

```bash
# Subscribe to all device messages
mosquitto_sub -h localhost -t "obedio/+/+/+/+"

# Subscribe to specific device type
mosquitto_sub -h localhost -t "obedio/+/+/button/+"
```

### Check Database

Verify devices are being tracked:

```sql
-- Connect to your PostgreSQL database
SELECT COUNT(*) FROM "Device";
SELECT * FROM "Device" LIMIT 5;
```

### Check Logs

```bash
# View simulator logs
ls -la logs/
tail -f logs/device-*.log
```

## 🎯 Common Use Cases

### Development Testing

```bash
# Start development environment
npm run dev

# Start specific device type
npm run sim:button -- --device-id DEV-001 --site-id dev-site
```

### Performance Testing

```bash
# Quick stress test
npm run test:performance -- custom --duration 60000 --max-devices 20

# Full test suite
npm run test:performance -- run-all
```

### Custom Device Development

```bash
# Use the generic device simulator
node examples/custom-device-template.js

# Or create your own
node -e "
const { GenericDeviceSimulator } = require('./dist/simulators/generic-device-simulator.js');
const device = new GenericDeviceSimulator({
  deviceId: 'CUSTOM-001',
  siteId: 'test-site',
  roomId: 'test-room',
  template: {
    name: 'Test Device',
    sensors: [{ name: 'value', type: 'integer', range: { min: 0, max: 100 } }],
    events: [{ name: 'reading', interval: 5000, payload: { value: '{{sensors.value}}' } }]
  }
});
device.start();
"
```

## 🔧 Troubleshooting Quick Fixes

### MQTT Connection Issues

```bash
# Check if MQTT broker is running
telnet localhost 1883

# Verify MQTT credentials
mosquitto_pub -h localhost -u admin -P admin -t test -m "hello"
```

### Database Connection Issues

```bash
# Test database connection
npm run test:db-connection

# Reset database (if needed)
npx prisma migrate reset --force
npm run seed
```

### Permission Issues

```bash
# Fix log directory permissions
sudo mkdir -p logs
sudo chown -R $USER:$USER logs

# Make scripts executable
chmod +x examples/*.sh
```

### Memory Issues

```bash
# Reduce device count
export MAX_CONCURRENT_DEVICES=10

# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 📚 Next Steps

Once you have the basic setup working:

1. **Read the full [README.md](README.md)** for comprehensive documentation
2. **Explore examples** in the [`examples/`](examples/) directory
3. **Customize device templates** for your specific IoT devices
4. **Set up monitoring** with the metrics collection system
5. **Deploy to production** using Docker Compose

## 🆘 Getting Help

### Check Logs First

```bash
# View recent logs
tail -50 logs/simulator-*.log

# Search for errors
grep -i error logs/*.log
```

### Common Log Messages

- ✅ `Device connected successfully` - Everything is working
- ⚠️ `Connection failed, retrying...` - Check MQTT broker
- ❌ `Database connection error` - Check DATABASE_URL
- 🔄 `Device reconnecting` - Normal behavior, no action needed

### Debug Mode

```bash
# Enable verbose logging
LOG_LEVEL=debug npm run sim:button

# Or with DEBUG environment variable
DEBUG=obedio:* npm run sim:button
```

### Performance Issues

```bash
# Monitor system resources
npm run monitor

# Check metrics
cat logs/metrics/metrics-*.json | jq '.summary'
```

## 🎉 Success Indicators

You'll know everything is working when you see:

- 🟢 Devices connecting to MQTT broker
- 📊 Regular status updates in logs
- 💾 Data being stored in database
- 📈 Performance metrics being collected
- 🔄 Devices reconnecting gracefully after disconnection

**Ready to simulate IoT devices at scale! 🚀**