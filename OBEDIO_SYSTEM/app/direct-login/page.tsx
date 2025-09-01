'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function DirectLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Funkcija za direktnu prijavu sa hardkodiranim tokenom
  const handleDirectLogin = async (role: string) => {
    setIsLoading(true)
    
    try {
      // Direktno postavljanje tokena u local storage (umesto cookie zbog NextJS ograničenja)
      const userData = {
        id: role === 'admin' ? 1 : role === 'engineer' ? 2 : 3,
        name: role === 'admin' ? 'Admin User' : role === 'engineer' ? 'System Engineer' : 'Crew Member',
        email: `${role}@obedio.com`,
        role: role.toUpperCase()
      }
      
      // Kreiraj token (ovo bi trebalo raditi na serveru, ali za potrebe workarounda je dovoljno)
      const token = btoa(JSON.stringify(userData))
      
      // Postavi token u localStorage
      localStorage.setItem('obedio_auth', token)
      localStorage.setItem('obedio_user', JSON.stringify(userData))
      
      console.log(`Direktno prijavljen kao ${role} korisnik`)
      
      // Redirect na dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Greška pri direktnoj prijavi:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-primary/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">O</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary">Obedio</h1>
          <h2 className="mt-2 text-2xl font-medium">Direktna prijava</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Izaberite ulogu i prijavite se direktno
          </p>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Direktna prijava</CardTitle>
            <CardDescription>
              Izaberite jednu od uloga za prijavu bez autentikacije
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => handleDirectLogin('admin')}
              disabled={isLoading}
            >
              Prijavi se kao Admin
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleDirectLogin('engineer')}
              disabled={isLoading}
            >
              Prijavi se kao Inženjer
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleDirectLogin('crew')}
              disabled={isLoading}
            >
              Prijavi se kao Član posade
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Napomena: Ovo je privremeno rešenje dok ne popravimo standardnu prijavu.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
