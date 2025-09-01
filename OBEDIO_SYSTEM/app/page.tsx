import React from 'react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-blue-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">O</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-600">Obedio</h1>
          <h2 className="mt-2 text-2xl font-medium">Admin Panel</h2>
          <p className="mt-2 text-sm text-gray-600">
            Luxury yacht and villa management system
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Database Restored Successfully!</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your database connection is working. Navigate to different sections:
          </p>
          <div className="space-y-2">
            <Link href="/dashboard" className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center">
              Dashboard
            </Link>
            <Link href="/crew" className="block w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center">
              Crew Management
            </Link>
            <Link href="/guests" className="block w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center">
              Guest Management
            </Link>
          </div>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Obedio. All rights reserved.</p>
      </footer>
    </div>
  )
}
