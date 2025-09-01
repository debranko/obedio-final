'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BypassPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Direktno postavljanje mock podataka u localStorage
    const userData = {
      id: 1,
      name: 'Admin User',
      email: 'admin@obedio.com',
      role: 'ADMIN'
    }
    
    // Postavi podatke u localStorage
    localStorage.setItem('userData', JSON.stringify(userData))
    
    // Postavimo cookie vrednost
    document.cookie = `authToken=bypass-token-admin; path=/; max-age=86400`
    
    console.log('Bypass authentication successful')
    
    // Redirect na dashboard nakon 1 sekunde
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1000)
  }, [])
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Autentikacija u toku...</h1>
        <p>Bićete preusmereni na dashboard za nekoliko trenutaka.</p>
      </div>
    </div>
  )
}
