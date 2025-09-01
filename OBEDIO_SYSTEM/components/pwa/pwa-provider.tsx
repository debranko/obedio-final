'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface PWAContextType {
  isInstalled: boolean
  canInstall: boolean
  isOnline: boolean
  install: () => Promise<void>
  isUpdateAvailable: boolean
  updateApp: () => Promise<void>
  registration: ServiceWorkerRegistration | null
}

const PWAContext = createContext<PWAContextType | null>(null)

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker()
    }

    // Check if app is installed
    checkInstallStatus()

    // Set up online/offline detection
    setupOnlineDetection()

    // Set up install prompt
    setupInstallPrompt()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      setRegistration(registration)
      console.log('[PWA] Service worker registered:', registration)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsUpdateAvailable(true)
              console.log('[PWA] New version available')
            }
          })
        }
      })

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[PWA] Message from SW:', event.data)
        
        if (event.data.type === 'CACHE_UPDATED') {
          // Handle cache updates
          console.log('[PWA] Cache updated for:', event.data.url)
        }
      })

    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error)
    }
  }

  const checkInstallStatus = () => {
    // Check if app is in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches
    
    setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome)
  }

  const setupOnlineDetection = () => {
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  const handleOnline = () => {
    setIsOnline(true)
    console.log('[PWA] App is online')
    
    // Sync queued requests when back online
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SYNC_REQUESTS' })
    }
  }

  const handleOffline = () => {
    setIsOnline(false)
    console.log('[PWA] App is offline')
  }

  const setupInstallPrompt = () => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault()
    setDeferredPrompt(event)
    setCanInstall(true)
    console.log('[PWA] Install prompt available')
  }

  const install = async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No install prompt available')
      return
    }

    try {
      const result = await deferredPrompt.prompt()
      console.log('[PWA] Install prompt result:', result)
      
      if (result.outcome === 'accepted') {
        setIsInstalled(true)
        setCanInstall(false)
        setDeferredPrompt(null)
      }
    } catch (error) {
      console.error('[PWA] Install failed:', error)
    }
  }

  const updateApp = async () => {
    if (!registration) {
      console.warn('[PWA] No service worker registration')
      return
    }

    try {
      const newWorker = registration.waiting
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    } catch (error) {
      console.error('[PWA] Update failed:', error)
    }
  }

  const value: PWAContextType = {
    isInstalled,
    canInstall,
    isOnline,
    install,
    isUpdateAvailable,
    updateApp,
    registration
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}

export function useOnlineStatus() {
  const { isOnline } = usePWA()
  return isOnline
}

export function useInstallPrompt() {
  const { canInstall, install, isInstalled } = usePWA()
  return { canInstall, install, isInstalled }
}