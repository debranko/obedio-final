#!/usr/bin/env node
/**
 * Basic Usage Example
 * 
 * This script demonstrates how to start and use individual device simulators
 * for basic testing and development.
 */

import { ButtonSimulator } from '../dist/simulators/button-simulator.js';
import { WatchSimulator } from '../dist/simulators/watch-simulator.js';
import { RepeaterSimulator } from '../dist/simulators/repeater-simulator.js';
import { createDeviceLogger } from '../dist/utils/logger.js';

const logger = createDeviceLogger('basic-usage', 'example');

async function runBasicExample() {
  logger.info('🚀 Starting Basic Usage Example');
  
  try {
    // Create button simulator
    const button = new ButtonSimulator({
      deviceId: 'BTN-EXAMPLE-001',
      siteId: 'hotel-alpha',
      roomId: 'room-101',
      batteryLevel: 85,
      signalStrength: 95
    });
    
    // Create watch simulator
    const watch = new WatchSimulator({
      deviceId: 'WATCH-EXAMPLE-001',
      siteId: 'hotel-alpha',
      roomId: 'crew-quarters',
      batteryLevel: 78,
      signalStrength: 88,
      userId: 'user-123'
    });
    
    // Create repeater simulator
    const repeater = new RepeaterSimulator({
      deviceId: 'REP-EXAMPLE-001',
      siteId: 'hotel-alpha',
      roomId: 'corridor-1',
      signalStrength: 100,
      coverageArea: 50,
      maxConnections: 20
    });
    
    logger.info('📱 Starting devices...');
    
    // Start all devices
    await Promise.all([
      button.start(),
      watch.start(),
      repeater.start()
    ]);
    
    logger.info('✅ All devices started successfully');
    logger.info('📊 Device status:');
    console.log('  Button:', button.getStatus());
    console.log('  Watch:', watch.getStatus());
    console.log('  Repeater:', repeater.getStatus());
    
    // Run for 2 minutes
    logger.info('⏱️  Running simulation for 2 minutes...');
    await new Promise(resolve => setTimeout(resolve, 120000));
    
    // Stop all devices
    logger.info('🛑 Stopping devices...');
    await Promise.all([
      button.stop(),
      watch.stop(),
      repeater.stop()
    ]);
    
    logger.info('✅ Basic usage example completed successfully');
    
  } catch (error) {
    logger.error('❌ Error in basic usage example:', error);
    process.exit(1);
  }
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
runBasicExample().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});