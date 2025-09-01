import * as mqtt from 'mqtt'
import { emitter, SSE_EVENTS } from '../lib/sseEmitter'
import { PrismaClient } from '@prisma/client'
import {
  handleDeviceStatus,
  handleDeviceHeartbeat,
  upsertDevice
} from '../lib/mqtt-handlers/device-handler'
import {
  handleButtonPress
} from '../lib/mqtt-handlers/request-handler'
import {
  handleProvisionRequest
} from '../lib/mqtt-handlers/provision-handler'

// Initialize Prisma client
const prisma = new PrismaClient()

// MQTT Topics
const TOPICS = {
  BUTTON_PRESS: 'obedio/device/+/press',
  BUTTON_STATUS: 'obedio/device/+/status',
  DEVICE_HEARTBEAT: 'obedio/device/+/heartbeat',
  SYSTEM: 'obedio/system/#',
  PROVISION: 'obedio/provision/request'
}

// MQTT connection parameters
const MQTT_HOST = process.env.MQTT_HOST || 'mqtt://localhost:1883'
const MQTT_OPTIONS = {
  clientId: `mqtt-bridge-${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
}

// Connect to MQTT broker
console.log(`Connecting to MQTT broker at ${MQTT_HOST}...`)
const client = mqtt.connect(MQTT_HOST, MQTT_OPTIONS)

// Connection event handlers
client.on('connect', () => {
  console.log('Connected to MQTT broker')
  
  // Subscribe to all relevant topics
  Object.values(TOPICS).forEach(topic => {
    client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`Subscribed to ${topic}`)
      } else {
        console.error(`Error subscribing to ${topic}:`, err)
      }
    })
  })
})

client.on('error', (error) => {
  console.error('MQTT connection error:', error)
})

client.on('close', () => {
  console.log('MQTT connection closed')
})

// Handle incoming messages
client.on('message', async (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`)
  
  try {
    // Parse message as JSON
    const payload = JSON.parse(message.toString())
    
    // Extract device ID from topic
    const deviceIdMatch = topic.match(/obedio\/device\/([^\/]+)\//)
    const deviceId = deviceIdMatch ? deviceIdMatch[1] : null
    
    // Handle different topic patterns
    if (topic.match(TOPICS.BUTTON_PRESS.replace('+', '.*'))) {
      // Koristimo importovanu funkciju iz request-handler-a
      if (deviceId) {
        await handleButtonPress(deviceId, payload)
      }
    } else if (topic.match(TOPICS.BUTTON_STATUS.replace('+', '.*'))) {
      // Koristimo importovanu funkciju iz device-handler-a
      if (deviceId) {
        await handleDeviceStatus(deviceId, payload)
      }
    } else if (topic.match(TOPICS.DEVICE_HEARTBEAT.replace('+', '.*'))) {
      // Koristimo importovanu funkciju iz device-handler-a
      if (deviceId) {
        await handleDeviceHeartbeat(deviceId)
      }
    } else if (topic === TOPICS.PROVISION) {
      // Obradi provisioning zahtev
      const result = await handleProvisionRequest(payload)
      
      // Pošalji odgovor nazad uređaju ako postoji deviceId u payload-u
      if (payload.replyTopic) {
        const responseTopic = payload.replyTopic
        client.publish(responseTopic, JSON.stringify(result))
        console.log(`Published provision response to ${responseTopic}:`, result)
      }
    } else if (topic.match(TOPICS.SYSTEM.replace('#', '.*'))) {
      await handleSystemMessage(topic, payload)
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error)
  }
})

// Napomena: Handler funkcija je uklonjena odavde i prebačena u lib/mqtt-handlers/request-handler.ts

// Napomena: Handler funkcija je uklonjena odavde i prebačena u lib/mqtt-handlers/device-handler.ts

// Napomena: Handler funkcija je uklonjena odavde i prebačena u lib/mqtt-handlers/device-handler.ts

// Handler for system-wide messages
async function handleSystemMessage(topic: string, payload: any) {
  console.log(`Processing system message on topic ${topic}`)
  
  // For system status updates
  if (topic.endsWith('/status')) {
    try {
      // Get system statistics
      const [totalDevices, onlineDevices, lowBatteryDevices, activeRequests] = await Promise.all([
        prisma.device.count(),
        prisma.device.count({
          where: {
            lastSeen: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Online in last 5 minutes
            }
          }
        }),
        prisma.device.count({
          where: { battery: { lt: 20 } } // Low battery threshold
        }),
        prisma.request.count({
          where: { status: 'PENDING' }
        })
      ])
      
      // Emit system status event
      emitter.emitEvent(SSE_EVENTS.SYSTEM_STATUS, {
        onlineDevices,
        totalDevices,
        lowBatteryDevices,
        activeRequests,
      })
      
      console.log('Emitted system status update')
    } catch (error) {
      console.error('Error processing system status update:', error)
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('MQTT Bridge shutting down...')
  client.end()
  prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('MQTT Bridge shutting down...')
  client.end()
  prisma.$disconnect()
  process.exit(0)
})

console.log('MQTT Bridge running...')
