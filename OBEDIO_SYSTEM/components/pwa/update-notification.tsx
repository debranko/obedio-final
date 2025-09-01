'use client'

import { useState } from 'react'
import { RefreshCw, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePWA } from './pwa-provider'

export function UpdateNotification() {
  const { isUpdateAvailable, updateApp } = usePWA()
  const [isVisible, setIsVisible] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isUpdateAvailable || !isVisible) {
    return null
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateApp()
    } catch (error) {
      console.error('Update failed:', error)
      setIsUpdating(false)
    }
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 shadow-lg border-2 border-blue-200 bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Update Available</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          A new version of OBEDIO Admin is ready to install
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>This update includes:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Performance improvements</li>
            <li>Bug fixes and stability</li>
            <li>Enhanced offline functionality</li>
            <li>Security updates</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleUpdate} 
            disabled={isUpdating}
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Now
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsVisible(false)}
          >
            Later
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          The app will restart after the update is complete
        </div>
      </CardContent>
    </Card>
  )
}

export function UpdateBanner() {
  const { isUpdateAvailable, updateApp } = usePWA()
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isUpdateAvailable) {
    return null
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateApp()
    } catch (error) {
      console.error('Update failed:', error)
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-blue-600">
              <Download className="h-5 w-5 text-white" />
            </span>
            <p className="ml-3 font-medium text-blue-800 dark:text-blue-200">
              <span className="md:hidden">App update available!</span>
              <span className="hidden md:inline">
                A new version of OBEDIO Admin is available with improvements and fixes.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}