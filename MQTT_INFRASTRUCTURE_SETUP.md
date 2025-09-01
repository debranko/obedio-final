# OBEDIO MQTT Monitor & Control System - Infrastructure Setup

## Overview

This document provides complete setup instructions for the OBEDIO MQTT Monitor & Control System Docker infrastructure. The system consists of four main services working together to provide comprehensive MQTT device management and monitoring capabilities.

## Architecture Components

### 🔗 Core Services

1. **Mosquitto MQTT Broker** (`mosquitto`)
   - Eclipse Mosquitto v2.0.18
   - Ports: 1883 (MQTT), 8883 (MQTT/TLS), 9001 (WebSocket)
   - Features: Dynamic security, ACL, persistence, TLS support

2. **PostgreSQL Database** (`postgresql`)
   - PostgreSQL 15 Alpine
   - Port: 5432
   - Features: MQTT device registry, traffic logs, analytics

3. **Redis Cache** (`redis`)
   - Redis 7 Alpine
   - Port: 6379
   - Features: Session management, device state caching, message queuing

4. **MQTT Admin API** (`mqtt-admin-api`)
   - Node.js TypeScript application
   - Port: 4001
   - Features: REST API, device management, provisioning, monitoring

### 🌐 Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    obedio-network                           │
│                   (172.20.0.0/16)                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Mosquitto   │  │ PostgreSQL  │  │    Redis    │        │
│  │  :1883/8883 │  │    :5432    │  │    :6379    │        │
│  │    :9001    │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            MQTT Admin API (:4001)                      │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows with Docker support
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Available Ports**: 1883, 8883, 9001, 5432, 6379, 4001
- **Disk Space**: Minimum 2GB free space for containers and volumes
- **Memory**: Minimum 2GB RAM available for Docker

### Software Dependencies

```bash
# Verify Docker installation
docker --version          # Should be ≥ 20.10
docker-compose --version  # Should be ≥ 2.0

# Verify required ports are available
netstat -tuln | grep -E ':(1883|8883|9001|5432|6379|4001)'
```

## Quick Start

### 1. Environment Setup

```bash
# Navigate to project directory
cd /path/to/OBEDIO_FINAL

# Copy environment template
cp .env.mqtt.example .env.mqtt

# Review and customize environment variables
nano .env.mqtt
```

### 2. Start All Services

```bash
# Make scripts executable (first time only)
chmod +x scripts/*.sh

# Start all MQTT services
./scripts/start-mqtt-services.sh
```

### 3. Verify Installation

```bash
# Check service health
./scripts/health-check-mqtt.sh

# View service logs
./scripts/logs-mqtt-services.sh
```

## Configuration Details

### Environment Variables

Key environment variables in `.env.mqtt`:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | `obedio_secure_password_2024` | PostgreSQL database password |
| `JWT_SECRET` | `your_jwt_secret_key_minimum_32_characters` | JWT signing secret |
| `ENCRYPTION_KEY` | `your_32_char_encryption_key_here` | Data encryption key |
| `MQTT_USERNAME` | `obedio-api-service` | MQTT service username |
| `LOG_LEVEL` | `info` | Application log level |
| `NODE_ENV` | `production` | Node.js environment |

### MQTT Broker Configuration

**Security Profiles**:
- `admin`: Full system access for administrative tasks
- `service`: Backend services with broad device management access
- `device`: IoT devices with restricted topic access
- `provisioning`: Device setup and initial configuration

**Topic Structure**:
```
obedio/{site}/{room}/{type}/{device_id}/
├── status          # Device status updates
├── press           # Button press events (button devices)
├── location        # Location updates (watch devices)
├── heartbeat       # Keep-alive messages
├── battery         # Battery level reports
├── cmd/            # Command topics (device subscriptions)
├── emergency/      # Emergency alerts
└── mesh/           # Mesh network data (repeaters)
```

### Database Schema

**Core Tables**:
- `mqtt_devices`: Device registry with security profiles
- `mqtt_traffic_logs`: Message traffic for analytics
- `mqtt_sessions`: Active and historical connections
- `mqtt_certificates`: X.509 certificates for device auth
- `mqtt_security_profiles`: ACL patterns and connection limits

### Volume Management

**Persistent Data Volumes**:
```
docker/volumes/
├── postgres/       # PostgreSQL data
├── redis/          # Redis persistence files
└── mosquitto/
    ├── data/       # MQTT broker persistence
    └── logs/       # MQTT broker logs
```

## Management Scripts

### Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `start-mqtt-services.sh` | Start all services | `./scripts/start-mqtt-services.sh` |
| `stop-mqtt-services.sh` | Stop services | `./scripts/stop-mqtt-services.sh [--force\|--clean]` |
| `health-check-mqtt.sh` | Check service health | `./scripts/health-check-mqtt.sh [--verbose]` |
| `logs-mqtt-services.sh` | View service logs | `./scripts/logs-mqtt-services.sh [--follow] [service]` |
| `reset-mqtt-services.sh` | Complete reset | `./scripts/reset-mqtt-services.sh --confirm` |

### Common Operations

**Start Services**:
```bash
# Standard startup
./scripts/start-mqtt-services.sh

# View startup logs
./scripts/logs-mqtt-services.sh --follow
```

**Monitor Health**:
```bash
# Quick health check
./scripts/health-check-mqtt.sh

# Detailed health check with resource usage
./scripts/health-check-mqtt.sh --verbose
```

**View Logs**:
```bash
# All services
./scripts/logs-mqtt-services.sh

# Specific service
./scripts/logs-mqtt-services.sh mosquitto

# Follow logs in real-time
./scripts/logs-mqtt-services.sh --follow mqtt-admin-api
```

**Restart Services**:
```bash
# Graceful restart
./scripts/stop-mqtt-services.sh
./scripts/start-mqtt-services.sh

# Force restart with cleanup
./scripts/stop-mqtt-services.sh --clean
./scripts/start-mqtt-services.sh
```

## Service Endpoints

### MQTT Broker Access

```bash
# Plain MQTT (development)
mqtt://localhost:1883

# TLS MQTT (production)
mqtts://localhost:8883

# WebSocket (web clients)
ws://localhost:9001
```

### Database Connections

```bash
# PostgreSQL
postgresql://obedio_user:password@localhost:5432/obedio

# Redis
redis://localhost:6379
```

### HTTP API

```bash
# Health check
curl http://localhost:4001/health

# API endpoints
curl http://localhost:4001/api/devices
curl http://localhost:4001/api/provision/tokens
```

## Security Configuration

### Production Security Checklist

**Before Production Deployment**:

1. **Change Default Passwords**:
   ```bash
   # Generate secure passwords
   openssl rand -base64 32  # For POSTGRES_PASSWORD
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 24  # For ENCRYPTION_KEY
   ```

2. **Enable Authentication**:
   ```bash
   # In .env.mqtt
   ENABLE_API_AUTH=true
   API_KEY=your_secure_api_key_here
   ```

3. **Configure TLS**:
   ```bash
   # Generate certificates or use existing ones
   ENABLE_TLS=true
   SSL_CERT_PATH=/mosquitto/certs/server.crt
   SSL_KEY_PATH=/mosquitto/certs/server.key
   ```

4. **Set Production Environment**:
   ```bash
   NODE_ENV=production
   ENABLE_DEBUG_MODE=false
   ENABLE_TEST_ENDPOINTS=false
   ```

### Certificate Management

**Generate Self-Signed Certificates** (Development):
```bash
# Navigate to certificates directory
cd docker/certificates

# Generate CA key and certificate
openssl req -new -x509 -days 365 -extensions v3_ca -keyout ca.key -out ca.crt

# Generate server key and certificate
openssl req -new -keyout server.key -out server.csr
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365
```

## Troubleshooting

### Common Issues

**Port Conflicts**:
```bash
# Check port usage
lsof -i :1883
lsof -i :5432
lsof -i :6379
lsof -i :4001

# Stop conflicting services
sudo systemctl stop postgresql  # If system PostgreSQL is running
sudo systemctl stop redis       # If system Redis is running
```

**Permission Issues**:
```bash
# Fix volume permissions
sudo chown -R $(id -u):$(id -g) docker/volumes/
chmod 755 docker/volumes/mosquitto/{data,logs}
chmod 700 docker/volumes/postgres
```

**Memory Issues**:
```bash
# Check Docker memory usage
docker stats

# Clean up unused resources
docker system prune -a --volumes
```

**Service Won't Start**:
```bash
# Check service logs
./scripts/logs-mqtt-services.sh [service_name]

# Restart with clean state
./scripts/reset-mqtt-services.sh --confirm
./scripts/start-mqtt-services.sh
```

### Debug Mode

**Enable Debug Logging**:
```bash
# In .env.mqtt
LOG_LEVEL=debug
ENABLE_DEBUG_MODE=true

# Restart services
./scripts/stop-mqtt-services.sh
./scripts/start-mqtt-services.sh
```

### Health Check Details

The health check script validates:
- ✅ Docker daemon status
- ✅ Container running status
- ✅ Service health checks
- ✅ Database connectivity
- ✅ Redis connectivity
- ✅ MQTT broker responsiveness
- ✅ API endpoint availability
- ✅ Port accessibility
- ✅ Volume disk usage

## Backup and Recovery

### Database Backup

```bash
# Manual backup
docker exec obedio-postgres pg_dump -U obedio_user obedio > backup.sql

# Restore from backup
docker exec -i obedio-postgres psql -U obedio_user obedio < backup.sql
```

### Volume Backup

```bash
# Create volume backup
tar -czf mqtt-volumes-backup.tar.gz docker/volumes/

# Restore volume backup
tar -xzf mqtt-volumes-backup.tar.gz
```

## Monitoring and Analytics

### Performance Metrics

**Container Resource Usage**:
```bash
# Real-time stats
docker stats

# Historical usage
docker exec obedio-postgres psql -U obedio_user -d obedio -c "SELECT * FROM mqtt_traffic_summary;"
```

**MQTT Broker Statistics**:
```bash
# Broker uptime
mosquitto_sub -h localhost -t '$SYS/broker/uptime' -C 1

# Connected clients
mosquitto_sub -h localhost -t '$SYS/broker/clients/connected' -C 1
```

## Integration with OBEDIO System

The MQTT infrastructure is designed to integrate seamlessly with the existing OBEDIO system:

1. **Device Registration**: Devices registered in OBEDIO system automatically get MQTT credentials
2. **Request Routing**: MQTT messages trigger request creation in OBEDIO database
3. **Status Updates**: Device status changes are synchronized between systems
4. **User Authentication**: Shared authentication tokens between web interface and MQTT API

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Check service health
   - Review error logs
   - Monitor disk usage

2. **Monthly**:
   - Update security certificates
   - Clean up old log files
   - Review performance metrics

3. **Quarterly**:
   - Update Docker images
   - Review security configurations
   - Backup critical data

### Getting Help

**Log Collection for Support**:
```bash
# Collect all logs
./scripts/logs-mqtt-services.sh > mqtt-logs.txt

# System information
docker version > system-info.txt
docker-compose version >> system-info.txt
./scripts/health-check-mqtt.sh --verbose >> system-info.txt
```

---

## Conclusion

The OBEDIO MQTT Monitor & Control System provides a robust, scalable infrastructure for IoT device management. With proper configuration and monitoring, it can handle hundreds of devices with real-time communication, comprehensive logging, and advanced security features.

For additional support or feature requests, please refer to the project documentation or contact the development team.

**Last Updated**: 2025-01-16  
**Version**: 1.0.0  
**Compatibility**: Docker 20.10+, Docker Compose 2.0+