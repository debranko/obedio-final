import { EventEmitter } from 'events';
import { RedisService } from '@/utils/redis';
import { DatabaseUtils } from '@/models/database';
import { logOperation, provisionLogger } from '@/utils/logger';

export interface DevicePresence {
  deviceId: string;
  isOnline: boolean;
  lastSeen: Date;
  lastHeartbeat?: Date;
  connectionQuality?: number;
  metadata?: {
    ip?: string;
    userAgent?: string;
    location?: {
      site: string;
      room: string;
    };
    battery?: number;
    signal?: number;
  };
}

export interface PresenceUpdate {
  deviceId: string;
  status: 'online' | 'offline' | 'heartbeat' | 'timeout';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class PresenceService extends EventEmitter {
  private static instance: PresenceService;
  private presenceCache = new Map<string, DevicePresence>();
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();
  private readonly HEARTBEAT_TIMEOUT = 90000; // 90 seconds
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly PRESENCE_KEY_PREFIX = 'presence:';
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    super();
    this.startCleanupProcess();
  }

  public static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  /**
   * Initialize presence service
   */
  async initialize(): Promise<void> {
    try {
      // Load existing presence data from Redis
      await this.loadPresenceFromCache();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      provisionLogger.info('Presence service initialized');
    } catch (error) {
      provisionLogger.error('Failed to initialize presence service:', error);
      throw error;
    }
  }

  /**
   * Update device presence
   */
  async updatePresence(update: PresenceUpdate): Promise<void> {
    try {
      const { deviceId, status, timestamp, metadata } = update;
      
      let presence = this.presenceCache.get(deviceId);
      
      if (!presence) {
        presence = {
          deviceId,
          isOnline: false,
          lastSeen: timestamp,
        };
      }

      // Update presence based on status
      switch (status) {
        case 'online':
          presence.isOnline = true;
          presence.lastSeen = timestamp;
          presence.lastHeartbeat = timestamp;
          this.resetHeartbeatTimer(deviceId);
          break;

        case 'offline':
          presence.isOnline = false;
          presence.lastSeen = timestamp;
          this.clearHeartbeatTimer(deviceId);
          break;

        case 'heartbeat':
          if (presence.isOnline) {
            presence.lastHeartbeat = timestamp;
            presence.lastSeen = timestamp;
            this.resetHeartbeatTimer(deviceId);
          }
          break;

        case 'timeout':
          presence.isOnline = false;
          this.clearHeartbeatTimer(deviceId);
          break;
      }

      // Update metadata if provided
      if (metadata) {
        presence.metadata = {
          ...presence.metadata,
          ...metadata,
        };
      }

      // Calculate connection quality
      presence.connectionQuality = this.calculateConnectionQuality(presence);

      // Update cache
      this.presenceCache.set(deviceId, presence);

      // Persist to Redis
      await this.persistPresence(presence);

      // Update database
      await DatabaseUtils.updateDeviceStatus(
        deviceId,
        presence.isOnline,
        presence.lastSeen
      );

      // Emit presence change event
      this.emit('presenceChange', presence);

      logOperation('presence_updated', {
        deviceId,
        status,
        isOnline: presence.isOnline,
      });

    } catch (error) {
      provisionLogger.error('Failed to update presence:', error);
    }
  }

  /**
   * Get device presence
   */
  async getPresence(deviceId: string): Promise<DevicePresence | null> {
    try {
      // Check cache first
      let presence = this.presenceCache.get(deviceId);
      
      if (!presence) {
        // Load from Redis
        const loadedPresence = await this.loadPresenceFromRedis(deviceId);
        
        if (loadedPresence) {
          presence = loadedPresence;
          this.presenceCache.set(deviceId, presence);
        }
      }

      return presence || null;
    } catch (error) {
      provisionLogger.error('Failed to get presence:', error);
      return null;
    }
  }

  /**
   * Get all device presences
   */
  async getAllPresences(): Promise<DevicePresence[]> {
    try {
      const presences: DevicePresence[] = [];
      
      // Get all devices from database
      const devices = await DatabaseUtils.getDeviceStatusOverview();
      
      for (const device of devices) {
        const presence = await this.getPresence(device.device_id);
        if (presence) {
          presences.push(presence);
        } else {
          // Create default presence for devices not in cache
          const defaultPresence: DevicePresence = {
            deviceId: device.device_id,
            isOnline: device.is_online || false,
            lastSeen: new Date(device.last_mqtt_activity || Date.now()),
            connectionQuality: 0,
          };
          presences.push(defaultPresence);
        }
      }

      return presences;
    } catch (error) {
      provisionLogger.error('Failed to get all presences:', error);
      return [];
    }
  }

  /**
   * Get online devices count
   */
  async getOnlineCount(): Promise<number> {
    try {
      const presences = await this.getAllPresences();
      return presences.filter(p => p.isOnline).length;
    } catch (error) {
      provisionLogger.error('Failed to get online count:', error);
      return 0;
    }
  }

  /**
   * Get presence statistics
   */
  async getPresenceStats(): Promise<{
    total: number;
    online: number;
    offline: number;
    recentlyActive: number;
    connectionQualityAvg: number;
  }> {
    try {
      const presences = await this.getAllPresences();
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      const stats = {
        total: presences.length,
        online: presences.filter(p => p.isOnline).length,
        offline: presences.filter(p => !p.isOnline).length,
        recentlyActive: presences.filter(p => 
          new Date(p.lastSeen).getTime() > oneHourAgo
        ).length,
        connectionQualityAvg: presences.reduce((sum, p) => 
          sum + (p.connectionQuality || 0), 0
        ) / presences.length || 0,
      };

      return stats;
    } catch (error) {
      provisionLogger.error('Failed to get presence stats:', error);
      return {
        total: 0,
        online: 0,
        offline: 0,
        recentlyActive: 0,
        connectionQualityAvg: 0,
      };
    }
  }

  /**
   * Set device offline (manual override)
   */
  async setDeviceOffline(deviceId: string): Promise<void> {
    await this.updatePresence({
      deviceId,
      status: 'offline',
      timestamp: new Date(),
    });
  }

  /**
   * Set device online (manual override)
   */
  async setDeviceOnline(deviceId: string, metadata?: Record<string, any>): Promise<void> {
    await this.updatePresence({
      deviceId,
      status: 'online',
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Process MQTT heartbeat
   */
  async processHeartbeat(deviceId: string, metadata?: Record<string, any>): Promise<void> {
    await this.updatePresence({
      deviceId,
      status: 'heartbeat',
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Process device connection
   */
  async processConnection(deviceId: string, metadata?: Record<string, any>): Promise<void> {
    await this.updatePresence({
      deviceId,
      status: 'online',
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Process device disconnection
   */
  async processDisconnection(deviceId: string): Promise<void> {
    await this.updatePresence({
      deviceId,
      status: 'offline',
      timestamp: new Date(),
    });
  }

  /**
   * Calculate connection quality score (0-100)
   */
  private calculateConnectionQuality(presence: DevicePresence): number {
    const now = Date.now();
    const lastSeen = new Date(presence.lastSeen).getTime();
    const timeSinceLastSeen = now - lastSeen;

    // Base score on recency of last seen
    let quality = 100;

    if (timeSinceLastSeen > 60000) { // 1 minute
      quality -= 20;
    }
    if (timeSinceLastSeen > 300000) { // 5 minutes
      quality -= 30;
    }
    if (timeSinceLastSeen > 900000) { // 15 minutes
      quality -= 50;
    }

    // Factor in battery level if available
    if (presence.metadata?.battery !== undefined) {
      if (presence.metadata.battery < 20) {
        quality -= 20;
      } else if (presence.metadata.battery < 50) {
        quality -= 10;
      }
    }

    // Factor in signal strength if available
    if (presence.metadata?.signal !== undefined) {
      if (presence.metadata.signal < 30) {
        quality -= 15;
      } else if (presence.metadata.signal < 60) {
        quality -= 5;
      }
    }

    // If offline, quality is 0
    if (!presence.isOnline) {
      quality = 0;
    }

    return Math.max(0, Math.min(100, quality));
  }

  /**
   * Set up heartbeat timer for device
   */
  private resetHeartbeatTimer(deviceId: string): void {
    // Clear existing timer
    this.clearHeartbeatTimer(deviceId);

    // Set new timer
    const timer = setTimeout(async () => {
      await this.updatePresence({
        deviceId,
        status: 'timeout',
        timestamp: new Date(),
      });
    }, this.HEARTBEAT_TIMEOUT);

    this.heartbeatTimers.set(deviceId, timer);
  }

  /**
   * Clear heartbeat timer for device
   */
  private clearHeartbeatTimer(deviceId: string): void {
    const timer = this.heartbeatTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.heartbeatTimers.delete(deviceId);
    }
  }

  /**
   * Persist presence to Redis
   */
  private async persistPresence(presence: DevicePresence): Promise<void> {
    try {
      await RedisService.setSession(
        `${this.PRESENCE_KEY_PREFIX}${presence.deviceId}`,
        presence,
        86400 // 24 hours TTL
      );
    } catch (error) {
      provisionLogger.error('Failed to persist presence to Redis:', error);
    }
  }

  /**
   * Load presence from Redis
   */
  private async loadPresenceFromRedis(deviceId: string): Promise<DevicePresence | null> {
    try {
      const data = await RedisService.getSession(`${this.PRESENCE_KEY_PREFIX}${deviceId}`);
      return data as DevicePresence | null;
    } catch (error) {
      provisionLogger.error('Failed to load presence from Redis:', error);
      return null;
    }
  }

  /**
   * Load all presence data from cache
   */
  private async loadPresenceFromCache(): Promise<void> {
    try {
      // In a real implementation, this would scan Redis for all presence keys
      // For now, we'll skip this as it requires Redis SCAN operations
      provisionLogger.debug('Presence cache loaded');
    } catch (error) {
      provisionLogger.error('Failed to load presence cache:', error);
    }
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    this.on('presenceChange', (presence: DevicePresence) => {
      provisionLogger.debug(`Presence changed for ${presence.deviceId}: ${presence.isOnline ? 'online' : 'offline'}`);
    });
  }

  /**
   * Start cleanup process for stale presence data
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupStalePresences();
    }, 300000); // 5 minutes
  }

  /**
   * Clean up stale presence data
   */
  private async cleanupStalePresences(): Promise<void> {
    try {
      const now = Date.now();
      const staleThreshold = now - (24 * 60 * 60 * 1000); // 24 hours

      let cleanedCount = 0;

      for (const [deviceId, presence] of this.presenceCache.entries()) {
        const lastSeen = new Date(presence.lastSeen).getTime();
        
        if (lastSeen < staleThreshold) {
          this.presenceCache.delete(deviceId);
          this.clearHeartbeatTimer(deviceId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        provisionLogger.info(`Cleaned up ${cleanedCount} stale presence records`);
      }
    } catch (error) {
      provisionLogger.error('Failed to cleanup stale presences:', error);
    }
  }

  /**
   * Shutdown the presence service
   */
  async shutdown(): Promise<void> {
    try {
      // Clear all timers
      for (const timer of this.heartbeatTimers.values()) {
        clearTimeout(timer);
      }
      this.heartbeatTimers.clear();

      // Clear cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      provisionLogger.info('Presence service shutdown completed');
    } catch (error) {
      provisionLogger.error('Error during presence service shutdown:', error);
    }
  }
}

export default PresenceService;