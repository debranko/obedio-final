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

export async function GET(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch MQTT devices directly from SQLite database
    const mqttDevices = await prisma.mqttDevice.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the UI expectations
    const transformedDevices = mqttDevices.map((device) => ({
      id: device.id,
      clientId: device.mqttClientId || device.deviceId,
      name: device.deviceId, // Using deviceId as name for now
      type: device.deviceType.toUpperCase(),
      status: device.isOnline ? 'online' : 'offline',
      site: device.site,
      room: device.room,
      lastSeen: device.lastMqttActivity || device.createdAt,
      battery: Math.floor(Math.random() * 100), // Demo data
      signal: Math.floor(Math.random() * 100), // Demo data
      firmware: '2.1.4', // Demo version
      createdAt: device.createdAt
    }))

    return NextResponse.json({ 
      devices: transformedDevices,
      total: transformedDevices.length 
    })
  } catch (error) {
    console.error('Error fetching MQTT devices from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices from database' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, deviceType, site, room, clientId, username, password } = body

    // Create new MQTT device in SQLite database
    const newDevice = await prisma.mqttDevice.create({
      data: {
        deviceId: clientId || `obedio_${Date.now()}`,
        deviceType: deviceType.toUpperCase(),
        mqttClientId: clientId || `obedio_${Date.now()}`,
        site: site || 'main',
        room: room || 'unknown',
        isOnline: false,
        mqttUsername: username,
        mqttPasswordHash: password // In production, this should be hashed
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        device: {
          id: newDevice.id,
          clientId: newDevice.mqttClientId,
          name: newDevice.deviceId,
          type: newDevice.deviceType,
          status: newDevice.isOnline ? 'online' : 'offline',
          site: newDevice.site,
          room: newDevice.room,
          createdAt: newDevice.createdAt
        }
      },
      message: 'Device created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating MQTT device:', error)
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}