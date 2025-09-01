#!/usr/bin/env node
/**
 * Multi-Device Load Testing Example
 * 
 * This script demonstrates how to run comprehensive load tests
 * with multiple device types and performance monitoring.
 */

import { MultiDeviceRunner } from '../dist/multi-device-runner.js';
import { PerformanceTester } from '../dist/scripts/performance-test.js';
import { MetricsCollector } from '../dist/utils/metrics-collector.js';
import { createDeviceLogger } from '../dist/utils/logger.js';

const logger = createDeviceLogger('load-test', 'example');

async function runLoadTestExample() {
  logger.info('🚀 Starting Multi-Device Load Test Example');
  
  const runner = new MultiDeviceRunner();
  const metrics = new MetricsCollector({
    collectionInterval: 2000, // Collect every 2 seconds during load test
    alertThresholds: {
      cpu: { warning: 60, critical: 80 },
      memory: { warning: 70, critical: 90 },
      networkConnections: { warning: 500, critical: 1000 },
      mqttErrors: { warning: 5, critical: 20 },
      deviceErrors: { warning: 3, critical: 10 }
    }
  });
  
  // Set up metrics monitoring
  metrics.on('alert', (alert) => {
    logger.warn(`⚠️  Performance Alert: ${alert.message}`, {
      type: alert.type,
      category: alert.category,
      value: alert.value,
      threshold: alert.threshold
    });
  });
  
  try {
    logger.info('📊 Starting metrics collection...');
    metrics.start();
    
    logger.info('🏗️  Setting up devices...');
    
    // Add various device types
    const devicePromises = [];
    
    // Add 10 button devices
    for (let i = 1; i <= 10; i++) {
      devicePromises.push(
        runner.addDevice('button', {
          deviceId: `BTN-LOAD-${i.toString().padStart(3, '0')}`,
          siteId: 'hotel-alpha',
          roomId: `room-${100 + i}`,
          batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
          signalStrength: Math.floor(Math.random() * 30) + 70 // 70-100%
        })
      );
    }
    
    // Add 5 watch devices
    for (let i = 1; i <= 5; i++) {
      devicePromises.push(
        runner.addDevice('watch', {
          deviceId: `WATCH-LOAD-${i.toString().padStart(3, '0')}`,
          siteId: 'hotel-alpha',
          roomId: 'crew-quarters',
          batteryLevel: Math.floor(Math.random() * 30) + 70,
          signalStrength: Math.floor(Math.random() * 25) + 75,
          userId: `user-${i}`
        })
      );
    }
    
    // Add 3 repeater devices
    for (let i = 1; i <= 3; i++) {
      devicePromises.push(
        runner.addDevice('repeater', {
          deviceId: `REP-LOAD-${i.toString().padStart(3, '0')}`,
          siteId: 'hotel-alpha',
          roomId: `corridor-${i}`,
          signalStrength: 100,
          coverageArea: 50,
          maxConnections: 25
        })
      );
    }
    
    await Promise.all(devicePromises);
    logger.info(`✅ Added ${devicePromises.length} devices`);
    
    logger.info('🚀 Starting all devices...');
    await runner.startAll();
    
    // Let devices stabilize
    logger.info('⏳ Letting devices stabilize for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    logger.info('📈 Running load test scenarios...');
    
    // Scenario 1: Basic Load Test
    logger.info('📊 Scenario 1: Basic Load Test (5 minutes)');
    const basicLoadConfig = {
      duration: 300000, // 5 minutes
      rampUpTime: 60000, // 1 minute
      maxDevices: 18, // All devices we added
      messageRate: 15,
      deviceTypes: ['button', 'watch', 'repeater'],
      scenario: 'basic'
    };
    
    await runner.runLoadTest(basicLoadConfig);
    
    // Wait between tests
    logger.info('⏸️  Waiting 1 minute between tests...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Scenario 2: Stress Test
    logger.info('📊 Scenario 2: Stress Test (3 minutes)');
    const stressConfig = {
      duration: 180000, // 3 minutes
      rampUpTime: 30000, // 30 seconds
      maxDevices: 18,
      messageRate: 30, // Higher message rate
      deviceTypes: ['button', 'watch', 'repeater'],
      scenario: 'stress'
    };
    
    await runner.runLoadTest(stressConfig);
    
    // Wait before lifecycle test
    logger.info('⏸️  Waiting 1 minute before lifecycle test...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Scenario 3: Lifecycle Test
    logger.info('📊 Scenario 3: Device Lifecycle Test');
    const lifecycleConfig = {
      cycles: 10,
      connectDuration: 45000, // 45 seconds
      disconnectDuration: 15000, // 15 seconds
      deviceCount: 18,
      validateMessages: true
    };
    
    await runner.runLifecycleTest(lifecycleConfig);
    
    logger.info('✅ All load test scenarios completed');
    
    // Generate final metrics report
    const summary = metrics.getSummary();
    logger.info('📊 Final Performance Summary:', summary);
    
    if (summary && summary.alertCounts.critical > 0) {
      logger.warn(`⚠️  ${summary.alertCounts.critical} critical alerts during testing`);
    } else if (summary && summary.alertCounts.warning > 0) {
      logger.warn(`ℹ️  ${summary.alertCounts.warning} warning alerts during testing`);
    } else {
      logger.info('✅ No performance alerts during testing');
    }
    
  } catch (error) {
    logger.error('❌ Error during load test:', error);
    throw error;
    
  } finally {
    logger.info('🧹 Cleaning up...');
    
    // Stop all devices
    try {
      await runner.stopAll();
      logger.info('✅ All devices stopped');
    } catch (error) {
      logger.error('❌ Error stopping devices:', error);
    }
    
    // Stop metrics collection
    metrics.stop();
    logger.info('✅ Metrics collection stopped');
    
    // Export final metrics
    try {
      await metrics.exportMetrics();
      logger.info('📄 Final metrics exported');
    } catch (error) {
      logger.error('❌ Error exporting metrics:', error);
    }
  }
  
  logger.info('🎉 Multi-device load test example completed');
}

// Handle graceful shutdown
let shutdownInProgress = false;

async function gracefulShutdown(signal) {
  if (shutdownInProgress) return;
  shutdownInProgress = true;
  
  logger.info(`🛑 Received ${signal}, shutting down gracefully...`);
  
  // Note: In a real implementation, you'd want to keep references
  // to the runner and metrics instances to properly clean them up here
  
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Run the example
runLoadTestExample().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});