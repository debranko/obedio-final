import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSessionCookie } from '@/lib/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/provision/tokens/history
 * Dohvata istoriju svih tokena za provisioning sa opcijom soft-delete filtriranja
 */
export async function GET(request: NextRequest) {
  try {
    // Provera autentikacije
    const session = getSessionCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Dohvatanje upita za filtriranje
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Izgradnja upita
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    // Dodajemo deleted filter ako je potrebno - ovo simulira soft-delete
    if (!includeDeleted) {
      where.status = {
        not: 'DELETED'
      }
    }
    
    // Dohvatanje tokena
    const [tokens, totalCount] = await Promise.all([
      prisma.provisionToken.findMany({
        where,
        include: {
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.provisionToken.count({ where })
    ])
    
    // Formatiranje odgovora
    const formattedTokens = tokens.map((token: any) => ({
      id: token.id,
      token: token.token,
      room: token.room,
      status: token.status,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      usedAt: token.usedAt,
      deviceId: token.deviceId,
      qrPayload: JSON.parse(token.qrPayload),
      logs: token.logs
    }))
    
    return NextResponse.json({
      tokens: formattedTokens,
      pagination: {
        total: totalCount,
        limit,
        offset
      }
    })
  } catch (error: any) {
    console.error('Error fetching provision tokens history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provision tokens history', details: error.message },
      { status: 500 }
    )
  }
}
