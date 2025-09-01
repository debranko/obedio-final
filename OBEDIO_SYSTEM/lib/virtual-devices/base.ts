import mqtt, { MqttClient } from 'mqtt';
import { EventEmitter } from 'events';

export interface VirtualDeviceConfig {
  uid?: string;
  name: string;
  room: string;
  type: 'BUTTON' | 'SMART_WATCH' | 'REPEATER';
  initialBattery?: number;
  initialSignal?: number;
  isVirtual: boolean;
  failureMode?: 'none' | 'offline' | 'low_battery' | 'poor_signal' | 'intermittent';
}

export interface DeviceEvent {
  timestamp: number;
  deviceUid: string;
  eventType: string;
  data: any;
}

export class EventRecorder {
  private events: DeviceEvent[] = [];
  private deviceUid: string;

  constructor(deviceUid: string) {
    this.deviceUid = deviceUid;
  }

  record(eventType: string, data: any): void {
    this.events.push({
      timestamp: Date.now(),
      deviceUid: this.deviceUid,
      eventType,
      data
    });
  }

  getEvents(): DeviceEvent[] {
    return this.events;
  }

  clear(): void {
    this.events = [];
  }
}

export abstract class VirtualDevice extends EventEmitter {
  protected mqttClient: MqttClient | null = null;
  protected config: VirtualDeviceConfig;
  protected batteryLevel: number;
  protected signalStrength: number;
  protected isActive: boolean = true;
  protected isOnline: boolean = true;
  protected heartbeatInterval: NodeJS.Timeout | null = null;
  protected eventRecorder: EventRecorder;
  protected mqttBrokerUrl: string;

  constructor(config: VirtualDeviceConfig) {
    super();
    this.config = {
      ...config,
      uid: config.uid || this.generateUid(config.type),
      isVirtual: true
    };
    this.batteryLevel = config.initialBattery || 100;
    this.signalStrength = config.initialSignal || 100;
    this.eventRecorder = new EventRecorder(this.config.uid!);
    
    // Get MQTT broker URL from environment or use default
    this.mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  }

  protected generateUid(type: string): string {
    const year = new Date().getFullYear();
    const typePrefix = type.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const counter = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `OB-${year}-${typePrefix}-${random}${counter}-V`; // -V suffix for virtual
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.mqttClient = mqtt.connect(this.mqttBrokerUrl, {
          clientId: `virtual-${this.config.uid}`,
          clean: true,
          connectTimeout: 4000,
          reconnectPeriod: 1000,
        });

        this.mqttClient.on('connect', () => {
          console.log(`Virtual device ${this.config.uid} connected to MQTT broker`);
          this.startHeartbeat();
          this.publishStatus();
          resolve();
        });

        this.mqttClient.on('error', (error) => {
          console.error(`Virtual device ${this.config.uid} MQTT error:`, error);
          reject(error);
        });

        this.mqttClient.on('close', () => {
          console.log(`Virtual device ${this.config.uid} disconnected from MQTT broker`);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.mqttClient) {
      this.mqttClient.end();
      this.mqttClient = null;
    }

    this.isOnline = false;
  }

  protected startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isOnline && this.mqttClient?.connected) {
        this.sendHeartbeat();
        this.simulateBatteryDrain();
        this.simulateSignalFluctuation();
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  protected sendHeartbeat(): void {
    const topic = `obedio/device/${this.config.uid}/heartbeat`;
    const payload = {
      timestamp: new Date().toISOString(),
      isVirtual: true
    };
    
    this.publish(topic, payload);
    this.eventRecorder.record('heartbeat', payload);
  }

  protected publish(topic: string, payload: any): void {
    if (this.mqttClient?.connected && this.isOnline) {
      this.mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 });
    }
  }

  publishStatus(): void {
    const topic = `obedio/device/${this.config.uid}/status`;
    const payload = {
      battery: Math.round(this.batteryLevel),
      signal: Math.round(this.signalStrength),
      timestamp: new Date().toISOString(),
      isVirtual: true,
      room: this.config.room,
      type: this.config.type,
      name: this.config.name
    };
    
    this.publish(topic, payload);
    this.eventRecorder.record('status_update', payload);
    this.emit('status', payload);
  }

  simulateBatteryDrain(instant: boolean = false, targetLevel?: number): void {
    if (instant && targetLevel !== undefined) {
      this.batteryLevel = Math.max(0, targetLevel);
      this.publishStatus();
      this.eventRecorder.record('battery_drain', { instant: true, level: this.batteryLevel });
    } else {
      // Normal gradual drain
      if (this.batteryLevel > 0) {
        this.batteryLevel = Math.max(0, this.batteryLevel - (Math.random() * 0.1));
        if (this.batteryLevel < 20) {
          this.emit('low_battery', this.batteryLevel);
        }
      }
    }
  }

  protected simulateSignalFluctuation(): void {
    const fluctuation = (Math.random() - 0.5) * 10;
    this.signalStrength = Math.max(0, Math.min(100, this.signalStrength + fluctuation));
    
    if (this.signalStrength < 30) {
      this.emit('poor_signal', this.signalStrength);
    }
  }

  simulateOffline(duration?: number): void {
    this.isOnline = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.eventRecorder.record('device_offline', { duration });
    this.emit('offline');
    
    if (duration) {
      setTimeout(() => this.simulateOnline(), duration);
    }
  }

  simulateOnline(): void {
    this.isOnline = true;
    this.startHeartbeat();
    this.publishStatus();
    this.eventRecorder.record('device_online', {});
    this.emit('online');
  }

  simulateNetworkFailure(type: 'packet_loss' | 'high_latency' | 'disconnect'): void {
    this.eventRecorder.record('network_failure', { type });
    
    switch (type) {
      case 'disconnect':
        this.simulateOffline(5000);
        break;
      case 'packet_loss':
        // Simulate by randomly dropping publishes
        const originalPublish = this.publish.bind(this);
        this.publish = (topic: string, payload: any) => {
          if (Math.random() > 0.3) { // 30% packet loss
            originalPublish(topic, payload);
          }
        };
        // Restore after 10 seconds
        setTimeout(() => {
          this.publish = originalPublish;
        }, 10000);
        break;
      case 'high_latency':
        // Simulate by delaying publishes
        const delayedPublish = this.publish.bind(this);
        this.publish = (topic: string, payload: any) => {
          setTimeout(() => delayedPublish(topic, payload), Math.random() * 2000);
        };
        // Restore after 10 seconds
        setTimeout(() => {
          this.publish = delayedPublish;
        }, 10000);
        break;
    }
  }

  getStatus(): any {
    return {
      uid: this.config.uid,
      name: this.config.name,
      room: this.config.room,
      type: this.config.type,
      battery: Math.round(this.batteryLevel),
      signal: Math.round(this.signalStrength),
      isOnline: this.isOnline,
      isActive: this.isActive,
      isVirtual: true
    };
  }

  getEvents(): DeviceEvent[] {
    return this.eventRecorder.getEvents();
  }

  clearEvents(): void {
    this.eventRecorder.clear();
  }
}