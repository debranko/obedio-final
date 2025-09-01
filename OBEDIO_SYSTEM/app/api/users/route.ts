import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/users - Dohvatanje svih korisnika
export async function GET(request: NextRequest) {
  // Provera autentikacije
  const session = getSessionCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Opcioni parametri za filtriranje
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    
    // Kreiranje upita sa opcionalnim filterima
    const where: any = {}
    
    if (role) {
      where.role = role
    }

    // Dohvatanje korisnika sa osnovnim informacijama
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Izbegnuti osetljive podatke poput lozinki
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
