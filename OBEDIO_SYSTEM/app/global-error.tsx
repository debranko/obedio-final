'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">Kritična greška u aplikaciji</h2>
          <p className="mt-2 text-gray-600">
            Došlo je do neočekivane greške pri učitavanju aplikacije.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => reset()}
              className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              Pokušaj ponovo
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Nazad na početnu
            </button>
          </div>
          <div className="mt-10 text-xs text-gray-500">
            <p>Error ID: {error.digest || 'unknown'}</p>
          </div>
        </div>
      </body>
    </html>
  )
}
