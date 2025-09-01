import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { config } from '@/config/index.js';
import { SeedDataConfig, DatabaseSeedResult } from '@/types/index.js';
import { createDeviceLogger } from '@/utils/logger.js';

const logger = createDeviceLogger('database-seeder', 'seed');
const prisma = new PrismaClient();

// Default seed configuration
const DEFAULT_SEED_CONFIG: SeedDataConfig = {
  sites: [
    {
      name: 'yacht-1',
      rooms: ['bridge', 'deck-1', 'deck-2', 'deck-3', 'cabin-101', 'cabin-102', 'cabin-201', 'cabin-202', 'engine-room', 'galley']
    },
    {
      name: 'hotel-alpha',
      rooms: ['lobby', 'restaurant', 'pool-area', 'spa', 'room-101', 'room-102', 'room-201', 'room-202', 'conference-a', 'conference-b']
    },
    {
      name: 'testlab',
      rooms: ['lab-1', 'lab-2', 'office', 'workshop', 'storage']
    }
  ],
  deviceCounts: {
    button: 20,
    watch: 15,
    repeater: 8
  },
  securityProfiles: [
    {
      name: 'admin',
      aclPattern: 'readwrite obedio/#',
      maxQos: 2,
      maxConnections: 5
    },
    {
      name: 'service',
      aclPattern: 'readwrite obedio/+/+/+/+/#\nread $SYS/#',
      maxQos: 2,
      maxConnections: 10
    },
    {
      name: 'device_button',
      aclPattern: 'write obedio/{site}/{room}/button/{clientid}/#\nread obedio/{site}/{room}/button/{clientid}/cmd/#',
      maxQos: 1,
      maxConnections: 1
    },
    {
      name: 'device_watch',
      aclPattern: 'write obedio/{site}/{room}/watch/{clientid}/#\nread obedio/{site}/{room}/watch/{clientid}/cmd/#',
      maxQos: 1,
      maxConnections: 1
    },
    {
      name: 'device_repeater',
      aclPattern: 'readwrite obedio/{site}/+/+/+/#\nread obedio/{site}/mesh/#\nwrite obedio/{site}/mesh/#',
      maxQos: 2,
      maxConnections: 1
    },
    {
      name: 'provisioning',
      aclPattern: 'write obedio/+/system/provision/#\nread obedio/+/system/provision/response/#',
      maxQos: 1,
      maxConnections: 3
    }
  ],
  users: [
    {
      name: 'Admin User',
      email: 'admin@obedio.com',
      role: 'admin'
    },
    {
      name: 'Service Account',
      email: 'service@obedio.com',
      role: 'service'
    },
    {
      name: 'Test Manager',
      email: 'manager@obedio.com',
      role: 'manager'
    },
    {
      name: 'Crew Member 1',
      email: 'crew1@obedio.com',
      role: 'crew'
    },
    {
      name: 'Crew Member 2',
      email: 'crew2@obedio.com',
      role: 'crew'
    }
  ]
};

export class DatabaseSeeder {
  private config: SeedDataConfig;
  
  constructor(seedConfig?: Partial<SeedDataConfig>) {
    this.config = { ...DEFAULT_SEED_CONFIG, ...seedConfig };
  }
  
  /**
   * Main seeding function
   */
  async seed(): Promise<DatabaseSeedResult> {
    logger.info('Starting database seeding process');
    
    const result: DatabaseSeedResult = {
      devices: 0,
      mqttDevices: 0,
      securityProfiles: 0,
      trafficLogs: 0,
      certificates: 0,
      users: 0,
      locations: 0
    };
    
    try {
      // Clear existing data in reverse dependency order
      await this.clearExistingData();
      
      // Seed in dependency order
      result.users = await this.seedUsers();
      result.locations = await this.seedLocations();
      result.securityProfiles = await this.seedSecurityProfiles();
      result.certificates = await this.seedCertificates();
      result.devices = await this.seedLegacyDevices();
      result.mqttDevices = await this.seedMqttDevices();
      result.trafficLogs = await this.seedTrafficLogs();
      
      logger.info('Database seeding completed successfully', result);
      return result;
      
    } catch (error) {
      logger.error('Database seeding failed', error);
      throw error;
    }
  }
  
  /**
   * Clear existing test data
   */
  private async clearExistingData(): Promise<void> {
    logger.info('Clearing existing test data');
    
    // Clear in reverse dependency order
    await prisma.mqttTrafficLog.deleteMany({});
    await prisma.mqttSession.deleteMany({});
    await prisma.mqttCertificate.deleteMany({});
    await prisma.mqttDevice.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.mqttSecurityProfile.deleteMany({});
    await prisma.location.deleteMany({});
    
    // Keep users for continuity, but clear test users
    await prisma.user.deleteMany({
      where: {
        email: {
          endsWith: '@obedio.com'
        }
      }
    });
    
    logger.info('Existing test data cleared');
  }
  
  /**
   * Seed users
   */
  private async seedUsers(): Promise<number> {
    logger.info('Seeding users');
    
    const users = [];
    for (const userData of this.config.users) {
      users.push({
        name: userData.name,
        email: userData.email,
        password: faker.internet.password(12), // In real app, would be hashed
        role: userData.role,
        avatar: null,
        createdAt: faker.date.past(1),
        updatedAt: new Date()
      });
    }
    
    const createdUsers = await prisma.user.createMany({
      data: users,
      skipDuplicates: true
    });
    
    logger.info(`Created ${createdUsers.count} users`);
    return createdUsers.count;
  }
  
  /**
   * Seed locations
   */
  private async seedLocations(): Promise<number> {
    logger.info('Seeding locations');
    
    const locations = [];
    for (const site of this.config.sites) {
      for (const room of site.rooms) {
        locations.push({
          name: room,
          deck: this.generateDeckName(room),
          type: this.inferRoomType(room),
          capacity: faker.number.int({ min: 1, max: 8 }),
          isActive: true,
          description: `${room} in ${site.name}`,
          site: site.name,
          createdAt: faker.date.past(1),
          updatedAt: new Date()
        });
      }
    }
    
    const createdLocations = await prisma.location.createMany({
      data: locations,
      skipDuplicates: true
    });
    
    logger.info(`Created ${createdLocations.count} locations`);
    return createdLocations.count;
  }
  
  /**
   * Seed security profiles
   */
  private async seedSecurityProfiles(): Promise<number> {
    logger.info('Seeding security profiles');
    
    const profiles = this.config.securityProfiles.map(profile => ({
      profileName: profile.name,
      aclPattern: profile.aclPattern,
      maxQos: profile.maxQos,
      maxConnections: profile.maxConnections,
      clientCertRequired: ['admin', 'service'].includes(profile.name),
      description: `Security profile for ${profile.name} access level`,
      createdAt: faker.date.past(1),
      updatedAt: new Date()
    }));
    
    const createdProfiles = await prisma.mqttSecurityProfile.createMany({
      data: profiles,
      skipDuplicates: true
    });
    
    logger.info(`Created ${createdProfiles.count} security profiles`);
    return createdProfiles.count;
  }
  
  /**
   * Seed certificates
   */
  private async seedCertificates(): Promise<number> {
    logger.info('Seeding certificates');
    
    const certificates = [];
    const securityProfiles = await prisma.mqttSecurityProfile.findMany();
    
    // Create CA certificate
    certificates.push({
      certificateId: 'obedio-ca-root',
      deviceId: null,
      commonName: 'OBEDIO Root CA',
      certificatePem: this.generateMockCertificate('OBEDIO Root CA'),
      privateKeyPem: this.generateMockPrivateKey(),
      caCertificatePem: null,
      serialNumber: '01',
      validFrom: faker.date.past(2),
      validTo: faker.date.future(5),
      isRevoked: false,
      createdAt: faker.date.past(1)
    });
    
    // Create server certificate
    certificates.push({
      certificateId: 'obedio-mqtt-server',
      deviceId: null,
      commonName: 'OBEDIO MQTT Server',
      certificatePem: this.generateMockCertificate('OBEDIO MQTT Server'),
      privateKeyPem: this.generateMockPrivateKey(),
      caCertificatePem: certificates[0].certificatePem,
      serialNumber: '02',
      validFrom: faker.date.past(1),
      validTo: faker.date.future(2),
      isRevoked: false,
      createdAt: faker.date.past(1)
    });
    
    // Create client certificates for admin and service profiles
    const adminProfiles = securityProfiles.filter(p => 
      p.clientCertRequired && ['admin', 'service'].includes(p.profileName)
    );
    
    for (const profile of adminProfiles) {
      certificates.push({
        certificateId: `obedio-${profile.profileName}-client`,
        deviceId: null,
        commonName: `OBEDIO ${profile.profileName} Client`,
        certificatePem: this.generateMockCertificate(`OBEDIO ${profile.profileName} Client`),
        privateKeyPem: this.generateMockPrivateKey(),
        caCertificatePem: certificates[0].certificatePem,
        serialNumber: faker.string.numeric(8),
        validFrom: faker.date.past(1),
        validTo: faker.date.future(2),
        isRevoked: false,
        createdAt: faker.date.past(1)
      });
    }
    
    const createdCertificates = await prisma.mqttCertificate.createMany({
      data: certificates,
      skipDuplicates: true
    });
    
    logger.info(`Created ${createdCertificates.count} certificates`);
    return createdCertificates.count;
  }
  
  /**
   * Seed legacy devices (for integration with existing system)
   */
  private async seedLegacyDevices(): Promise<number> {
    logger.info('Seeding legacy devices');
    
    const locations = await prisma.location.findMany();
    const users = await prisma.user.findMany();
    const devices = [];
    
    let deviceCounter = 1;
    
    for (const site of this.config.sites) {
      const siteLocations = locations.filter(l => l.site === site.name);
      
      // Create button devices
      for (let i = 0; i < this.config.deviceCounts.button; i++) {
        const location = faker.helpers.arrayElement(siteLocations);
        const assignedUser = Math.random() > 0.3 ? faker.helpers.arrayElement(users) : null;
        
        devices.push({
          uid: `OB-2025-BTN-${faker.string.alphanumeric(6).toUpperCase()}`,
          name: `Button Device ${deviceCounter}`,
          room: location.name,
          type: 'BUTTON',
          battery: faker.number.int({ min: 20, max: 100 }),
          signal: faker.number.int({ min: 60, max: 100 }),
          isActive: Math.random() > 0.1, // 90% active
          lastSeen: faker.date.recent(7),
          firmwareVersion: faker.helpers.arrayElement(['1.0.0', '1.1.0', '1.2.0']),
          location: `${location.name} - ${faker.helpers.arrayElement(['Table', 'Wall', 'Bedside', 'Desk'])}`,
          model: faker.helpers.arrayElement(['OB-BTN-100', 'OB-BTN-200', 'OB-BTN-300']),
          assignedToUserId: assignedUser?.id || null,
          lastSync: faker.date.recent(1),
          connectionType: 'LoRa',
          operatingFrequency: faker.helpers.arrayElement(['868MHz', '915MHz']),
          isEmergencyMode: false,
          locationId: location.id,
          specificLocation: `${location.name}`,
          createdAt: faker.date.past(1),
          updatedAt: faker.date.recent(7)
        });
        deviceCounter++;
      }
      
      // Create watch devices
      for (let i = 0; i < this.config.deviceCounts.watch; i++) {
        const location = faker.helpers.arrayElement(siteLocations);
        const assignedUser = Math.random() > 0.2 ? faker.helpers.arrayElement(users) : null;
        
        devices.push({
          uid: `OB-2025-WCH-${faker.string.alphanumeric(6).toUpperCase()}`,
          name: `Smart Watch ${deviceCounter}`,
          room: location.name,
          type: 'SMART_WATCH',
          battery: faker.number.int({ min: 30, max: 100 }),
          signal: faker.number.int({ min: 70, max: 100 }),
          isActive: Math.random() > 0.05, // 95% active
          lastSeen: faker.date.recent(1),
          firmwareVersion: faker.helpers.arrayElement(['2.0.0', '2.1.0', '2.2.0']),
          location: `Worn by user in ${location.name}`,
          model: faker.helpers.arrayElement(['OB-WCH-100', 'OB-WCH-200', 'OB-WCH-Pro']),
          assignedToUserId: assignedUser?.id || null,
          lastSync: faker.date.recent(1),
          connectionType: 'Bluetooth/LoRa',
          operatingFrequency: '2.4GHz/868MHz',
          isEmergencyMode: false,
          locationId: location.id,
          specificLocation: `${location.name}`,
          createdAt: faker.date.past(1),
          updatedAt: faker.date.recent(1)
        });
        deviceCounter++;
      }
      
      // Create repeater devices
      for (let i = 0; i < this.config.deviceCounts.repeater; i++) {
        const location = faker.helpers.arrayElement(siteLocations);
        
        devices.push({
          uid: `OB-2025-RPT-${faker.string.alphanumeric(6).toUpperCase()}`,
          name: `Repeater ${deviceCounter}`,
          room: location.name,
          type: 'REPEATER',
          battery: 100, // Repeaters are usually AC powered
          signal: faker.number.int({ min: 80, max: 100 }),
          isActive: Math.random() > 0.02, // 98% active
          lastSeen: faker.date.recent(1),
          firmwareVersion: faker.helpers.arrayElement(['3.0.0', '3.1.0', '3.2.0']),
          location: `Fixed installation in ${location.name}`,
          model: faker.helpers.arrayElement(['OB-RPT-1000', 'OB-RPT-2000', 'OB-RPT-Pro']),
          assignedToUserId: null,
          lastSync: faker.date.recent(1),
          connectionType: 'Ethernet/LoRa/Wi-Fi',
          operatingFrequency: '868MHz/915MHz/2.4GHz',
          isEmergencyMode: false,
          connectedDevices: faker.number.int({ min: 0, max: 15 }),
          coverageArea: '300m radius',
          meshRole: faker.helpers.arrayElement(['coordinator', 'router', 'border-router']),
          ipAddress: faker.internet.ip(),
          macAddress: faker.internet.mac(),
          locationId: location.id,
          specificLocation: `${location.name}`,
          createdAt: faker.date.past(1),
          updatedAt: faker.date.recent(1)
        });
        deviceCounter++;
      }
    }
    
    const createdDevices = await prisma.device.createMany({
      data: devices,
      skipDuplicates: true
    });
    
    logger.info(`Created ${createdDevices.count} legacy devices`);
    return createdDevices.count;
  }
  
  /**
   * Seed MQTT devices
   */
  private async seedMqttDevices(): Promise<number> {
    logger.info('Seeding MQTT devices');
    
    const legacyDevices = await prisma.device.findMany();
    const securityProfiles = await prisma.mqttSecurityProfile.findMany();
    const mqttDevices = [];
    
    for (const device of legacyDevices) {
      // Determine security profile based on device type
      let profileName = '';
      switch (device.type) {
        case 'BUTTON':
          profileName = 'device_button';
          break;
        case 'SMART_WATCH':
          profileName = 'device_watch';
          break;
        case 'REPEATER':
          profileName = 'device_repeater';
          break;
        default:
          profileName = 'device_button';
      }
      
      const securityProfile = securityProfiles.find(p => p.profileName === profileName);
      const location = await prisma.location.findFirst({ where: { id: device.locationId } });
      
      if (!location || !securityProfile) continue;
      
      mqttDevices.push({
        deviceId: device.uid,
        site: location.site || 'unknown',
        room: location.name,
        deviceType: device.type.toLowerCase(),
        mqttClientId: `${device.uid}-${faker.string.alphanumeric(4)}`,
        lastWillTopic: `obedio/${location.site}/${location.name}/${device.type.toLowerCase()}/${device.uid}/lwt`,
        lastWillMessage: JSON.stringify({
          timestamp: new Date().toISOString(),
          device_id: device.uid,
          status: 'offline'
        }),
        securityProfileId: securityProfile.id,
        mqttUsername: device.uid,
        mqttPasswordHash: faker.string.alphanumeric(32), // Would be properly hashed in real app
        clientCertificateId: null,
        isOnline: device.isActive && Math.random() > 0.2, // 80% of active devices are online
        lastMqttActivity: device.lastSeen,
        mqttSubscriptions: JSON.stringify([
          `obedio/${location.site}/${location.name}/${device.type.toLowerCase()}/${device.uid}/cmd/+`
        ]),
        deviceMetadata: JSON.stringify({
          model: device.model,
          firmwareVersion: device.firmwareVersion,
          lastSync: device.lastSync
        }),
        legacyDeviceId: device.id,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt
      });
    }
    
    const createdMqttDevices = await prisma.mqttDevice.createMany({
      data: mqttDevices,
      skipDuplicates: true
    });
    
    // Update legacy devices with MQTT device IDs
    for (const mqttDevice of mqttDevices) {
      await prisma.device.update({
        where: { id: mqttDevice.legacyDeviceId },
        data: { 
          mqttDeviceId: mqttDevice.deviceId,
          securityProfileId: mqttDevice.securityProfileId
        }
      });
    }
    
    logger.info(`Created ${createdMqttDevices.count} MQTT devices`);
    return createdMqttDevices.count;
  }
  
  /**
   * Seed traffic logs
   */
  private async seedTrafficLogs(): Promise<number> {
    logger.info('Seeding traffic logs');
    
    const mqttDevices = await prisma.mqttDevice.findMany();
    const trafficLogs = [];
    
    // Generate traffic logs for the past 7 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    for (const device of mqttDevices) {
      // Generate realistic traffic patterns
      const logsPerDay = this.getLogsPerDay(device.deviceType);
      
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
        
        for (let i = 0; i < logsPerDay; i++) {
          const timestamp = new Date(
            dayDate.getTime() + Math.random() * 24 * 60 * 60 * 1000
          );
          
          // Generate different types of messages
          const messageTypes = this.getMessageTypes(device.deviceType);
          const messageType = faker.helpers.arrayElement(messageTypes);
          
          trafficLogs.push({
            deviceId: device.deviceId,
            topic: this.generateTopicForMessage(device, messageType),
            qos: faker.helpers.arrayElement([0, 1, 2]),
            payloadSize: this.getPayloadSize(messageType),
            direction: faker.helpers.weightedArrayElement([
              { weight: 0.8, value: 'inbound' },
              { weight: 0.2, value: 'outbound' }
            ]),
            messageType: messageType,
            clientIp: faker.internet.ip(),
            timestamp: timestamp
          });
        }
      }
    }
    
    // Batch insert traffic logs
    const batchSize = 1000;
    let totalCreated = 0;
    
    for (let i = 0; i < trafficLogs.length; i += batchSize) {
      const batch = trafficLogs.slice(i, i + batchSize);
      const result = await prisma.mqttTrafficLog.createMany({
        data: batch,
        skipDuplicates: true
      });
      totalCreated += result.count;
    }
    
    logger.info(`Created ${totalCreated} traffic log entries`);
    return totalCreated;
  }
  
  // Helper methods
  
  private generateDeckName(room: string): string {
    if (room.includes('deck')) return room;
    if (room.includes('cabin')) return 'Guest Deck';
    if (room.includes('bridge')) return 'Navigation Deck';
    if (room.includes('engine')) return 'Engineering Deck';
    if (room.includes('room-1')) return 'Floor 1';
    if (room.includes('room-2')) return 'Floor 2';
    return 'Main Deck';
  }
  
  private inferRoomType(room: string): string {
    if (room.includes('cabin') || room.includes('room')) return 'guest_room';
    if (room.includes('bridge')) return 'control_room';
    if (room.includes('engine')) return 'technical';
    if (room.includes('galley') || room.includes('restaurant')) return 'dining';
    if (room.includes('conference')) return 'meeting';
    if (room.includes('lobby')) return 'public';
    if (room.includes('lab')) return 'laboratory';
    return 'general';
  }
  
  private generateMockCertificate(commonName: string): string {
    return `-----BEGIN CERTIFICATE-----
MIICXjCCAcegAwIBAgIJAL7+Zx+W7QaOMA0GCSqGSIb3DQEBCwUAMDQxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRAwDgYDVQQHDAdTYW4gSm9zZTAe
Fw0yNTAxMTYwMDAwMDBaFw0yNjAxMTYwMDAwMDBaMDQxCzAJBgNVBAYTAlVTMRMw
EQYDVQQIDApDYWxpZm9ybmlhMRAwDgYDVQQHDAdTYW4gSm9zZTCBnzANBgkqhkiG
9w0BAQEFAAOBjQAwgYkCgYEA${faker.string.alphanumeric(200)}QIDAQAB
o1MwUTAdBgNVHQ4EFgQU${faker.string.alphanumeric(32)}MAfBgNVHSMEGDAWgBT
${faker.string.alphanumeric(32)}MA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZI
hvcNAQELBQADgYEA${faker.string.alphanumeric(100)}=
-----END CERTIFICATE-----`;
  }
  
  private generateMockPrivateKey(): string {
    return `-----BEGIN PRIVATE KEY-----
MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAL${faker.string.alphanumeric(200)}
QIDAQAB${faker.string.alphanumeric(400)}
-----END PRIVATE KEY-----`;
  }
  
  private getLogsPerDay(deviceType: string): number {
    switch (deviceType) {
      case 'button':
        return faker.number.int({ min: 10, max: 50 });
      case 'smart_watch':
        return faker.number.int({ min: 100, max: 300 });
      case 'repeater':
        return faker.number.int({ min: 200, max: 500 });
      default:
        return faker.number.int({ min: 20, max: 100 });
    }
  }
  
  private getMessageTypes(deviceType: string): string[] {
    switch (deviceType) {
      case 'button':
        return ['status', 'press', 'heartbeat', 'battery', 'voice_ready'];
      case 'smart_watch':
        return ['status', 'heartbeat', 'location', 'health', 'steps', 'fall_detected'];
      case 'repeater':
        return ['status', 'health', 'mesh', 'power', 'network'];
      default:
        return ['status', 'heartbeat', 'data'];
    }
  }
  
  private generateTopicForMessage(device: any, messageType: string): string {
    return `obedio/${device.site}/${device.room}/${device.deviceType}/${device.deviceId}/${messageType}`;
  }
  
  private getPayloadSize(messageType: string): number {
    switch (messageType) {
      case 'heartbeat':
        return faker.number.int({ min: 50, max: 100 });
      case 'status':
        return faker.number.int({ min: 150, max: 300 });
      case 'location':
        return faker.number.int({ min: 200, max: 400 });
      case 'health':
        return faker.number.int({ min: 300, max: 600 });
      case 'mesh':
        return faker.number.int({ min: 500, max: 1000 });
      default:
        return faker.number.int({ min: 100, max: 200 });
    }
  }
}

// Main execution function
async function main() {
  console.log('🌱 Starting OBEDIO Database Seeding...\n');
  
  try {
    const seeder = new DatabaseSeeder();
    const result = await seeder.seed();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Seeding Results:');
    console.log(`   👥 Users: ${result.users}`);
    console.log(`   📍 Locations: ${result.locations}`);
    console.log(`   🛡️  Security Profiles: ${result.securityProfiles}`);
    console.log(`   🔐 Certificates: ${result.certificates}`);
    console.log(`   📱 Legacy Devices: ${result.devices}`);
    console.log(`   🌐 MQTT Devices: ${result.mqttDevices}`);
    console.log(`   📈 Traffic Logs: ${result.trafficLogs}`);
    
    console.log('\n🎉 Database is now populated with test data!');
    
  } catch (error) {
    console.error('\n❌ Database seeding failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { DatabaseSeeder, DEFAULT_SEED_CONFIG };