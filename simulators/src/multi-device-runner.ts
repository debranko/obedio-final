import { ButtonDeviceSimulator } from '@/simulators/button-simulator.js';
import { WatchDeviceSimulator } from '@/simulators/watch-simulator.js';
import { RepeaterDeviceSimulator } from '@/simulators/repeater-simulator.js';
import { GenericDeviceSimulator, TEMPLATE_EXAMPLES } from '@/simulators/generic-device-simulator.js';
import { 
  DeviceConfig, 
  ButtonDeviceConfig, 
  WatchDeviceConfig, 
  RepeaterDeviceConfig,
  LoadTestConfig,
  LifecycleTestConfig 
} from '@/types/index.js';
import { config } from '@/config/index.js';
import { createDeviceLogger } from '@/utils/logger.js';
import { Command } from 'commander';

const logger = createDeviceLogger('multi-runner', 'control');

interface SimulatorInstance {
  id: string;
  type: 'button' | 'watch' | 'repeater' | 'generic';
  simulator: any;
  config: DeviceConfig;
  startTime?: Date;
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  error?: string;
}

export class MultiDeviceRunner {
  private simulators: Map<string, SimulatorInstance> = new Map();
  private isRunning = false;
  private startupDelay: number;
  private shutdownDelay: number;
  
  constructor() {
    this.startupDelay = config.getDeviceStartupDelay();
    this.shutdownDelay = config.getDeviceShutdownDelay();
  }
  
  /**
   * Start multiple device simulators
   */
  async startSimulators(configs: Array<{
    type: 'button' | 'watch' | 'repeater' | 'generic';
    count: number;
    config?: Partial<DeviceConfig>;
    template?: string; // For generic devices
  }>): Promise<void> {
    logger.info('Starting multi-device simulation', { 
      totalConfigs: configs.length,
      maxConcurrent: config.getMaxConcurrentDevices()
    });
    
    this.isRunning = true;
    let deviceCounter = 1;
    
    for (const configGroup of configs) {
      for (let i = 0; i < configGroup.count; i++) {
        if (this.simulators.size >= config.getMaxConcurrentDevices()) {
          logger.warn('Maximum concurrent devices reached', { 
            max: config.getMaxConcurrentDevices() 
          });
          break;
        }
        
        const deviceId = this.generateDeviceId(configGroup.type, deviceCounter);
        const deviceConfig = this.createDeviceConfig(configGroup, deviceId);
        
        try {
          const instance = await this.createSimulatorInstance(
            configGroup.type, 
            deviceConfig, 
            configGroup.template
          );
          
          this.simulators.set(deviceId, instance);
          
          // Start with delay to avoid overwhelming the broker
          setTimeout(() => {
            this.startSimulator(deviceId);
          }, i * this.startupDelay);
          
          deviceCounter++;
          
        } catch (error) {
          logger.error(`Failed to create simulator ${deviceId}`, error);
        }
      }
    }
    
    logger.info(`Created ${this.simulators.size} device simulators`);
  }
  
  /**
   * Stop all simulators
   */
  async stopAllSimulators(): Promise<void> {
    logger.info('Stopping all simulators', { count: this.simulators.size });
    
    this.isRunning = false;
    
    const stopPromises: Promise<void>[] = [];
    let delay = 0;
    
    for (const [deviceId, instance] of this.simulators.entries()) {
      stopPromises.push(
        new Promise((resolve) => {
          setTimeout(async () => {
            await this.stopSimulator(deviceId);
            resolve();
          }, delay);
        })
      );
      delay += this.shutdownDelay;
    }
    
    await Promise.all(stopPromises);
    this.simulators.clear();
    
    logger.info('All simulators stopped');
  }
  
  /**
   * Start a specific simulator
   */
  private async startSimulator(deviceId: string): Promise<void> {
    const instance = this.simulators.get(deviceId);
    if (!instance) return;
    
    try {
      instance.status = 'starting';
      instance.startTime = new Date();
      
      await instance.simulator.start();
      
      instance.status = 'running';
      logger.info(`Simulator ${deviceId} started successfully`);
      
    } catch (error) {
      instance.status = 'error';
      instance.error = (error as Error).message;
      logger.error(`Failed to start simulator ${deviceId}`, error);
    }
  }
  
  /**
   * Stop a specific simulator
   */
  private async stopSimulator(deviceId: string): Promise<void> {
    const instance = this.simulators.get(deviceId);
    if (!instance) return;
    
    try {
      instance.status = 'stopping';
      
      if (instance.simulator && typeof instance.simulator.stop === 'function') {
        await instance.simulator.stop();
      }
      
      instance.status = 'stopped';
      logger.info(`Simulator ${deviceId} stopped successfully`);
      
    } catch (error) {
      instance.status = 'error';
      instance.error = (error as Error).message;
      logger.error(`Failed to stop simulator ${deviceId}`, error);
    }
  }
  
  /**
   * Create simulator instance based on type
   */
  private async createSimulatorInstance(
    type: string, 
    deviceConfig: DeviceConfig, 
    template?: string
  ): Promise<SimulatorInstance> {
    let simulator: any;
    
    switch (type) {
      case 'button':
        simulator = new ButtonDeviceSimulator(deviceConfig as ButtonDeviceConfig);
        break;
        
      case 'watch':
        simulator = new WatchDeviceSimulator(deviceConfig as WatchDeviceConfig);
        break;
        
      case 'repeater':
        simulator = new RepeaterDeviceSimulator(deviceConfig as RepeaterDeviceConfig);
        break;
        
      case 'generic':
        const templateName = template || 'temperature_sensor';
        const deviceTemplate = TEMPLATE_EXAMPLES[templateName as keyof typeof TEMPLATE_EXAMPLES];
        if (!deviceTemplate) {
          throw new Error(`Unknown template: ${templateName}`);
        }
        simulator = new GenericDeviceSimulator(deviceConfig, deviceTemplate);
        break;
        
      default:
        throw new Error(`Unknown simulator type: ${type}`);
    }
    
    return {
      id: deviceConfig.deviceId,
      type: type as any,
      simulator,
      config: deviceConfig,
      status: 'stopped'
    };
  }
  
  /**
   * Create device configuration
   */
  private createDeviceConfig(
    configGroup: any, 
    deviceId: string
  ): DeviceConfig {
    const baseConfig: DeviceConfig = {
      deviceId,
      site: configGroup.config?.site || config.getDefaultSite(),
      room: configGroup.config?.room || config.getDefaultRoom(),
      deviceType: configGroup.type,
      name: `${configGroup.type.charAt(0).toUpperCase() + configGroup.type.slice(1)} Device ${deviceId}`,
      ...configGroup.config
    };
    
    // Add type-specific configurations
    switch (configGroup.type) {
      case 'button':
        return {
          ...baseConfig,
          pressInterval: {
            min: config.getButtonPressMinInterval(),
            max: config.getButtonPressMaxInterval()
          },
          doublePressThreshold: config.getButtonDoublePressThreshold(),
          longPressThreshold: config.getButtonLongPressThreshold(),
          emergencyPressEnabled: true
        } as ButtonDeviceConfig;
        
      case 'watch':
        return {
          ...baseConfig,
          heartRate: {
            min: config.getWatchHeartRateMin(),
            max: config.getWatchHeartRateMax(),
            variability: 10
          },
          stepInterval: config.getWatchStepInterval(),
          locationUpdateInterval: config.getWatchLocationUpdateInterval(),
          healthMonitoring: true
        } as WatchDeviceConfig;
        
      case 'repeater':
        return {
          ...baseConfig,
          meshUpdateInterval: config.getRepeaterMeshUpdateInterval(),
          maxConnectedDevices: config.getRepeaterMaxConnectedDevices(),
          coverageArea: '300m radius',
          frequencies: ['868MHz', '915MHz', '2.4GHz'],
          powerSource: 'AC'
        } as RepeaterDeviceConfig;
        
      default:
        return baseConfig;
    }
  }
  
  /**
   * Generate unique device ID
   */
  private generateDeviceId(type: string, counter: number): string {
    const prefix = type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36);
    return `${prefix}-${timestamp}-${counter.toString().padStart(3, '0')}`;
  }
  
  /**
   * Get status of all simulators
   */
  getStatus(): Array<{
    id: string;
    type: string;
    status: string;
    uptime?: number;
    error?: string;
  }> {
    return Array.from(this.simulators.values()).map(instance => ({
      id: instance.id,
      type: instance.type,
      status: instance.status,
      uptime: instance.startTime ? Date.now() - instance.startTime.getTime() : undefined,
      error: instance.error
    }));
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      total: this.simulators.size,
      running: 0,
      stopped: 0,
      starting: 0,
      stopping: 0,
      error: 0,
      byType: {} as Record<string, number>
    };
    
    for (const instance of this.simulators.values()) {
      stats[instance.status as keyof typeof stats]++;
      stats.byType[instance.type] = (stats.byType[instance.type] || 0) + 1;
    }
    
    return stats;
  }
  
  /**
   * Run load test
   */
  async runLoadTest(testConfig: LoadTestConfig): Promise<void> {
    logger.info('Starting load test', testConfig);
    
    const deviceTypes = testConfig.deviceTypes.length > 0 ? testConfig.deviceTypes : ['button', 'watch', 'repeater'];
    const devicesPerType = Math.floor(testConfig.maxDevices / deviceTypes.length);
    
    const configs = deviceTypes.map(type => ({
      type,
      count: devicesPerType,
      config: {
        site: 'load-test',
        room: `test-${type}`
      }
    }));
    
    // Start simulators with ramp-up
    const rampUpDelay = testConfig.rampUpTime / testConfig.maxDevices;
    
    await this.startSimulators(configs);
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, testConfig.duration));
    
    // Generate test report
    const endStats = this.getStatistics();
    logger.info('Load test completed', { 
      duration: testConfig.duration,
      finalStats: endStats
    });
    
    // Stop all simulators
    await this.stopAllSimulators();
  }
  
  /**
   * Run lifecycle test
   */
  async runLifecycleTest(testConfig: LifecycleTestConfig): Promise<void> {
    logger.info('Starting lifecycle test', testConfig);
    
    for (let cycle = 1; cycle <= testConfig.cycles; cycle++) {
      logger.info(`Starting cycle ${cycle}/${testConfig.cycles}`);
      
      // Start devices
      await this.startSimulators([{
        type: 'button',
        count: Math.floor(testConfig.deviceCount / 3),
        config: { site: 'lifecycle-test', room: `cycle-${cycle}` }
      }, {
        type: 'watch',
        count: Math.floor(testConfig.deviceCount / 3),
        config: { site: 'lifecycle-test', room: `cycle-${cycle}` }
      }, {
        type: 'repeater',
        count: Math.ceil(testConfig.deviceCount / 3),
        config: { site: 'lifecycle-test', room: `cycle-${cycle}` }
      }]);
      
      // Wait for connect duration
      await new Promise(resolve => setTimeout(resolve, testConfig.connectDuration));
      
      // Stop devices
      await this.stopAllSimulators();
      
      // Wait for disconnect duration
      if (cycle < testConfig.cycles) {
        await new Promise(resolve => setTimeout(resolve, testConfig.disconnectDuration));
      }
    }
    
    logger.info('Lifecycle test completed');
  }
}

// CLI interface
const program = new Command();

program
  .name('multi-device-runner')
  .description('OBEDIO Multi-Device Simulator Runner')
  .version('1.0.0');

program
  .command('start')
  .description('Start multiple device simulators')
  .option('-b, --buttons <count>', 'Number of button devices', '5')
  .option('-w, --watches <count>', 'Number of watch devices', '3')
  .option('-r, --repeaters <count>', 'Number of repeater devices', '2')
  .option('-g, --generic <count>', 'Number of generic devices', '0')
  .option('-t, --template <name>', 'Template for generic devices', 'temperature_sensor')
  .option('-s, --site <name>', 'Site name', config.getDefaultSite())
  .option('--room <name>', 'Room name', config.getDefaultRoom())
  .action(async (options) => {
    const runner = new MultiDeviceRunner();
    
    const configs = [];
    
    if (parseInt(options.buttons) > 0) {
      configs.push({
        type: 'button' as const,
        count: parseInt(options.buttons),
        config: { site: options.site, room: options.room }
      });
    }
    
    if (parseInt(options.watches) > 0) {
      configs.push({
        type: 'watch' as const,
        count: parseInt(options.watches),
        config: { site: options.site, room: options.room }
      });
    }
    
    if (parseInt(options.repeaters) > 0) {
      configs.push({
        type: 'repeater' as const,
        count: parseInt(options.repeaters),
        config: { site: options.site, room: options.room }
      });
    }
    
    if (parseInt(options.generic) > 0) {
      configs.push({
        type: 'generic' as const,
        count: parseInt(options.generic),
        config: { site: options.site, room: options.room },
        template: options.template
      });
    }
    
    try {
      await runner.startSimulators(configs);
      
      console.log('✅ All simulators started successfully!');
      console.log('📊 Status:', runner.getStatistics());
      console.log('\nPress Ctrl+C to stop all simulators...');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping all simulators...');
        await runner.stopAllSimulators();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('\n🛑 Stopping all simulators...');
        await runner.stopAllSimulators();
        process.exit(0);
      });
      
      // Keep process alive
      process.stdin.resume();
      
    } catch (error) {
      console.error('❌ Failed to start simulators:', error);
      process.exit(1);
    }
  });

program
  .command('load-test')
  .description('Run load test with multiple devices')
  .option('-d, --duration <ms>', 'Test duration in milliseconds', '300000')
  .option('-r, --ramp-up <ms>', 'Ramp up time in milliseconds', '30000')
  .option('-m, --max-devices <count>', 'Maximum number of devices', '50')
  .option('-t, --types <types>', 'Device types (comma-separated)', 'button,watch,repeater')
  .action(async (options) => {
    const runner = new MultiDeviceRunner();
    
    const testConfig: LoadTestConfig = {
      duration: parseInt(options.duration),
      rampUpTime: parseInt(options.rampUp),
      maxDevices: parseInt(options.maxDevices),
      messageRate: 10,
      deviceTypes: options.types.split(',') as Array<'button' | 'watch' | 'repeater'>,
      scenario: 'basic'
    };
    
    try {
      await runner.runLoadTest(testConfig);
      console.log('✅ Load test completed successfully!');
    } catch (error) {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    }
  });

program
  .command('lifecycle-test')
  .description('Run device lifecycle test')
  .option('-c, --cycles <count>', 'Number of test cycles', '5')
  .option('-o, --connect-duration <ms>', 'Connection duration per cycle', '60000')
  .option('-f, --disconnect-duration <ms>', 'Disconnection duration per cycle', '10000')
  .option('-d, --device-count <count>', 'Number of devices per cycle', '10')
  .action(async (options) => {
    const runner = new MultiDeviceRunner();
    
    const testConfig: LifecycleTestConfig = {
      cycles: parseInt(options.cycles),
      connectDuration: parseInt(options.connectDuration),
      disconnectDuration: parseInt(options.disconnectDuration),
      deviceCount: parseInt(options.deviceCount),
      validateMessages: true
    };
    
    try {
      await runner.runLifecycleTest(testConfig);
      console.log('✅ Lifecycle test completed successfully!');
    } catch (error) {
      console.error('❌ Lifecycle test failed:', error);
      process.exit(1);
    }
  });

// Export for use as module
export { MultiDeviceRunner };

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}