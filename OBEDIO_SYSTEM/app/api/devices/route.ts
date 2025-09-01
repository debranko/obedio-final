import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'
import { headers } from 'next/headers'

// Authentication check helper function
async function checkAuth() {
  const session = await getSessionCookie()
  if (!session) {
    return { authorized: false, message: 'No session found' }
  }
  return { authorized: true }
}

// GET - Fetch devices with filtering and pagination
export async function GET(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Get pagination parameters with defaults
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Get filtering parameters
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const batteryFilter = searchParams.get('battery')
    
    // Construct the filter object
    const filter: any = {}
    
    if (search) {
      filter.OR = [
        { name: { contains: search } },
        { room: { contains: search } },
        { uid: { contains: search } }
      ]
    }
    
    if (type) {
      filter.type = type
    }
    
    if (isActive === 'true') {
      filter.isActive = true
    } else if (isActive === 'false') {
      filter.isActive = false
    }
    
    if (batteryFilter === 'lt:20') {
      filter.battery = { lt: 20 }
    }
    
    // Fetch devices with pagination and filters
    const [devices, totalCount] = await Promise.all([
      prisma.device.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy: { id: 'desc' }
      }),
      prisma.device.count({ where: filter })
    ])
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    
    // Return devices with metadata
    return NextResponse.json({
      devices,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

// POST - Create a new device
export async function POST(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Validate input
    if (!body.uid || !body.room) {
      return NextResponse.json(
        { error: 'UID and room are required' },
        { status: 400 }
      )
    }
    
    // Check if device with UID already exists
    const existingDevice = await prisma.device.findUnique({
      where: { uid: body.uid }
    })
    
    if (existingDevice) {
      return NextResponse.json(
        { error: 'Device with this UID already exists' },
        { status: 400 }
      )
    }
    
    // Create the device
    const device = await prisma.device.create({
      data: {
        uid: body.uid,
        name: body.name || null,
        room: body.room,
        locationId: body.locationId || null,
        type: body.type || 'BUTTON',
        battery: body.battery || 100,
        signal: body.signal || 100,
        isActive: body.isActive === false ? false : true
      }
    })
    
    return NextResponse.json({
      message: 'Device created successfully',
      device
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    )
  }
}
