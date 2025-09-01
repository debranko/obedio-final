import { EventEmitter } from 'events';
import { createDeviceLogger } from './logger.js';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

const logger = createDeviceLogger('metrics-collector', 'system');

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    heap: NodeJS.MemoryUsage;
  };
  network: {
    connectionsActive: number;
    bytesReceived: number;
    bytesSent: number;
  };
  mqtt: {
    messagesReceived: number;
    messagesSent: number;
    connectionsActive: number;
    errorsCount: number;
  };
  devices: {
    active: number;
    connected: number;
    disconnected: number;
    errors: number;
  };
}

export interface PerformanceAlert {
  type: 'warning' | 'critical';
  category: 'cpu' | 'memory' | 'network' | 'mqtt' | 'devices';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface MetricsConfig {
  collectionInterval: number; // milliseconds
  retentionPeriod: number; // milliseconds
  alertThresholds: {
    cpu: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    networkConnections: { warning: number; critical: number };
    mqttErrors: { warning: number; critical: number };
    deviceErrors: { warning: number; critical: number };
  };
  exportInterval: number; // milliseconds
  exportPath: string;
}

const DEFAULT_CONFIG: MetricsConfig = {
  collectionInterval: 5000, // 5 seconds
  retentionPeriod: 3600000, // 1 hour
  alertThresholds: {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    networkConnections: { warning: 1000, critical: 2000 },
    mqttErrors: { warning: 10, critical: 50 },
    deviceErrors: { warning: 5, critical: 20 }
  },
  exportInterval: 60000, // 1 minute
  exportPath: 'logs/metrics'
};

export class MetricsCollector extends EventEmitter {
  private config: MetricsConfig;
  private metrics: SystemMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private collecting = false;
  private collectionTimer?: NodeJS.Timeout;
  private exportTimer?: NodeJS.Timeout;
  
  // Counters for MQTT and device metrics
  private mqttStats = {
    messagesReceived: 0,
    messagesSent: 0,
    connectionsActive: 0,
    errorsCount: 0
  };
  
  private deviceStats = {
    active: 0,
    connected: 0,
    disconnected: 0,
    errors: 0
  };
  
  private networkStats = {
    connectionsActive: 0,
    bytesReceived: 0,
    bytesSent: 0
  };
  
  // Previous CPU measurements for usage calculation
  private previousCpuUsage = process.cpuUsage();
  private previousTime = Date.now();
  
  constructor(config: Partial<MetricsConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Start collecting metrics
   */
  start(): void {
    if (this.collecting) {
      logger.warn('Metrics collection already started');
      return;
    }
    
    this.collecting = true;
    
    logger.info('Starting metrics collection', {
      interval: this.config.collectionInterval,
      retention: this.config.retentionPeriod
    });
    
    // Start collection timer
    this.collectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);
    
    // Start export timer
    this.exportTimer = setInterval(() => {
      this.exportMetrics();
    }, this.config.exportInterval);
    
    // Collect initial metrics
    this.collectMetrics();
    
    this.emit('started');
  }
  
  /**
   * Stop collecting metrics
   */
  stop(): void {
    if (!this.collecting) {
      return;
    }
    
    this.collecting = false;
    
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }
    
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
    }
    
    logger.info('Stopped metrics collection');
    this.emit('stopped');
  }
  
  /**
   * Collect current system metrics
   */
  private collectMetrics(): void {
    try {
      const now = Date.now();
      const currentCpuUsage = process.cpuUsage(this.previousCpuUsage);
      const timeDiff = now - this.previousTime;
      
      // Calculate CPU usage percentage
      const cpuUsagePercent = ((currentCpuUsage.user + currentCpuUsage.system) / (timeDiff * 1000)) * 100;
      
      // Memory information
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercent = (usedMemory / totalMemory) * 100;
      
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: Math.min(cpuUsagePercent, 100),
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        },
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usagePercent: memoryPercent,
          heap: memoryUsage
        },
        network: { ...this.networkStats },
        mqtt: { ...this.mqttStats },
        devices: { ...this.deviceStats }
      };
      
      this.metrics.push(metrics);
      
      // Clean old metrics
      this.cleanOldMetrics();
      
      // Check for alerts
      this.checkAlerts(metrics);
      
      // Update previous values
      this.previousCpuUsage = process.cpuUsage();
      this.previousTime = now;
      
      this.emit('metrics', metrics);
      
    } catch (error) {
      logger.error('Error collecting metrics', error);
    }
  }
  
  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: SystemMetrics): void {
    const alerts: PerformanceAlert[] = [];
    
    // CPU alerts
    if (metrics.cpu.usage > this.config.alertThresholds.cpu.critical) {
      alerts.push({
        type: 'critical',
        category: 'cpu',
        message: 'Critical CPU usage detected',
        value: metrics.cpu.usage,
        threshold: this.config.alertThresholds.cpu.critical,
        timestamp: new Date()
      });
    } else if (metrics.cpu.usage > this.config.alertThresholds.cpu.warning) {
      alerts.push({
        type: 'warning',
        category: 'cpu',
        message: 'High CPU usage detected',
        value: metrics.cpu.usage,
        threshold: this.config.alertThresholds.cpu.warning,
        timestamp: new Date()
      });
    }
    
    // Memory alerts
    if (metrics.memory.usagePercent > this.config.alertThresholds.memory.critical) {
      alerts.push({
        type: 'critical',
        category: 'memory',
        message: 'Critical memory usage detected',
        value: metrics.memory.usagePercent,
        threshold: this.config.alertThresholds.memory.critical,
        timestamp: new Date()
      });
    } else if (metrics.memory.usagePercent > this.config.alertThresholds.memory.warning) {
      alerts.push({
        type: 'warning',
        category: 'memory',
        message: 'High memory usage detected',
        value: metrics.memory.usagePercent,
        threshold: this.config.alertThresholds.memory.warning,
        timestamp: new Date()
      });
    }
    
    // Network alerts
    if (metrics.network.connectionsActive > this.config.alertThresholds.networkConnections.critical) {
      alerts.push({
        type: 'critical',
        category: 'network',
        message: 'Critical number of network connections',
        value: metrics.network.connectionsActive,
        threshold: this.config.alertThresholds.networkConnections.critical,
        timestamp: new Date()
      });
    } else if (metrics.network.connectionsActive > this.config.alertThresholds.networkConnections.warning) {
      alerts.push({
        type: 'warning',
        category: 'network',
        message: 'High number of network connections',
        value: metrics.network.connectionsActive,
        threshold: this.config.alertThresholds.networkConnections.warning,
        timestamp: new Date()
      });
    }
    
    // MQTT alerts
    if (metrics.mqtt.errorsCount > this.config.alertThresholds.mqttErrors.critical) {
      alerts.push({
        type: 'critical',
        category: 'mqtt',
        message: 'Critical number of MQTT errors',
        value: metrics.mqtt.errorsCount,
        threshold: this.config.alertThresholds.mqttErrors.critical,
        timestamp: new Date()
      });
    } else if (metrics.mqtt.errorsCount > this.config.alertThresholds.mqttErrors.warning) {
      alerts.push({
        type: 'warning',
        category: 'mqtt',
        message: 'High number of MQTT errors',
        value: metrics.mqtt.errorsCount,
        threshold: this.config.alertThresholds.mqttErrors.warning,
        timestamp: new Date()
      });
    }
    
    // Device alerts
    if (metrics.devices.errors > this.config.alertThresholds.deviceErrors.critical) {
      alerts.push({
        type: 'critical',
        category: 'devices',
        message: 'Critical number of device errors',
        value: metrics.devices.errors,
        threshold: this.config.alertThresholds.deviceErrors.critical,
        timestamp: new Date()
      });
    } else if (metrics.devices.errors > this.config.alertThresholds.deviceErrors.warning) {
      alerts.push({
        type: 'warning',
        category: 'devices',
        message: 'High number of device errors',
        value: metrics.devices.errors,
        threshold: this.config.alertThresholds.deviceErrors.warning,
        timestamp: new Date()
      });
    }
    
    // Emit alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.emit('alert', alert);
      
      logger.warn(`Performance alert: ${alert.message}`, {
        type: alert.type,
        category: alert.category,
        value: alert.value,
        threshold: alert.threshold
      });
    });
  }
  
  /**
   * Clean old metrics based on retention period
   */
  private cleanOldMetrics(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    this.metrics = this.metrics.filter(
      metric => metric.timestamp.getTime() > cutoff
    );
    
    this.alerts = this.alerts.filter(
      alert => alert.timestamp.getTime() > cutoff
    );
  }
  
  /**
   * Export metrics to file
   */
  private async exportMetrics(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `metrics-${timestamp}.json`;
      const filepath = path.join(this.config.exportPath, filename);
      
      // Ensure directory exists
      await fs.mkdir(this.config.exportPath, { recursive: true });
      
      const exportData = {
        timestamp: new Date().toISOString(),
        config: this.config,
        metrics: this.metrics,
        alerts: this.alerts,
        summary: this.getSummary()
      };
      
      await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
      
      logger.debug(`Metrics exported to ${filepath}`);
      
    } catch (error) {
      logger.error('Error exporting metrics', error);
    }
  }
  
  /**
   * Get current metrics summary
   */
  getSummary(): any {
    if (this.metrics.length === 0) {
      return null;
    }
    
    const latest = this.metrics[this.metrics.length - 1];
    const oldest = this.metrics[0];
    
    // Calculate averages over the collection period
    const avgCpu = this.metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / this.metrics.length;
    const avgMemory = this.metrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / this.metrics.length;
    const maxCpu = Math.max(...this.metrics.map(m => m.cpu.usage));
    const maxMemory = Math.max(...this.metrics.map(m => m.memory.usagePercent));
    
    return {
      period: {
        start: oldest.timestamp,
        end: latest.timestamp,
        duration: latest.timestamp.getTime() - oldest.timestamp.getTime()
      },
      current: latest,
      averages: {
        cpu: avgCpu,
        memory: avgMemory
      },
      peaks: {
        cpu: maxCpu,
        memory: maxMemory
      },
      totals: {
        mqttMessages: latest.mqtt.messagesReceived + latest.mqtt.messagesSent,
        networkBytes: latest.network.bytesReceived + latest.network.bytesSent,
        alerts: this.alerts.length
      },
      alertCounts: {
        critical: this.alerts.filter(a => a.type === 'critical').length,
        warning: this.alerts.filter(a => a.type === 'warning').length
      }
    };
  }
  
  /**
   * Get all collected metrics
   */
  getMetrics(): SystemMetrics[] {
    return [...this.metrics];
  }
  
  /**
   * Get all alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }
  
  /**
   * Update MQTT statistics
   */
  updateMqttStats(stats: Partial<typeof this.mqttStats>): void {
    Object.assign(this.mqttStats, stats);
  }
  
  /**
   * Update device statistics
   */
  updateDeviceStats(stats: Partial<typeof this.deviceStats>): void {
    Object.assign(this.deviceStats, stats);
  }
  
  /**
   * Update network statistics
   */
  updateNetworkStats(stats: Partial<typeof this.networkStats>): void {
    Object.assign(this.networkStats, stats);
  }
  
  /**
   * Increment MQTT message counters
   */
  incrementMqttMessages(type: 'sent' | 'received', count = 1): void {
    if (type === 'sent') {
      this.mqttStats.messagesSent += count;
    } else {
      this.mqttStats.messagesReceived += count;
    }
  }
  
  /**
   * Increment error counters
   */
  incrementErrors(type: 'mqtt' | 'device', count = 1): void {
    if (type === 'mqtt') {
      this.mqttStats.errorsCount += count;
    } else {
      this.deviceStats.errors += count;
    }
  }
  
  /**
   * Reset all counters
   */
  reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.mqttStats = {
      messagesReceived: 0,
      messagesSent: 0,
      connectionsActive: 0,
      errorsCount: 0
    };
    this.deviceStats = {
      active: 0,
      connected: 0,
      disconnected: 0,
      errors: 0
    };
    this.networkStats = {
      connectionsActive: 0,
      bytesReceived: 0,
      bytesSent: 0
    };
    
    logger.info('Metrics collector reset');
  }
}