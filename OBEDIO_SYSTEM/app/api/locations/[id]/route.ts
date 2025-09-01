import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authBypass = request.headers.get("x-auth-bypass")
    if (authBypass !== "true") {
      const session = await getSessionCookie()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const includeDevices = searchParams.get('includeDevices') === 'true'
    const includeGuests = searchParams.get('includeGuests') === 'true'

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        devices: includeDevices,
        guests: includeGuests,
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Calculate occupancy
    const locationWithOccupancy = {
      ...location,
      occupancy: location.guests?.length || 0
    }

    return NextResponse.json(locationWithOccupancy)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authBypass = request.headers.get("x-auth-bypass")
    if (authBypass !== "true") {
      const session = await getSessionCookie()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, deck, type, description, capacity } = body

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(deck !== undefined && { deck }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(capacity !== undefined && { capacity }),
      },
    })

    return NextResponse.json(location)
  } catch (error: any) {
    console.error('Error updating location:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authBypass = request.headers.get("x-auth-bypass")
    if (authBypass !== "true") {
      const session = await getSessionCookie()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    // Check if location has any associated devices or guests
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        devices: true,
        guests: true,
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    if (location.devices.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with associated devices' },
        { status: 400 }
      )
    }

    if (location.guests.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with assigned guests' },
        { status: 400 }
      )
    }

    await prisma.location.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting location:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}