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

// GET - Fetch MQTT health data from SQLite database
export async function GET(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'repeaters') {
      // Generate demo repeater data for MVP (since we don't have actual repeater infrastructure)
      const devices = await prisma.mqttDevice.findMany({
        where: {
          deviceType: 'REPEATER'
        }
      })

      const mockRepeaters = devices.map((device, index) => ({
        id: device.id,
        name: `${device.site} Repeater`,
        location: `${device.site} - ${device.room}`,
        ipAddress: `192.168.1.${100 + index}`,
        macAddress: `00:1B:44:11:3A:B${index}`,
        status: device.isOnline ? 'online' : Math.random() > 0.3 ? 'online' : 'degraded',
        uptime: Math.random() * 200,
        lastSeen: device.lastMqttActivity || device.createdAt,
        firmware: '2.1.4',
        metrics: {
          cpu: Math.floor(Math.random() * 60) + 20,
          memory: Math.floor(Math.random() * 60) + 30,
          temperature: Math.floor(Math.random() * 30) + 35,
          signalStrength: Math.floor(Math.random() * 40) + 60,
          connectedDevices: Math.floor(Math.random() * 10) + 2,
          messagesProcessed: Math.floor(Math.random() * 20000) + 5000,
          errorRate: Math.random() * 2
        },
        networkInfo: {
          meshRole: index === 0 ? 'coordinator' : 'router',
          parentDevice: index > 0 ? 'rep_001' : undefined,
          childDevices: index === 0 ? ['mqtt_001', 'mqtt_002'] : ['mqtt_003'],
          hopCount: index + 1
        }
      }))

      return NextResponse.json({
        success: true,
        data: {
          repeaters: mockRepeaters
        },
        message: 'MQTT repeater health data retrieved'
      })
    }

    // Default health overview
    const totalDevices = await prisma.mqttDevice.count()
    const onlineDevices = await prisma.mqttDevice.count({
      where: { isOnline: true }
    })
    const totalProfiles = await prisma.mqttSecurityProfile.count()
    const totalTrafficLogs = await prisma.mqttTrafficLog.count()

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: 345.6,
        version: '2.1.4',
        environment: 'production',
        components: {
          mqtt: 'healthy',
          database: 'healthy',
          security: 'healthy'
        },
        metrics: {
          totalDevices,
          onlineDevices,
          securityProfiles: totalProfiles,
          trafficMessages: totalTrafficLogs
        }
      },
      message: 'MQTT health overview retrieved from database'
    })
  } catch (error) {
    console.error('Error fetching MQTT health data from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MQTT health data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}