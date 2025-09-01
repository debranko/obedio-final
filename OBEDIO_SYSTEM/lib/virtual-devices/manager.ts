import { VirtualDevice, VirtualDeviceConfig } from './base';
import { VirtualSmartButton } from './button';
import { VirtualSmartwatch } from './smartwatch';
import { VirtualRepeater } from './repeater';
import { FailureSimulator, FailureScenario } from './failure-simulator';
import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';

export interface VirtualDeviceManagerConfig {
  mqttBrokerUrl?: string;
  prisma?: PrismaClient;
}

export interface CreateDeviceOptions {
  type: 'BUTTON' | 'SMART_WATCH' | 'REPEATER';
  name: string;
  room: string;
  uid?: string;
  initialBattery?: number;
  initialSignal?: number;
  additionalConfig?: Record<string, any>;
  saveToDatabase?: boolean;
}

export class VirtualDeviceManager extends EventEmitter {
  private devices: Map<string, VirtualDevice> = new Map();
  private failureSimulator: FailureSimulator;
  private prisma?: PrismaClient;
  private mqttBrokerUrl: string;

  constructor(config?: VirtualDeviceManagerConfig) {
    super();
    this.mqttBrokerUrl = config?.mqttBrokerUrl || process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    this.prisma = config?.prisma;
    this.failureSimulator = new FailureSimulator();
  }

  /**
   * Create a new virtual device
   */
  async createDevice(options: CreateDeviceOptions): Promise<VirtualDevice> {
    const baseConfig: VirtualDeviceConfig = {
      uid: options.uid,
      name: options.name,
      room: options.room,
      type: options.type,
      initialBattery: options.initialBattery,
      initialSignal: options.initialSignal,
      isVirtual: true
    };

    let device: VirtualDevice;

    switch (options.type) {
      case 'BUTTON':
        device = new VirtualSmartButton(baseConfig);
        break;
      
      case 'SMART_WATCH':
        device = new VirtualSmartwatch({
          ...baseConfig,
          assignedCrewId: options.additionalConfig?.assignedCrewId,
          initialLocation: options.additionalConfig?.initialLocation
        });
        break;
      
      case 'REPEATER':
        device = new VirtualRepeater({
          ...baseConfig,
          signalRange: options.additionalConfig?.signalRange,
          initialSignalStrength: options.additionalConfig?.initialSignalStrength
        });
        break;
      
      default:
        throw new Error(`Unknown device type: ${options.type}`);
    }

    // Connect to MQTT
    await device.connect();

    // Register with manager
    const uid = (device as any).config.uid;
    this.devices.set(uid, device);
    
    // Register with failure simulator
    this.failureSimulator.registerDevice(device);

    // Save to database if requested
    if (options.saveToDatabase && this.prisma) {
      await this.saveDeviceToDatabase(device);
    }

    // Emit device created event
    this.emit('device_created', {
      uid,
      type: options.type,
      name: options.name,
      room: options.room
    });

    return device;
  }

  /**
   * Get a device by UID
   */
  getDevice(uid: string): VirtualDevice | undefined {
    return this.devices.get(uid);
  }

  /**
   * Get all devices
   */
  getAllDevices(): VirtualDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get devices by type
   */
  getDevicesByType(type: 'BUTTON' | 'SMART_WATCH' | 'REPEATER'): VirtualDevice[] {
    return this.getAllDevices().filter(device => (device as any).config.type === type);
  }

  /**
   * Get devices by room
   */
  getDevicesByRoom(room: string): VirtualDevice[] {
    return this.getAllDevices().filter(device => (device as any).config.room === room);
  }

  /**
   * Remove a device
   */
  async removeDevice(uid: string): Promise<boolean> {
    const device = this.devices.get(uid);
    if (!device) return false;

    // Disconnect from MQTT
    device.disconnect();

    // Unregister from failure simulator
    this.failureSimulator.unregisterDevice(uid);

    // Remove from manager
    this.devices.delete(uid);

    // Remove from database if exists
    if (this.prisma) {
      await this.removeDeviceFromDatabase(uid);
    }

    // Emit device removed event
    this.emit('device_removed', { uid });

    return true;
  }

  /**
   * Remove all devices
   */
  async removeAllDevices(): Promise<void> {
    const uids = Array.from(this.devices.keys());
    for (const uid of uids) {
      await this.removeDevice(uid);
    }
  }

  /**
   * Execute a failure scenario
   */
  executeFailureScenario(scenario: FailureScenario): void {
    this.failureSimulator.executeScenario(scenario);
    this.emit('failure_scenario_executed', scenario);
  }

  /**
   * Stop all active failures
   */
  stopAllFailures(): void {
    this.failureSimulator.stopAllFailures();
    this.emit('failures_stopped');
  }

  /**
   * Stop failures for a specific device
   */
  stopDeviceFailures(uid: string): void {
    this.failureSimulator.stopDeviceFailures(uid);
    this.emit('device_failures_stopped', { uid });
  }

  /**
   * Get active failures
   */
  getActiveFailures(): string[] {
    return this.failureSimulator.getActiveFailures();
  }

  /**
   * Create a test scenario with multiple devices
   */
  async createTestScenario(scenarioName: string): Promise<void> {
    switch (scenarioName) {
      case 'basic_setup':
        await this.createBasicSetup();
        break;
      case 'full_yacht':
        await this.createFullYachtSetup();
        break;
      case 'stress_test':
        await this.createStressTestSetup();
        break;
      default:
        throw new Error(`Unknown test scenario: ${scenarioName}`);
    }
  }

  /**
   * Create basic setup with a few devices
   */
  private async createBasicSetup(): Promise<void> {
    // Create buttons
    await this.createDevice({
      type: 'BUTTON',
      name: 'Master Cabin Button',
      room: 'Master Cabin',
      saveToDatabase: true
    });

    await this.createDevice({
      type: 'BUTTON',
      name: 'Guest Cabin Button',
      room: 'Guest Cabin',
      saveToDatabase: true
    });

    // Create smartwatches
    await this.createDevice({
      type: 'SMART_WATCH',
      name: 'Captain Watch',
      room: 'Bridge',
      additionalConfig: {
        assignedCrewId: 1,
        initialLocation: { lat: 43.7, lng: 7.3 }
      },
      saveToDatabase: true
    });

    await this.createDevice({
      type: 'SMART_WATCH',
      name: 'Steward Watch',
      room: 'Crew Quarters',
      additionalConfig: {
        assignedCrewId: 2,
        initialLocation: { lat: 43.7, lng: 7.3 }
      },
      saveToDatabase: true
    });

    // Create repeater
    await this.createDevice({
      type: 'REPEATER',
      name: 'Main Deck Repeater',
      room: 'Main Deck',
      additionalConfig: {
        signalRange: 150
      },
      saveToDatabase: true
    });

    this.emit('test_scenario_created', { name: 'basic_setup' });
  }

  /**
   * Create full yacht setup
   */
  private async createFullYachtSetup(): Promise<void> {
    const rooms = [
      'Master Cabin', 'VIP Cabin', 'Guest Cabin 1', 'Guest Cabin 2',
      'Main Salon', 'Upper Salon', 'Bridge', 'Galley',
      'Crew Mess', 'Engine Room', 'Beach Club', 'Sun Deck'
    ];

    // Create buttons for each room
    for (const room of rooms) {
      await this.createDevice({
        type: 'BUTTON',
        name: `${room} Button`,
        room,
        saveToDatabase: true
      });
    }

    // Create smartwatches for crew
    const crewPositions = [
      { name: 'Captain', id: 1 },
      { name: 'Chief Steward', id: 2 },
      { name: 'Steward 1', id: 3 },
      { name: 'Steward 2', id: 4 },
      { name: 'Engineer', id: 5 },
      { name: 'Deckhand', id: 6 }
    ];

    for (const crew of crewPositions) {
      await this.createDevice({
        type: 'SMART_WATCH',
        name: `${crew.name} Watch`,
        room: 'Crew Quarters',
        additionalConfig: {
          assignedCrewId: crew.id,
          initialLocation: { lat: 43.7, lng: 7.3 }
        },
        saveToDatabase: true
      });
    }

    // Create repeaters for coverage
    const repeaterLocations = [
      'Main Deck', 'Upper Deck', 'Sun Deck', 'Engine Room'
    ];

    for (const location of repeaterLocations) {
      await this.createDevice({
        type: 'REPEATER',
        name: `${location} Repeater`,
        room: location,
        additionalConfig: {
          signalRange: 200
        },
        saveToDatabase: true
      });
    }

    this.emit('test_scenario_created', { name: 'full_yacht' });
  }

  /**
   * Create stress test setup
   */
  private async createStressTestSetup(): Promise<void> {
    // Create many devices for stress testing
    const deviceCount = {
      buttons: 50,
      smartwatches: 20,
      repeaters: 10
    };

    // Create buttons
    for (let i = 0; i < deviceCount.buttons; i++) {
      await this.createDevice({
        type: 'BUTTON',
        name: `Test Button ${i + 1}`,
        room: `Test Room ${Math.floor(i / 5) + 1}`,
        initialBattery: Math.random() * 100,
        initialSignal: Math.random() * 100
      });
    }

    // Create smartwatches
    for (let i = 0; i < deviceCount.smartwatches; i++) {
      await this.createDevice({
        type: 'SMART_WATCH',
        name: `Test Watch ${i + 1}`,
        room: 'Test Area',
        additionalConfig: {
          assignedCrewId: i + 1,
          initialLocation: {
            lat: 43.7 + (Math.random() - 0.5) * 0.01,
            lng: 7.3 + (Math.random() - 0.5) * 0.01
          }
        }
      });
    }

    // Create repeaters
    for (let i = 0; i < deviceCount.repeaters; i++) {
      await this.createDevice({
        type: 'REPEATER',
        name: `Test Repeater ${i + 1}`,
        room: `Zone ${i + 1}`,
        additionalConfig: {
          signalRange: 100 + Math.random() * 200
        }
      });
    }

    this.emit('test_scenario_created', { 
      name: 'stress_test',
      deviceCount: deviceCount.buttons + deviceCount.smartwatches + deviceCount.repeaters
    });
  }

  /**
   * Save device to database
   */
  private async saveDeviceToDatabase(device: VirtualDevice): Promise<void> {
    if (!this.prisma) return;

    const config = (device as any).config;
    const status = device.getStatus();

    await this.prisma.device.create({
      data: {
        uid: config.uid,
        name: config.name,
        type: config.type,
        room: config.room,
        battery: status.battery,
        signal: status.signal,
        isVirtual: true,
        virtualConfig: {
          mqttBrokerUrl: this.mqttBrokerUrl,
          createdAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Remove device from database
   */
  private async removeDeviceFromDatabase(uid: string): Promise<void> {
    if (!this.prisma) return;

    await this.prisma.device.deleteMany({
      where: { uid, isVirtual: true }
    });
  }

  /**
   * Get device statistics
   */
  getStatistics(): {
    totalDevices: number;
    devicesByType: Record<string, number>;
    activeFailures: number;
    averageBattery: number;
    averageSignal: number;
  } {
    const devices = this.getAllDevices();
    const devicesByType: Record<string, number> = {};
    let totalBattery = 0;
    let totalSignal = 0;

    devices.forEach(device => {
      const type = (device as any).config.type;
      devicesByType[type] = (devicesByType[type] || 0) + 1;
      
      const status = device.getStatus();
      totalBattery += status.battery;
      totalSignal += status.signal;
    });

    return {
      totalDevices: devices.length,
      devicesByType,
      activeFailures: this.getActiveFailures().length,
      averageBattery: devices.length > 0 ? totalBattery / devices.length : 0,
      averageSignal: devices.length > 0 ? totalSignal / devices.length : 0
    };
  }

  /**
   * Export device events for analysis
   */
  exportDeviceEvents(uid: string): any[] {
    const device = this.getDevice(uid);
    if (!device) return [];

    return (device as any).eventRecorder.getEvents();
  }

  /**
   * Export all device events
   */
  exportAllEvents(): Record<string, any[]> {
    const events: Record<string, any[]> = {};
    
    this.devices.forEach((device, uid) => {
      events[uid] = (device as any).eventRecorder.getEvents();
    });

    return events;
  }
}