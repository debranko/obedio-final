import { PrismaClient } from '@prisma/client';
import { logger, dbLogger } from '@/utils/logger';
import { config } from '@/config';

// Extend PrismaClient for custom logging
class DatabaseClient extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: config.database.url,
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Set up event listeners for logging
    // Note: Commented out due to TypeScript strict typing in newer Prisma versions
    // this.$on('query', (e: any) => {
    //   dbLogger.debug({
    //     query: e.query,
    //     params: e.params,
    //     duration: e.duration,
    //   }, 'Database query executed');
    // });

    // this.$on('error', (e: any) => {
    //   dbLogger.error({
    //     target: e.target,
    //   }, 'Database error occurred');
    // });

    // this.$on('info', (e: any) => {
    //   dbLogger.info(e.message);
    // });

    // this.$on('warn', (e: any) => {
    //   dbLogger.warn(e.message);
    // });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      dbLogger.error('Database health check failed:', error);
      return false;
    }
  }

  async getConnectionInfo(): Promise<{
    connected: boolean;
    databaseName?: string;
    version?: string;
  }> {
    try {
      const result = await this.$queryRaw<Array<{
        current_database: string;
        version: string;
      }>>`
        SELECT current_database(), version()
      `;

      return {
        connected: true,
        databaseName: result[0]?.current_database,
        version: result[0]?.version,
      };
    } catch (error) {
      return {
        connected: false,
      };
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.$disconnect();
      dbLogger.info('Database disconnected successfully');
    } catch (error) {
      dbLogger.error('Error disconnecting from database:', error);
      throw error;
    }
  }
}

// Create global database instance
export const db = new DatabaseClient();

// Connection management
export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection
    await db.$connect();
    
    // Verify we can execute queries
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    const connectionInfo = await db.getConnectionInfo();
    dbLogger.info({
      database: connectionInfo.databaseName,
      version: connectionInfo.version?.split(' ')[0], // Just the version number
    }, 'Database connected successfully');

  } catch (error) {
    dbLogger.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await db.disconnect();
  } catch (error) {
    dbLogger.error('Error during database disconnection:', error);
    throw error;
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.$transaction(callback);
}

// Database utilities
export class DatabaseUtils {
  /**
   * Register a new MQTT device in the database
   */
  static async registerMqttDevice(deviceData: {
    deviceId: string;
    site: string;
    room: string;
    deviceType: 'button' | 'watch' | 'repeater' | 'sensor';
    securityProfileName?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const result = await db.$queryRaw<Array<{ register_mqtt_device: number }>>`
        SELECT register_mqtt_device(
          ${deviceData.deviceId},
          ${deviceData.site},
          ${deviceData.room},
          ${deviceData.deviceType},
          ${deviceData.securityProfileName || null}
        ) as register_mqtt_device
      `;

      const deviceId = result[0]?.register_mqtt_device;
      
      if (deviceData.metadata && deviceId) {
        await db.$executeRaw`
          UPDATE mqtt_devices 
          SET device_metadata = ${JSON.stringify(deviceData.metadata)}::jsonb
          WHERE id = ${deviceId}
        `;
      }

      dbLogger.info({
        deviceId: deviceData.deviceId,
        site: deviceData.site,
        room: deviceData.room,
        type: deviceData.deviceType,
      }, 'MQTT device registered successfully');

      return deviceId;
    } catch (error) {
      dbLogger.error('Failed to register MQTT device:', error);
      throw error;
    }
  }

  /**
   * Log MQTT traffic to database
   */
  static async logMqttTraffic(trafficData: {
    deviceId: string;
    topic: string;
    qos: number;
    payloadSize: number;
    direction: 'inbound' | 'outbound';
    clientIp?: string;
  }) {
    try {
      await db.$executeRaw`
        SELECT log_mqtt_traffic(
          ${trafficData.deviceId},
          ${trafficData.topic},
          ${trafficData.qos},
          ${trafficData.payloadSize},
          ${trafficData.direction},
          ${trafficData.clientIp || null}::inet
        )
      `;
    } catch (error) {
      // Log traffic errors at debug level to avoid spam
      dbLogger.debug('Failed to log MQTT traffic:', error);
    }
  }

  /**
   * Get device status overview
   */
  static async getDeviceStatusOverview() {
    try {
      const result = await db.$queryRaw<Array<{
        device_id: string;
        site: string;
        room: string;
        device_type: string;
        is_online: boolean;
        connection_status: string;
        last_mqtt_activity: Date | null;
        security_profile: string | null;
      }>>`
        SELECT * FROM mqtt_devices_status
        ORDER BY last_mqtt_activity DESC NULLS LAST
      `;

      return result;
    } catch (error) {
      dbLogger.error('Failed to get device status overview:', error);
      throw error;
    }
  }

  /**
   * Get traffic summary for analytics
   */
  static async getTrafficSummary(hours: number = 24) {
    try {
      const result = await db.$queryRaw<Array<{
        device_id: string;
        hour: Date;
        direction: string;
        message_count: bigint;
        total_payload_size: bigint;
        avg_payload_size: number;
      }>>`
        SELECT * FROM mqtt_traffic_summary
        WHERE hour >= NOW() - INTERVAL '${hours} hours'
        ORDER BY hour DESC
      `;

      // Convert bigint to number for JSON serialization
      return result.map((row: any) => ({
        ...row,
        message_count: Number(row.message_count),
        total_payload_size: Number(row.total_payload_size),
      }));
    } catch (error) {
      dbLogger.error('Failed to get traffic summary:', error);
      throw error;
    }
  }

  /**
   * Update device online status
   */
  static async updateDeviceStatus(
    deviceId: string,
    isOnline: boolean,
    lastActivity?: Date
  ) {
    try {
      await db.$executeRaw`
        UPDATE mqtt_devices 
        SET 
          is_online = ${isOnline},
          last_mqtt_activity = ${lastActivity || new Date()}
        WHERE device_id = ${deviceId}
      `;
    } catch (error) {
      dbLogger.debug('Failed to update device status:', error);
    }
  }

  /**
   * Clean up old traffic logs (for maintenance)
   */
  static async cleanupOldTrafficLogs(daysToKeep: number = 30) {
    try {
      const result = await db.$executeRaw`
        DELETE FROM mqtt_traffic_logs 
        WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
      `;

      dbLogger.info({
        deletedRows: result,
        daysToKeep,
      }, 'Old traffic logs cleaned up');

      return result;
    } catch (error) {
      dbLogger.error('Failed to cleanup old traffic logs:', error);
      throw error;
    }
  }
}

export default db;