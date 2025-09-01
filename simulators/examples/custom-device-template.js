#!/usr/bin/env node
/**
 * Custom Device Template Example
 * 
 * This script demonstrates how to create custom device templates
 * using the GenericDeviceSimulator with realistic IoT scenarios.
 */

import { GenericDeviceSimulator } from '../dist/simulators/generic-device-simulator.js';
import { createDeviceLogger } from '../dist/utils/logger.js';

const logger = createDeviceLogger('custom-template', 'example');

// Smart Thermostat Template
const thermostatTemplate = {
  name: 'Smart Thermostat',
  type: 'thermostat',
  sensors: [
    {
      name: 'temperature',
      type: 'float',
      range: { min: 16, max: 30 },
      unit: '°C',
      precision: 1
    },
    {
      name: 'humidity',
      type: 'float',
      range: { min: 30, max: 70 },
      unit: '%',
      precision: 0
    },
    {
      name: 'targetTemp',
      type: 'float',
      range: { min: 20, max: 25 },
      unit: '°C',
      precision: 1
    }
  ],
  events: [
    {
      name: 'sensor_reading',
      interval: 60000, // Every minute
      payload: {
        temperature: '{{sensors.temperature}}',
        humidity: '{{sensors.humidity}}',
        targetTemp: '{{sensors.targetTemp}}',
        heating: '{{sensors.temperature < sensors.targetTemp}}',
        timestamp: '{{timestamp}}'
      }
    },
    {
      name: 'temperature_alert',
      condition: 'sensors.temperature > 28',
      payload: {
        alert: 'High temperature detected',
        value: '{{sensors.temperature}}',
        severity: 'warning'
      }
    }
  ],
  commands: [
    {
      name: 'set_temperature',
      parameters: ['target_temp'],
      response: {
        status: 'ok',
        target: '{{parameters.target_temp}}',
        current: '{{sensors.temperature}}'
      }
    },
    {
      name: 'get_status',
      parameters: [],
      response: {
        temperature: '{{sensors.temperature}}',
        humidity: '{{sensors.humidity}}',
        target: '{{sensors.targetTemp}}',
        heating: '{{sensors.temperature < sensors.targetTemp}}'
      }
    }
  ]
};

// Smart Lock Template
const smartLockTemplate = {
  name: 'Smart Door Lock',
  type: 'lock',
  sensors: [
    {
      name: 'locked',
      type: 'boolean',
      default: true
    },
    {
      name: 'batteryLevel',
      type: 'integer',
      range: { min: 0, max: 100 },
      unit: '%'
    },
    {
      name: 'accessAttempts',
      type: 'integer',
      range: { min: 0, max: 5 },
      default: 0
    }
  ],
  events: [
    {
      name: 'status_update',
      interval: 300000, // Every 5 minutes
      payload: {
        locked: '{{sensors.locked}}',
        battery: '{{sensors.batteryLevel}}',
        timestamp: '{{timestamp}}'
      }
    },
    {
      name: 'access_attempt',
      interval: 1800000, // Every 30 minutes (random access)
      condition: 'Math.random() < 0.3', // 30% chance
      payload: {
        method: 'keypad',
        success: '{{Math.random() > 0.1}}', // 90% success rate
        timestamp: '{{timestamp}}'
      }
    },
    {
      name: 'low_battery_alert',
      condition: 'sensors.batteryLevel < 20',
      payload: {
        alert: 'Low battery warning',
        level: '{{sensors.batteryLevel}}',
        severity: 'warning'
      }
    }
  ],
  commands: [
    {
      name: 'lock',
      parameters: [],
      response: {
        status: 'locked',
        timestamp: '{{timestamp}}'
      }
    },
    {
      name: 'unlock',
      parameters: ['access_code'],
      response: {
        status: 'unlocked',
        authorized: '{{parameters.access_code === "1234"}}',
        timestamp: '{{timestamp}}'
      }
    }
  ]
};

// Environmental Sensor Template
const environmentalSensorTemplate = {
  name: 'Environmental Monitor',
  type: 'environmental',
  sensors: [
    {
      name: 'temperature',
      type: 'float',
      range: { min: -10, max: 50 },
      unit: '°C',
      precision: 2
    },
    {
      name: 'humidity',
      type: 'float',
      range: { min: 0, max: 100 },
      unit: '%',
      precision: 1
    },
    {
      name: 'pressure',
      type: 'float',
      range: { min: 950, max: 1050 },
      unit: 'hPa',
      precision: 1
    },
    {
      name: 'co2',
      type: 'integer',
      range: { min: 300, max: 2000 },
      unit: 'ppm'
    },
    {
      name: 'lightLevel',
      type: 'integer',
      range: { min: 0, max: 100000 },
      unit: 'lux'
    }
  ],
  events: [
    {
      name: 'environmental_reading',
      interval: 30000, // Every 30 seconds
      payload: {
        temperature: '{{sensors.temperature}}',
        humidity: '{{sensors.humidity}}',
        pressure: '{{sensors.pressure}}',
        co2: '{{sensors.co2}}',
        light: '{{sensors.lightLevel}}',
        timestamp: '{{timestamp}}'
      }
    },
    {
      name: 'air_quality_alert',
      condition: 'sensors.co2 > 1500',
      payload: {
        alert: 'Poor air quality detected',
        co2Level: '{{sensors.co2}}',
        severity: 'critical'
      }
    },
    {
      name: 'comfort_index',
      interval: 120000, // Every 2 minutes
      payload: {
        comfort: '{{(sensors.temperature > 20 && sensors.temperature < 26 && sensors.humidity > 40 && sensors.humidity < 60) ? "comfortable" : "uncomfortable"}}',
        temperature: '{{sensors.temperature}}',
        humidity: '{{sensors.humidity}}'
      }
    }
  ]
};

async function runCustomTemplateExample() {
  logger.info('🚀 Starting Custom Device Template Example');
  
  const devices = [];
  
  try {
    logger.info('🌡️  Creating smart thermostat...');
    const thermostat = new GenericDeviceSimulator({
      deviceId: 'THERMO-001',
      siteId: 'hotel-alpha',
      roomId: 'lobby',
      template: thermostatTemplate,
      batteryLevel: 100, // Mains powered
      signalStrength: 95
    });
    devices.push(thermostat);
    
    logger.info('🔒 Creating smart lock...');
    const smartLock = new GenericDeviceSimulator({
      deviceId: 'LOCK-001',
      siteId: 'hotel-alpha',
      roomId: 'room-201',
      template: smartLockTemplate,
      batteryLevel: 65,
      signalStrength: 88
    });
    devices.push(smartLock);
    
    logger.info('🌍 Creating environmental sensor...');
    const envSensor = new GenericDeviceSimulator({
      deviceId: 'ENV-001',
      siteId: 'hotel-alpha',
      roomId: 'conference-room',
      template: environmentalSensorTemplate,
      batteryLevel: 75,
      signalStrength: 92
    });
    devices.push(envSensor);
    
    logger.info('🚀 Starting all custom devices...');
    await Promise.all(devices.map(device => device.start()));
    
    logger.info('✅ All devices started successfully');
    logger.info('📊 Device status:');
    devices.forEach(device => {
      console.log(`  ${device.getStatus().deviceId}:`, device.getStatus());
    });
    
    // Demonstrate command sending
    logger.info('📡 Demonstrating device commands...');
    
    // Set thermostat temperature
    logger.info('🌡️  Setting thermostat to 22°C...');
    await thermostat.handleCommand({
      deviceId: 'THERMO-001',
      command: 'set_temperature',
      parameters: { target_temp: 22 },
      timestamp: new Date()
    });
    
    // Check lock status
    logger.info('🔒 Checking lock status...');
    await smartLock.handleCommand({
      deviceId: 'LOCK-001',
      command: 'get_status',
      parameters: {},
      timestamp: new Date()
    });
    
    // Run simulation for 3 minutes
    logger.info('⏱️  Running custom device simulation for 3 minutes...');
    await new Promise(resolve => setTimeout(resolve, 180000));
    
    logger.info('📊 Final device status:');
    devices.forEach(device => {
      const status = device.getStatus();
      console.log(`  ${status.deviceId}:`, {
        isActive: status.isActive,
        batteryLevel: status.batteryLevel,
        signalStrength: status.signalStrength,
        messagesSent: status.messagesSent || 0
      });
    });
    
  } catch (error) {
    logger.error('❌ Error in custom template example:', error);
    throw error;
    
  } finally {
    logger.info('🛑 Stopping all devices...');
    await Promise.all(devices.map(device => device.stop()));
    logger.info('✅ All devices stopped');
  }
  
  logger.info('🎉 Custom device template example completed successfully');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the example
runCustomTemplateExample().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});