import { VirtualDevice } from './base';
import { VirtualSmartButton } from './button';
import { VirtualSmartwatch } from './smartwatch';
import { VirtualRepeater } from './repeater';

export type FailureType = 
  | 'battery_drain'
  | 'signal_loss'
  | 'device_offline'
  | 'intermittent_connection'
  | 'button_malfunction'
  | 'network_congestion'
  | 'firmware_crash'
  | 'memory_leak';

export interface FailureScenario {
  id: string;
  name: string;
  description: string;
  failureType: FailureType;
  duration?: number;
  severity?: 'low' | 'medium' | 'high';
  targetDevices?: string[]; // Device UIDs or 'all'
  parameters?: Record<string, any>;
}

export class FailureSimulator {
  private activeFailures: Map<string, NodeJS.Timeout> = new Map();
  private devices: Map<string, VirtualDevice> = new Map();

  /**
   * Register a device with the failure simulator
   */
  registerDevice(device: VirtualDevice): void {
    const uid = (device as any).config.uid;
    this.devices.set(uid, device);
  }

  /**
   * Unregister a device
   */
  unregisterDevice(uid: string): void {
    this.devices.delete(uid);
    // Cancel any active failures for this device
    const failureKey = `${uid}-*`;
    this.activeFailures.forEach((timeout, key) => {
      if (key.startsWith(uid)) {
        clearTimeout(timeout);
        this.activeFailures.delete(key);
      }
    });
  }

  /**
   * Execute a failure scenario
   */
  executeScenario(scenario: FailureScenario): void {
    const targetDevices = this.getTargetDevices(scenario.targetDevices);
    
    targetDevices.forEach(device => {
      this.simulateFailure(device, scenario);
    });
  }

  /**
   * Simulate a specific failure on a device
   */
  private simulateFailure(device: VirtualDevice, scenario: FailureScenario): void {
    const uid = (device as any).config.uid;
    const failureKey = `${uid}-${scenario.failureType}`;

    // Cancel any existing failure of the same type
    if (this.activeFailures.has(failureKey)) {
      clearTimeout(this.activeFailures.get(failureKey)!);
    }

    switch (scenario.failureType) {
      case 'battery_drain':
        this.simulateBatteryDrain(device, scenario);
        break;
      case 'signal_loss':
        this.simulateSignalLoss(device, scenario);
        break;
      case 'device_offline':
        this.simulateDeviceOffline(device, scenario);
        break;
      case 'intermittent_connection':
        this.simulateIntermittentConnection(device, scenario);
        break;
      case 'button_malfunction':
        if (device instanceof VirtualSmartButton) {
          this.simulateButtonMalfunction(device, scenario);
        }
        break;
      case 'network_congestion':
        if (device instanceof VirtualRepeater) {
          this.simulateNetworkCongestion(device, scenario);
        }
        break;
      case 'firmware_crash':
        this.simulateFirmwareCrash(device, scenario);
        break;
      case 'memory_leak':
        this.simulateMemoryLeak(device, scenario);
        break;
    }
  }

  /**
   * Simulate battery drain
   */
  private simulateBatteryDrain(device: VirtualDevice, scenario: FailureScenario): void {
    const targetLevel = scenario.parameters?.targetLevel || 0;
    const drainRate = scenario.parameters?.drainRate || 1; // % per second
    
    if (scenario.parameters?.instant) {
      device.simulateBatteryDrain(true, targetLevel);
    } else {
      const interval = setInterval(() => {
        const currentBattery = device.getStatus().battery;
        if (currentBattery <= targetLevel) {
          clearInterval(interval);
          this.activeFailures.delete(`${(device as any).config.uid}-battery_drain`);
          return;
        }
        device.simulateBatteryDrain(true, currentBattery - drainRate);
      }, 1000);

      this.activeFailures.set(`${(device as any).config.uid}-battery_drain`, interval);
    }
  }

  /**
   * Simulate signal loss
   */
  private simulateSignalLoss(device: VirtualDevice, scenario: FailureScenario): void {
    const severity = scenario.severity || 'medium';
    const signalLevels = {
      low: 30,
      medium: 15,
      high: 5
    };

    // Gradually reduce signal strength
    const targetSignal = signalLevels[severity];
    const interval = setInterval(() => {
      const currentSignal = device.getStatus().signal;
      if (currentSignal <= targetSignal) {
        clearInterval(interval);
        this.activeFailures.delete(`${(device as any).config.uid}-signal_loss`);
        return;
      }
      
      // Update signal strength based on device type
      if (device instanceof VirtualRepeater) {
        device.updateSignalStrength(-currentSignal + 2);
      } else {
        // For other devices, manipulate the protected signalStrength
        (device as any).signalStrength = Math.max(targetSignal, currentSignal - 5);
        device.publishStatus();
      }
    }, 500);

    this.activeFailures.set(`${(device as any).config.uid}-signal_loss`, interval);

    // Auto-restore after duration
    if (scenario.duration) {
      setTimeout(() => {
        clearInterval(interval);
        this.activeFailures.delete(`${(device as any).config.uid}-signal_loss`);
        if (device instanceof VirtualRepeater) {
          device.updateSignalStrength(-50); // Restore to default
        } else {
          (device as any).signalStrength = 100;
          device.publishStatus();
        }
      }, scenario.duration);
    }
  }

  /**
   * Simulate device going offline
   */
  private simulateDeviceOffline(device: VirtualDevice, scenario: FailureScenario): void {
    device.simulateOffline(scenario.duration);
  }

  /**
   * Simulate intermittent connection
   */
  private simulateIntermittentConnection(device: VirtualDevice, scenario: FailureScenario): void {
    const interval = scenario.parameters?.interval || 5000; // Time between disconnects
    const offlineDuration = scenario.parameters?.offlineDuration || 2000;
    
    const intermittentInterval = setInterval(() => {
      device.simulateOffline(offlineDuration);
    }, interval);

    this.activeFailures.set(`${(device as any).config.uid}-intermittent_connection`, intermittentInterval);

    // Stop after duration
    if (scenario.duration) {
      setTimeout(() => {
        clearInterval(intermittentInterval);
        this.activeFailures.delete(`${(device as any).config.uid}-intermittent_connection`);
      }, scenario.duration);
    }
  }

  /**
   * Simulate button malfunction
   */
  private simulateButtonMalfunction(button: VirtualSmartButton, scenario: FailureScenario): void {
    const malfunctionType = scenario.parameters?.type || 'stuck';
    
    switch (malfunctionType) {
      case 'stuck':
        // Simulate stuck button - rapid presses
        const stuckInterval = setInterval(() => {
          button.press();
        }, 100);
        
        this.activeFailures.set(`${(button as any).config.uid}-button_malfunction`, stuckInterval);
        
        // Stop after duration
        setTimeout(() => {
          clearInterval(stuckInterval);
          this.activeFailures.delete(`${(button as any).config.uid}-button_malfunction`);
        }, scenario.duration || 5000);
        break;
        
      case 'unresponsive':
        // Make button unresponsive by overriding press
        const originalPress = button.press.bind(button);
        button.press = () => {
          console.log('Button is unresponsive due to malfunction');
        };
        
        // Restore after duration
        setTimeout(() => {
          button.press = originalPress;
        }, scenario.duration || 10000);
        break;
    }
  }

  /**
   * Simulate network congestion on repeater
   */
  private simulateNetworkCongestion(repeater: VirtualRepeater, scenario: FailureScenario): void {
    const messageCount = scenario.parameters?.messageCount || 100;
    const duration = scenario.duration || 30000;
    
    repeater.simulateCongestion(messageCount, duration);
  }

  /**
   * Simulate firmware crash
   */
  private simulateFirmwareCrash(device: VirtualDevice, scenario: FailureScenario): void {
    // Device goes offline
    device.simulateOffline();
    
    // Emit crash event
    device.emit('firmware_crash', {
      timestamp: new Date().toISOString(),
      severity: scenario.severity || 'high'
    });

    // Simulate reboot after delay
    setTimeout(() => {
      device.simulateOnline();
      device.emit('firmware_recovered', {
        timestamp: new Date().toISOString(),
        downtime: scenario.parameters?.rebootTime || 30000
      });
    }, scenario.parameters?.rebootTime || 30000);
  }

  /**
   * Simulate memory leak
   */
  private simulateMemoryLeak(device: VirtualDevice, scenario: FailureScenario): void {
    let memoryUsage = 50; // Start at 50%
    const leakRate = scenario.parameters?.leakRate || 1; // % per second
    
    const leakInterval = setInterval(() => {
      memoryUsage = Math.min(100, memoryUsage + leakRate);
      
      device.emit('memory_usage', {
        usage: memoryUsage,
        timestamp: new Date().toISOString()
      });

      // Crash when memory is full
      if (memoryUsage >= 100) {
        clearInterval(leakInterval);
        this.activeFailures.delete(`${(device as any).config.uid}-memory_leak`);
        this.simulateFirmwareCrash(device, {
          ...scenario,
          parameters: {
            ...scenario.parameters,
            crashReason: 'out_of_memory'
          }
        });
      }
    }, 1000);

    this.activeFailures.set(`${(device as any).config.uid}-memory_leak`, leakInterval);
  }

  /**
   * Get target devices based on scenario configuration
   */
  private getTargetDevices(targetDevices?: string[]): VirtualDevice[] {
    if (!targetDevices || targetDevices.includes('all')) {
      return Array.from(this.devices.values());
    }
    
    return targetDevices
      .map(uid => this.devices.get(uid))
      .filter(device => device !== undefined) as VirtualDevice[];
  }

  /**
   * Stop all active failures
   */
  stopAllFailures(): void {
    this.activeFailures.forEach(timeout => clearTimeout(timeout));
    this.activeFailures.clear();
  }

  /**
   * Stop failures for a specific device
   */
  stopDeviceFailures(uid: string): void {
    this.activeFailures.forEach((timeout, key) => {
      if (key.startsWith(uid)) {
        clearTimeout(timeout);
        this.activeFailures.delete(key);
      }
    });
  }

  /**
   * Get active failures
   */
  getActiveFailures(): string[] {
    return Array.from(this.activeFailures.keys());
  }
}

// Pre-defined failure scenarios
export const PREDEFINED_SCENARIOS: FailureScenario[] = [
  {
    id: 'low_battery_warning',
    name: 'Low Battery Warning',
    description: 'Simulates devices reaching low battery levels',
    failureType: 'battery_drain',
    parameters: {
      targetLevel: 15,
      drainRate: 2
    }
  },
  {
    id: 'poor_signal_area',
    name: 'Poor Signal Area',
    description: 'Simulates devices in areas with poor signal coverage',
    failureType: 'signal_loss',
    severity: 'medium',
    duration: 60000
  },
  {
    id: 'network_outage',
    name: 'Network Outage',
    description: 'Simulates complete network failure',
    failureType: 'device_offline',
    duration: 120000,
    targetDevices: ['all']
  },
  {
    id: 'unstable_connection',
    name: 'Unstable Connection',
    description: 'Simulates intermittent connectivity issues',
    failureType: 'intermittent_connection',
    duration: 300000,
    parameters: {
      interval: 10000,
      offlineDuration: 3000
    }
  },
  {
    id: 'button_stuck',
    name: 'Stuck Button',
    description: 'Simulates a button that is physically stuck',
    failureType: 'button_malfunction',
    duration: 10000,
    parameters: {
      type: 'stuck'
    }
  },
  {
    id: 'repeater_congestion',
    name: 'Repeater Congestion',
    description: 'Simulates high traffic through repeater',
    failureType: 'network_congestion',
    duration: 60000,
    parameters: {
      messageCount: 500
    }
  },
  {
    id: 'device_crash',
    name: 'Device Firmware Crash',
    description: 'Simulates a device firmware crash and reboot',
    failureType: 'firmware_crash',
    severity: 'high',
    parameters: {
      rebootTime: 45000
    }
  },
  {
    id: 'memory_leak_critical',
    name: 'Critical Memory Leak',
    description: 'Simulates a memory leak leading to device crash',
    failureType: 'memory_leak',
    parameters: {
      leakRate: 2
    }
  }
];