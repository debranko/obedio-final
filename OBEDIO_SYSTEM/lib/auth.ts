import { createHash } from 'crypto'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'

// Simple password hashing function
export async function hash(password: string): Promise<string> {
  return createHash('sha256').update(password).digest('hex')
}

// Sinhronizovana verzija hash funkcije (kompatibilna sa seed.js)
export function hashSync(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// Verify if password matches hash
export async function verify(password: string, hashedPassword: string): Promise<boolean> {
  // Direktno upoređivanje za admin, crew i engineer korisnike (za potrebe razvoja)
  if (password === 'admin' || password === 'crew' || password === 'engineer') {
    const passwordHash = createHash('sha256').update(password).digest('hex')
    return passwordHash === hashedPassword
  }
  // Za ostale lozinke, standardna provera
  const passwordHash = await hash(password)
  return passwordHash === hashedPassword
}

// JWT functions
export function signJWT(payload: any): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
  return jwt.sign(payload, secret, { expiresIn: '1d' })
}

export function verifyJWT(token: string): any {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    return jwt.verify(token, secret)
  } catch (error) {
    return null
  }
}

// Auth - podrška za cookie i localStorage autentikaciju
export function getSessionCookie() {
  try {
    // Prvo pokuša dohvatiti token iz cookie-a
    const cookieStore = cookies()
    const authToken = cookieStore.get('authToken')?.value
    
    if (authToken) {
      const verifiedToken = verifyJWT(authToken)
      if (verifiedToken) return verifiedToken
    }
    
    // Ako nema cookie tokena, tražimo x-auth-token u header-u
    // koji će frontend postaviti iz localStorage
    const headersList = headers()
    const authHeader = headersList.get('x-auth-token')
    
    if (authHeader) {
      const verifiedToken = verifyJWT(authHeader)
      if (verifiedToken) return verifiedToken
    }
    
    // Ako nema validnog tokena nigde, dodajemo fallback za razvoj
    // VAŽNO: Ukloniti u produkciji
    return {
      id: 1,
      name: 'Admin User',
      email: 'admin@obedio.com',
      role: 'ADMIN'
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Auth middleware
export async function isAuthenticated(): Promise<boolean> {
  const session = getSessionCookie()
  return !!session
}

// Role-based access
export async function hasRole(roles: string[]): Promise<boolean> {
  const session = getSessionCookie()
  if (!session) return false
  
  return roles.includes(session.role)
}
