import dotenv from 'dotenv';
import { MqttConfig, SimulatorConfig } from '@/types/index.js';

// Load environment variables
dotenv.config();

export class Config {
  private static instance: Config;
  
  private constructor() {}
  
  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
  
  private getEnvString(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }
  
  private getEnvNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Required environment variable ${key} is not set`);
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${key} must be a number`);
    }
    return num;
  }
  
  private getEnvBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value.toLowerCase() === 'true';
  }
  
  getMqttConfig(): MqttConfig {
    return {
      brokerUrl: this.getEnvString('MQTT_BROKER_URL', 'mqtt://localhost:1883'),
      username: this.getEnvString('MQTT_USERNAME', undefined),
      password: this.getEnvString('MQTT_PASSWORD', undefined),
      clientIdPrefix: this.getEnvString('MQTT_CLIENT_ID_PREFIX', 'obedio-sim'),
      keepAlive: this.getEnvNumber('MQTT_KEEP_ALIVE', 60),
      cleanSession: this.getEnvBoolean('MQTT_CLEAN_SESSION', true),
      reconnectPeriod: this.getEnvNumber('MQTT_RECONNECT_PERIOD', 1000),
      connectTimeout: this.getEnvNumber('MQTT_CONNECT_TIMEOUT', 30000),
      tls: {
        enabled: this.getEnvBoolean('ENABLE_TLS', false),
        certPath: this.getEnvString('TLS_CERT_PATH', undefined),
        keyPath: this.getEnvString('TLS_KEY_PATH', undefined),
        caPath: this.getEnvString('TLS_CA_PATH', undefined),
        rejectUnauthorized: this.getEnvBoolean('TLS_REJECT_UNAUTHORIZED', false)
      }
    };
  }
  
  getSimulatorConfig(): SimulatorConfig {
    return {
      heartbeatInterval: this.getEnvNumber('HEARTBEAT_INTERVAL', 30000),
      statusUpdateInterval: this.getEnvNumber('STATUS_UPDATE_INTERVAL', 60000),
      batteryDrainRate: parseFloat(this.getEnvString('BATTERY_DRAIN_RATE', '0.1')),
      signalFluctuationRange: this.getEnvNumber('SIGNAL_FLUCTUATION_RANGE', 10),
      enableRandomEvents: this.getEnvBoolean('ENABLE_RANDOM_EVENTS', true),
      logLevel: this.getEnvString('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error'
    };
  }
  
  getDefaultSite(): string {
    return this.getEnvString('DEFAULT_SITE', 'yacht-1');
  }
  
  getDefaultRoom(): string {
    return this.getEnvString('DEFAULT_ROOM', 'simulation');
  }
  
  getDatabaseUrl(): string {
    return this.getEnvString('DATABASE_URL', 'postgresql://obedio_user:obedio_secure_password_2024@localhost:5432/obedio');
  }
  
  getApiBaseUrl(): string {
    return this.getEnvString('API_BASE_URL', 'http://localhost:4001');
  }
  
  getApiKey(): string | undefined {
    return this.getEnvString('API_KEY', undefined);
  }
  
  isApiAuthEnabled(): boolean {
    return this.getEnvBoolean('ENABLE_API_AUTH', false);
  }
  
  isDebugMode(): boolean {
    return this.getEnvBoolean('ENABLE_DEBUG_MODE', false);
  }
  
  getLogLevel(): string {
    return this.getEnvString('LOG_LEVEL', 'info');
  }
  
  getLogFilePath(): string {
    return this.getEnvString('LOG_FILE_PATH', './logs/simulator.log');
  }
  
  isConsoleLogEnabled(): boolean {
    return this.getEnvBoolean('CONSOLE_LOG_ENABLED', true);
  }
  
  isFileLogEnabled(): boolean {
    return this.getEnvBoolean('FILE_LOG_ENABLED', true);
  }
  
  getMaxConcurrentDevices(): number {
    return this.getEnvNumber('MAX_CONCURRENT_DEVICES', 100);
  }
  
  getDeviceStartupDelay(): number {
    return this.getEnvNumber('DEVICE_STARTUP_DELAY', 1000);
  }
  
  getDeviceShutdownDelay(): number {
    return this.getEnvNumber('DEVICE_SHUTDOWN_DELAY', 500);
  }
  
  getButtonPressMinInterval(): number {
    return this.getEnvNumber('BUTTON_PRESS_MIN_INTERVAL', 5000);
  }
  
  getButtonPressMaxInterval(): number {
    return this.getEnvNumber('BUTTON_PRESS_MAX_INTERVAL', 300000);
  }
  
  getButtonDoublePressThreshold(): number {
    return this.getEnvNumber('BUTTON_DOUBLE_PRESS_THRESHOLD', 500);
  }
  
  getButtonLongPressThreshold(): number {
    return this.getEnvNumber('BUTTON_LONG_PRESS_THRESHOLD', 2000);
  }
  
  getWatchHeartRateMin(): number {
    return this.getEnvNumber('WATCH_HEARTRATE_MIN', 60);
  }
  
  getWatchHeartRateMax(): number {
    return this.getEnvNumber('WATCH_HEARTRATE_MAX', 120);
  }
  
  getWatchStepInterval(): number {
    return this.getEnvNumber('WATCH_STEP_INTERVAL', 5000);
  }
  
  getWatchLocationUpdateInterval(): number {
    return this.getEnvNumber('WATCH_LOCATION_UPDATE_INTERVAL', 30000);
  }
  
  getRepeaterMeshUpdateInterval(): number {
    return this.getEnvNumber('REPEATER_MESH_UPDATE_INTERVAL', 120000);
  }
  
  getRepeaterMaxConnectedDevices(): number {
    return this.getEnvNumber('REPEATER_CONNECTED_DEVICES_MAX', 10);
  }
  
  isMetricsEnabled(): boolean {
    return this.getEnvBoolean('ENABLE_METRICS', true);
  }
  
  getMetricsInterval(): number {
    return this.getEnvNumber('METRICS_INTERVAL', 10000);
  }
}

export const config = Config.getInstance();