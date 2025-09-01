'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocalStorageAuth, setIsLocalStorageAuth] = useState(false)

  // Provera postojeće sesije u localStorage prilikom učitavanja komponente
  useEffect(() => {
    const userData = localStorage.getItem('userData')
    const authToken = localStorage.getItem('authToken')
    
    if (userData && authToken) {
      console.log('Postojeća sesija pronađena u localStorage, preusmeravanje...')
      router.push('/dashboard')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    console.log('Login attempt with:', { username, password })

    try {
      // Formiranje email adrese za API
      const email = username.includes('@') ? username : `${username}@obedio.com`
      console.log('Sending login request with:', { email, password })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('Login response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Kreiranje localStorage verzije autentikacije kao fallback
      if (data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user))
        localStorage.setItem('authToken', 'local-auth-token')
        console.log('Auth data stored in localStorage:', data.user)
      }

      // Redirect to dashboard on successful login
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Something went wrong')
      
      // Ako je korisnik koristio demo kredencijale, pokušaj alternativno logovanje
      if (username === 'admin' && password === 'admin') {
        console.log('Trying fallback authentication for demo user')
        handleLocalStorageAuth('admin')
        return
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Funkcija za alternativno logovanje kroz localStorage
  const handleLocalStorageAuth = (role: string) => {
    setIsLoading(true)
    setIsLocalStorageAuth(true)
    
    try {
      // Podaci o korisniku na osnovu uloge
      const userData = {
        id: role === 'admin' ? 1 : role === 'engineer' ? 2 : 3,
        name: role === 'admin' ? 'Admin User' : role === 'engineer' ? 'System Engineer' : 'Crew Member',
        email: `${role}@obedio.com`,
        role: role, // Čuvamo originalni string umesto toUpperCase()
        timestamp: new Date().toISOString()
      }
      
      // Sačuvaj u localStorage
      localStorage.setItem('userData', JSON.stringify(userData))
      localStorage.setItem('authToken', `local-auth-${Date.now()}`)
      
      console.log('Fallback auth successful for:', role, userData)
      
      // Redirect na dashboard nakon uspešne prijave
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err) {
      console.error('Fallback auth failed:', err)
      setError('Authentication failed. Please try again.')
      setIsLocalStorageAuth(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setUsername('admin')
    setPassword('admin')
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {isLocalStorageAuth ? 'Using fallback login...' : 'Signing in...'}
              </>
            ) : 'Sign in'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-muted-foreground">
          <span>Demo credentials: </span>
          <Button
            variant="link"
            className="h-auto p-0 text-sm font-medium text-primary"
            onClick={handleDemoLogin}
          >
            admin / admin
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
