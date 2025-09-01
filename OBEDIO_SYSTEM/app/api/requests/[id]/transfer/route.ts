import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'

// POST /api/requests/[id]/transfer
// Prebacivanje zahteva na drugog korisnika
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
    
    const data = await request.json()
    const targetUserId = Number(data.targetUserId)
    
    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "Target user ID is required" },
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

    // Provera da li ciljani korisnik postoji
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      )
    }
    
    // Možemo prebaciti samo zahteve u statusu 'PENDING' ili 'IN_PROGRESS'
    if (existingRequest.status !== 'PENDING' && existingRequest.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: "Only pending or in progress requests can be transferred" },
        { status: 400 }
      )
    }

    // Zapisati u notes ko je prebacio i dodatni komentar ako postoji
    const sourceUserName = session.name
    const notes = data.notes || ''
    const transferNote = `${new Date().toISOString()} - ${sourceUserName} transferred to ${targetUser.name}${notes ? ': ' + notes : ''}`
    
    const updatedNotes = existingRequest.notes
      ? `${existingRequest.notes}\n${transferNote}`
      : transferNote
    
    // Ažuriranje statusa zahteva
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        assignedTo: targetUserId,
        notes: updatedNotes
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
      requestId: updatedRequest.id,
      deviceId: updatedRequest.deviceId,
      deviceName: updatedRequest.device.name,
      room: updatedRequest.device.room,
      status: updatedRequest.status,
      assignedTo: updatedRequest.assignedTo,
      assignedName: updatedRequest.assignedUser?.name || null,
      timestamp: updatedRequest.timestamp.toISOString(),
      updatedAt: new Date().toISOString(),
      transferredBy: sourceUserName,
      transferredTo: targetUser.name
    })
    
    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error transferring request:', error)
    return NextResponse.json(
      { error: "Failed to transfer request" },
      { status: 500 }
    )
  }
}
