const QRCode = require('qrcode');
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { config } from '@/config';
import { provisionLogger, logOperation } from '@/utils/logger';
import { RedisService } from '@/utils/redis';
import { DatabaseUtils } from '@/models/database';

export interface ProvisionToken {
  id: string;
  token: string;
  site: string;
  room: string;
  deviceType: 'button' | 'watch' | 'repeater' | 'sensor';
  description?: string;
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProvisionRequest {
  token: string;
  deviceId: string;
  deviceInfo?: {
    model?: string;
    firmwareVersion?: string;
    hardwareRevision?: string;
    serialNumber?: string;
    macAddress?: string;
  };
}

export interface DeviceCredentials {
  clientId: string;
  username: string;
  password: string;
  brokerUrl: string;
  topics: {
    publish: string[];
    subscribe: string[];
  };
  certificates?: {
    ca?: string;
    cert?: string;
    key?: string;
  };
}

export interface QRCodeData {
  provisionUrl: string;
  token: string;
  site: string;
  room: string;
  deviceType: string;
  expiresAt: string;
}

export class ProvisioningService {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly PASSWORD_LENGTH = 24;
  private static readonly QR_CODE_BASE_URL = process.env.PROVISION_BASE_URL || 'https://provision.obedio.com';

  /**
   * Create a new provisioning token
   */
  static async createProvisionToken(params: {
    site: string;
    room: string;
    deviceType: 'button' | 'watch' | 'repeater' | 'sensor';
    description?: string;
    expiresIn?: number;
    maxUses?: number;
    metadata?: Record<string, any>;
  }): Promise<{ token: ProvisionToken; qrCode: string }> {
    try {
      const tokenId = uuidv4();
      const token = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + (params.expiresIn || 3600) * 1000);

      const provisionToken: ProvisionToken = {
        id: tokenId,
        token,
        site: params.site,
        room: params.room,
        deviceType: params.deviceType,
        description: params.description,
        expiresAt,
        maxUses: params.maxUses || 1,
        usedCount: 0,
        isActive: true,
        metadata: params.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store token in Redis with expiration
      const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      await RedisService.setSession(`provision:token:${token}`, provisionToken, ttlSeconds);

      // Generate QR code
      const qrCodeData: QRCodeData = {
        provisionUrl: `${this.QR_CODE_BASE_URL}/provision`,
        token,
        site: params.site,
        room: params.room,
        deviceType: params.deviceType,
        expiresAt: expiresAt.toISOString(),
      };

      const qrCode = await this.generateQRCode(qrCodeData);

      logOperation('provision_token_created', {
        tokenId,
        site: params.site,
        room: params.room,
        deviceType: params.deviceType,
        expiresAt,
      });

      return { token: provisionToken, qrCode };

    } catch (error) {
      provisionLogger.error('Failed to create provision token:', error);
      throw error;
    }
  }

  /**
   * Validate and use a provisioning token
   */
  static async validateProvisionToken(token: string): Promise<ProvisionToken | null> {
    try {
      const tokenData = await RedisService.getSession(`provision:token:${token}`);
      
      if (!tokenData) {
        provisionLogger.warn(`Invalid or expired provision token: ${token}`);
        return null;
      }

      const provisionToken: ProvisionToken = tokenData;

      // Check if token is still active
      if (!provisionToken.isActive) {
        provisionLogger.warn(`Inactive provision token: ${token}`);
        return null;
      }

      // Check if token has expired
      if (new Date() > new Date(provisionToken.expiresAt)) {
        provisionLogger.warn(`Expired provision token: ${token}`);
        await RedisService.deleteSession(`provision:token:${token}`);
        return null;
      }

      // Check if token has reached max uses
      if (provisionToken.usedCount >= provisionToken.maxUses) {
        provisionLogger.warn(`Provision token max uses exceeded: ${token}`);
        return null;
      }

      return provisionToken;

    } catch (error) {
      provisionLogger.error('Failed to validate provision token:', error);
      return null;
    }
  }

  /**
   * Provision a new device using a token
   */
  static async provisionDevice(request: ProvisionRequest): Promise<{
    success: boolean;
    deviceCredentials?: DeviceCredentials;
    error?: string;
  }> {
    try {
      // Validate token
      const provisionToken = await this.validateProvisionToken(request.token);
      if (!provisionToken) {
        return {
          success: false,
          error: 'Invalid or expired provision token',
        };
      }

      // Check if device ID is already in use
      const existingDevices = await DatabaseUtils.getDeviceStatusOverview();
      const existingDevice = existingDevices.find((d: any) => d.device_id === request.deviceId);
      
      if (existingDevice) {
        return {
          success: false,
          error: 'Device ID already exists',
        };
      }

      // Generate device credentials
      const deviceCredentials = await this.generateDeviceCredentials(
        request.deviceId,
        provisionToken.site,
        provisionToken.room,
        provisionToken.deviceType
      );

      // Register device in database
      await DatabaseUtils.registerMqttDevice({
        deviceId: request.deviceId,
        site: provisionToken.site,
        room: provisionToken.room,
        deviceType: provisionToken.deviceType,
        securityProfileName: `${provisionToken.deviceType}_default`,
        metadata: {
          ...request.deviceInfo,
          provisionedAt: new Date().toISOString(),
          provisionToken: provisionToken.id,
        },
      });

      // Update token usage count
      provisionToken.usedCount += 1;
      provisionToken.updatedAt = new Date();

      if (provisionToken.usedCount >= provisionToken.maxUses) {
        // Deactivate token if max uses reached
        provisionToken.isActive = false;
        await RedisService.deleteSession(`provision:token:${request.token}`);
      } else {
        // Update token in Redis
        const ttlSeconds = Math.floor((new Date(provisionToken.expiresAt).getTime() - Date.now()) / 1000);
        await RedisService.setSession(`provision:token:${request.token}`, provisionToken, ttlSeconds);
      }

      logOperation('device_provisioned', {
        deviceId: request.deviceId,
        site: provisionToken.site,
        room: provisionToken.room,
        deviceType: provisionToken.deviceType,
        tokenId: provisionToken.id,
      });

      return {
        success: true,
        deviceCredentials,
      };

    } catch (error) {
      provisionLogger.error('Failed to provision device:', error);
      return {
        success: false,
        error: 'Internal server error during provisioning',
      };
    }
  }

  /**
   * Generate secure device credentials
   */
  private static async generateDeviceCredentials(
    deviceId: string,
    site: string,
    room: string,
    deviceType: string
  ): Promise<DeviceCredentials> {
    const clientId = `${site}-${room}-${deviceType}-${deviceId}`;
    const username = `obedio_${deviceType}_${deviceId}`;
    const password = this.generateSecurePassword();

    // Define topic patterns based on device type and location
    const baseTopic = `obedio/${site}/${room}/${deviceType}/${deviceId}`;
    
    const publishTopics = [
      `${baseTopic}/status`,
      `${baseTopic}/data`,
      `${baseTopic}/heartbeat`,
      `${baseTopic}/battery`,
      `${baseTopic}/signal`,
    ];

    const subscribeTopics = [
      `${baseTopic}/command`,
      `${baseTopic}/config`,
      `obedio/system/broadcast`,
    ];

    // Add device-type specific topics
    if (deviceType === 'button') {
      publishTopics.push(`${baseTopic}/emergency`);
    } else if (deviceType === 'watch') {
      publishTopics.push(`${baseTopic}/location`);
      subscribeTopics.push(`${baseTopic}/notification`);
    } else if (deviceType === 'repeater') {
      publishTopics.push(`${baseTopic}/relay`);
      subscribeTopics.push(`obedio/${site}/+/+/+/#`); // Can relay all site traffic
    }

    return {
      clientId,
      username,
      password,
      brokerUrl: config.mqtt.brokerUrl,
      topics: {
        publish: publishTopics,
        subscribe: subscribeTopics,
      },
    };
  }

  /**
   * Generate QR code for provisioning
   */
  private static async generateQRCode(data: QRCodeData, options?: {
    size?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  }): Promise<string> {
    try {
      const qrOptions = {
        width: options?.size || 256,
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M' as const,
        margin: options?.margin || 4,
        color: {
          dark: options?.darkColor || '#000000',
          light: options?.lightColor || '#FFFFFF',
        },
      };

      // Create a compact JSON representation for QR code
      const qrData = JSON.stringify(data);

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, qrOptions);

      return qrCodeDataUrl;

    } catch (error) {
      provisionLogger.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  /**
   * Get all active provision tokens
   */
  static async getActiveTokens(): Promise<ProvisionToken[]> {
    try {
      // In a real implementation, you'd query a database
      // For now, this is a placeholder that would scan Redis keys
      const activeTokens: ProvisionToken[] = [];
      
      // This is a simplified implementation
      // In production, you'd maintain an index of active tokens
      
      return activeTokens;

    } catch (error) {
      provisionLogger.error('Failed to get active tokens:', error);
      throw error;
    }
  }

  /**
   * Revoke a provision token
   */
  static async revokeToken(token: string): Promise<boolean> {
    try {
      const tokenData = await RedisService.getSession(`provision:token:${token}`);
      
      if (!tokenData) {
        return false;
      }

      // Remove from Redis
      await RedisService.deleteSession(`provision:token:${token}`);

      logOperation('provision_token_revoked', { token });

      return true;

    } catch (error) {
      provisionLogger.error('Failed to revoke token:', error);
      return false;
    }
  }

  /**
   * Generate a cryptographically secure token
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Generate a cryptographically secure password
   */
  private static generateSecurePassword(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < this.PASSWORD_LENGTH; i++) {
      const randomIndex = crypto.randomInt(charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Clean up expired tokens (maintenance function)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      // This would be implemented as a scheduled job
      // to clean up expired tokens from the database
      let cleanedCount = 0;

      provisionLogger.info(`Cleaned up ${cleanedCount} expired provision tokens`);
      
      return cleanedCount;

    } catch (error) {
      provisionLogger.error('Failed to cleanup expired tokens:', error);
      return 0;
    }
  }
}

export default ProvisioningService;