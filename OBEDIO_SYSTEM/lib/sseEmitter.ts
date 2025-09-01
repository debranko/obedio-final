import { EventEmitter } from 'events'

// Create a singleton event emitter
class SSEEmitter extends EventEmitter {
  private static instance: SSEEmitter

  private constructor() {
    super()
    // Increase max event listeners to avoid memory leak warnings
    this.setMaxListeners(100)
  }

  public static getInstance(): SSEEmitter {
    if (!SSEEmitter.instance) {
      SSEEmitter.instance = new SSEEmitter()
    }
    return SSEEmitter.instance
  }

  // Method to emit events with specific payload
  public emitEvent(eventName: string, data: any): void {
    this.emit(eventName, data)
    console.log(`SSE Event emitted: ${eventName}`, data)
  }
}

// Export singleton instance
export const emitter = SSEEmitter.getInstance()

// Event names constants
export const SSE_EVENTS = {
  NEW_REQUEST: 'new_request',
  DEVICE_UPDATE: 'device_update',
  SYSTEM_STATUS: 'system_status',
  DEVICE_ADDED: 'device_added',
  REQUEST_UPDATE: 'request_update',
  SHIFT_UPDATE: 'shift_update',
}

// Event payload types
export interface DeviceUpdateEvent {
  deviceId: number
  uid: string
  battery: number
  signal: number
  lastSeen: string
}

export interface NewRequestEvent {
  requestId: number
  deviceId: number
  deviceName: string
  room: string
  timestamp: string
}

export interface SystemStatusEvent {
  onlineDevices: number
  totalDevices: number
  lowBatteryDevices: number
  activeRequests: number
}

export interface DeviceAddedEvent {
  deviceId: number
  uid: string
  name: string
  room: string
}
