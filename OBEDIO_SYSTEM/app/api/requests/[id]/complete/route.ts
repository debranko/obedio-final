import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'

// POST /api/requests/[id]/complete
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Provera autentikacije
  const session = getSessionCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const id = Number(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      )
    }
    
    // Provera da li zahtev postoji
    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            name: true,
            room: true,
          }
        },
        assignedUser: true
      }
    })
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      )
    }

    // Onemogućiti završavanje zahteva koji nije u obradi
    if (existingRequest.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: "Only requests in progress can be completed" },
        { status: 400 }
      )
    }
    
    // Ažuriranje statusa zahteva
    const completedRequest = await prisma.request.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            room: true,
          }
        },
        assignedUser: true
      }
    })
    
    // Emitovanje SSE događaja
    emitter.emitEvent(SSE_EVENTS.REQUEST_UPDATE, {
      requestId: completedRequest.id,
      deviceId: completedRequest.deviceId,
      deviceName: completedRequest.device.name,
      room: completedRequest.device.room,
      status: completedRequest.status,
      assignedTo: completedRequest.assignedTo,
      assignedName: completedRequest.assignedUser?.name || null,
      timestamp: completedRequest.timestamp.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    return NextResponse.json(completedRequest)
  } catch (error) {
    console.error('Error completing request:', error)
    return NextResponse.json(
      { error: "Failed to complete request" },
      { status: 500 }
    )
  }
}
