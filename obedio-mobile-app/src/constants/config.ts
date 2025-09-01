import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  // For local development - using actual local IP
  BASE_URL: __DEV__ ? 'http://10.90.0.66:3000/api' : 'https://your-production-api.com/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'OBEDIO Mobile',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  BUILD_NUMBER: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
};

// Navigation Configuration
export const NAVIGATION_CONFIG = {
  INITIAL_ROUTE: 'Dashboard',
  TAB_BAR_HEIGHT: 80,
};

// Theme Colors
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  accent: '#FF6B35',
};

// Dark Theme Colors
export const DARK_COLORS = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  accent: '#FF6B35',
};

// Status Colors
export const STATUS_COLORS = {
  PENDING: '#FF9500',
  IN_PROGRESS: '#007AFF',
  COMPLETED: '#34C759',
  CANCELLED: '#8E8E93',
  online: '#34C759',
  offline: '#FF3B30',
  lowBattery: '#FF9500',
  critical: '#FF3B30',
};

// Device Types
export const DEVICE_TYPES = {
  BUTTON: 'Button',
  SMART_WATCH: 'Smart Watch',
  REPEATER: 'Repeater',
} as const;

// Request Status
export const REQUEST_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

// Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  DASHBOARD: 30000, // 30 seconds
  REQUESTS: 15000,  // 15 seconds
  DEVICES: 60000,   // 1 minute
  CREW: 120000,     // 2 minutes
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Notification Settings
export const NOTIFICATIONS = {
  ENABLED: true,
  SOUND: true,
  VIBRATION: true,
  BADGE: true,
};