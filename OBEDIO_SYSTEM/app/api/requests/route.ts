import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'
import { headers } from 'next/headers'
import { z } from 'zod'

// Schema za validaciju podataka kod kreiranja zahteva
const requestCreateSchema = z.object({
  deviceId: z.number().int().positive("ID uređaja mora biti pozitivan broj"),
  notes: z.string().optional(),
})

// Schema za validaciju podataka kod ažuriranja zahteva
const requestUpdateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assignedTo: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

// GET - Dohvatanje svih zahteva
export async function GET(request: NextRequest) {
  // Alternativna provera za x-auth-bypass header
  const headersList = headers();
  const authBypass = headersList.get('x-auth-bypass');
  
  // Standardna provera autentikacije ako nema bypass headera
  if (!authBypass) {
    const session = getSessionCookie()
    if (!session) {
      console.log('API Requests: Nema sesije i nema bypass headera, vraćam 401 Unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log('API Requests: Validna sesija pronađena, pristup dozvoljen');
  } else {
    console.log('API Requests: Pronađen x-auth-bypass header, preskačem proveru autentikacije');
  }

  try {
    // Parametri za filtriranje i paginaciju
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined
    const deviceId = searchParams.get('deviceId') 
      ? parseInt(searchParams.get('deviceId') || '0') 
      : undefined
    const assignedTo = searchParams.get('assignedTo') 
      ? parseInt(searchParams.get('assignedTo') || '0') 
      : undefined

    // Priprema filtera za pretragu
    const where: any = {}
    
    // Dodavanje filtera za status zahteva
    if (status) {
      where.status = status
    }
    
    // Dodavanje filtera za uređaj
    if (deviceId && !isNaN(deviceId)) {
      where.deviceId = deviceId
    }
    
    // Dodavanje filtera za asigniranog korisnika
    if (assignedTo && !isNaN(assignedTo)) {
      where.assignedTo = assignedTo
    }
    
    // Brojanje ukupnog broja rezultata (za paginaciju)
    const total = await prisma.request.count({ where })
    
    // Dohvatanje zahteva sa paginacijom
    const requests = await prisma.request.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            room: true,
            type: true,
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })
    
    // Priprema meta podataka za paginaciju
    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
    
    return NextResponse.json({ requests, meta })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom dohvatanja zahteva" },
      { status: 500 }
    )
  }
}

// POST - Kreiranje novog zahteva
export async function POST(request: NextRequest) {
  // Provera autentikacije
  const session = getSessionCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Validacija podataka
    const validation = requestCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validacija nije uspela", details: validation.error.format() },
        { status: 400 }
      )
    }
    
    // Provera postojanja uređaja
    const device = await prisma.device.findUnique({
      where: { id: validation.data.deviceId }
    })
    
    if (!device) {
      return NextResponse.json(
        { error: "Uređaj sa datim ID-om ne postoji" },
        { status: 404 }
      )
    }
    
    // Kreiranje novog zahteva
    const newRequest = await prisma.request.create({
      data: {
        deviceId: validation.data.deviceId,
        status: "PENDING",
        timestamp: new Date(),
        notes: validation.data.notes || "",
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
    
    // Emitovanje SSE događaja za novi zahtev
    emitter.emitEvent(SSE_EVENTS.NEW_REQUEST, {
      requestId: newRequest.id,
      deviceId: newRequest.deviceId,
      deviceName: newRequest.device.name,
      room: newRequest.device.room,
      timestamp: newRequest.timestamp,
    })
    
    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom kreiranja zahteva" },
      { status: 500 }
    )
  }
}
