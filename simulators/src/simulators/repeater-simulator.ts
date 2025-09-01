import { BaseDeviceSimulator } from '@/core/base-device-simulator.js';
import { RepeaterDeviceConfig, DeviceEvent } from '@/types/index.js';
import { config } from '@/config/index.js';

interface ConnectedDevice {
  deviceId: string;
  deviceType: string;
  signalStrength: number;
  lastSeen: Date;
  hopCount: number;
}

interface MeshNetworkData {
  networkId: string;
  nodeId: string;
  parentNodes: string[];
  childNodes: string[];
  connectedDevices: ConnectedDevice[];
  networkTopology: Map<string, string[]>;
}

interface PowerStatus {
  source: 'AC' | 'UPS' | 'Battery';
  batteryLevel?: number;
  upsRuntime?: number; // minutes
  acVoltage?: number;
  powerConsumption: number; // watts
}

export class RepeaterDeviceSimulator extends BaseDeviceSimulator {
  private repeaterConfig: RepeaterDeviceConfig;
  private meshNetwork: MeshNetworkData;
  private powerStatus: PowerStatus;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private operatingFrequencies: string[];
  private isMaintenanceMode: boolean = false;
  
  // Timers
  private meshUpdateTimer: NodeJS.Timeout | null = null;
  private healthTimer: NodeJS.Timeout | null = null;
  private powerMonitorTimer: NodeJS.Timeout | null = null;
  private deviceScanTimer: NodeJS.Timeout | null = null;
  
  constructor(deviceConfig: RepeaterDeviceConfig) {
    super(deviceConfig);
    this.repeaterConfig = deviceConfig;
    
    // Initialize mesh network data
    this.meshNetwork = {
      networkId: `mesh-${deviceConfig.site}-${Math.random().toString(36).substr(2, 6)}`,
      nodeId: deviceConfig.deviceId,
      parentNodes: [],
      childNodes: [],
      connectedDevices: [],
      networkTopology: new Map()
    };
    
    // Initialize power status
    this.powerStatus = {
      source: deviceConfig.powerSource || 'AC',
      batteryLevel: deviceConfig.powerSource === 'Battery' ? 100 : undefined,
      upsRuntime: deviceConfig.powerSource === 'UPS' ? 120 : undefined,
      acVoltage: deviceConfig.powerSource !== 'Battery' ? 220 + Math.random() * 20 : undefined,
      powerConsumption: 15 + Math.random() * 5 // 15-20W typical
    };
    
    // Initialize operating frequencies
    this.operatingFrequencies = deviceConfig.frequencies || ['868MHz', '915MHz', '2.4GHz'];
    
    this.logger.info('Repeater device simulator created', {
      deviceId: deviceConfig.deviceId,
      coverageArea: deviceConfig.coverageArea,
      powerSource: this.powerStatus.source,
      frequencies: this.operatingFrequencies
    });
  }
  
  protected async onDeviceStart(): Promise<void> {
    this.logger.info('Starting repeater device simulator');
    
    // Subscribe to command topics
    await this.subscribeToTopic(this.getDeviceTopic('cmd/+'));
    
    // Subscribe to mesh network topics
    await this.subscribeToTopic(`obedio/${this.deviceConfig.site}/+/+/+/mesh`);
    await this.subscribeToTopic(`obedio/${this.deviceConfig.site}/mesh/+`);
    
    // Start periodic tasks
    this.startMeshUpdates();
    this.startHealthMonitoring();
    this.startPowerMonitoring();
    this.startDeviceScanning();
    
    // Send initial mesh announcement
    await this.announceToMesh();
    
    this.logger.info('Repeater device simulator started');
  }
  
  protected async onDeviceStop(): Promise<void> {
    this.logger.info('Stopping repeater device simulator');
    
    // Send mesh departure message
    await this.sendMeshDeparture();
    
    // Clear all timers
    this.clearTimers();
    
    this.logger.info('Repeater device simulator stopped');
  }
  
  protected onCommandReceived(command: string, data: any): void {
    this.logger.info(`Repeater device received command: ${command}`, data);
    
    switch (command) {
      case 'mesh_scan':
        this.performMeshScan();
        break;
      case 'update_topology':
        this.updateNetworkTopology(data);
        break;
      case 'set_power_source':
        this.setPowerSource(data.source);
        break;
      case 'maintenance_mode':
        this.toggleMaintenanceMode(data.enabled);
        break;
      case 'frequency_scan':
        this.performFrequencyScan();
        break;
      case 'reboot':
        this.performReboot();
        break;
      case 'factory_reset':
        this.performFactoryReset();
        break;
      default:
        this.logger.warn(`Unknown command received: ${command}`);
    }
  }
  
  /**
   * Start mesh network updates
   */
  private startMeshUpdates(): void {
    const interval = this.repeaterConfig.meshUpdateInterval || config.getRepeaterMeshUpdateInterval();
    
    this.meshUpdateTimer = setInterval(() => {
      if (this.isRunning && this.isConnected && !this.isMaintenanceMode) {
        this.publishMeshUpdate().catch(error => {
          this.logger.error('Failed to publish mesh update', error);
        });
      }
    }, interval);
    
    this.logger.info('Mesh updates started');
  }
  
  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthTimer = setInterval(() => {
      if (this.isRunning && this.isConnected) {
        this.publishHealthUpdate().catch(error => {
          this.logger.error('Failed to publish health update', error);
        });
      }
    }, 60000); // Every minute
    
    this.logger.info('Health monitoring started');
  }
  
  /**
   * Start power monitoring
   */
  private startPowerMonitoring(): void {
    this.powerMonitorTimer = setInterval(() => {
      if (this.isRunning && this.isConnected) {
        this.updatePowerStatus();
        this.publishPowerUpdate().catch(error => {
          this.logger.error('Failed to publish power update', error);
        });
      }
    }, 30000); // Every 30 seconds
    
    this.logger.info('Power monitoring started');
  }
  
  /**
   * Start device scanning
   */
  private startDeviceScanning(): void {
    this.deviceScanTimer = setInterval(() => {
      if (this.isRunning && this.isConnected && !this.isMaintenanceMode) {
        this.scanForDevices();
      }
    }, 45000); // Every 45 seconds
    
    this.logger.info('Device scanning started');
  }
  
  /**
   * Announce presence to mesh network
   */
  private async announceToMesh(): Promise<void> {
    const announcement = {
      timestamp: new Date().toISOString(),
      node_id: this.meshNetwork.nodeId,
      network_id: this.meshNetwork.networkId,
      device_type: 'repeater',
      coverage_area: this.repeaterConfig.coverageArea,
      frequencies: this.operatingFrequencies,
      max_devices: this.repeaterConfig.maxConnectedDevices,
      power_source: this.powerStatus.source,
      status: 'online'
    };
    
    await this.publishMessage(`obedio/${this.deviceConfig.site}/mesh/announce`, announcement);
    await this.publishMessage(this.getDeviceTopic('mesh/announce'), announcement);
    
    this.logger.event('MESH_ANNOUNCE', announcement);
  }
  
  /**
   * Send mesh departure message
   */
  private async sendMeshDeparture(): Promise<void> {
    const departure = {
      timestamp: new Date().toISOString(),
      node_id: this.meshNetwork.nodeId,
      network_id: this.meshNetwork.networkId,
      status: 'offline',
      connected_devices: Array.from(this.connectedDevices.keys())
    };
    
    await this.publishMessage(`obedio/${this.deviceConfig.site}/mesh/departure`, departure);
    await this.publishMessage(this.getDeviceTopic('mesh/departure'), departure);
    
    this.logger.event('MESH_DEPARTURE', departure);
  }
  
  /**
   * Publish mesh network update
   */
  private async publishMeshUpdate(): Promise<void> {
    this.updateConnectedDevicesStatus();
    
    const meshData = {
      timestamp: new Date().toISOString(),
      node_id: this.meshNetwork.nodeId,
      network_id: this.meshNetwork.networkId,
      parent_nodes: this.meshNetwork.parentNodes,
      child_nodes: this.meshNetwork.childNodes,
      connected_devices: Array.from(this.connectedDevices.values()),
      device_count: this.connectedDevices.size,
      signal_quality: this.calculateAverageSignalQuality(),
      network_load: this.calculateNetworkLoad(),
      uptime: this.getMetrics().uptime
    };
    
    await this.publishMessage(this.getDeviceTopic('mesh'), meshData);
    await this.publishMessage(`obedio/${this.deviceConfig.site}/mesh/update`, meshData);
    
    this.logger.event('MESH_UPDATE', meshData);
  }
  
  /**
   * Publish health update
   */
  private async publishHealthUpdate(): Promise<void> {
    const healthData = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      status: this.isMaintenanceMode ? 'maintenance' : 'operational',
      uptime: this.getMetrics().uptime,
      temperature: this.status.temperature,
      humidity: this.status.humidity,
      memory_usage: Math.random() * 60 + 20, // 20-80%
      cpu_usage: Math.random() * 40 + 10, // 10-50%
      network_interfaces: this.getNetworkInterfaceStatus(),
      error_count: this.metrics.errors,
      maintenance_mode: this.isMaintenanceMode
    };
    
    await this.publishMessage(this.getDeviceTopic('health'), healthData);
    this.logger.event('HEALTH_UPDATE', healthData);
  }
  
  /**
   * Publish power status update
   */
  private async publishPowerUpdate(): Promise<void> {
    const powerData = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      power_source: this.powerStatus.source,
      battery_level: this.powerStatus.batteryLevel,
      ups_runtime: this.powerStatus.upsRuntime,
      ac_voltage: this.powerStatus.acVoltage,
      power_consumption: this.powerStatus.powerConsumption,
      power_status: this.getPowerStatus()
    };
    
    await this.publishMessage(this.getDeviceTopic('power'), powerData);
    this.logger.event('POWER_UPDATE', powerData);
  }
  
  /**
   * Scan for nearby devices
   */
  private scanForDevices(): void {
    // Simulate discovering new devices in range
    if (this.connectedDevices.size < this.repeaterConfig.maxConnectedDevices) {
      if (Math.random() < 0.3) { // 30% chance to discover new device
        this.addConnectedDevice();
      }
    }
    
    // Simulate devices leaving network
    if (this.connectedDevices.size > 0 && Math.random() < 0.1) { // 10% chance to lose device
      this.removeRandomConnectedDevice();
    }
  }
  
  /**
   * Add a simulated connected device
   */
  private addConnectedDevice(): void {
    const deviceTypes = ['button', 'watch', 'sensor'];
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    const deviceId = `${deviceType}-${Math.random().toString(36).substr(2, 6)}`;
    
    const device: ConnectedDevice = {
      deviceId,
      deviceType,
      signalStrength: Math.floor(Math.random() * 40 + 60), // 60-100%
      lastSeen: new Date(),
      hopCount: Math.floor(Math.random() * 3 + 1) // 1-3 hops
    };
    
    this.connectedDevices.set(deviceId, device);
    this.logger.info(`Device ${deviceId} connected to repeater`, device);
  }
  
  /**
   * Remove a random connected device
   */
  private removeRandomConnectedDevice(): void {
    const deviceIds = Array.from(this.connectedDevices.keys());
    if (deviceIds.length > 0) {
      const randomId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      this.connectedDevices.delete(randomId);
      this.logger.info(`Device ${randomId} disconnected from repeater`);
    }
  }
  
  /**
   * Update connected devices status
   */
  private updateConnectedDevicesStatus(): void {
    this.connectedDevices.forEach((device, deviceId) => {
      // Simulate signal strength fluctuations
      device.signalStrength = Math.max(20, Math.min(100, 
        device.signalStrength + (Math.random() - 0.5) * 10
      ));
      
      // Update last seen
      device.lastSeen = new Date();
    });
  }
  
  /**
   * Update power status
   */
  private updatePowerStatus(): void {
    switch (this.powerStatus.source) {
      case 'AC':
        // Simulate voltage fluctuations
        this.powerStatus.acVoltage = 220 + (Math.random() - 0.5) * 20;
        break;
      
      case 'UPS':
        // Simulate UPS runtime decrease during outages
        if (Math.random() < 0.1 && this.powerStatus.upsRuntime! > 0) { // 10% chance of outage
          this.powerStatus.upsRuntime! -= 1;
        }
        break;
      
      case 'Battery':
        // Simulate battery drain
        if (this.powerStatus.batteryLevel! > 0) {
          this.powerStatus.batteryLevel! -= 0.1; // 0.1% per update
        }
        break;
    }
    
    // Update power consumption based on load
    const baseConsumption = 15;
    const loadFactor = this.connectedDevices.size / this.repeaterConfig.maxConnectedDevices;
    this.powerStatus.powerConsumption = baseConsumption + (loadFactor * 5); // +5W at full load
  }
  
  /**
   * Calculate average signal quality
   */
  private calculateAverageSignalQuality(): number {
    if (this.connectedDevices.size === 0) return 100;
    
    const totalSignal = Array.from(this.connectedDevices.values())
      .reduce((sum, device) => sum + device.signalStrength, 0);
    
    return Math.round(totalSignal / this.connectedDevices.size);
  }
  
  /**
   * Calculate network load
   */
  private calculateNetworkLoad(): number {
    return Math.round((this.connectedDevices.size / this.repeaterConfig.maxConnectedDevices) * 100);
  }
  
  /**
   * Get network interface status
   */
  private getNetworkInterfaceStatus(): any {
    return this.operatingFrequencies.map(freq => ({
      frequency: freq,
      status: 'active',
      signal_strength: Math.floor(Math.random() * 30 + 70), // 70-100%
      interference_level: Math.floor(Math.random() * 20), // 0-20%
      channel: Math.floor(Math.random() * 16 + 1) // 1-16
    }));
  }
  
  /**
   * Get power status description
   */
  private getPowerStatus(): string {
    switch (this.powerStatus.source) {
      case 'AC':
        return this.powerStatus.acVoltage! > 200 ? 'stable' : 'unstable';
      case 'UPS':
        return this.powerStatus.upsRuntime! > 30 ? 'backup' : 'critical';
      case 'Battery':
        return this.powerStatus.batteryLevel! > 20 ? 'battery' : 'low_battery';
      default:
        return 'unknown';
    }
  }
  
  /**
   * Perform mesh scan
   */
  public async performMeshScan(): Promise<void> {
    this.logger.info('Performing mesh network scan');
    
    const scanResults = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      scan_type: 'mesh_topology',
      discovered_nodes: Math.floor(Math.random() * 5 + 2), // 2-6 nodes
      signal_map: this.generateSignalMap(),
      recommended_topology: this.generateTopologyRecommendation()
    };
    
    await this.publishMessage(this.getDeviceTopic('scan_results'), scanResults);
    this.logger.event('MESH_SCAN', scanResults);
  }
  
  /**
   * Update network topology
   */
  public updateNetworkTopology(data: any): void {
    if (data.parent_nodes) {
      this.meshNetwork.parentNodes = data.parent_nodes;
    }
    if (data.child_nodes) {
      this.meshNetwork.childNodes = data.child_nodes;
    }
    
    this.logger.info('Network topology updated', {
      parentNodes: this.meshNetwork.parentNodes,
      childNodes: this.meshNetwork.childNodes
    });
  }
  
  /**
   * Set power source
   */
  public setPowerSource(source: 'AC' | 'UPS' | 'Battery'): void {
    this.powerStatus.source = source;
    
    // Reset power status based on new source
    switch (source) {
      case 'AC':
        this.powerStatus.acVoltage = 220;
        delete this.powerStatus.batteryLevel;
        delete this.powerStatus.upsRuntime;
        break;
      case 'UPS':
        this.powerStatus.upsRuntime = 120;
        delete this.powerStatus.batteryLevel;
        break;
      case 'Battery':
        this.powerStatus.batteryLevel = 100;
        delete this.powerStatus.acVoltage;
        delete this.powerStatus.upsRuntime;
        break;
    }
    
    this.logger.info(`Power source changed to ${source}`);
  }
  
  /**
   * Toggle maintenance mode
   */
  public toggleMaintenanceMode(enabled: boolean): void {
    this.isMaintenanceMode = enabled;
    this.logger.info(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Perform frequency scan
   */
  public async performFrequencyScan(): Promise<void> {
    const scanResults = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      scan_type: 'frequency_analysis',
      frequencies: this.operatingFrequencies.map(freq => ({
        frequency: freq,
        interference_level: Math.random() * 30, // 0-30%
        signal_strength: Math.random() * 40 + 60, // 60-100%
        channel_utilization: Math.random() * 50 + 10, // 10-60%
        recommended: Math.random() > 0.5
      }))
    };
    
    await this.publishMessage(this.getDeviceTopic('frequency_scan'), scanResults);
    this.logger.event('FREQUENCY_SCAN', scanResults);
  }
  
  /**
   * Perform reboot
   */
  public async performReboot(): Promise<void> {
    this.logger.info('Performing device reboot');
    await this.stop();
    setTimeout(() => this.start(), 5000); // 5 second reboot time
  }
  
  /**
   * Perform factory reset
   */
  public async performFactoryReset(): Promise<void> {
    this.logger.info('Performing factory reset');
    
    // Clear connected devices
    this.connectedDevices.clear();
    
    // Reset mesh network data
    this.meshNetwork.parentNodes = [];
    this.meshNetwork.childNodes = [];
    this.meshNetwork.connectedDevices = [];
    
    // Reset power status
    this.powerStatus = {
      source: 'AC',
      acVoltage: 220,
      powerConsumption: 15
    };
    
    await this.stop();
    setTimeout(() => this.start(), 10000); // 10 second reset time
  }
  
  /**
   * Generate signal map for scan results
   */
  private generateSignalMap(): any {
    return {
      coverage_radius: `${Math.floor(Math.random() * 100 + 200)}m`, // 200-300m
      signal_zones: [
        { zone: 'strong', coverage: '0-100m', devices: Math.floor(Math.random() * 5 + 3) },
        { zone: 'medium', coverage: '100-200m', devices: Math.floor(Math.random() * 3 + 1) },
        { zone: 'weak', coverage: '200-300m', devices: Math.floor(Math.random() * 2) }
      ]
    };
  }
  
  /**
   * Generate topology recommendation
   */
  private generateTopologyRecommendation(): any {
    return {
      optimal_parent: `repeater-${Math.random().toString(36).substr(2, 6)}`,
      suggested_children: Array.from({ length: 2 }, () => 
        `repeater-${Math.random().toString(36).substr(2, 6)}`
      ),
      load_balancing: 'recommended',
      redundancy_level: 'medium'
    };
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.meshUpdateTimer) {
      clearInterval(this.meshUpdateTimer);
      this.meshUpdateTimer = null;
    }
    
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    
    if (this.powerMonitorTimer) {
      clearInterval(this.powerMonitorTimer);
      this.powerMonitorTimer = null;
    }
    
    if (this.deviceScanTimer) {
      clearInterval(this.deviceScanTimer);
      this.deviceScanTimer = null;
    }
  }
  
  /**
   * Get device statistics
   */
  public getDeviceStats() {
    return {
      ...this.getMetrics(),
      meshNetwork: this.meshNetwork,
      powerStatus: this.powerStatus,
      connectedDevices: Array.from(this.connectedDevices.values()),
      operatingFrequencies: this.operatingFrequencies,
      isMaintenanceMode: this.isMaintenanceMode,
      deviceType: 'repeater',
      status: this.getStatus()
    };
  }
}

// Standalone repeater simulator runner
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runRepeaterSimulator() {
    const deviceConfig: RepeaterDeviceConfig = {
      deviceId: process.argv[2] || `rpt-${Math.random().toString(36).substr(2, 9)}`,
      site: process.argv[3] || config.getDefaultSite(),
      room: process.argv[4] || 'infrastructure',
      deviceType: 'repeater',
      name: `Repeater ${process.argv[2] || 'Simulator'}`,
      meshUpdateInterval: config.getRepeaterMeshUpdateInterval(),
      maxConnectedDevices: config.getRepeaterMaxConnectedDevices(),
      coverageArea: '300m radius',
      frequencies: ['868MHz', '915MHz', '2.4GHz'],
      powerSource: 'AC'
    };
    
    const simulator = new RepeaterDeviceSimulator(deviceConfig);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down repeater simulator...');
      await simulator.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down repeater simulator...');
      await simulator.stop();
      process.exit(0);
    });
    
    try {
      await simulator.start();
      console.log(`Repeater simulator started: ${deviceConfig.deviceId}`);
      
      // Simulate mesh topology changes periodically
      setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance
          simulator.performMeshScan();
        }
      }, 60000); // Check every minute
      
      // Keep the process running
      process.stdin.resume();
    } catch (error) {
      console.error('Failed to start repeater simulator:', error);
      process.exit(1);
    }
  }
  
  runRepeaterSimulator().catch(console.error);
}