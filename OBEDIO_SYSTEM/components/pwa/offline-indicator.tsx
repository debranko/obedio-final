'use client'

import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOnlineStatus, usePWA } from './pwa-provider'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
      <Badge 
        variant="destructive" 
        className="flex items-center gap-2 px-3 py-2 text-sm"
      >
        <WifiOff className="h-4 w-4" />
        You're offline
      </Badge>
    </div>
  )
}

export function ConnectionStatus() {
  const isOnline = useOnlineStatus()

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-muted-foreground">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm text-muted-foreground">Offline</span>
        </>
      )}
    </div>
  )
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-yellow-400 dark:bg-yellow-600">
              <WifiOff className="h-5 w-5 text-white" />
            </span>
            <p className="ml-3 font-medium text-yellow-800 dark:text-yellow-200">
              <span className="md:hidden">You're offline!</span>
              <span className="hidden md:inline">
                You're currently offline. Some features may not be available.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-800 border-yellow-300 dark:border-yellow-600"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">You're Offline</CardTitle>
          <CardDescription>
            This page isn't available offline. Please check your internet connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">While you're offline, you can still:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>View cached device data</li>
              <li>Browse previously loaded pages</li>
              <li>Use basic navigation</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DataStatus({ isOfflineData = false, lastUpdated }: { 
  isOfflineData?: boolean
  lastUpdated?: Date 
}) {
  if (!isOfflineData) {
    return null
  }

  const timeAgo = lastUpdated ? 
    new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((lastUpdated.getTime() - Date.now()) / (1000 * 60)),
      'minute'
    ) : 'some time ago'

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
      <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
      <span>Offline data from {timeAgo}</span>
    </div>
  )
}

export function MQTTOfflineIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className="text-sm text-muted-foreground">
        MQTT {isConnected ? 'Connected' : 'Disconnected'}
      </span>
      {!isConnected && (
        <Badge variant="outline" className="text-xs">
          Offline Mode
        </Badge>
      )}
    </div>
  )
}