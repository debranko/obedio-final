import { VirtualDevice, VirtualDeviceConfig } from './base';

export interface RepeaterStats {
  messagesRelayed: number;
  devicesConnected: number;
  signalStrength: number;
  uptime: number;
  lastRelayTime?: string;
}

export interface ConnectedDevice {
  uid: string;
  type: string;
  rssi: number;
  lastSeen: string;
}

export class VirtualRepeater extends VirtualDevice {
  private stats: RepeaterStats;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private relayQueue: any[] = [];
  private signalRange: number = 100; // meters
  private repeaterSignalStrength: number = -50; // dBm - renamed to avoid conflict
  private uptimeStart: number = Date.now();
  private firmwareVersion: string = '1.0.0'; // Added firmware version property

  constructor(config: Omit<VirtualDeviceConfig, 'type'> & {
    signalRange?: number;
    initialSignalStrength?: number;
  }) {
    super({ ...config, type: 'REPEATER' });
    
    this.signalRange = config.signalRange || 100;
    this.repeaterSignalStrength = config.initialSignalStrength || -50;
    
    this.stats = {
      messagesRelayed: 0,
      devicesConnected: 0,
      signalStrength: this.repeaterSignalStrength,
      uptime: 0
    };

    // Start uptime counter
    this.startUptimeCounter();
  }

  /**
   * Relay a message from one device to another
   */
  relayMessage(fromDevice: string, toDevice: string, message: any): void {
    // Add to relay queue
    this.relayQueue.push({
      from: fromDevice,
      to: toDevice,
      message,
      timestamp: new Date().toISOString()
    });

    // Process relay with slight delay to simulate real-world latency
    setTimeout(() => {
      const relay = this.relayQueue.shift();
      if (!relay) return;

      const topic = `obedio/repeater/${this.config.uid}/relay`;
      const payload = {
        ...relay,
        rssi: this.calculateRSSI(fromDevice),
        hopCount: (message.hopCount || 0) + 1,
        isVirtual: true
      };

      this.publish(topic, payload);
      this.eventRecorder.record('message_relayed', payload);
      this.emit('message_relayed', payload);

      // Update stats
      this.stats.messagesRelayed++;
      this.stats.lastRelayTime = new Date().toISOString();
      
      // Update connected device info
      this.updateConnectedDevice(fromDevice);
      
      this.publishStatus();
    }, Math.random() * 100 + 50); // 50-150ms delay
  }

  /**
   * Register a device connection
   */
  registerDevice(deviceUid: string, deviceType: string): void {
    const rssi = this.calculateRSSI(deviceUid);
    const device: ConnectedDevice = {
      uid: deviceUid,
      type: deviceType,
      rssi,
      lastSeen: new Date().toISOString()
    };

    this.connectedDevices.set(deviceUid, device);
    this.stats.devicesConnected = this.connectedDevices.size;

    const topic = `obedio/repeater/${this.config.uid}/device/connected`;
    const payload = {
      device,
      totalDevices: this.stats.devicesConnected,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('device_connected', payload);
    this.emit('device_connected', payload);
    this.publishStatus();
  }

  /**
   * Unregister a device connection
   */
  unregisterDevice(deviceUid: string): void {
    const device = this.connectedDevices.get(deviceUid);
    if (!device) return;

    this.connectedDevices.delete(deviceUid);
    this.stats.devicesConnected = this.connectedDevices.size;

    const topic = `obedio/repeater/${this.config.uid}/device/disconnected`;
    const payload = {
      deviceUid,
      totalDevices: this.stats.devicesConnected,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('device_disconnected', payload);
    this.emit('device_disconnected', payload);
    this.publishStatus();
  }

  /**
   * Update signal strength
   */
  updateSignalStrength(strength: number): void {
    const previousStrength = this.repeaterSignalStrength;
    this.repeaterSignalStrength = Math.max(-100, Math.min(-30, strength)); // Clamp between -100 and -30 dBm
    this.stats.signalStrength = this.repeaterSignalStrength;

    const topic = `obedio/repeater/${this.config.uid}/signal`;
    const payload = {
      signalStrength: this.repeaterSignalStrength,
      previousStrength,
      quality: this.getSignalQuality(),
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('signal_update', payload);
    this.emit('signal_update', payload);
    this.publishStatus();
  }

  /**
   * Simulate signal interference
   */
  simulateInterference(duration: number, severity: 'low' | 'medium' | 'high'): void {
    const originalStrength = this.repeaterSignalStrength;
    const interference = {
      low: -10,
      medium: -25,
      high: -40
    };

    // Apply interference
    this.updateSignalStrength(this.repeaterSignalStrength + interference[severity]);

    const topic = `obedio/repeater/${this.config.uid}/interference`;
    const payload = {
      severity,
      duration,
      signalDrop: interference[severity],
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('interference_started', payload);
    this.emit('interference', payload);

    // Restore signal after duration
    setTimeout(() => {
      this.updateSignalStrength(originalStrength);
      this.eventRecorder.record('interference_ended', {
        duration,
        timestamp: new Date().toISOString()
      });
    }, duration);
  }

  /**
   * Simulate network congestion
   */
  simulateCongestion(messageCount: number, duration: number): void {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > duration) {
        clearInterval(interval);
        return;
      }

      // Generate dummy relay messages
      for (let i = 0; i < messageCount / 10; i++) {
        const fromDevice = `DEVICE_${Math.floor(Math.random() * 10)}`;
        const toDevice = `DEVICE_${Math.floor(Math.random() * 10)}`;
        
        this.relayMessage(fromDevice, toDevice, {
          type: 'congestion_test',
          data: `Test message ${i}`,
          timestamp: new Date().toISOString()
        });
      }
    }, 100); // Every 100ms

    const topic = `obedio/repeater/${this.config.uid}/congestion`;
    const payload = {
      messageCount,
      duration,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('congestion_test', payload);
  }

  /**
   * Calculate RSSI based on device UID (simulated)
   */
  private calculateRSSI(deviceUid: string): number {
    // Simulate RSSI based on device UID hash
    const hash = deviceUid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variance = (hash % 20) - 10; // -10 to +10 variance
    return Math.max(-90, Math.min(-40, this.repeaterSignalStrength + variance));
  }

  /**
   * Get signal quality description
   */
  private getSignalQuality(): string {
    if (this.repeaterSignalStrength >= -50) return 'excellent';
    if (this.repeaterSignalStrength >= -60) return 'good';
    if (this.repeaterSignalStrength >= -70) return 'fair';
    if (this.repeaterSignalStrength >= -80) return 'poor';
    return 'very poor';
  }

  /**
   * Update connected device last seen time
   */
  private updateConnectedDevice(deviceUid: string): void {
    const device = this.connectedDevices.get(deviceUid);
    if (device) {
      device.lastSeen = new Date().toISOString();
      device.rssi = this.calculateRSSI(deviceUid);
    }
  }

  /**
   * Start uptime counter
   */
  private startUptimeCounter(): void {
    setInterval(() => {
      this.stats.uptime = Math.floor((Date.now() - this.uptimeStart) / 1000);
    }, 1000);
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(maxAge: number = 300000): void { // 5 minutes default
    const now = Date.now();
    const staleDevices: string[] = [];

    this.connectedDevices.forEach((device, uid) => {
      const lastSeenTime = new Date(device.lastSeen).getTime();
      if (now - lastSeenTime > maxAge) {
        staleDevices.push(uid);
      }
    });

    staleDevices.forEach(uid => this.unregisterDevice(uid));

    if (staleDevices.length > 0) {
      const topic = `obedio/repeater/${this.config.uid}/cleanup`;
      const payload = {
        removedDevices: staleDevices,
        timestamp: new Date().toISOString(),
        isVirtual: true
      };

      this.publish(topic, payload);
      this.eventRecorder.record('cleanup_performed', payload);
    }
  }

  /**
   * Simulate mesh network formation
   */
  simulateMeshNetwork(otherRepeaters: string[]): void {
    const topic = `obedio/repeater/${this.config.uid}/mesh`;
    const payload = {
      meshId: `MESH_${Date.now()}`,
      repeaters: [this.config.uid, ...otherRepeaters],
      topology: 'star', // Could be 'mesh', 'tree', etc.
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('mesh_formed', payload);
    this.emit('mesh_formed', payload);
  }

  /**
   * Get repeater-specific status
   */
  getStatus(): any {
    const baseStatus = super.getStatus();
    return {
      ...baseStatus,
      stats: this.stats,
      connectedDevices: Array.from(this.connectedDevices.values()),
      signalQuality: this.getSignalQuality(),
      relayQueueSize: this.relayQueue.length,
      signalRange: this.signalRange
    };
  }

  /**
   * Simulate firmware update
   */
  simulateFirmwareUpdate(version: string, duration: number = 30000): void {
    const topic = `obedio/repeater/${this.config.uid}/firmware/update`;
    const startPayload = {
      currentVersion: this.firmwareVersion,
      targetVersion: version,
      status: 'downloading',
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, startPayload);
    this.eventRecorder.record('firmware_update_started', startPayload);
    this.emit('firmware_update', startPayload);

    // Simulate download progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        this.publish(topic, {
          ...startPayload,
          status: 'downloading',
          progress
        });
      }
    }, duration / 10);

    // Simulate installation
    setTimeout(() => {
      clearInterval(progressInterval);
      
      this.publish(topic, {
        ...startPayload,
        status: 'installing',
        progress: 100
      });

      // Simulate reboot
      setTimeout(() => {
        this.firmwareVersion = version;
        this.uptimeStart = Date.now();
        this.stats.uptime = 0;
        
        this.publish(topic, {
          currentVersion: version,
          status: 'completed',
          timestamp: new Date().toISOString(),
          isVirtual: true
        });
        
        this.eventRecorder.record('firmware_update_completed', {
          version,
          timestamp: new Date().toISOString()
        });
        
        this.publishStatus();
      }, 5000); // 5 second "reboot"
    }, duration);
  }
}