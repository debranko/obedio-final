import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSessionCookie } from '@/lib/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * POST /api/provision/tokens/[id]/delete
 * Soft-delete tokena za provisioning
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Provera autentikacije
    const session = getSessionCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Provera administratorskih prava
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only ADMIN can delete provision tokens' },
        { status: 403 }
      )
    }
    
    const tokenId = parseInt(params.id)
    if (isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 })
    }
    
    // Soft-delete tokena umesto stvarnog brisanja
    const updatedToken = await prisma.provisionToken.update({
      where: { id: tokenId },
      data: { status: 'DELETED' }
    })
    
    // Kreiranje loga za ovu akciju
    await prisma.provisionLog.create({
      data: {
        tokenId,
        action: 'DELETE',
        message: `Token soft-deleted by admin ${session.userId}`,
        metadata: JSON.stringify({ adminId: session.userId })
      }
    })
    
    return NextResponse.json({
      id: updatedToken.id,
      status: updatedToken.status,
      message: 'Token successfully deleted'
    })
  } catch (error: any) {
    console.error('Error deleting provision token:', error)
    
    // Specifične greške
    if (error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to delete provision token', details: error.message },
      { status: 500 }
    )
  }
}
