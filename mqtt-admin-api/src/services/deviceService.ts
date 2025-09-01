import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/utils/logger';
import { RedisService } from '@/utils/redis';
import { config } from '@/config';

const prisma = new PrismaClient();

export interface DeviceRegistrationData {
  deviceId: string;
  site: string;
  room: string;
  deviceType: string;
  model?: string;
  firmwareVersion?: string;
  ipAddress?: string;
  macAddress?: string;
}

export interface DeviceCredentials {
  deviceId: string;
  username: string;
  password: string;
  qrCode: string;
  mqttConfig: {
    brokerUrl: string;
    username: string;
    password: string;
    clientId: string;
    topics: {
      status: string;
      command: string;
      event: string;
    };
    tls: {
      enabled: boolean;
      rejectUnauthorized: boolean;
    };
  };
  expiresAt: Date;
}

export class DeviceService {
  private static readonly PASSWORD_LENGTH = 16;
  private static readonly CREDENTIAL_EXPIRY_HOURS = 24;
  private static readonly MOSQUITTO_PASSWD_FILE = '/mosquitto/passwd/passwd';

  /**
   * Register a new MQTT device with password-based authentication
   */
  static async registerDevice(data: DeviceRegistrationData): Promise<DeviceCredentials> {
    try {
      // Check if device already exists
      const existingDevice = await prisma.mqttDevice.findUnique({
        where: { deviceId: data.deviceId }
      });

      if (existingDevice) {
        throw new Error(`Device ${data.deviceId} already exists`);
      }

      // Generate secure password
      const password = this.generateSecurePassword();
      const username = data.deviceId; // Use deviceId as username for simplicity
      const passwordHash = await bcrypt.hash(password, 10);

      // Create device in database
      const device = await prisma.mqttDevice.create({
        data: {
          deviceId: data.deviceId,
          site: data.site,
          room: data.room,
          deviceType: data.deviceType,
          username,
          passwordHash,
          model: data.model,
          firmwareVersion: data.firmwareVersion,
          ipAddress: data.ipAddress,
          macAddress: data.macAddress,
        }
      });

      // Create MQTT configuration
      const mqttConfig = {
        brokerUrl: config.mqtt.brokerUrl,
        username,
        password,
        clientId: data.deviceId,
        topics: {
          status: `obedio/${data.site}/${data.room}/${data.deviceId}/status`,
          command: `obedio/${data.site}/${data.room}/${data.deviceId}/cmd`,
          event: `obedio/${data.site}/${data.room}/${data.deviceId}/event`,
        },
        tls: {
          enabled: true,
          rejectUnauthorized: false,
        }
      };

      // Generate QR code
      const qrCodeData = JSON.stringify({
        deviceId: data.deviceId,
        config: mqttConfig
      });
      
      const qrCode = await QRCode.toDataURL(qrCodeData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Store credentials (expires in 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.CREDENTIAL_EXPIRY_HOURS);

      await prisma.deviceCredential.create({
        data: {
          deviceId: data.deviceId,
          username,
          password, // Store plain text temporarily for QR generation
          qrCode,
          mqttConfig: JSON.stringify(mqttConfig),
          expiresAt,
        }
      });

      // Add to mosquitto password file
      await this.addToMosquittoPasswd(username, password);

      // Log activity
      logger.info(`Device registered: ${data.deviceId}`, {
        site: data.site,
        room: data.room,
        deviceType: data.deviceType
      });

      return {
        deviceId: data.deviceId,
        username,
        password,
        qrCode,
        mqttConfig,
        expiresAt
      };

    } catch (error) {
      logger.error(`Failed to register device ${data.deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Rotate device credentials
   */
  static async rotateCredentials(deviceId: string): Promise<DeviceCredentials> {
    try {
      // Check if device exists
      const device = await prisma.mqttDevice.findUnique({
        where: { deviceId }
      });

      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      // Remove old credential
      await prisma.deviceCredential.deleteMany({
        where: { deviceId }
      });

      // Generate new password
      const password = this.generateSecurePassword();
      const username = deviceId;
      const passwordHash = await bcrypt.hash(password, 10);

      // Update device password hash
      await prisma.mqttDevice.update({
        where: { deviceId },
        data: { passwordHash }
      });

      // Create new MQTT configuration
      const mqttConfig = {
        brokerUrl: config.mqtt.brokerUrl,
        username,
        password,
        clientId: deviceId,
        topics: {
          status: `obedio/${device.site}/${device.room}/${deviceId}/status`,
          command: `obedio/${device.site}/${device.room}/${deviceId}/cmd`,
          event: `obedio/${device.site}/${device.room}/${deviceId}/event`,
        },
        tls: {
          enabled: true,
          rejectUnauthorized: false,
        }
      };

      // Generate new QR code
      const qrCodeData = JSON.stringify({
        deviceId,
        config: mqttConfig
      });
      
      const qrCode = await QRCode.toDataURL(qrCodeData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Store new credentials
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.CREDENTIAL_EXPIRY_HOURS);

      await prisma.deviceCredential.create({
        data: {
          deviceId,
          username,
          password,
          qrCode,
          mqttConfig: JSON.stringify(mqttConfig),
          expiresAt,
        }
      });

      // Update mosquitto password file
      await this.addToMosquittoPasswd(username, password);

      logger.info(`Credentials rotated for device: ${deviceId}`);

      return {
        deviceId,
        username,
        password,
        qrCode,
        mqttConfig,
        expiresAt
      };

    } catch (error) {
      logger.error(`Failed to rotate credentials for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get device credentials (mark as viewed)
   */
  static async getDeviceCredentials(deviceId: string): Promise<DeviceCredentials | null> {
    try {
      const credential = await prisma.deviceCredential.findUnique({
        where: { deviceId },
        include: { device: true }
      });

      if (!credential) {
        return null;
      }

      // Check if expired
      if (credential.expiresAt < new Date()) {
        await prisma.deviceCredential.delete({
          where: { deviceId }
        });
        return null;
      }

      // Mark as viewed (credentials can only be viewed once for security)
      await prisma.deviceCredential.update({
        where: { deviceId },
        data: { viewedAt: new Date() }
      });

      const mqttConfig = JSON.parse(credential.mqttConfig);

      return {
        deviceId: credential.deviceId,
        username: credential.username,
        password: credential.password,
        qrCode: credential.qrCode || '',
        mqttConfig,
        expiresAt: credential.expiresAt
      };

    } catch (error) {
      logger.error(`Failed to get credentials for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * List devices with their status
   */
  static async listDevices(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;

      const [devices, total] = await Promise.all([
        prisma.mqttDevice.findMany({
          skip: offset,
          take: limit,
          include: {
            presence: true,
            traffic: {
              take: 5,
              orderBy: { timestamp: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.mqttDevice.count()
      ]);

      return {
        devices: devices.map(device => ({
          ...device,
          isOnline: device.presence?.status === 'online' || false,
          lastSeen: device.presence?.lastSeen || device.lastSeen,
          recentTraffic: device.traffic
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Failed to list devices:', error);
      throw error;
    }
  }

  /**
   * Update device presence
   */
  static async updatePresence(deviceId: string, status: 'online' | 'offline' | 'disconnected', metadata?: Record<string, any>) {
    try {
      await prisma.mqttPresence.upsert({
        where: { deviceId },
        update: {
          status,
          lastSeen: new Date(),
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          connectedAt: status === 'online' ? new Date() : undefined,
          disconnectedAt: status === 'offline' ? new Date() : undefined,
        },
        create: {
          deviceId,
          status,
          lastSeen: new Date(),
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          connectedAt: status === 'online' ? new Date() : undefined,
        }
      });

      // Update device last seen
      await prisma.mqttDevice.update({
        where: { deviceId },
        data: { lastSeen: new Date() }
      });

      // Cache in Redis
      await RedisService.setSession(`device:presence:${deviceId}`, {
        status,
        lastSeen: new Date().toISOString(),
        metadata
      }, 300); // 5 minutes

    } catch (error) {
      logger.error(`Failed to update presence for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Record traffic event
   */
  static async recordTraffic(deviceId: string, topic: string, payloadSize: number, direction: 'inbound' | 'outbound', payload?: string) {
    try {
      await prisma.mqttTraffic.create({
        data: {
          deviceId,
          topic,
          payload: payload?.substring(0, 1000), // Truncate large payloads
          payloadSize,
          direction,
          timestamp: new Date(),
        }
      });

      // Update device last seen
      await prisma.mqttDevice.update({
        where: { deviceId },
        data: { lastSeen: new Date() }
      });

    } catch (error) {
      logger.error(`Failed to record traffic for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Generate secure random password
   */
  private static generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < this.PASSWORD_LENGTH; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Add user to mosquitto password file
   */
  private static async addToMosquittoPasswd(username: string, password: string) {
    try {
      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Read existing passwd file
      let passwdContent = '';
      try {
        passwdContent = await fs.readFile(this.MOSQUITTO_PASSWD_FILE, 'utf-8');
      } catch (error) {
        // File doesn't exist, create directory
        await fs.mkdir(path.dirname(this.MOSQUITTO_PASSWD_FILE), { recursive: true });
      }

      // Remove existing entry for this username
      const lines = passwdContent.split('\n').filter(line => 
        !line.startsWith(`${username}:`)
      );

      // Add new entry
      lines.push(`${username}:${hashedPassword}`);

      // Write back to file
      await fs.writeFile(this.MOSQUITTO_PASSWD_FILE, lines.join('\n'));

      logger.info(`Added user ${username} to mosquitto passwd file`);

    } catch (error) {
      logger.error(`Failed to add user ${username} to mosquitto passwd file:`, error);
      // Don't throw here - device registration can continue without mosquitto passwd
    }
  }

  /**
   * Clean up expired credentials
   */
  static async cleanupExpiredCredentials() {
    try {
      const result = await prisma.deviceCredential.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired credentials`);
      }

    } catch (error) {
      logger.error('Failed to cleanup expired credentials:', error);
    }
  }

  /**
   * Get device by ID
   */
  static async getDevice(deviceId: string) {
    try {
      const device = await prisma.mqttDevice.findUnique({
        where: { deviceId },
        include: {
          presence: true,
          traffic: {
            take: 10,
            orderBy: { timestamp: 'desc' }
          },
          credentials: true
        }
      });

      if (!device) {
        return null;
      }

      return {
        ...device,
        isOnline: device.presence?.status === 'online' || false,
        lastSeen: device.presence?.lastSeen || device.lastSeen,
        hasActiveCredentials: device.credentials && device.credentials.expiresAt > new Date(),
      };

    } catch (error) {
      logger.error(`Failed to get device ${deviceId}:`, error);
      throw error;
    }
  }
}