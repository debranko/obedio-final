'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="mt-6 text-2xl font-bold">Nešto je pošlo po zlu!</h2>
      <p className="mt-2 text-muted-foreground">
        Došlo je do greške pri učitavanju sadržaja.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Button
          onClick={() => reset()}
          variant="default"
        >
          Pokušaj ponovo
        </Button>
        <Button
          onClick={() => window.location.href = '/dashboard'}
          variant="outline"
        >
          Nazad na početnu
        </Button>
      </div>
    </div>
  )
}
