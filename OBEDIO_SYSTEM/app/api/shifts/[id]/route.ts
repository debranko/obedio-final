import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'
import { DutyService } from '@/lib/services/duty-service'

// GET /api/shifts/[id] - Dohvatanje pojedinačne smene
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
    const id = Number(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid shift ID" },
        { status: 400 }
      )
    }
    
    // Dohvatanje smene sa informacijama o korisniku
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })
    
    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(shift)
  } catch (error) {
    console.error('Error fetching shift:', error)
    return NextResponse.json(
      { error: "Failed to fetch shift" },
      { status: 500 }
    )
  }
}

// PATCH /api/shifts/[id] - Završavanje smene
export async function PATCH(
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
        { error: "Invalid shift ID" },
        { status: 400 }
      )
    }
    
    const data = await request.json()
    const action = data.action
    
    // Dohvatanje smene
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { user: true }
    })
    
    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 }
      )
    }
    
    // Podržane akcije: 'end' (završavanje smene)
    if (action === 'end') {
      // Ako je smena već završena
      if (shift.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: "Cannot end shift that is not active" },
          { status: 400 }
        )
      }
      
      // Ako se prebacuju zahtevi drugom korisniku
      if (data.transferRequestsTo) {
        const targetUserId = Number(data.transferRequestsTo)
        const notes = data.transferNotes || ''
        
        if (!isNaN(targetUserId)) {
          // Prebacivanje svih zahteva
          await DutyService.transferAllRequests(shift.userId, targetUserId, notes)
        }
      }
      
      // Završavanje smene kroz DutyService
      const endedShift = await DutyService.endShift(shift.userId)
      return NextResponse.json(endedShift)
    }
    
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error updating shift:', error)
    return NextResponse.json(
      { error: error.message || "Failed to update shift" },
      { status: 500 }
    )
  }
}
