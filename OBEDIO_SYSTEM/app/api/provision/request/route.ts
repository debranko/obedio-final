import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionCookie } from '@/lib/auth'
import { ProvisionService } from '@/lib/services/provision-service'

// Zod shema za validaciju zahteva
const provisionRequestSchema = z.object({
  room: z.string().min(1, 'Soba je obavezno polje'),
  expiresInMinutes: z.number().int().positive().default(60).optional(),
})

export const dynamic = 'force-dynamic'

/**
 * POST /api/provision/request
 * Kreira novi token za provisioning uređaja
 */
export async function POST(request: NextRequest) {
  try {
    // Provera autentikacije
    const session = getSessionCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Provera da li korisnik ima prava da kreira token za provisioning
    if (session.role !== 'ADMIN' && session.role !== 'ENGINEER') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only ADMIN or ENGINEER can create provision tokens' },
        { status: 403 }
      )
    }
    
    // Parsiranje tela zahteva
    const body = await request.json()
    
    // Validacija pomoću Zod sheme
    const validationResult = provisionRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      )
    }
    
    const { room, expiresInMinutes = 60 } = validationResult.data
    
    // Kreiranje provision tokena
    const provisionToken = await ProvisionService.createProvisionToken(
      room,
      session.userId,
      expiresInMinutes
    )
    
    // Formatiranje odgovora
    const response = {
      id: provisionToken.id,
      token: provisionToken.token,
      room: provisionToken.room,
      expiresAt: provisionToken.expiresAt,
      qrPayload: JSON.parse(provisionToken.qrPayload), // Parsiranje JSON-a za lakše korišćenje na klijentu
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating provision token:', error)
    return NextResponse.json(
      { error: 'Failed to create provision token', details: error.message },
      { status: 500 }
    )
  }
}
