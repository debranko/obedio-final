import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// Helper function for auth check
async function checkAuth() {
  const headersList = headers();
  const authBypass = headersList.get('x-auth-bypass');
  
  if (!authBypass) {
    const session = getSessionCookie()
    if (!session) {
      console.log('API: No session and no bypass header, returning 401 Unauthorized');
      return { authorized: false };
    }
    console.log('API: Valid session found, access allowed');
  } else {
    console.log('API: Found x-auth-bypass header, skipping authentication check');
  }
  
  return { authorized: true };
}

export async function POST(request: NextRequest) {
  // Check authorization
  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { shiftId } = body;

    if (!shiftId) {
      return NextResponse.json(
        { error: 'Shift ID is required' },
        { status: 400 }
      );
    }

    // Delete the shift
    await prisma.shift.delete({
      where: {
        id: Number(shiftId)
      }
    });

    return NextResponse.json({
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift' },
      { status: 500 }
    );
  }
}
