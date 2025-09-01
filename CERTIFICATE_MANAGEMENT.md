# OBEDIO MQTT TLS Certificate Management

## Overview

This document describes the comprehensive TLS certificate management infrastructure implemented for the OBEDIO MQTT Monitor & Control system. The system provides automated certificate generation, validation, and management for secure MQTT communications.

## Architecture

### Certificate Infrastructure

The system implements a complete Public Key Infrastructure (PKI) with:

- **Root Certificate Authority (CA)**: Self-signed root certificate for the OBEDIO organization
- **Server Certificates**: TLS certificates for Mosquitto MQTT broker
- **Client Certificates**: Individual certificates for IoT devices and services
- **Certificate Validation**: Automated validation and verification utilities

### Components

1. **Certificate Generation Scripts** (`scripts/`)
   - [`generate-ca.sh`](scripts/generate-ca.sh) - Root CA generation
   - [`generate-server-cert.sh`](scripts/generate-server-cert.sh) - Server certificate generation
   - [`generate-client-cert.sh`](scripts/generate-client-cert.sh) - Client certificate generation
   - [`validate-certificates.sh`](scripts/validate-certificates.sh) - Certificate validation utilities

2. **Database Integration** (`mqtt-admin-api/`)
   - Certificate tracking models
   - Certificate log management
   - API endpoints for certificate operations

3. **Docker Integration** (`docker-compose.mqtt.yml`)
   - Automated certificate initialization
   - Volume mounting for certificate storage
   - TLS-enabled Mosquitto configuration

## Quick Start

### 1. Generate Root CA Certificate

```bash
./scripts/generate-ca.sh
```

This creates:
- CA private key (4096-bit RSA, 10-year validity)
- CA certificate 
- CA configuration files
- Certificate database files

### 2. Generate Server Certificate

```bash
./scripts/generate-server-cert.sh
```

This creates:
- Server private key (2048-bit RSA, 2-year validity)
- Server certificate with Subject Alternative Names
- Certificate chain and bundle files
- Mosquitto-compatible certificate files

### 3. Generate Client Certificates

```bash
./scripts/generate-client-cert.sh <device-id> <device-type> <organization>
```

Example:
```bash
./scripts/generate-client-cert.sh button-001 button OBEDIO
./scripts/generate-client-cert.sh gateway-001 gateway OBEDIO
./scripts/generate-client-cert.sh sensor-001 sensor OBEDIO
```

### 4. Validate All Certificates

```bash
./scripts/validate-certificates.sh
```

### 5. Start MQTT System with TLS

```bash
docker-compose -f docker-compose.mqtt.yml up -d
```

## Certificate Types and Configurations

### Root CA Certificate

- **Key Size**: 4096-bit RSA
- **Validity**: 10 years (3650 days)
- **Purpose**: Signs all server and client certificates
- **Location**: `docker/certificates/ca/`

### Server Certificate

- **Key Size**: 2048-bit RSA
- **Validity**: 2 years (730 days)
- **Subject**: `CN=mosquitto.obedio.local`
- **SAN**: Multiple DNS names and IP addresses for flexible connectivity
- **Purpose**: TLS encryption for MQTT broker

### Client Certificates

- **Key Size**: 2048-bit RSA
- **Validity**: 1 year (365 days)
- **Subject**: `CN=<device-id>`
- **SAN**: Device-specific DNS names
- **Purpose**: Device authentication and encryption

## Device Type Configurations

The system supports different device types with specialized certificate profiles:

### Button Devices
```bash
./scripts/generate-client-cert.sh button-001 button OBEDIO
```
- Basic client authentication
- Digital signature and key agreement

### Gateway Devices
```bash
./scripts/generate-client-cert.sh gateway-001 gateway OBEDIO
```
- Client and server authentication capabilities
- Enhanced key usage for gateway functions

### Sensor Devices
```bash
./scripts/generate-client-cert.sh sensor-001 sensor OBEDIO
```
- Standard client authentication
- Optimized for low-power devices

### Admin/Service Accounts
```bash
./scripts/generate-client-cert.sh admin-001 admin OBEDIO
```
- Full client and server authentication
- Administrative privileges

## Generated Files Structure

```
docker/certificates/
├── ca/
│   ├── ca.key              # CA private key (600 permissions)
│   ├── ca.crt              # CA certificate (644 permissions)
│   ├── ca.conf             # CA configuration
│   └── ca.db/              # Certificate database files
├── server/
│   ├── server.key          # Server private key (600 permissions)
│   ├── server.crt          # Server certificate (644 permissions)
│   ├── server-chain.crt    # Certificate chain
│   └── server.conf         # Server configuration
├── clients/
│   └── <device-id>/
│       ├── <device-id>.key        # Client private key (600 permissions)
│       ├── <device-id>.crt        # Client certificate (644 permissions)
│       ├── <device-id>-chain.crt  # Certificate chain
│       ├── <device-id>-bundle.pem # Combined bundle
│       ├── <device-id>-mqtt.conf  # MQTT client configuration
│       └── <device-id>.env        # Environment configuration
├── backup/                 # Automatic backups of replaced certificates
├── ca.crt                 # Mosquitto CA certificate
├── server.crt             # Mosquitto server certificate
└── server.key             # Mosquitto server private key
```

## API Endpoints

The system provides REST API endpoints for certificate management:

### Certificate Operations

- `POST /api/certificates/generate-client` - Generate new client certificate
- `GET /api/certificates/list` - List all certificates
- `GET /api/certificates/:id` - Get certificate details
- `DELETE /api/certificates/:id` - Revoke certificate
- `POST /api/certificates/validate` - Validate certificate

### Certificate Request Schema

```typescript
{
  deviceId: string;      // Unique device identifier
  deviceType: string;    // Device type (button, gateway, sensor, admin)
  organization: string;  // Organization name (default: OBEDIO)
  validityDays?: number; // Certificate validity period
}
```

## Database Schema

### MqttCertificate Model

```typescript
model MqttCertificate {
  id              Int      @id @default(autoincrement())
  deviceId        String   @unique
  deviceType      String
  organization    String
  serialNumber    String   @unique
  fingerprint     String
  issuedAt        DateTime @default(now())
  expiresAt       DateTime
  revokedAt       DateTime?
  certificatePath String
  privateKeyPath  String
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  logs            MqttCertificateLog[]
}
```

### MqttCertificateLog Model

```typescript
model MqttCertificateLog {
  id            Int      @id @default(autoincrement())
  certificateId Int
  action        String   // ISSUED, RENEWED, REVOKED, VALIDATED
  details       String?
  timestamp     DateTime @default(now())
  
  certificate   MqttCertificate @relation(fields: [certificateId], references: [id])
}
```

## Testing Certificate Connectivity

### Test with OpenSSL

```bash
# Test server certificate
openssl s_client -connect localhost:8883 \
  -CAfile docker/certificates/ca/ca.crt \
  -cert docker/certificates/clients/button-001/button-001.crt \
  -key docker/certificates/clients/button-001/button-001.key
```

### Test with Mosquitto Client

```bash
# Publish with client certificate
mosquitto_pub -h localhost -p 8883 \
  --cafile docker/certificates/ca/ca.crt \
  --cert docker/certificates/clients/button-001/button-001.crt \
  --key docker/certificates/clients/button-001/button-001.key \
  -t 'obedio/devices/button/button-001/status' \
  -m '{"status":"online"}'

# Subscribe with client certificate
mosquitto_sub -h localhost -p 8883 \
  --cafile docker/certificates/ca/ca.crt \
  --cert docker/certificates/clients/button-001/button-001.crt \
  --key docker/certificates/clients/button-001/button-001.key \
  -t 'obedio/devices/+/+/+'
```

## Security Considerations

### File Permissions

- **Private Keys**: 600 (owner read/write only)
- **Certificates**: 644 (owner read/write, group/others read)
- **CA Directory**: 700 (owner access only)

### Certificate Rotation

- **CA Certificate**: 10-year validity, manual rotation required
- **Server Certificate**: 2-year validity, automated renewal recommended
- **Client Certificates**: 1-year validity, automated renewal recommended

### Best Practices

1. **Backup Management**: Automatic backups are created when certificates are replaced
2. **Certificate Monitoring**: Use the validation script to monitor certificate health
3. **Revocation**: Properly revoke compromised certificates through the API
4. **Key Storage**: Store private keys securely and never transmit them over insecure channels

## Troubleshooting

### Common Issues

#### Certificate Verification Failed

```bash
# Check certificate chain
openssl verify -CAfile docker/certificates/ca/ca.crt docker/certificates/clients/device-001/device-001.crt

# Check certificate details
openssl x509 -in docker/certificates/clients/device-001/device-001.crt -text -noout
```

#### Permission Errors

```bash
# Fix certificate permissions
chmod 600 docker/certificates/clients/*/*.key
chmod 644 docker/certificates/clients/*/*.crt
chmod 700 docker/certificates/ca/
```

#### MQTT Connection Issues

1. Verify certificates with validation script:
   ```bash
   ./scripts/validate-certificates.sh
   ```

2. Check Mosquitto logs:
   ```bash
   docker-compose -f docker-compose.mqtt.yml logs mosquitto
   ```

3. Test with verbose OpenSSL connection:
   ```bash
   openssl s_client -connect localhost:8883 -CAfile docker/certificates/ca/ca.crt -verify 2
   ```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Certificate verification failed` | Invalid certificate chain | Regenerate certificates |
| `Private key mismatch` | Key/certificate pair mismatch | Regenerate both key and certificate |
| `Permission denied` | Incorrect file permissions | Fix permissions with chmod |
| `Certificate expired` | Certificate past expiry date | Renew certificate |

## Maintenance

### Regular Tasks

1. **Monthly**: Run certificate validation
2. **Quarterly**: Review certificate expiry dates
3. **Annually**: Rotate client certificates
4. **As needed**: Revoke compromised certificates

### Monitoring Commands

```bash
# Check all certificate status
./scripts/validate-certificates.sh

# List certificate expiry dates
find docker/certificates/clients -name "*.crt" -exec openssl x509 -in {} -noout -subject -enddate \;

# Check certificate database
sqlite3 mqtt-admin-api/prisma/dev.db "SELECT deviceId, expiresAt, isActive FROM MqttCertificate;"
```

## Integration Examples

### Node.js MQTT Client

```javascript
const mqtt = require('mqtt');
const fs = require('fs');

const options = {
  host: 'localhost',
  port: 8883,
  protocol: 'mqtts',
  ca: fs.readFileSync('docker/certificates/ca/ca.crt'),
  cert: fs.readFileSync('docker/certificates/clients/device-001/device-001.crt'),
  key: fs.readFileSync('docker/certificates/clients/device-001/device-001.key'),
  rejectUnauthorized: true
};

const client = mqtt.connect(options);
```

### Python MQTT Client

```python
import ssl
import paho.mqtt.client as mqtt

context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
context.load_verify_locations('docker/certificates/ca/ca.crt')
context.load_cert_chain('docker/certificates/clients/device-001/device-001.crt',
                       'docker/certificates/clients/device-001/device-001.key')

client = mqtt.Client()
client.tls_set_context(context)
client.connect('localhost', 8883, 60)
```

## Support

For issues or questions regarding the certificate management system:

1. Check this documentation
2. Run the validation script: `./scripts/validate-certificates.sh`
3. Review troubleshooting section
4. Check system logs and error messages

---

**Last Updated**: 2025-08-16  
**Version**: 1.0.0