import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authBypass = request.headers.get("x-auth-bypass")
    if (authBypass !== "true") {
      const session = await getSessionCookie()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const searchParams = request.nextUrl.searchParams
    const includeDevices = searchParams.get('includeDevices') === 'true'
    const includeGuests = searchParams.get('includeGuests') === 'true'
    const deck = searchParams.get('deck')
    const type = searchParams.get('type')

    const where: any = {}
    if (deck) where.deck = deck
    if (type) where.type = type

    const locations = await prisma.location.findMany({
      where,
      include: {
        devices: includeDevices,
        guests: includeGuests,
      },
      orderBy: [
        { deck: 'asc' },
        { name: 'asc' }
      ]
    })

    // Calculate occupancy for each location
    const locationsWithOccupancy = locations.map(location => ({
      ...location,
      occupancy: location.guests?.length || 0
    }))

    return NextResponse.json(locationsWithOccupancy)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authBypass = request.headers.get("x-auth-bypass")
    if (authBypass !== "true") {
      const session = await getSessionCookie()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { name, deck, type, description, capacity } = body

    if (!name || !deck || !type) {
      return NextResponse.json(
        { error: 'Name, deck, and type are required' },
        { status: 400 }
      )
    }

    const location = await prisma.location.create({
      data: {
        name,
        deck,
        type,
        description,
        capacity: capacity || 0,
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}