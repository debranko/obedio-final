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

// GET - Fetch MQTT traffic data from SQLite database
export async function GET(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get recent traffic logs from database
    const recentLogs = await prisma.mqttTrafficLog.findMany({
      take: 100,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        mqttDevice: true
      }
    })

    // Generate demo messages with some real data from database
    const messages = recentLogs.map((log, index) => ({
      id: `msg_${log.id}`,
      timestamp: log.timestamp.toISOString(),
      topic: log.topic,
      clientId: log.mqttDevice?.mqttClientId || 'unknown_client',
      qos: log.qos || 1,
      retain: false,
      payload: `{"deviceId":"${log.deviceId}","messageType":"${log.messageType}"}`,
      size: log.payloadSize,
      direction: log.direction as 'inbound' | 'outbound'
    }))

    // Generate demo traffic stats
    const totalDevices = await prisma.mqttDevice.count()
    const onlineDevices = await prisma.mqttDevice.count({
      where: { isOnline: true }
    })
    const totalMessages = await prisma.mqttTrafficLog.count()

    const stats = {
      totalMessages,
      messagesPerSecond: Math.random() * 5,
      totalBytes: totalMessages * 50, // Estimated
      bytesPerSecond: Math.random() * 200,
      connectedClients: onlineDevices,
      activeTopics: [
        'obedio/+/+/status',
        'obedio/+/+/telemetry', 
        'obedio/+/+/command'
      ]
    }

    return NextResponse.json({
      success: true,
      data: {
        messages,
        stats
      },
      message: 'MQTT traffic data retrieved from database'
    })
  } catch (error) {
    console.error('Error fetching MQTT traffic from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MQTT traffic data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}