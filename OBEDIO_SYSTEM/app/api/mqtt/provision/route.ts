import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Authentication check helper function
async function checkAuth() {
  const session = await getSessionCookie()
  if (!session) {
    return { authorized: false, message: 'No session found' }
  }
  return { authorized: true }
}

// Helper function to generate secure passwords
function generateSecurePassword() {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.json()
    const { name, type, site, room, description, securityProfile } = formData
    
    // Generate device identifiers
    const deviceId = `${type.toLowerCase()}_${Date.now()}`
    const clientId = `obedio_${deviceId}`
    const username = `${type.toLowerCase()}_${name.toLowerCase().replace(/\s+/g, '_')}`
    const password = generateSecurePassword()
    
    // Create new MQTT device in SQLite database
    const newDevice = await prisma.mqttDevice.create({
      data: {
        deviceId,
        deviceType: type.toUpperCase(),
        mqttClientId: clientId,
        site: site || 'main',
        room: room || 'unknown',
        isOnline: false,
        mqttUsername: username,
        mqttPasswordHash: password, // In production, this should be hashed
        deviceMetadata: JSON.stringify({
          name,
          description: description || '',
          securityProfile: securityProfile || 'standard'
        })
      }
    })

    // Generate MQTT topics for the device
    const topics = {
      command: `obedio/${site}/${room}/${deviceId}/command`,
      telemetry: `obedio/${site}/${room}/${deviceId}/telemetry`,
      status: `obedio/${site}/${room}/${deviceId}/status`
    }

    // Return provisioning data for QR code generation
    const provisioningData = {
      deviceId: newDevice.deviceId,
      clientId: newDevice.mqttClientId,
      username: newDevice.mqttUsername,
      password: password,
      mqttHost: 'mqtt.obedio.local', // Demo hostname
      mqttPort: 1883, // Standard MQTT port for MVP (non-TLS)
      topics
    }

    return NextResponse.json(provisioningData)
  } catch (error) {
    console.error('Error provisioning device in database:', error)
    return NextResponse.json(
      { error: 'Failed to provision device' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}