'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    async function logout() {
      try {
        // Call the logout API
        await fetch('/api/auth/logout', {
          method: 'GET',
        })

        // Redirect to login page
        router.push('/')
        router.refresh()
      } catch (error) {
        console.error('Logout error:', error)
        router.push('/')
      }
    }

    logout()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Signing out...</h1>
        <p className="mt-2 text-muted-foreground">You will be redirected shortly.</p>
      </div>
    </div>
  )
}
