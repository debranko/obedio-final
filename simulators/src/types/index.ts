export interface DeviceConfig {
  deviceId: string;
  site: string;
  room: string;
  deviceType: 'button' | 'watch' | 'repeater' | 'generic';
  name?: string;
  mqttClientId?: string;
  firmware?: string;
  model?: string;
}

export interface MqttConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientIdPrefix: string;
  keepAlive: number;
  cleanSession: boolean;
  reconnectPeriod: number;
  connectTimeout: number;
  tls?: {
    enabled: boolean;
    certPath?: string;
    keyPath?: string;
    caPath?: string;
    rejectUnauthorized: boolean;
  };
}

export interface DeviceStatus {
  battery: number;
  signal: number;
  isOnline: boolean;
  lastSeen: Date;
  temperature?: number;
  humidity?: number;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
}

export interface DeviceMetrics {
  uptime: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  reconnections: number;
  lastError?: string;
  memoryUsage?: number;
}

export interface SimulatorConfig {
  heartbeatInterval: number;
  statusUpdateInterval: number;
  batteryDrainRate: number;
  signalFluctuationRange: number;
  enableRandomEvents: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ButtonDeviceConfig extends DeviceConfig {
  deviceType: 'button';
  pressInterval: {
    min: number;
    max: number;
  };
  doublePressThreshold: number;
  longPressThreshold: number;
  emergencyPressEnabled: boolean;
}

export interface WatchDeviceConfig extends DeviceConfig {
  deviceType: 'watch';
  heartRate: {
    min: number;
    max: number;
    variability: number;
  };
  stepInterval: number;
  locationUpdateInterval: number;
  healthMonitoring: boolean;
}

export interface RepeaterDeviceConfig extends DeviceConfig {
  deviceType: 'repeater';
  meshUpdateInterval: number;
  maxConnectedDevices: number;
  coverageArea: string;
  frequencies: string[];
  powerSource: 'AC' | 'UPS' | 'Battery';
}

export type AnyDeviceConfig = ButtonDeviceConfig | WatchDeviceConfig | RepeaterDeviceConfig | DeviceConfig;

export interface DeviceEvent {
  type: 'press' | 'voice_ready' | 'heartbeat' | 'fall_detected' | 'emergency' | 'health' | 'mesh_update';
  timestamp: Date;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface MqttMessage {
  topic: string;
  payload: string | Buffer;
  qos: 0 | 1 | 2;
  retain?: boolean;
}

export interface ProvisioningRequest {
  token: string;
  deviceType: string;
  battery?: number;
  signal?: number;
  firmware?: string;
  model?: string;
  ipAddress?: string;
}

export interface ProvisioningResponse {
  success: boolean;
  deviceId?: number;
  deviceUid?: string;
  room?: string;
  error?: string;
  details?: string;
}

export interface LoadTestConfig {
  duration: number;
  rampUpTime: number;
  maxDevices: number;
  messageRate: number;
  deviceTypes: Array<'button' | 'watch' | 'repeater'>;
  scenario: 'basic' | 'stress' | 'endurance' | 'burst';
}

export interface LifecycleTestConfig {
  cycles: number;
  connectDuration: number;
  disconnectDuration: number;
  deviceCount: number;
  validateMessages: boolean;
}

export interface SeedDataConfig {
  sites: Array<{
    name: string;
    rooms: string[];
  }>;
  deviceCounts: {
    button: number;
    watch: number;
    repeater: number;
  };
  securityProfiles: Array<{
    name: string;
    aclPattern: string;
    maxQos: number;
    maxConnections: number;
  }>;
  users: Array<{
    name: string;
    email: string;
    role: string;
  }>;
}

export interface SimulatorState {
  isRunning: boolean;
  startTime: Date;
  devices: Map<string, any>;
  metrics: DeviceMetrics;
  errors: string[];
  lastHeartbeat: Date;
}

export interface DatabaseSeedResult {
  devices: number;
  mqttDevices: number;
  securityProfiles: number;
  trafficLogs: number;
  certificates: number;
  users: number;
  locations: number;
}