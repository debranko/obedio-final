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

// GET - Fetch security data from SQLite database
export async function GET(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'profiles') {
      // Get security profiles from database
      const profiles = await prisma.mqttSecurityProfile.findMany({
        include: {
          mqttDevices: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const transformedProfiles = profiles.map(profile => ({
        id: profile.id,
        name: profile.profileName,
        description: profile.description || 'Default security profile',
        level: 'standard', // Simplified for MVP
        permissions: {
          publish: ['status', 'telemetry'],
          subscribe: ['command'],
          connect: true
        },
        restrictions: {
          ipWhitelist: [],
          timeRestrictions: false,
          maxConnections: profile.maxConnections
        },
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        deviceCount: profile.mqttDevices.length
      }))

      return NextResponse.json({
        success: true,
        data: { profiles: transformedProfiles },
        message: 'Security profiles retrieved'
      })
    }

    if (type === 'credentials') {
      // Get device credentials from MQTT devices
      const devices = await prisma.mqttDevice.findMany({
        where: {
          mqttUsername: {
            not: null
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const credentials = devices.map(device => ({
        id: device.id,
        deviceName: device.deviceId,
        deviceType: device.deviceType,
        username: device.mqttUsername,
        password: device.mqttPasswordHash || '••••••••',
        isActive: device.isOnline,
        createdAt: device.createdAt,
        lastUsed: device.lastMqttActivity
      }))

      return NextResponse.json({
        success: true,
        data: { credentials },
        message: 'Device credentials retrieved'
      })
    }

    // Default security overview
    const deviceCount = await prisma.mqttDevice.count()
    const profileCount = await prisma.mqttSecurityProfile.count()
    const onlineDevices = await prisma.mqttDevice.count({
      where: { isOnline: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        profiles: profileCount,
        activeCredentials: deviceCount,
        securedDevices: onlineDevices,
        securityLevel: 'standard',
        lastSecurityScan: new Date().toISOString(),
        threatLevel: 'low'
      },
      message: 'Security overview retrieved'
    })
  } catch (error) {
    console.error('Error fetching MQTT security data from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MQTT security data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create/update security profile
export async function POST(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, name, description, level, maxConnections = 1 } = body

    if (type === 'profile') {
      // Create security profile in database
      const newProfile = await prisma.mqttSecurityProfile.create({
        data: {
          profileName: name,
          description: description || 'Security profile for MVP',
          aclPattern: 'obedio/+/+/#', // Standard pattern for MVP
          maxQos: 1,
          maxConnections: maxConnections,
          clientCertRequired: false // MVP uses password auth only
        }
      })

      return NextResponse.json({
        success: true,
        data: { profile: newProfile },
        message: 'Security profile created successfully'
      }, { status: 201 })
    }

    if (body.requestType === 'certificate') {
      // For MVP, we don't create real certificates, just return success
      return NextResponse.json({
        success: true,
        message: 'MVP uses password authentication only'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Operation completed'
    })
  } catch (error) {
    console.error('Error creating security profile:', error)
    return NextResponse.json(
      { error: 'Failed to create security profile' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}