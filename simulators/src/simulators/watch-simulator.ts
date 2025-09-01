import { BaseDeviceSimulator } from '@/core/base-device-simulator.js';
import { WatchDeviceConfig, DeviceEvent } from '@/types/index.js';
import { config } from '@/config/index.js';

interface HealthMetrics {
  heartRate: number;
  stepCount: number;
  caloriesBurned: number;
  distanceWalked: number; // in meters
  sleepQuality?: number; // 0-100%
  stressLevel?: number; // 0-100%
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export class WatchDeviceSimulator extends BaseDeviceSimulator {
  private watchConfig: WatchDeviceConfig;
  private healthMetrics: HealthMetrics;
  private currentLocation: LocationData;
  private isCharging: boolean = false;
  private lastStepTime: Date;
  private fallDetectionEnabled: boolean = true;
  
  // Timers
  private stepTimer: NodeJS.Timeout | null = null;
  private locationTimer: NodeJS.Timeout | null = null;
  private healthTimer: NodeJS.Timeout | null = null;
  
  constructor(deviceConfig: WatchDeviceConfig) {
    super(deviceConfig);
    this.watchConfig = deviceConfig;
    this.lastStepTime = new Date();
    
    // Initialize health metrics
    this.healthMetrics = {
      heartRate: this.generateInitialHeartRate(),
      stepCount: Math.floor(Math.random() * 5000), // Random daily steps so far
      caloriesBurned: Math.floor(Math.random() * 1500),
      distanceWalked: Math.floor(Math.random() * 3000), // meters
      sleepQuality: Math.floor(Math.random() * 40) + 60, // 60-100%
      stressLevel: Math.floor(Math.random() * 30) + 10 // 10-40%
    };
    
    // Initialize location (simulate yacht/hotel location)
    this.currentLocation = {
      latitude: 35.6762 + (Math.random() - 0.5) * 0.01, // Tokyo Bay area
      longitude: 139.6503 + (Math.random() - 0.5) * 0.01,
      accuracy: Math.floor(Math.random() * 10) + 3, // 3-13 meters
      altitude: Math.floor(Math.random() * 50) + 10, // 10-60 meters
      heading: Math.floor(Math.random() * 360),
      speed: Math.random() * 2 // 0-2 m/s (walking speed)
    };
    
    this.logger.info('Smart watch simulator created', {
      deviceId: deviceConfig.deviceId,
      room: deviceConfig.room,
      site: deviceConfig.site,
      healthMonitoring: deviceConfig.healthMonitoring
    });
  }
  
  protected async onDeviceStart(): Promise<void> {
    this.logger.info('Starting smart watch simulator');
    
    // Subscribe to command topics
    await this.subscribeToTopic(this.getDeviceTopic('cmd/+'));
    
    // Start health monitoring
    if (this.watchConfig.healthMonitoring) {
      this.startHealthMonitoring();
    }
    
    // Start location updates
    this.startLocationUpdates();
    
    // Start step counting
    this.startStepCounting();
    
    this.logger.info('Smart watch simulator started');
  }
  
  protected async onDeviceStop(): Promise<void> {
    this.logger.info('Stopping smart watch simulator');
    
    // Clear all timers
    this.clearTimers();
    
    this.logger.info('Smart watch simulator stopped');
  }
  
  protected onCommandReceived(command: string, data: any): void {
    this.logger.info(`Watch device received command: ${command}`, data);
    
    switch (command) {
      case 'start_workout':
        this.startWorkout(data.workoutType || 'general');
        break;
      case 'stop_workout':
        this.stopWorkout();
        break;
      case 'enable_fall_detection':
        this.enableFallDetection();
        break;
      case 'disable_fall_detection':
        this.disableFallDetection();
        break;
      case 'request_location':
        this.sendLocationUpdate();
        break;
      case 'start_charging':
        this.startCharging();
        break;
      case 'stop_charging':
        this.stopCharging();
        break;
      case 'emergency_contact':
        this.simulateEmergencyContact();
        break;
      default:
        this.logger.warn(`Unknown command received: ${command}`);
    }
  }
  
  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthTimer = setInterval(() => {
      if (this.isRunning && this.isConnected) {
        this.updateHealthMetrics();
        this.publishHealthUpdate().catch(error => {
          this.logger.error('Failed to publish health update', error);
        });
      }
    }, 60000); // Every minute
    
    this.logger.info('Health monitoring started');
  }
  
  /**
   * Start location updates
   */
  private startLocationUpdates(): void {
    const interval = this.watchConfig.locationUpdateInterval || config.getWatchLocationUpdateInterval();
    
    this.locationTimer = setInterval(() => {
      if (this.isRunning && this.isConnected) {
        this.updateLocation();
        this.publishLocationUpdate().catch(error => {
          this.logger.error('Failed to publish location update', error);
        });
      }
    }, interval);
    
    this.logger.info('Location updates started');
  }
  
  /**
   * Start step counting
   */
  private startStepCounting(): void {
    const interval = this.watchConfig.stepInterval || config.getWatchStepInterval();
    
    this.stepTimer = setInterval(() => {
      if (this.isRunning && this.isConnected && !this.isCharging) {
        this.simulateSteps();
      }
    }, interval);
    
    this.logger.info('Step counting started');
  }
  
  /**
   * Update health metrics
   */
  private updateHealthMetrics(): void {
    // Simulate heart rate variability
    const baseHeartRate = this.generateBaseHeartRate();
    const variation = (Math.random() - 0.5) * 10; // ±5 BPM variation
    this.healthMetrics.heartRate = Math.max(50, Math.min(200, Math.round(baseHeartRate + variation)));
    
    // Update stress level (influenced by heart rate)
    if (this.healthMetrics.heartRate > 100) {
      this.healthMetrics.stressLevel = Math.min(100, this.healthMetrics.stressLevel! + Math.random() * 5);
    } else {
      this.healthMetrics.stressLevel = Math.max(0, this.healthMetrics.stressLevel! - Math.random() * 2);
    }
    
    // Calories are roughly correlated with steps and heart rate
    const calorieIncrease = (this.healthMetrics.heartRate - 60) * 0.1 + Math.random() * 2;
    this.healthMetrics.caloriesBurned += Math.max(0, calorieIncrease);
  }
  
  /**
   * Update location with realistic movement
   */
  private updateLocation(): void {
    // Simulate small movements (like walking around yacht/hotel)
    const maxMovement = 0.0001; // ~10 meters
    this.currentLocation.latitude += (Math.random() - 0.5) * maxMovement;
    this.currentLocation.longitude += (Math.random() - 0.5) * maxMovement;
    
    // Update accuracy and other location data
    this.currentLocation.accuracy = Math.floor(Math.random() * 10) + 3;
    this.currentLocation.heading = (this.currentLocation.heading! + Math.random() * 60 - 30) % 360;
    this.currentLocation.speed = Math.random() * 3; // 0-3 m/s
    
    // Update device location in status
    this.status.location = {
      lat: this.currentLocation.latitude,
      lng: this.currentLocation.longitude,
      accuracy: this.currentLocation.accuracy
    };
  }
  
  /**
   * Simulate steps
   */
  private simulateSteps(): void {
    // Simulate 1-10 steps per interval based on activity level
    const stepsToAdd = Math.floor(Math.random() * 10) + 1;
    this.healthMetrics.stepCount += stepsToAdd;
    
    // Calculate distance (average step length ~0.7m)
    const distanceAdded = stepsToAdd * 0.7;
    this.healthMetrics.distanceWalked += distanceAdded;
    
    this.lastStepTime = new Date();
    
    // Occasionally publish step updates
    if (Math.random() < 0.1) { // 10% chance
      this.publishStepUpdate().catch(error => {
        this.logger.error('Failed to publish step update', error);
      });
    }
  }
  
  /**
   * Publish health update
   */
  private async publishHealthUpdate(): Promise<void> {
    const healthPayload = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      heart_rate: this.healthMetrics.heartRate,
      step_count: this.healthMetrics.stepCount,
      calories_burned: Math.round(this.healthMetrics.caloriesBurned),
      distance_walked: Math.round(this.healthMetrics.distanceWalked),
      sleep_quality: this.healthMetrics.sleepQuality,
      stress_level: this.healthMetrics.stressLevel,
      battery: this.status.battery,
      is_charging: this.isCharging
    };
    
    await this.publishMessage(this.getDeviceTopic('event/heartbeat'), healthPayload);
    await this.publishMessage(this.getDeviceTopic('health'), healthPayload);
    
    this.logger.event('HEALTH_UPDATE', healthPayload);
  }
  
  /**
   * Publish location update
   */
  private async publishLocationUpdate(): Promise<void> {
    const locationPayload = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      location: {
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        accuracy: this.currentLocation.accuracy,
        altitude: this.currentLocation.altitude,
        heading: this.currentLocation.heading,
        speed: this.currentLocation.speed
      },
      battery: this.status.battery
    };
    
    await this.publishMessage(this.getDeviceTopic('location'), locationPayload);
    this.logger.event('LOCATION_UPDATE', locationPayload);
  }
  
  /**
   * Publish step update
   */
  private async publishStepUpdate(): Promise<void> {
    const stepPayload = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      step_count: this.healthMetrics.stepCount,
      distance_walked: Math.round(this.healthMetrics.distanceWalked),
      calories_burned: Math.round(this.healthMetrics.caloriesBurned),
      last_step_time: this.lastStepTime.toISOString()
    };
    
    await this.publishMessage(this.getDeviceTopic('event/steps'), stepPayload);
    this.logger.event('STEP_UPDATE', stepPayload);
  }
  
  /**
   * Simulate fall detection
   */
  public async simulateFallDetected(): Promise<void> {
    if (!this.fallDetectionEnabled) {
      return;
    }
    
    const fallEvent = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      event_type: 'fall_detected',
      severity: Math.random() > 0.7 ? 'high' : 'medium',
      location: this.currentLocation,
      heart_rate: this.healthMetrics.heartRate,
      impact_force: Math.random() * 5 + 2, // 2-7G
      auto_call_emergency: Math.random() > 0.5
    };
    
    await this.publishMessage(this.getDeviceTopic('event/fall_detected'), fallEvent);
    await this.publishMessage(this.getDeviceTopic('emergency'), {
      ...fallEvent,
      alert_type: 'fall_detection',
      urgency: 'high'
    });
    
    this.logger.event('FALL_DETECTED', fallEvent);
    this.emit('fallDetected', fallEvent);
  }
  
  /**
   * Start workout mode
   */
  public async startWorkout(workoutType: string): Promise<void> {
    const workoutEvent = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      workout_type: workoutType,
      status: 'started',
      initial_heart_rate: this.healthMetrics.heartRate
    };
    
    await this.publishMessage(this.getDeviceTopic('event/workout'), workoutEvent);
    this.logger.event('WORKOUT_STARTED', workoutEvent);
  }
  
  /**
   * Stop workout mode
   */
  public async stopWorkout(): Promise<void> {
    const workoutEvent = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      status: 'stopped',
      final_heart_rate: this.healthMetrics.heartRate,
      total_calories: Math.round(this.healthMetrics.caloriesBurned),
      total_steps: this.healthMetrics.stepCount
    };
    
    await this.publishMessage(this.getDeviceTopic('event/workout'), workoutEvent);
    this.logger.event('WORKOUT_STOPPED', workoutEvent);
  }
  
  /**
   * Enable fall detection
   */
  public enableFallDetection(): void {
    this.fallDetectionEnabled = true;
    this.logger.info('Fall detection enabled');
  }
  
  /**
   * Disable fall detection
   */
  public disableFallDetection(): void {
    this.fallDetectionEnabled = false;
    this.logger.info('Fall detection disabled');
  }
  
  /**
   * Send current location
   */
  public async sendLocationUpdate(): Promise<void> {
    await this.publishLocationUpdate();
  }
  
  /**
   * Start charging
   */
  public startCharging(): void {
    this.isCharging = true;
    this.logger.info('Device started charging');
  }
  
  /**
   * Stop charging
   */
  public stopCharging(): void {
    this.isCharging = false;
    this.logger.info('Device stopped charging');
  }
  
  /**
   * Simulate emergency contact
   */
  public async simulateEmergencyContact(): Promise<void> {
    const emergencyEvent = {
      timestamp: new Date().toISOString(),
      device_id: this.deviceConfig.deviceId,
      event_type: 'emergency_contact',
      location: this.currentLocation,
      heart_rate: this.healthMetrics.heartRate,
      battery: this.status.battery,
      initiated_by: 'user'
    };
    
    await this.publishMessage(this.getDeviceTopic('emergency'), emergencyEvent);
    this.logger.event('EMERGENCY_CONTACT', emergencyEvent);
  }
  
  /**
   * Generate initial heart rate
   */
  private generateInitialHeartRate(): number {
    const min = this.watchConfig.heartRate?.min || config.getWatchHeartRateMin();
    const max = this.watchConfig.heartRate?.max || config.getWatchHeartRateMax();
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  /**
   * Generate base heart rate (varies by time of day)
   */
  private generateBaseHeartRate(): number {
    const hour = new Date().getHours();
    const min = this.watchConfig.heartRate?.min || config.getWatchHeartRateMin();
    const max = this.watchConfig.heartRate?.max || config.getWatchHeartRateMax();
    
    // Lower heart rate during night hours
    if (hour >= 22 || hour <= 6) {
      return min + Math.random() * 15; // Resting heart rate
    } else if (hour >= 7 && hour <= 11) {
      return min + 10 + Math.random() * 20; // Morning activity
    } else {
      return min + 5 + Math.random() * (max - min - 5); // Normal day
    }
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.stepTimer) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
    
    if (this.locationTimer) {
      clearInterval(this.locationTimer);
      this.locationTimer = null;
    }
    
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
  }
  
  /**
   * Override status update to include charging state
   */
  protected updateDeviceStatus(): void {
    super.updateDeviceStatus();
    
    // Battery charges when plugged in
    if (this.isCharging && this.status.battery < 100) {
      this.status.battery = Math.min(100, this.status.battery + 2); // 2% per status update
    }
  }
  
  /**
   * Get device statistics
   */
  public getDeviceStats() {
    return {
      ...this.getMetrics(),
      healthMetrics: this.healthMetrics,
      currentLocation: this.currentLocation,
      isCharging: this.isCharging,
      fallDetectionEnabled: this.fallDetectionEnabled,
      lastStepTime: this.lastStepTime,
      deviceType: 'watch',
      status: this.getStatus()
    };
  }
}

// Standalone watch simulator runner
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runWatchSimulator() {
    const deviceConfig: WatchDeviceConfig = {
      deviceId: process.argv[2] || `watch-${Math.random().toString(36).substr(2, 9)}`,
      site: process.argv[3] || config.getDefaultSite(),
      room: process.argv[4] || config.getDefaultRoom(),
      deviceType: 'watch',
      name: `Smart Watch ${process.argv[2] || 'Simulator'}`,
      heartRate: {
        min: config.getWatchHeartRateMin(),
        max: config.getWatchHeartRateMax(),
        variability: 10
      },
      stepInterval: config.getWatchStepInterval(),
      locationUpdateInterval: config.getWatchLocationUpdateInterval(),
      healthMonitoring: true
    };
    
    const simulator = new WatchDeviceSimulator(deviceConfig);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down watch simulator...');
      await simulator.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down watch simulator...');
      await simulator.stop();
      process.exit(0);
    });
    
    try {
      await simulator.start();
      console.log(`Watch simulator started: ${deviceConfig.deviceId}`);
      
      // Simulate occasional fall detection (for testing)
      setInterval(() => {
        if (Math.random() < 0.001) { // 0.1% chance per interval
          simulator.simulateFallDetected();
        }
      }, 30000); // Check every 30 seconds
      
      // Keep the process running
      process.stdin.resume();
    } catch (error) {
      console.error('Failed to start watch simulator:', error);
      process.exit(1);
    }
  }
  
  runWatchSimulator().catch(console.error);
}