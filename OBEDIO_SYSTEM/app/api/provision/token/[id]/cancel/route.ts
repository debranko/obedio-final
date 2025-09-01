import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/auth'
import { ProvisionService } from '@/lib/services/provision-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/provision/token/[id]/cancel
 * Otkazuje token za provisioning
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
    
    const tokenId = parseInt(params.id)
    if (isNaN(tokenId)) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 })
    }
    
    // Otkazivanje tokena
    const cancelledToken = await ProvisionService.cancelToken(tokenId)
    
    return NextResponse.json({
      id: cancelledToken.id,
      status: cancelledToken.status,
      message: 'Token successfully cancelled'
    })
  } catch (error: any) {
    console.error('Error cancelling provision token:', error)
    
    // Specifične greške
    if (error.message === 'Token not found') {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }
    
    if (error.message.includes('Cannot cancel token with status')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel provision token', details: error.message },
      { status: 500 }
    )
  }
}
