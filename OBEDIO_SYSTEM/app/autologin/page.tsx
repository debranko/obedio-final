'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

// Ova stranica automatski uloguje korisnika kao admin
// Koristi localStorage kao mehanizam autentikacije
export default function AutoLoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Podaci o korisniku - admin
    const userData = {
      id: 1,
      name: 'Admin User',
      email: 'admin@obedio.com',
      role: 'admin', 
      timestamp: new Date().toISOString()
    }
    
    // Čuvanje u localStorage
    localStorage.setItem('userData', JSON.stringify(userData))
    localStorage.setItem('authToken', `auto-auth-${Date.now()}`)
    
    console.log('Auto-login: Automatski ulogovan kao Admin')
    
    // Redirect na dashboard nakon 1 sekunde
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="text-xl font-bold">Auto-login kao Admin...</h1>
      </div>
      <p className="text-gray-500">Bićete preusmereni na dashboard za nekoliko trenutaka.</p>
    </div>
  )
}
