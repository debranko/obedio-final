'use client'

import { useState, useEffect } from 'react'
import { SSE_EVENTS } from '@/lib/sseEmitter'

interface EventSourceHookOptions {
  retry?: boolean
  retryInterval?: number
  onConnected?: () => void
  onError?: (error: Event) => void
}

// Custom hook for SSE connection
export function useEventSource<T = any>(
  eventType: string,
  handler: (data: T) => void,
  options: EventSourceHookOptions = {}
) {
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Event | null>(null)

  // Default options
  const {
    retry = true,
    retryInterval = 5000,
    onConnected,
    onError,
  } = options

  // Track if we need to attempt reconnection
  const [shouldReconnect, setShouldReconnect] = useState(false)
  const [reconnectTimeoutId, setReconnectTimeoutId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing reconnect timeout when component unmounts or dependencies change
    return () => {
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId) 
      }
    }
  }, [])

  // Main effect to create and manage EventSource
  useEffect(() => {
    // Don't create a new connection if we're not supposed to reconnect yet
    if (eventSource !== null) {
      return
    }

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    // URL for the SSE endpoint
    const sseUrl = process.env.NEXT_PUBLIC_SSE_URL || '/api/events/stream'
    
    // Create EventSource - only available in browser
    const es = new EventSource(sseUrl)
    setEventSource(es)
    setShouldReconnect(false) // Reset reconnect flag

    // Handle connection open
    es.onopen = () => {
      console.log('SSE connection opened')
      setConnected(true)
      setError(null)
      onConnected?.()
    }

    // Handle connection error
    es.onerror = (e) => {
      console.error('SSE connection error:', e)
      setConnected(false)
      setError(e)
      onError?.(e)
      
      // Close the EventSource
      es.close()
      setEventSource(null)
      
      // Signal that we should attempt reconnection if configured
      if (retry) {
        setShouldReconnect(true)
      }
    }

    // Handle connected event
    es.addEventListener('connected', (e: MessageEvent) => {
      console.log('SSE connected event:', e.data)
      setConnected(true)
      setError(null)
    })

    // Handle specific event type
    es.addEventListener(eventType, (e: MessageEvent) => {
      try {
        const parsedData = JSON.parse(e.data)
        handler(parsedData)
      } catch (error) {
        console.error(`Error parsing SSE ${eventType} event data:`, error)
      }
    })

    // Cleanup
    return () => {
      console.log('Cleaning up SSE connection')
      es.close()
    }
  }, [eventType, handler, eventSource, onConnected, onError])
  
  // Separate effect for handling reconnection logic
  useEffect(() => {
    if (shouldReconnect && retry) {
      console.log(`Scheduling SSE reconnection in ${retryInterval}ms...`)
      const timeoutId = setTimeout(() => {
        console.log('Attempting SSE reconnection...')
        setShouldReconnect(false)
        // Setting eventSource to null will trigger the main effect to create a new connection
        setEventSource(null)
      }, retryInterval)
      
      setReconnectTimeoutId(timeoutId)
      
      return () => clearTimeout(timeoutId)
    }
  }, [shouldReconnect, retry, retryInterval])

  return { connected, error }
}

// Helper hooks for specific event types
export function useNewRequestEvents(handler: (data: any) => void, options?: EventSourceHookOptions) {
  return useEventSource(SSE_EVENTS.NEW_REQUEST, handler, options)
}

export function useDeviceUpdateEvents(handler: (data: any) => void, options?: EventSourceHookOptions) {
  return useEventSource(SSE_EVENTS.DEVICE_UPDATE, handler, options)
}

export function useSystemStatusEvents(handler: (data: any) => void, options?: EventSourceHookOptions) {
  return useEventSource(SSE_EVENTS.SYSTEM_STATUS, handler, options)
}

export function useDeviceAddedEvents(handler: (data: any) => void, options?: EventSourceHookOptions) {
  return useEventSource(SSE_EVENTS.DEVICE_ADDED, handler, options)
}
