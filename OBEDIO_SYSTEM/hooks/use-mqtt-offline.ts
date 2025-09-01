'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOnlineStatus } from '@/components/pwa/pwa-provider'

interface MQTTDevice {
  id: string
  name: string
  status: 'online' | 'offline'
  lastSeen: Date
  data?: any
}

interface MQTTMessage {
  topic: string
  payload: any
  timestamp: Date
  qos?: number
}

interface OfflineMQTTState {
  devices: MQTTDevice[]
  messages: MQTTMessage[]
  queuedCommands: any[]
  lastSync: Date | null
  isConnected: boolean
}

const MQTT_CACHE_KEY = 'obedio-mqtt-cache'
const MQTT_QUEUE_KEY = 'obedio-mqtt-queue'

export function useMQTTOffline() {
  const isOnline = useOnlineStatus()
  const [offlineState, setOfflineState] = useState<OfflineMQTTState>({
    devices: [],
    messages: [],
    queuedCommands: [],
    lastSync: null,
    isConnected: false
  })

  // Load cached data on mount
  useEffect(() => {
    loadCachedData()
  }, [])

  // Save data when offline state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MQTT_CACHE_KEY, JSON.stringify({
        ...offlineState,
        lastSync: offlineState.lastSync?.toISOString()
      }))
    }
  }, [offlineState])

  const loadCachedData = () => {
    if (typeof window === 'undefined') return

    try {
      const cached = localStorage.getItem(MQTT_CACHE_KEY)
      if (cached) {
        const parsedCache = JSON.parse(cached)
        setOfflineState({
          ...parsedCache,
          lastSync: parsedCache.lastSync ? new Date(parsedCache.lastSync) : null
        })
      }

      const queuedCommands = localStorage.getItem(MQTT_QUEUE_KEY)
      if (queuedCommands) {
        const commands = JSON.parse(queuedCommands)
        setOfflineState(prev => ({ ...prev, queuedCommands: commands }))
      }
    } catch (error) {
      console.error('[MQTT Offline] Failed to load cached data:', error)
    }
  }

  const updateDeviceStatus = useCallback((deviceId: string, status: 'online' | 'offline', data?: any) => {
    setOfflineState(prev => {
      const existingDeviceIndex = prev.devices.findIndex(d => d.id === deviceId)
      const device: MQTTDevice = {
        id: deviceId,
        name: data?.name || `Device ${deviceId}`,
        status,
        lastSeen: new Date(),
        data
      }

      let updatedDevices
      if (existingDeviceIndex >= 0) {
        updatedDevices = [...prev.devices]
        updatedDevices[existingDeviceIndex] = device
      } else {
        updatedDevices = [...prev.devices, device]
      }

      return {
        ...prev,
        devices: updatedDevices,
        lastSync: new Date()
      }
    })
  }, [])

  const addMessage = useCallback((topic: string, payload: any, qos = 0) => {
    const message: MQTTMessage = {
      topic,
      payload,
      timestamp: new Date(),
      qos
    }

    setOfflineState(prev => ({
      ...prev,
      messages: [message, ...prev.messages.slice(0, 99)], // Keep last 100 messages
      lastSync: new Date()
    }))
  }, [])

  const queueCommand = useCallback((command: any) => {
    if (!isOnline) {
      const queuedCommand = {
        ...command,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      }

      setOfflineState(prev => ({
        ...prev,
        queuedCommands: [...prev.queuedCommands, queuedCommand]
      }))

      // Save to localStorage immediately for persistence
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem(MQTT_QUEUE_KEY)
        const commands = existing ? JSON.parse(existing) : []
        commands.push(queuedCommand)
        localStorage.setItem(MQTT_QUEUE_KEY, JSON.stringify(commands))
      }

      return { queued: true, id: queuedCommand.id }
    }

    return { queued: false }
  }, [isOnline])

  const processQueuedCommands = useCallback(async () => {
    if (!isOnline || offlineState.queuedCommands.length === 0) {
      return
    }

    console.log('[MQTT Offline] Processing queued commands:', offlineState.queuedCommands.length)

    const successfulCommands: string[] = []
    const failedCommands: any[] = []

    for (const command of offlineState.queuedCommands) {
      try {
        // Send command to MQTT API
        const response = await fetch('/api/mqtt/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(command)
        })

        if (response.ok) {
          successfulCommands.push(command.id)
        } else {
          failedCommands.push(command)
        }
      } catch (error) {
        console.error('[MQTT Offline] Failed to process command:', error)
        failedCommands.push(command)
      }
    }

    // Update state to remove successful commands
    setOfflineState(prev => ({
      ...prev,
      queuedCommands: failedCommands
    }))

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(MQTT_QUEUE_KEY, JSON.stringify(failedCommands))
    }

    return {
      processed: successfulCommands.length,
      failed: failedCommands.length
    }
  }, [isOnline, offlineState.queuedCommands])

  const setConnectionStatus = useCallback((connected: boolean) => {
    setOfflineState(prev => ({ ...prev, isConnected: connected }))
  }, [])

  const clearCache = useCallback(() => {
    setOfflineState({
      devices: [],
      messages: [],
      queuedCommands: [],
      lastSync: null,
      isConnected: false
    })

    if (typeof window !== 'undefined') {
      localStorage.removeItem(MQTT_CACHE_KEY)
      localStorage.removeItem(MQTT_QUEUE_KEY)
    }
  }, [])

  const getDeviceStatus = useCallback((deviceId: string) => {
    const device = offlineState.devices.find(d => d.id === deviceId)
    return device || null
  }, [offlineState.devices])

  const getRecentMessages = useCallback((topic?: string, limit = 10) => {
    let messages = offlineState.messages
    
    if (topic) {
      messages = messages.filter(m => m.topic === topic || m.topic.includes(topic))
    }

    return messages.slice(0, limit)
  }, [offlineState.messages])

  // Auto-process queue when coming back online
  useEffect(() => {
    if (isOnline && offlineState.queuedCommands.length > 0) {
      processQueuedCommands()
    }
  }, [isOnline, processQueuedCommands, offlineState.queuedCommands.length])

  return {
    // State
    devices: offlineState.devices,
    messages: offlineState.messages,
    queuedCommands: offlineState.queuedCommands,
    lastSync: offlineState.lastSync,
    isConnected: offlineState.isConnected && isOnline,
    isOnline,
    
    // Actions
    updateDeviceStatus,
    addMessage,
    queueCommand,
    processQueuedCommands,
    setConnectionStatus,
    clearCache,
    getDeviceStatus,
    getRecentMessages,
    
    // Stats
    stats: {
      totalDevices: offlineState.devices.length,
      onlineDevices: offlineState.devices.filter(d => d.status === 'online').length,
      queuedCommands: offlineState.queuedCommands.length,
      cachedMessages: offlineState.messages.length
    }
  }
}

export function useMQTTDeviceStatus(deviceId: string) {
  const { getDeviceStatus, updateDeviceStatus } = useMQTTOffline()
  const device = getDeviceStatus(deviceId)

  return {
    device,
    isOnline: device?.status === 'online',
    lastSeen: device?.lastSeen,
    updateStatus: (status: 'online' | 'offline', data?: any) => 
      updateDeviceStatus(deviceId, status, data)
  }
}