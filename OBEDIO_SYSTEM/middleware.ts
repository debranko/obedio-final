import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export function middleware(request: NextRequest) {
  // PRIVREMENO: Zaobići autentikaciju za potrebe debugovanja i razvoja
  // Ovo ćemo kasnije ukloniti i vratiti standardnu autentikaciju
  
  // NAPOMENA: Ovo je privremeni workaround koji omogućava rad sa aplikacijom
  // Ova modifikacija ne bi trebala biti u produkciji!
  
  // Putanje koje ne zahtevaju autentikaciju
  const publicPaths = [
    '/', 
    '/api/auth/login', 
    '/api/auth/logout',
    '/direct-login',
    '/bypass',
    '/dashboard',  // PRIVREMENO - dozvoliti direktan pristup dashboardu
    '/devices',    // PRIVREMENO - dozvoliti direktan pristup devices stranici
    '/tokens'      // PRIVREMENO - dozvoliti direktan pristup tokens stranici
  ]
  
  // Assets i API putanje koje ne zahtevaju autentikaciju
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('/api/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Provera da li je putanja javna
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // PRIVREMENO: Preskačemo proveru autentikacije za razvoj
  // Ovo će omogućiti rad sa localStorage autentikacijom
  return NextResponse.next()
  
  /* DISABLE FOR NOW: Original code below
  // Get auth token from cookie
  const authToken = request.cookies.get('authToken')?.value

  // If no token and trying to access protected route, redirect to login
  if (!authToken) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  // Verify JWT token
  const decodedToken = verifyJWT(authToken)

  // If token is invalid, redirect to login
  if (!decodedToken) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }
  */

  // Token is valid, proceed
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
