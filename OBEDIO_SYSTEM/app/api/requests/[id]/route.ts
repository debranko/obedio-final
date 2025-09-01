import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'
import { z } from 'zod'

// Schema za validaciju podataka kod ažuriranja zahteva
const requestUpdateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assignedTo: z.number().int().positive().nullable().optional(),
  notes: z.string().optional(),
})

// GET - Dohvatanje pojedinačnog zahteva
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Provera autentikacije
  const session = getSessionCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Nevažeći ID zahteva" }, { status: 400 })
    }

    // Dohvatanje zahteva
    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            room: true,
            type: true,
            battery: true,
            signalStrength: true,
            lastSeen: true,
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    })

    if (!request) {
      return NextResponse.json({ error: "Zahtev nije pronađen" }, { status: 404 })
    }

    return NextResponse.json(request)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom dohvatanja zahteva" },
      { status: 500 }
    )
  }
}

// PUT - Ažuriranje zahteva
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Provera autentikacije
  const session = getSessionCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Nevažeći ID zahteva" }, { status: 400 })
    }

    // Provera postojanja zahteva
    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            name: true,
            room: true,
          }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: "Zahtev nije pronađen" }, { status: 404 })
    }

    const body = await request.json()
    
    // Validacija podataka
    const validation = requestUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validacija nije uspela", details: validation.error.format() },
        { status: 400 }
      )
    }

    // Ako se menja assignedTo, provera korisnika
    if (validation.data.assignedTo !== undefined) {
      if (validation.data.assignedTo !== null) {
        const user = await prisma.user.findUnique({
          where: { id: validation.data.assignedTo }
        })
        
        if (!user) {
          return NextResponse.json(
            { error: "Korisnik sa datim ID-om ne postoji" },
            { status: 404 }
          )
        }
      }
    }

    // Ažuriranje zahteva
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: validation.data,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        device: {
          select: {
            id: true,
            name: true,
            room: true,
          }
        }
      }
    })

    // Emitovanje SSE događaja za ažuriranje zahteva
    emitter.emitEvent(SSE_EVENTS.REQUEST_UPDATE, {
      requestId: updatedRequest.id,
      deviceId: updatedRequest.deviceId,
      deviceName: updatedRequest.device.name,
      room: updatedRequest.device.room,
      status: updatedRequest.status,
      assignedTo: updatedRequest.assignedTo,
      assignedName: updatedRequest.assignedUser?.name || null,
      timestamp: updatedRequest.timestamp,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom ažuriranja zahteva" },
      { status: 500 }
    )
  }
}

// DELETE - Otkazivanje zahteva
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Provera autentikacije
  const session = getSessionCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Nevažeći ID zahteva" }, { status: 400 })
    }

    // Provera postojanja zahteva
    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            name: true,
            room: true,
          }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: "Zahtev nije pronađen" }, { status: 404 })
    }

    // Umesto brisanja, menjamo status u CANCELLED
    const cancelledRequest = await prisma.request.update({
      where: { id },
      data: { 
        status: "CANCELLED",
        assignedTo: null, // Uklanjamo asignaciju
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            room: true,
          }
        }
      }
    })

    // Emitovanje SSE događaja za otkazivanje zahteva
    emitter.emitEvent(SSE_EVENTS.REQUEST_UPDATE, {
      requestId: cancelledRequest.id,
      deviceId: cancelledRequest.deviceId,
      deviceName: cancelledRequest.device.name,
      room: cancelledRequest.device.room,
      status: "CANCELLED",
      assignedTo: null,
      assignedName: null,
      timestamp: cancelledRequest.timestamp,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ 
      message: "Zahtev je uspešno otkazan",
      id: cancelledRequest.id 
    })
  } catch (error) {
    console.error('Error cancelling request:', error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom otkazivanja zahteva" },
      { status: 500 }
    )
  }
}
