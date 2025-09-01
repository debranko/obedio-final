import { BaseDeviceSimulator } from '@/core/base-device-simulator.js';
import { DeviceConfig, DeviceEvent, MqttMessage } from '@/types/index.js';
import { config } from '@/config/index.js';

interface CustomTopicPattern {
  name: string;
  pattern: string; // e.g., "event/{eventType}" or "data/{sensor}"
  qos: 0 | 1 | 2;
  retain?: boolean;
}

interface EventTrigger {
  type: 'interval' | 'random' | 'conditional' | 'manual';
  interval?: number; // for interval type
  minInterval?: number; // for random type
  maxInterval?: number; // for random type
  probability?: number; // for random type (0-1)
  condition?: string; // for conditional type (JS expression)
  enabled: boolean;
}

interface CustomEvent {
  name: string;
  topic: string;
  payloadTemplate: any; // JSON template with placeholders
  trigger: EventTrigger;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

interface DataGenerator {
  type: 'random' | 'sequence' | 'formula' | 'static';
  min?: number;
  max?: number;
  step?: number;
  values?: any[];
  formula?: string; // JS expression
  staticValue?: any;
}

interface CustomSensor {
  name: string;
  dataType: 'number' | 'string' | 'boolean' | 'object' | 'array';
  generator: DataGenerator;
  unit?: string;
  precision?: number;
}

interface GenericDeviceTemplate {
  deviceType: string;
  name: string;
  description?: string;
  version: string;
  topics: CustomTopicPattern[];
  events: CustomEvent[];
  sensors: CustomSensor[];
  customCommands: string[];
  behaviorSettings: {
    statusUpdateInterval?: number;
    heartbeatInterval?: number;
    enableRandomEvents: boolean;
    simulateNetworkIssues: boolean;
    batteryDrainEnabled: boolean;
  };
}

export class GenericDeviceSimulator extends BaseDeviceSimulator {
  private template: GenericDeviceTemplate;
  private sensorData: Map<string, any> = new Map();
  private customEventTimers: Map<string, NodeJS.Timeout> = new Map();
  private customTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventCounters: Map<string, number> = new Map();
  
  constructor(deviceConfig: DeviceConfig, template: GenericDeviceTemplate) {
    super(deviceConfig);
    this.template = template;
    
    // Initialize sensor data
    this.initializeSensorData();
    
    // Initialize event counters
    this.template.events.forEach(event => {
      this.eventCounters.set(event.name, 0);
    });
    
    this.logger.info('Generic device simulator created', {
      deviceId: deviceConfig.deviceId,
      deviceType: this.template.deviceType,
      sensorsCount: this.template.sensors.length,
      eventsCount: this.template.events.length
    });
  }
  
  protected async onDeviceStart(): Promise<void> {
    this.logger.info('Starting generic device simulator');
    
    // Subscribe to command topics
    await this.subscribeToTopic(this.getDeviceTopic('cmd/+'));
    
    // Subscribe to custom command topics
    for (const command of this.template.customCommands) {
      await this.subscribeToTopic(this.getDeviceTopic(`cmd/${command}`));
    }
    
    // Start custom events
    this.startCustomEvents();
    
    // Start sensor data updates
    this.startSensorUpdates();
    
    this.logger.info('Generic device simulator started');
  }
  
  protected async onDeviceStop(): Promise<void> {
    this.logger.info('Stopping generic device simulator');
    
    // Clear all custom timers
    this.clearCustomTimers();
    
    this.logger.info('Generic device simulator stopped');
  }
  
  protected onCommandReceived(command: string, data: any): void {
    this.logger.info(`Generic device received command: ${command}`, data);
    
    // Handle standard commands
    switch (command) {
      case 'get_sensor_data':
        this.sendSensorData(data.sensor);
        break;
      case 'trigger_event':
        this.triggerCustomEvent(data.eventName, data.data);
        break;
      case 'update_sensor':
        this.updateSensorValue(data.sensor, data.value);
        break;
      case 'enable_event':
        this.enableEvent(data.eventName, data.enabled);
        break;
      case 'get_template':
        this.sendTemplate();
        break;
      default:
        // Check if it's a custom command
        if (this.template.customCommands.includes(command)) {
          this.handleCustomCommand(command, data);
        } else {
          this.logger.warn(`Unknown command received: ${command}`);
        }
    }
  }
  
  /**
   * Initialize sensor data based on template
   */
  private initializeSensorData(): void {
    this.template.sensors.forEach(sensor => {
      this.sensorData.set(sensor.name, this.generateSensorValue(sensor));
    });
  }
  
  /**
   * Start custom events based on their triggers
   */
  private startCustomEvents(): void {
    this.template.events.forEach(event => {
      if (!event.trigger.enabled) return;
      
      switch (event.trigger.type) {
        case 'interval':
          this.startIntervalEvent(event);
          break;
        case 'random':
          this.startRandomEvent(event);
          break;
        case 'conditional':
          this.startConditionalEvent(event);
          break;
        // 'manual' events are triggered externally
      }
    });
  }
  
  /**
   * Start sensor data updates
   */
  private startSensorUpdates(): void {
    const updateInterval = this.template.behaviorSettings.statusUpdateInterval || 
                          config.getSimulatorConfig().statusUpdateInterval;
    
    const timer = setInterval(() => {
      if (this.isRunning && this.isConnected) {
        this.updateAllSensorData();
        this.publishSensorData().catch(error => {
          this.logger.error('Failed to publish sensor data', error);
        });
      }
    }, updateInterval);
    
    this.customTimers.set('sensorUpdates', timer);
  }
  
  /**
   * Start interval-based event
   */
  private startIntervalEvent(event: CustomEvent): void {
    if (!event.trigger.interval) return;
    
    const timer = setInterval(() => {
      if (this.isRunning && this.isConnected) {
        this.executeCustomEvent(event).catch(error => {
          this.logger.error(`Failed to execute interval event ${event.name}`, error);
        });
      }
    }, event.trigger.interval);
    
    this.customEventTimers.set(event.name, timer);
    this.logger.debug(`Started interval event: ${event.name} (${event.trigger.interval}ms)`);
  }
  
  /**
   * Start random event
   */
  private startRandomEvent(event: CustomEvent): void {
    const scheduleNext = () => {
      const minInterval = event.trigger.minInterval || 30000;
      const maxInterval = event.trigger.maxInterval || 300000;
      const interval = Math.random() * (maxInterval - minInterval) + minInterval;
      
      const timer = setTimeout(() => {
        if (this.isRunning && this.isConnected) {
          const probability = event.trigger.probability || 0.5;
          if (Math.random() < probability) {
            this.executeCustomEvent(event).catch(error => {
              this.logger.error(`Failed to execute random event ${event.name}`, error);
            });
          }
          scheduleNext(); // Schedule next occurrence
        }
      }, interval);
      
      this.customEventTimers.set(event.name, timer);
    };
    
    scheduleNext();
    this.logger.debug(`Started random event: ${event.name}`);
  }
  
  /**
   * Start conditional event
   */
  private startConditionalEvent(event: CustomEvent): void {
    // Check condition every 10 seconds
    const timer = setInterval(() => {
      if (this.isRunning && this.isConnected && event.trigger.condition) {
        try {
          const context = this.getEvaluationContext();
          const shouldTrigger = this.evaluateCondition(event.trigger.condition, context);
          
          if (shouldTrigger) {
            this.executeCustomEvent(event).catch(error => {
              this.logger.error(`Failed to execute conditional event ${event.name}`, error);
            });
          }
        } catch (error) {
          this.logger.error(`Error evaluating condition for event ${event.name}`, error);
        }
      }
    }, 10000);
    
    this.customEventTimers.set(event.name, timer);
    this.logger.debug(`Started conditional event: ${event.name}`);
  }
  
  /**
   * Execute a custom event
   */
  private async executeCustomEvent(event: CustomEvent): Promise<void> {
    const count = this.eventCounters.get(event.name) || 0;
    this.eventCounters.set(event.name, count + 1);
    
    // Generate payload from template
    const payload = this.generatePayloadFromTemplate(event.payloadTemplate);
    
    // Add standard fields
    payload.timestamp = new Date().toISOString();
    payload.device_id = this.deviceConfig.deviceId;
    payload.event_name = event.name;
    payload.sequence_number = count + 1;
    
    // Determine QoS from topic configuration
    const topicConfig = this.template.topics.find(t => t.name === event.topic);
    const qos = topicConfig?.qos || 1;
    const retain = topicConfig?.retain || false;
    
    // Resolve topic pattern
    const resolvedTopic = this.resolveTopicPattern(event.topic);
    
    await this.publishMessage(resolvedTopic, payload, qos);
    
    this.logger.event('CUSTOM_EVENT', {
      eventName: event.name,
      topic: resolvedTopic,
      sequenceNumber: count + 1,
      priority: event.priority
    });
    
    this.emit('customEvent', {
      type: event.name,
      timestamp: new Date(),
      data: payload,
      priority: event.priority || 'normal'
    });
  }
  
  /**
   * Update all sensor data
   */
  private updateAllSensorData(): void {
    this.template.sensors.forEach(sensor => {
      const newValue = this.generateSensorValue(sensor);
      this.sensorData.set(sensor.name, newValue);
    });
  }
  
  /**
   * Generate value for a sensor based on its configuration
   */
  private generateSensorValue(sensor: CustomSensor): any {
    const generator = sensor.generator;
    
    switch (generator.type) {
      case 'random':
        return this.generateRandomValue(sensor, generator);
      
      case 'sequence':
        return this.generateSequenceValue(sensor, generator);
      
      case 'formula':
        return this.generateFormulaValue(sensor, generator);
      
      case 'static':
        return generator.staticValue;
      
      default:
        return null;
    }
  }
  
  /**
   * Generate random value
   */
  private generateRandomValue(sensor: CustomSensor, generator: DataGenerator): any {
    switch (sensor.dataType) {
      case 'number':
        const min = generator.min || 0;
        const max = generator.max || 100;
        const value = Math.random() * (max - min) + min;
        return sensor.precision ? Number(value.toFixed(sensor.precision)) : Math.round(value);
      
      case 'boolean':
        return Math.random() > 0.5;
      
      case 'string':
        if (generator.values && generator.values.length > 0) {
          return generator.values[Math.floor(Math.random() * generator.values.length)];
        }
        return `value-${Math.random().toString(36).substr(2, 8)}`;
      
      case 'array':
        return generator.values || [];
      
      case 'object':
        return generator.values || {};
      
      default:
        return null;
    }
  }
  
  /**
   * Generate sequence value
   */
  private generateSequenceValue(sensor: CustomSensor, generator: DataGenerator): any {
    // Simple sequence implementation - can be enhanced
    const current = this.sensorData.get(sensor.name) || generator.min || 0;
    const step = generator.step || 1;
    const max = generator.max || 100;
    const min = generator.min || 0;
    
    let next = current + step;
    if (next > max) next = min;
    
    return sensor.precision ? Number(next.toFixed(sensor.precision)) : next;
  }
  
  /**
   * Generate formula-based value
   */
  private generateFormulaValue(sensor: CustomSensor, generator: DataGenerator): any {
    if (!generator.formula) return 0;
    
    try {
      const context = this.getEvaluationContext();
      return this.evaluateFormula(generator.formula, context);
    } catch (error) {
      this.logger.error(`Error evaluating formula for sensor ${sensor.name}`, error);
      return 0;
    }
  }
  
  /**
   * Publish sensor data
   */
  private async publishSensorData(): Promise<void> {
    const sensorPayload = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      device_type: this.template.deviceType,
      sensors: Object.fromEntries(this.sensorData.entries()),
      battery: this.status.battery,
      signal: this.status.signal
    };
    
    await this.publishMessage(this.getDeviceTopic('sensors'), sensorPayload);
    
    // Also publish individual sensor topics if configured
    for (const [sensorName, value] of this.sensorData.entries()) {
      const topic = this.getDeviceTopic(`sensor/${sensorName}`);
      const sensorPayload = {
        timestamp: new Date().toISOString(),
        device_id: this.deviceConfig.deviceId,
        sensor: sensorName,
        value,
        unit: this.template.sensors.find(s => s.name === sensorName)?.unit
      };
      
      await this.publishMessage(topic, sensorPayload);
    }
  }
  
  /**
   * Generate payload from template
   */
  private generatePayloadFromTemplate(template: any): any {
    if (typeof template !== 'object' || template === null) {
      return template;
    }
    
    if (Array.isArray(template)) {
      return template.map(item => this.generatePayloadFromTemplate(item));
    }
    
    const result: any = {};
    
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // Handle template variables
        const expression = value.slice(2, -1);
        result[key] = this.evaluateExpression(expression);
      } else if (typeof value === 'object') {
        result[key] = this.generatePayloadFromTemplate(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Resolve topic pattern with variables
   */
  private resolveTopicPattern(pattern: string): string {
    let resolved = pattern;
    
    // Replace common variables
    resolved = resolved.replace('{deviceId}', this.deviceConfig.deviceId);
    resolved = resolved.replace('{site}', this.deviceConfig.site);
    resolved = resolved.replace('{room}', this.deviceConfig.room);
    resolved = resolved.replace('{deviceType}', this.deviceConfig.deviceType);
    
    // If pattern doesn't start with full topic path, prepend device topic
    if (!resolved.startsWith('obedio/')) {
      resolved = this.getDeviceTopic(resolved);
    }
    
    return resolved;
  }
  
  /**
   * Get evaluation context for formulas and conditions
   */
  private getEvaluationContext(): any {
    return {
      deviceId: this.deviceConfig.deviceId,
      battery: this.status.battery,
      signal: this.status.signal,
      temperature: this.status.temperature,
      humidity: this.status.humidity,
      uptime: this.getMetrics().uptime,
      timestamp: Date.now(),
      sensors: Object.fromEntries(this.sensorData.entries()),
      Math,
      Date,
      random: Math.random,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round
    };
  }
  
  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // Simple expression evaluator - in production, use a proper expression parser
      const func = new Function(...Object.keys(context), `return ${condition}`);
      return Boolean(func(...Object.values(context)));
    } catch (error) {
      this.logger.error('Error evaluating condition', error, { condition });
      return false;
    }
  }
  
  /**
   * Evaluate a formula expression
   */
  private evaluateFormula(formula: string, context: any): any {
    try {
      const func = new Function(...Object.keys(context), `return ${formula}`);
      return func(...Object.values(context));
    } catch (error) {
      this.logger.error('Error evaluating formula', error, { formula });
      return 0;
    }
  }
  
  /**
   * Evaluate a template expression
   */
  private evaluateExpression(expression: string): any {
    const context = this.getEvaluationContext();
    
    // Handle simple variable references
    if (context.hasOwnProperty(expression)) {
      return context[expression];
    }
    
    // Handle dot notation (e.g., sensors.temperature)
    if (expression.includes('.')) {
      const parts = expression.split('.');
      let result = context;
      for (const part of parts) {
        if (result && typeof result === 'object' && result.hasOwnProperty(part)) {
          result = result[part];
        } else {
          return null;
        }
      }
      return result;
    }
    
    // Handle function calls and expressions
    try {
      const func = new Function(...Object.keys(context), `return ${expression}`);
      return func(...Object.values(context));
    } catch (error) {
      this.logger.warn('Error evaluating expression', { expression, error: (error as Error).message });
      return expression; // Return original if evaluation fails
    }
  }
  
  /**
   * Send current sensor data
   */
  private async sendSensorData(sensorName?: string): Promise<void> {
    if (sensorName) {
      const value = this.sensorData.get(sensorName);
      if (value !== undefined) {
        const payload = {
          timestamp: new Date().toISOString(),
          device_id: this.deviceConfig.deviceId,
          sensor: sensorName,
          value
        };
        await this.publishMessage(this.getDeviceTopic(`sensor/${sensorName}/response`), payload);
      }
    } else {
      await this.publishSensorData();
    }
  }
  
  /**
   * Trigger a custom event manually
   */
  public async triggerCustomEvent(eventName: string, data?: any): Promise<void> {
    const event = this.template.events.find(e => e.name === eventName);
    if (event) {
      // Temporarily override payload template with provided data
      if (data) {
        const originalTemplate = event.payloadTemplate;
        event.payloadTemplate = { ...originalTemplate, ...data };
        await this.executeCustomEvent(event);
        event.payloadTemplate = originalTemplate;
      } else {
        await this.executeCustomEvent(event);
      }
    } else {
      this.logger.warn(`Unknown event: ${eventName}`);
    }
  }
  
  /**
   * Update sensor value
   */
  public updateSensorValue(sensorName: string, value: any): void {
    if (this.sensorData.has(sensorName)) {
      this.sensorData.set(sensorName, value);
      this.logger.info(`Sensor ${sensorName} updated to ${value}`);
    } else {
      this.logger.warn(`Unknown sensor: ${sensorName}`);
    }
  }
  
  /**
   * Enable/disable an event
   */
  public enableEvent(eventName: string, enabled: boolean): void {
    const event = this.template.events.find(e => e.name === eventName);
    if (event) {
      event.trigger.enabled = enabled;
      
      if (enabled) {
        // Restart the event
        this.clearEventTimer(eventName);
        if (event.trigger.type === 'interval') {
          this.startIntervalEvent(event);
        } else if (event.trigger.type === 'random') {
          this.startRandomEvent(event);
        } else if (event.trigger.type === 'conditional') {
          this.startConditionalEvent(event);
        }
      } else {
        // Stop the event
        this.clearEventTimer(eventName);
      }
      
      this.logger.info(`Event ${eventName} ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      this.logger.warn(`Unknown event: ${eventName}`);
    }
  }
  
  /**
   * Send device template
   */
  private async sendTemplate(): Promise<void> {
    const templateInfo = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      template: {
        deviceType: this.template.deviceType,
        name: this.template.name,
        version: this.template.version,
        sensors: this.template.sensors.map(s => ({
          name: s.name,
          dataType: s.dataType,
          unit: s.unit
        })),
        events: this.template.events.map(e => ({
          name: e.name,
          topic: e.topic,
          enabled: e.trigger.enabled
        })),
        customCommands: this.template.customCommands
      }
    };
    
    await this.publishMessage(this.getDeviceTopic('template'), templateInfo);
  }
  
  /**
   * Handle custom command
   */
  private handleCustomCommand(command: string, data: any): void {
    this.logger.info(`Handling custom command: ${command}`, data);
    
    // Emit event for custom command handling
    this.emit('customCommand', {
      command,
      data,
      timestamp: new Date()
    });
    
    // You can override this method in subclasses for specific command handling
  }
  
  /**
   * Clear event timer
   */
  private clearEventTimer(eventName: string): void {
    const timer = this.customEventTimers.get(eventName);
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
      this.customEventTimers.delete(eventName);
    }
  }
  
  /**
   * Clear all custom timers
   */
  private clearCustomTimers(): void {
    // Clear event timers
    this.customEventTimers.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.customEventTimers.clear();
    
    // Clear other custom timers
    this.customTimers.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.customTimers.clear();
  }
  
  /**
   * Get device statistics
   */
  public getDeviceStats() {
    return {
      ...this.getMetrics(),
      template: {
        deviceType: this.template.deviceType,
        name: this.template.name,
        version: this.template.version
      },
      sensorData: Object.fromEntries(this.sensorData.entries()),
      eventCounters: Object.fromEntries(this.eventCounters.entries()),
      activeEvents: this.template.events.filter(e => e.trigger.enabled).length,
      deviceType: 'generic',
      status: this.getStatus()
    };
  }
}

// Template examples for common device types
export const TEMPLATE_EXAMPLES = {
  temperature_sensor: {
    deviceType: 'temperature_sensor',
    name: 'Temperature Sensor',
    description: 'Simple temperature monitoring device',
    version: '1.0.0',
    topics: [
      { name: 'temperature', pattern: 'data/temperature', qos: 1 as const },
      { name: 'alert', pattern: 'event/temperature_alert', qos: 2 as const }
    ],
    events: [
      {
        name: 'temperature_reading',
        topic: 'data/temperature',
        payloadTemplate: {
          temperature: '${sensors.temperature}',
          unit: 'celsius',
          location: '${room}'
        },
        trigger: { type: 'interval' as const, interval: 30000, enabled: true }
      },
      {
        name: 'high_temperature_alert',
        topic: 'event/temperature_alert',
        payloadTemplate: {
          alertType: 'high_temperature',
          temperature: '${sensors.temperature}',
          threshold: 35,
          severity: 'warning'
        },
        trigger: {
          type: 'conditional' as const,
          condition: 'sensors.temperature > 35',
          enabled: true
        },
        priority: 'high' as const
      }
    ],
    sensors: [
      {
        name: 'temperature',
        dataType: 'number' as const,
        generator: { type: 'random' as const, min: 18, max: 40 },
        unit: '°C',
        precision: 1
      }
    ],
    customCommands: ['calibrate', 'set_threshold'],
    behaviorSettings: {
      statusUpdateInterval: 60000,
      heartbeatInterval: 30000,
      enableRandomEvents: true,
      simulateNetworkIssues: false,
      batteryDrainEnabled: true
    }
  },
  
  motion_detector: {
    deviceType: 'motion_detector',
    name: 'Motion Detector',
    description: 'PIR motion detection sensor',
    version: '1.0.0',
    topics: [
      { name: 'motion', pattern: 'event/motion_detected', qos: 2 as const },
      { name: 'status', pattern: 'status', qos: 1 as const }
    ],
    events: [
      {
        name: 'motion_detected',
        topic: 'event/motion_detected',
        payloadTemplate: {
          motionDetected: true,
          confidence: '${floor(random() * 40 + 60)}',
          duration: '${floor(random() * 5000 + 1000)}'
        },
        trigger: {
          type: 'random' as const,
          minInterval: 30000,
          maxInterval: 300000,
          probability: 0.3,
          enabled: true
        },
        priority: 'normal' as const
      }
    ],
    sensors: [
      {
        name: 'motion',
        dataType: 'boolean' as const,
        generator: { type: 'random' as const }
      },
      {
        name: 'sensitivity',
        dataType: 'number' as const,
        generator: { type: 'static' as const, staticValue: 75 },
        unit: '%'
      }
    ],
    customCommands: ['arm', 'disarm', 'set_sensitivity'],
    behaviorSettings: {
      statusUpdateInterval: 120000,
      heartbeatInterval: 60000,
      enableRandomEvents: true,
      simulateNetworkIssues: false,
      batteryDrainEnabled: true
    }
  }
};

// Standalone generic device simulator runner
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runGenericSimulator() {
    const templateName = process.argv[5] || 'temperature_sensor';
    const template = TEMPLATE_EXAMPLES[templateName as keyof typeof TEMPLATE_EXAMPLES];
    
    if (!template) {
      console.error(`Unknown template: ${templateName}`);
      console.log('Available templates:', Object.keys(TEMPLATE_EXAMPLES).join(', '));
      process.exit(1);
    }
    
    const deviceConfig: DeviceConfig = {
      deviceId: process.argv[2] || `${template.deviceType}-${Math.random().toString(36).substr(2, 9)}`,
      site: process.argv[3] || config.getDefaultSite(),
      room: process.argv[4] || config.getDefaultRoom(),
      deviceType: 'generic',
      name: `${template.name} ${process.argv[2] || 'Simulator'}`
    };
    
    const simulator = new GenericDeviceSimulator(deviceConfig, template);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down generic simulator...');
      await simulator.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down generic simulator...');
      await simulator.stop();
      process.exit(0);
    });
    
    try {
      await simulator.start();
      console.log(`Generic simulator started: ${deviceConfig.deviceId} (${template.name})`);
      
      // Keep the process running
      process.stdin.resume();
    } catch (error) {
      console.error('Failed to start generic simulator:', error);
      process.exit(1);
    }
  }
  
  runGenericSimulator().catch(console.error);
}