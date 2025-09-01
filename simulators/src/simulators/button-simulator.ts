import { BaseDeviceSimulator } from '@/core/base-device-simulator.js';
import { ButtonDeviceConfig, DeviceEvent } from '@/types/index.js';
import { config } from '@/config/index.js';

export class ButtonDeviceSimulator extends BaseDeviceSimulator {
  private buttonConfig: ButtonDeviceConfig;
  private pressTimer: NodeJS.Timeout | null = null;
  private voiceReadyTimer: NodeJS.Timeout | null = null;
  private lastPressTime: Date | null = null;
  private pressCount: number = 0;
  private isVoiceReady: boolean = false;
  
  constructor(deviceConfig: ButtonDeviceConfig) {
    super(deviceConfig);
    this.buttonConfig = deviceConfig;
    this.logger.info('Button device simulator created', {
      deviceId: deviceConfig.deviceId,
      room: deviceConfig.room,
      site: deviceConfig.site
    });
  }
  
  protected async onDeviceStart(): Promise<void> {
    this.logger.info('Starting button device simulator');
    
    // Subscribe to command topics
    await this.subscribeToTopic(this.getDeviceTopic('cmd/+'));
    
    // Start random button press simulation
    this.scheduleRandomPress();
    
    // Start voice ready simulation
    this.scheduleVoiceReady();
    
    this.logger.info('Button device simulator started');
  }
  
  protected async onDeviceStop(): Promise<void> {
    this.logger.info('Stopping button device simulator');
    
    // Clear timers
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    
    if (this.voiceReadyTimer) {
      clearTimeout(this.voiceReadyTimer);
      this.voiceReadyTimer = null;
    }
    
    this.logger.info('Button device simulator stopped');
  }
  
  protected onCommandReceived(command: string, data: any): void {
    this.logger.info(`Button device received command: ${command}`, data);
    
    switch (command) {
      case 'trigger_press':
        this.simulateButtonPress(data.pressType || 'single', data.priority || 'normal');
        break;
      case 'enable_voice':
        this.enableVoice();
        break;
      case 'disable_voice':
        this.disableVoice();
        break;
      case 'emergency':
        this.simulateEmergencyPress();
        break;
      default:
        this.logger.warn(`Unknown command received: ${command}`);
    }
  }
  
  /**
   * Simulate a button press event
   */
  public async simulateButtonPress(
    pressType: 'single' | 'double' | 'long' | 'emergency' = 'single',
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<void> {
    const now = new Date();
    const duration = this.calculatePressDuration(pressType);
    
    // Update press tracking
    this.pressCount++;
    this.lastPressTime = now;
    
    const pressEvent: DeviceEvent = {
      type: 'press',
      timestamp: now,
      priority,
      data: {
        pressType,
        duration,
        sequenceId: this.pressCount,
        deviceId: this.deviceConfig.deviceId,
        room: this.deviceConfig.room,
        battery: this.status.battery,
        signal: this.status.signal
      }
    };
    
    // Publish to press topic (legacy format for compatibility)
    const legacyPressPayload = {
      timestamp: now.toISOString(),
      device_id: this.deviceConfig.deviceId,
      press_type: pressType,
      duration,
      sequence_id: this.pressCount,
      priority,
      battery: this.status.battery,
      signal: this.status.signal,
      location: this.status.location || null
    };
    
    // Publish to multiple topics for compatibility
    await this.publishMessage(this.getDeviceTopic('press'), legacyPressPayload);
    await this.publishMessage(this.getDeviceTopic('event/press'), pressEvent.data);
    
    // For emergency presses, also publish to emergency topic
    if (pressType === 'emergency') {
      await this.publishMessage(this.getDeviceTopic('emergency'), {
        ...legacyPressPayload,
        alert_type: 'button_emergency',
        urgency: 'critical'
      });
    }
    
    this.logger.event('BUTTON_PRESS', {
      pressType,
      duration,
      priority,
      sequenceId: this.pressCount
    });
    
    this.emit('buttonPress', pressEvent);
    
    // Schedule next random press
    this.scheduleRandomPress();
  }
  
  /**
   * Simulate voice ready event
   */
  public async simulateVoiceReady(): Promise<void> {
    if (!this.isVoiceReady) {
      return;
    }
    
    const voiceEvent = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      event_type: 'voice_ready',
      status: 'listening',
      duration: 30000, // 30 seconds listening window
      quality: Math.floor(Math.random() * 100) + 1 // 1-100% quality
    };
    
    await this.publishMessage(this.getDeviceTopic('event/voice_ready'), voiceEvent);
    
    this.logger.event('VOICE_READY', voiceEvent);
    this.emit('voiceReady', voiceEvent);
    
    // Schedule next voice ready event
    this.scheduleVoiceReady();
  }
  
  /**
   * Simulate emergency button press
   */
  public async simulateEmergencyPress(): Promise<void> {
    await this.simulateButtonPress('emergency', 'critical');
  }
  
  /**
   * Enable voice functionality
   */
  public enableVoice(): void {
    this.isVoiceReady = true;
    this.logger.info('Voice functionality enabled');
    this.scheduleVoiceReady();
  }
  
  /**
   * Disable voice functionality
   */
  public disableVoice(): void {
    this.isVoiceReady = false;
    if (this.voiceReadyTimer) {
      clearTimeout(this.voiceReadyTimer);
      this.voiceReadyTimer = null;
    }
    this.logger.info('Voice functionality disabled');
  }
  
  /**
   * Schedule next random button press
   */
  private scheduleRandomPress(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
    
    const minInterval = this.buttonConfig.pressInterval?.min || config.getButtonPressMinInterval();
    const maxInterval = this.buttonConfig.pressInterval?.max || config.getButtonPressMaxInterval();
    
    const interval = Math.random() * (maxInterval - minInterval) + minInterval;
    
    this.pressTimer = setTimeout(() => {
      if (this.isRunning && this.isConnected) {
        // Randomly choose press type with weighted probability
        const pressType = this.getRandomPressType();
        const priority = this.getRandomPriority();
        
        this.simulateButtonPress(pressType, priority).catch(error => {
          this.logger.error('Failed to simulate button press', error);
        });
      }
    }, interval);
    
    this.logger.debug(`Next button press scheduled in ${Math.round(interval / 1000)}s`);
  }
  
  /**
   * Schedule next voice ready event
   */
  private scheduleVoiceReady(): void {
    if (!this.isVoiceReady || this.voiceReadyTimer) {
      return;
    }
    
    // Voice ready events are less frequent than button presses
    const interval = Math.random() * 120000 + 60000; // 1-3 minutes
    
    this.voiceReadyTimer = setTimeout(() => {
      if (this.isRunning && this.isConnected && this.isVoiceReady) {
        this.simulateVoiceReady().catch(error => {
          this.logger.error('Failed to simulate voice ready', error);
        });
      }
    }, interval);
  }
  
  /**
   * Calculate press duration based on type
   */
  private calculatePressDuration(pressType: string): number {
    switch (pressType) {
      case 'single':
        return Math.random() * 500 + 100; // 100-600ms
      case 'double':
        return Math.random() * 200 + 50; // 50-250ms per press
      case 'long':
        return Math.random() * 2000 + this.buttonConfig.longPressThreshold; // longPressThreshold + 0-2s
      case 'emergency':
        return Math.random() * 1000 + 2000; // 2-3s
      default:
        return 200;
    }
  }
  
  /**
   * Get random press type with weighted probability
   */
  private getRandomPressType(): 'single' | 'double' | 'long' | 'emergency' {
    const random = Math.random();
    
    if (random < 0.7) {
      return 'single'; // 70% chance
    } else if (random < 0.85) {
      return 'double'; // 15% chance
    } else if (random < 0.97) {
      return 'long'; // 12% chance
    } else {
      return 'emergency'; // 3% chance
    }
  }
  
  /**
   * Get random priority with weighted probability
   */
  private getRandomPriority(): 'low' | 'normal' | 'high' | 'critical' {
    const random = Math.random();
    
    if (random < 0.6) {
      return 'normal'; // 60% chance
    } else if (random < 0.8) {
      return 'low'; // 20% chance
    } else if (random < 0.95) {
      return 'high'; // 15% chance
    } else {
      return 'critical'; // 5% chance
    }
  }
  
  /**
   * Get device statistics
   */
  public getDeviceStats() {
    return {
      ...this.getMetrics(),
      pressCount: this.pressCount,
      lastPressTime: this.lastPressTime,
      isVoiceReady: this.isVoiceReady,
      deviceType: 'button',
      status: this.getStatus()
    };
  }
}

// Standalone button simulator runner
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runButtonSimulator() {
    const deviceConfig: ButtonDeviceConfig = {
      deviceId: process.argv[2] || `btn-${Math.random().toString(36).substr(2, 9)}`,
      site: process.argv[3] || config.getDefaultSite(),
      room: process.argv[4] || config.getDefaultRoom(),
      deviceType: 'button',
      name: `Button Device ${process.argv[2] || 'Simulator'}`,
      pressInterval: {
        min: config.getButtonPressMinInterval(),
        max: config.getButtonPressMaxInterval()
      },
      doublePressThreshold: config.getButtonDoublePressThreshold(),
      longPressThreshold: config.getButtonLongPressThreshold(),
      emergencyPressEnabled: true
    };
    
    const simulator = new ButtonDeviceSimulator(deviceConfig);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down button simulator...');
      await simulator.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down button simulator...');
      await simulator.stop();
      process.exit(0);
    });
    
    try {
      await simulator.start();
      console.log(`Button simulator started: ${deviceConfig.deviceId}`);
      
      // Enable voice functionality by default
      simulator.enableVoice();
      
      // Keep the process running
      process.stdin.resume();
    } catch (error) {
      console.error('Failed to start button simulator:', error);
      process.exit(1);
    }
  }
  
  runButtonSimulator().catch(console.error);
}