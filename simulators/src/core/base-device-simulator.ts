import { EventEmitter } from 'events';
import { MqttClient, connect } from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import { 
  DeviceConfig, 
  MqttConfig, 
  DeviceStatus, 
  DeviceMetrics, 
  DeviceEvent, 
  MqttMessage,
  SimulatorState 
} from '@/types/index.js';
import { createDeviceLogger, DeviceLogger } from '@/utils/logger.js';
import { config } from '@/config/index.js';

export abstract class BaseDeviceSimulator extends EventEmitter {
  protected mqttClient: MqttClient | null = null;
  protected deviceConfig: DeviceConfig;
  protected mqttConfig: MqttConfig;
  protected logger: DeviceLogger;
  protected isRunning: boolean = false;
  protected isConnected: boolean = false;
  protected startTime: Date | null = null;
  
  // Device state
  protected status: DeviceStatus;
  protected metrics: DeviceMetrics;
  
  // Timers
  protected heartbeatTimer: NodeJS.Timeout | null = null;
  protected statusTimer: NodeJS.Timeout | null = null;
  protected eventTimers: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(deviceConfig: DeviceConfig, mqttConfig?: MqttConfig) {
    super();
    
    this.deviceConfig = deviceConfig;
    this.mqttConfig = mqttConfig || config.getMqttConfig();
    this.logger = createDeviceLogger(deviceConfig.deviceId, deviceConfig.deviceType);
    
    // Initialize device status
    this.status = {
      battery: 100,
      signal: 100,
      isOnline: false,
      lastSeen: new Date(),
      temperature: 20 + Math.random() * 10, // 20-30°C
      humidity: 40 + Math.random() * 20     // 40-60%
    };
    
    // Initialize metrics
    this.metrics = {
      uptime: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      reconnections: 0
    };
    
    this.setupErrorHandling();
  }
  
  /**
   * Start the device simulator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Device simulator already running');
      return;
    }
    
    this.logger.info('Starting device simulator');
    this.startTime = new Date();
    this.isRunning = true;
    
    try {
      await this.connectMqtt();
      this.startPeriodicTasks();
      await this.onDeviceStart();
      this.emit('started');
      this.logger.info('Device simulator started successfully');
    } catch (error) {
      this.logger.error('Failed to start device simulator', error);
      this.isRunning = false;
      throw error;
    }
  }
  
  /**
   * Stop the device simulator
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Device simulator not running');
      return;
    }
    
    this.logger.info('Stopping device simulator');
    this.isRunning = false;
    
    try {
      await this.onDeviceStop();
      this.stopPeriodicTasks();
      await this.disconnectMqtt();
      this.emit('stopped');
      this.logger.info('Device simulator stopped successfully');
    } catch (error) {
      this.logger.error('Error during device simulator stop', error);
      throw error;
    }
  }
  
  /**
   * Get current device state
   */
  getState(): SimulatorState {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime || new Date(),
      devices: new Map(), // Will be overridden by specific implementations
      metrics: this.metrics,
      errors: [], // Could be populated from logs
      lastHeartbeat: this.status.lastSeen
    };
  }
  
  /**
   * Get device status
   */
  getStatus(): DeviceStatus {
    return { ...this.status };
  }
  
  /**
   * Get device metrics
   */
  getMetrics(): DeviceMetrics {
    if (this.startTime) {
      this.metrics.uptime = Date.now() - this.startTime.getTime();
    }
    return { ...this.metrics };
  }
  
  /**
   * Connect to MQTT broker
   */
  protected async connectMqtt(): Promise<void> {
    return new Promise((resolve, reject) => {
      const clientId = `${this.mqttConfig.clientIdPrefix}-${this.deviceConfig.deviceId}-${uuidv4().slice(0, 8)}`;
      
      const connectOptions: any = {
        clientId,
        keepalive: this.mqttConfig.keepAlive,
        clean: this.mqttConfig.cleanSession,
        reconnectPeriod: this.mqttConfig.reconnectPeriod,
        connectTimeout: this.mqttConfig.connectTimeout,
        username: this.mqttConfig.username,
        password: this.mqttConfig.password
      };
      
      // Add TLS options if enabled
      if (this.mqttConfig.tls?.enabled) {
        connectOptions.protocol = 'mqtts';
        connectOptions.rejectUnauthorized = this.mqttConfig.tls.rejectUnauthorized;
        
        if (this.mqttConfig.tls.certPath && this.mqttConfig.tls.keyPath) {
          const fs = require('fs');
          connectOptions.cert = fs.readFileSync(this.mqttConfig.tls.certPath);
          connectOptions.key = fs.readFileSync(this.mqttConfig.tls.keyPath);
          
          if (this.mqttConfig.tls.caPath) {
            connectOptions.ca = fs.readFileSync(this.mqttConfig.tls.caPath);
          }
        }
      }
      
      this.logger.info('Connecting to MQTT broker', { 
        broker: this.mqttConfig.brokerUrl,
        clientId 
      });
      
      this.mqttClient = connect(this.mqttConfig.brokerUrl, connectOptions);
      
      this.mqttClient.on('connect', () => {
        this.logger.info('Connected to MQTT broker');
        this.isConnected = true;
        this.status.isOnline = true;
        this.publishBirthMessage();
        resolve();
      });
      
      this.mqttClient.on('error', (error) => {
        this.logger.error('MQTT connection error', error);
        this.metrics.errors++;
        reject(error);
      });
      
      this.mqttClient.on('reconnect', () => {
        this.logger.info('Reconnecting to MQTT broker');
        this.metrics.reconnections++;
      });
      
      this.mqttClient.on('close', () => {
        this.logger.info('MQTT connection closed');
        this.isConnected = false;
        this.status.isOnline = false;
      });
      
      this.mqttClient.on('message', (topic, payload) => {
        this.handleIncomingMessage(topic, payload);
      });
    });
  }
  
  /**
   * Disconnect from MQTT broker
   */
  protected async disconnectMqtt(): Promise<void> {
    if (this.mqttClient && this.isConnected) {
      return new Promise((resolve) => {
        this.publishLastWillMessage();
        
        this.mqttClient!.end(false, {}, () => {
          this.logger.info('Disconnected from MQTT broker');
          this.isConnected = false;
          this.status.isOnline = false;
          resolve();
        });
      });
    }
  }
  
  /**
   * Publish message to MQTT broker
   */
  protected async publishMessage(topic: string, payload: any, qos: 0 | 1 | 2 = 1): Promise<void> {
    if (!this.mqttClient || !this.isConnected) {
      throw new Error('MQTT client not connected');
    }
    
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    return new Promise((resolve, reject) => {
      this.mqttClient!.publish(topic, message, { qos }, (error) => {
        if (error) {
          this.logger.error(`Failed to publish to ${topic}`, error);
          this.metrics.errors++;
          reject(error);
        } else {
          this.logger.mqtt('SEND', topic, payload);
          this.metrics.messagesSent++;
          resolve();
        }
      });
    });
  }
  
  /**
   * Subscribe to MQTT topic
   */
  protected async subscribeToTopic(topic: string, qos: 0 | 1 | 2 = 1): Promise<void> {
    if (!this.mqttClient || !this.isConnected) {
      throw new Error('MQTT client not connected');
    }
    
    return new Promise((resolve, reject) => {
      this.mqttClient!.subscribe(topic, { qos }, (error) => {
        if (error) {
          this.logger.error(`Failed to subscribe to ${topic}`, error);
          reject(error);
        } else {
          this.logger.info(`Subscribed to ${topic}`);
          resolve();
        }
      });
    });
  }
  
  /**
   * Generate device topic
   */
  protected getDeviceTopic(action: string): string {
    return `obedio/${this.deviceConfig.site}/${this.deviceConfig.room}/${this.deviceConfig.deviceType}/${this.deviceConfig.deviceId}/${action}`;
  }
  
  /**
   * Publish birth message (device comes online)
   */
  protected async publishBirthMessage(): Promise<void> {
    const birthPayload = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      device_type: this.deviceConfig.deviceType,
      firmware_version: this.deviceConfig.firmware || '1.0.0',
      model: this.deviceConfig.model || 'Simulator',
      status: 'online'
    };
    
    await this.publishMessage(this.getDeviceTopic('birth'), birthPayload);
    this.logger.event('BIRTH', birthPayload);
  }
  
  /**
   * Publish last will message (device goes offline)
   */
  protected async publishLastWillMessage(): Promise<void> {
    const lwt = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      status: 'offline'
    };
    
    await this.publishMessage(this.getDeviceTopic('lwt'), lwt);
    this.logger.event('LWT', lwt);
  }
  
  /**
   * Publish status update
   */
  protected async publishStatusUpdate(): Promise<void> {
    this.updateDeviceStatus();
    
    const statusPayload = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      battery: this.status.battery,
      signal: this.status.signal,
      temperature: this.status.temperature,
      humidity: this.status.humidity,
      uptime: this.getMetrics().uptime
    };
    
    await this.publishMessage(this.getDeviceTopic('status'), statusPayload);
    this.logger.event('STATUS', statusPayload);
  }
  
  /**
   * Publish heartbeat
   */
  protected async publishHeartbeat(): Promise<void> {
    const heartbeatPayload = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      status: 'alive'
    };
    
    await this.publishMessage(this.getDeviceTopic('heartbeat'), heartbeatPayload);
    this.status.lastSeen = new Date();
  }
  
  /**
   * Handle incoming MQTT messages
   */
  protected handleIncomingMessage(topic: string, payload: Buffer): void {
    try {
      const message = payload.toString();
      this.logger.mqtt('RECV', topic, message);
      this.metrics.messagesReceived++;
      
      // Parse command messages
      if (topic.includes('/cmd/')) {
        this.handleCommand(topic, message);
      }
      
      this.emit('message', { topic, payload: message });
    } catch (error) {
      this.logger.error('Error handling incoming message', error, { topic });
      this.metrics.errors++;
    }
  }
  
  /**
   * Handle device commands
   */
  protected handleCommand(topic: string, payload: string): void {
    try {
      const commandType = topic.split('/').pop();
      const data = JSON.parse(payload);
      
      this.logger.info(`Received command: ${commandType}`, data);
      
      switch (commandType) {
        case 'ping':
          this.handlePingCommand(data);
          break;
        case 'config':
          this.handleConfigCommand(data);
          break;
        case 'reset':
          this.handleResetCommand(data);
          break;
        default:
          this.onCommandReceived(commandType!, data);
      }
    } catch (error) {
      this.logger.error('Error handling command', error, { topic, payload });
    }
  }
  
  /**
   * Handle ping command
   */
  protected async handlePingCommand(data: any): Promise<void> {
    const pongPayload = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      ping_id: data.ping_id || uuidv4(),
      response: 'pong'
    };
    
    await this.publishMessage(this.getDeviceTopic('pong'), pongPayload);
  }
  
  /**
   * Handle config command
   */
  protected handleConfigCommand(data: any): void {
    this.logger.info('Config command received', data);
    // Override in specific device implementations
  }
  
  /**
   * Handle reset command
   */
  protected async handleResetCommand(data: any): Promise<void> {
    this.logger.info('Reset command received', data);
    await this.stop();
    setTimeout(() => this.start(), 2000);
  }
  
  /**
   * Update device status with realistic variations
   */
  protected updateDeviceStatus(): void {
    const simulatorConfig = config.getSimulatorConfig();
    
    // Simulate battery drain
    if (this.status.battery > 0) {
      this.status.battery = Math.max(0, this.status.battery - simulatorConfig.batteryDrainRate);
    }
    
    // Simulate signal fluctuations
    const signalChange = (Math.random() - 0.5) * simulatorConfig.signalFluctuationRange;
    this.status.signal = Math.max(0, Math.min(100, this.status.signal + signalChange));
    
    // Update temperature and humidity slightly
    this.status.temperature = Math.max(15, Math.min(35, this.status.temperature! + (Math.random() - 0.5) * 2));
    this.status.humidity = Math.max(30, Math.min(80, this.status.humidity! + (Math.random() - 0.5) * 5));
    
    this.status.lastSeen = new Date();
  }
  
  /**
   * Start periodic tasks
   */
  protected startPeriodicTasks(): void {
    const simulatorConfig = config.getSimulatorConfig();
    
    // Heartbeat timer
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.publishHeartbeat().catch(error => {
          this.logger.error('Failed to send heartbeat', error);
        });
      }
    }, simulatorConfig.heartbeatInterval);
    
    // Status update timer
    this.statusTimer = setInterval(() => {
      if (this.isConnected) {
        this.publishStatusUpdate().catch(error => {
          this.logger.error('Failed to send status update', error);
        });
      }
    }, simulatorConfig.statusUpdateInterval);
  }
  
  /**
   * Stop periodic tasks
   */
  protected stopPeriodicTasks(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
    
    // Clear all event timers
    this.eventTimers.forEach((timer) => clearTimeout(timer));
    this.eventTimers.clear();
  }
  
  /**
   * Setup error handling
   */
  protected setupErrorHandling(): void {
    this.on('error', (error) => {
      this.logger.error('Device simulator error', error);
      this.metrics.errors++;
    });
    
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', error);
      this.stop().catch(() => {});
    });
    
    process.on('unhandledRejection', (reason) => {
      this.logger.error('Unhandled rejection', reason as Error);
    });
  }
  
  // Abstract methods to be implemented by specific device types
  protected abstract onDeviceStart(): Promise<void>;
  protected abstract onDeviceStop(): Promise<void>;
  protected abstract onCommandReceived(command: string, data: any): void;
}