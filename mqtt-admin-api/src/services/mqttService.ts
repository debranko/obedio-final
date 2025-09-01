import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { EventEmitter } from 'events';
import { config } from '@/config';
import { mqttLogger, logMqttMessage, logOperation } from '@/utils/logger';
import { DatabaseUtils } from '@/models/database';
import { RedisService } from '@/utils/redis';

export interface MqttMessage {
  topic: string;
  payload: Buffer | string;
  qos: 0 | 1 | 2;
  retain: boolean;
  timestamp: Date;
  deviceId?: string;
  messageType?: string;
}

export interface DeviceStatus {
  deviceId: string;
  isOnline: boolean;
  lastSeen: Date;
  battery?: number;
  signal?: number;
  location?: {
    site: string;
    room: string;
  };
}

export class MqttService extends EventEmitter {
  private client: MqttClient | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private subscriptions = new Set<string>();

  constructor() {
    super();
    this.setupEventListeners();
  }

  async connect(): Promise<void> {
    if (this.client && this.client.connected) {
      mqttLogger.info('MQTT client already connected');
      return;
    }

    if (this.isConnecting) {
      mqttLogger.info('MQTT connection already in progress');
      return;
    }

    this.isConnecting = true;
    
    try {
      const options: IClientOptions = {
        clientId: config.mqtt.clientId,
        username: config.mqtt.username,
        password: config.mqtt.password,
        keepalive: config.mqtt.keepAlive,
        reconnectPeriod: config.mqtt.reconnectPeriod,
        clean: true,
        will: {
          topic: `obedio/system/api/status`,
          payload: JSON.stringify({
            status: 'offline',
            timestamp: new Date().toISOString(),
            clientId: config.mqtt.clientId,
          }),
          qos: 1,
          retain: true,
        },
      };

      mqttLogger.info({
        brokerUrl: config.mqtt.brokerUrl,
        clientId: config.mqtt.clientId,
        username: config.mqtt.username,
      }, 'Connecting to MQTT broker');

      this.client = mqtt.connect(config.mqtt.brokerUrl, options);
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MQTT connection timeout'));
        }, 10000); // 10 second timeout

        this.client!.on('connect', () => {
          clearTimeout(timeout);
          this.connectionAttempts = 0;
          this.isConnecting = false;
          mqttLogger.info('Successfully connected to MQTT broker');
          
          // Subscribe to all Obedio topics
          this.subscribeToTopics();
          
          // Publish online status
          this.publishSystemStatus('online');
          
          resolve();
        });

        this.client!.on('error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          mqttLogger.error('MQTT connection error:', error);
          reject(error);
        });
      });

    } catch (error) {
      this.isConnecting = false;
      this.connectionAttempts++;
      mqttLogger.error('Failed to connect to MQTT broker:', error);
      
      // For MVP, don't retry aggressively - just fail gracefully
      if (process.env.NODE_ENV === 'development' && this.connectionAttempts === 1) {
        mqttLogger.warn('MQTT broker unavailable - running in MVP mode without MQTT');
      }
      
      if (this.connectionAttempts < this.maxReconnectAttempts && process.env.MQTT_RETRY_ENABLED === 'true') {
        const delay = this.reconnectDelay * Math.pow(2, this.connectionAttempts);
        mqttLogger.info(`Retrying connection in ${delay}ms (attempt ${this.connectionAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.connect();
        }, delay);
      } else {
        mqttLogger.info('MQTT service unavailable - API will run without real-time MQTT features');
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      // Publish offline status before disconnecting
      await this.publishSystemStatus('offline');
      
      await new Promise<void>((resolve) => {
        this.client!.end(false, {}, () => {
          mqttLogger.info('MQTT client disconnected');
          resolve();
        });
      });
      
      this.client = null;
    } catch (error) {
      mqttLogger.error('Error disconnecting from MQTT broker:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.on('deviceStatus', this.handleDeviceStatus.bind(this));
  }

  private subscribeToTopics(): void {
    if (!this.client) {
      return;
    }

    const topics = [
      'obedio/+/+/+/+/status',    // Device status messages
      'obedio/+/+/+/+/data',      // Device data messages  
      'obedio/+/+/+/+/battery',   // Battery status
      'obedio/+/+/+/+/signal',    // Signal strength
      'obedio/+/+/+/+/location',  // Location updates
      'obedio/+/+/+/+/emergency', // Emergency alerts
      'obedio/+/+/+/+/heartbeat', // Device heartbeats
      'obedio/system/+',          // System messages
    ];

    topics.forEach(topic => {
      this.client!.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          mqttLogger.error(`Failed to subscribe to ${topic}:`, error);
        } else {
          mqttLogger.debug(`Subscribed to topic: ${topic}`);
          this.subscriptions.add(topic);
        }
      });
    });

    // Set up message handler
    this.client.on('message', (topic, payload, packet) => {
      this.handleIncomingMessage(topic, payload, packet);
    });

    // Set up connection event handlers
    this.client.on('reconnect', () => {
      mqttLogger.info('MQTT client reconnecting...');
    });

    this.client.on('offline', () => {
      mqttLogger.warn('MQTT client went offline');
    });

    this.client.on('error', (error) => {
      mqttLogger.error('MQTT client error:', error);
    });
  }

  private async handleIncomingMessage(topic: string, payload: Buffer, packet: any): Promise<void> {
    try {
      const message: MqttMessage = {
        topic,
        payload: payload.toString(),
        qos: packet.qos,
        retain: packet.retain,
        timestamp: new Date(),
      };

      // Parse topic structure: obedio/{site}/{room}/{type}/{id}/{action}
      const topicParts = topic.split('/');
      if (topicParts.length >= 5 && topicParts[0] === 'obedio') {
        message.deviceId = `${topicParts[1]}-${topicParts[2]}-${topicParts[3]}-${topicParts[4]}`;
        message.messageType = topicParts[5] || 'unknown';
      }

      // Log message for debugging
      logMqttMessage('inbound', topic, message.payload, {
        qos: packet.qos,
        retain: packet.retain,
        deviceId: message.deviceId,
      });

      // Process the message
      await this.processMessage(message);

      // Cache message in Redis for replay (optional)
      try {
        if (RedisService && typeof (RedisService as any).cacheMqttMessage === 'function') {
          await (RedisService as any).cacheMqttMessage(topic, message);
        }
      } catch (error) {
        // Redis caching is optional - don't fail if unavailable
      }

      // Log traffic to database
      if (message.deviceId) {
        await DatabaseUtils.logMqttTraffic({
          deviceId: message.deviceId,
          topic,
          qos: packet.qos,
          payloadSize: payload.length,
          direction: 'inbound',
        });
      }

      // Emit message event for WebSocket forwarding
      this.emit('message', message);

    } catch (error) {
      mqttLogger.error('Error handling incoming MQTT message:', error);
    }
  }

  private async processMessage(message: MqttMessage): Promise<void> {
    if (!message.deviceId) {
      return;
    }

    try {
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(message.payload.toString());
      } catch {
        // If not JSON, treat as string
        parsedPayload = message.payload.toString();
      }

      // Update device status based on message type
      switch (message.messageType) {
        case 'status':
          await this.handleDeviceStatusMessage(message.deviceId, parsedPayload);
          break;

        case 'heartbeat':
          await this.handleHeartbeatMessage(message.deviceId, parsedPayload);
          break;

        case 'battery':
          await this.handleBatteryMessage(message.deviceId, parsedPayload);
          break;

        case 'signal':
          await this.handleSignalMessage(message.deviceId, parsedPayload);
          break;

        case 'emergency':
          await this.handleEmergencyMessage(message.deviceId, parsedPayload);
          break;

        case 'data':
          await this.handleDataMessage(message.deviceId, parsedPayload);
          break;

        default:
          mqttLogger.debug(`Unhandled message type: ${message.messageType}`, {
            deviceId: message.deviceId,
            topic: message.topic,
          });
      }

    } catch (error) {
      mqttLogger.error('Error processing MQTT message:', error);
    }
  }

  private async handleDeviceStatusMessage(deviceId: string, payload: any): Promise<void> {
    const isOnline = payload.status === 'online' || payload.online === true;
    
    await DatabaseUtils.updateDeviceStatus(deviceId, isOnline, new Date());
    
    const deviceStatus: DeviceStatus = {
      deviceId,
      isOnline,
      lastSeen: new Date(),
    };

    // Cache status in Redis (optional)
    try {
      if (RedisService && typeof (RedisService as any).cacheDeviceStatus === 'function') {
        await (RedisService as any).cacheDeviceStatus(deviceId, deviceStatus);
      }
    } catch (error) {
      // Redis caching is optional - don't fail if unavailable
    }

    this.emit('deviceStatus', deviceStatus);
  }

  private async handleHeartbeatMessage(deviceId: string, payload: any): Promise<void> {
    await DatabaseUtils.updateDeviceStatus(deviceId, true, new Date());
    
    const deviceStatus: DeviceStatus = {
      deviceId,
      isOnline: true,
      lastSeen: new Date(),
    };

    try {
      if (RedisService && typeof (RedisService as any).cacheDeviceStatus === 'function') {
        await (RedisService as any).cacheDeviceStatus(deviceId, deviceStatus);
      }
    } catch (error) {
      // Redis caching is optional - don't fail if unavailable
    }
    this.emit('deviceStatus', deviceStatus);
  }

  private async handleBatteryMessage(deviceId: string, payload: any): Promise<void> {
    const batteryLevel = typeof payload === 'object' ? payload.level : payload;
    
    if (typeof batteryLevel === 'number') {
      const deviceStatus: DeviceStatus = {
        deviceId,
        isOnline: true,
        lastSeen: new Date(),
        battery: batteryLevel,
      };

      try {
        if (RedisService && typeof (RedisService as any).cacheDeviceStatus === 'function') {
          await (RedisService as any).cacheDeviceStatus(deviceId, deviceStatus);
        }
      } catch (error) {
        // Redis caching is optional - don't fail if unavailable
      }
      this.emit('deviceStatus', deviceStatus);
    }
  }

  private async handleSignalMessage(deviceId: string, payload: any): Promise<void> {
    const signalStrength = typeof payload === 'object' ? payload.strength : payload;
    
    if (typeof signalStrength === 'number') {
      const deviceStatus: DeviceStatus = {
        deviceId,
        isOnline: true,
        lastSeen: new Date(),
        signal: signalStrength,
      };

      try {
        if (RedisService && typeof (RedisService as any).cacheDeviceStatus === 'function') {
          await (RedisService as any).cacheDeviceStatus(deviceId, deviceStatus);
        }
      } catch (error) {
        // Redis caching is optional - don't fail if unavailable
      }
      this.emit('deviceStatus', deviceStatus);
    }
  }

  private async handleEmergencyMessage(deviceId: string, payload: any): Promise<void> {
    mqttLogger.warn({
      deviceId,
      payload,
      timestamp: new Date().toISOString(),
    }, 'Emergency message received');

    // Emergency messages should trigger immediate notifications
    this.emit('emergency', {
      deviceId,
      payload,
      timestamp: new Date(),
    });
  }

  private async handleDataMessage(deviceId: string, payload: any): Promise<void> {
    // Handle general data messages from devices
    this.emit('deviceData', {
      deviceId,
      data: payload,
      timestamp: new Date(),
    });
  }

  private async handleDeviceStatus(deviceStatus: DeviceStatus): Promise<void> {
    logOperation('device_status_update', {
      deviceId: deviceStatus.deviceId,
      isOnline: deviceStatus.isOnline,
      battery: deviceStatus.battery,
      signal: deviceStatus.signal,
    });
  }

  async publishMessage(topic: string, payload: any, options: { qos?: 0 | 1 | 2, retain?: boolean } = {}): Promise<void> {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT client not connected');
    }

    const messagePayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const publishOptions = {
      qos: options.qos || 1,
      retain: options.retain || false,
    };

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, messagePayload, publishOptions, (error) => {
        if (error) {
          mqttLogger.error('Failed to publish MQTT message:', error);
          reject(error);
        } else {
          logMqttMessage('outbound', topic, payload, publishOptions);
          resolve();
        }
      });
    });
  }

  async sendDeviceCommand(deviceId: string, command: string, params?: any): Promise<void> {
    const [site, room, type, id] = deviceId.split('-');
    const topic = `obedio/${site}/${room}/${type}/${id}/command`;
    
    const commandPayload = {
      command,
      params,
      timestamp: new Date().toISOString(),
      source: 'api',
    };

    await this.publishMessage(topic, commandPayload);
    
    logOperation('device_command_sent', {
      deviceId,
      command,
      params,
      topic,
    });
  }

  private async publishSystemStatus(status: 'online' | 'offline'): Promise<void> {
    const statusPayload = {
      status,
      timestamp: new Date().toISOString(),
      clientId: config.mqtt.clientId,
      service: 'mqtt-admin-api',
    };

    try {
      await this.publishMessage('obedio/system/api/status', statusPayload, {
        qos: 1,
        retain: true,
      });
    } catch (error) {
      mqttLogger.error('Failed to publish system status:', error);
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.client.connected;
  }

  getConnectionInfo(): any {
    if (!this.client) {
      return { connected: false };
    }

    return {
      connected: this.client.connected,
      reconnecting: this.client.reconnecting,
      clientId: config.mqtt.clientId,
      subscriptions: Array.from(this.subscriptions),
      connectionAttempts: this.connectionAttempts,
    };
  }

  async getRecentMessages(topicPattern: string = 'obedio/#', limit: number = 50): Promise<any[]> {
    try {
      if (RedisService && typeof (RedisService as any).getRecentMessages === 'function') {
        return await (RedisService as any).getRecentMessages(topicPattern, limit);
      }
      return [];
    } catch (error) {
      // Redis is optional - return empty array if unavailable
      return [];
    }
  }
}

export default MqttService;