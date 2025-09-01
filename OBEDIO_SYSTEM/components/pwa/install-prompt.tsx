'use client'

import { useState } from 'react'
import { Download, X, Smartphone, Monitor, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useInstallPrompt } from './pwa-provider'

export function InstallPrompt() {
  const { canInstall, install, isInstalled } = useInstallPrompt()
  const [isVisible, setIsVisible] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)

  if (isInstalled || !canInstall || !isVisible) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await install()
    } catch (error) {
      console.error('Install failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Install OBEDIO Admin</CardTitle>
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
          Get the full app experience with offline capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            Mobile Ready
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            Desktop App
          </Badge>
          <Badge variant="secondary">Offline Mode</Badge>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Benefits:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Works offline with cached data</li>
            <li>• Faster loading and performance</li>
            <li>• Push notifications for alerts</li>
            <li>• Native app-like experience</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleInstall} 
            disabled={isInstalling}
            className="flex-1"
          >
            {isInstalling ? 'Installing...' : 'Install App'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsVisible(false)}
          >
            Later
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Chrome className="h-3 w-3" />
            Works best on Chrome, Edge, and Safari
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function InstallButton() {
  const { canInstall, install, isInstalled } = useInstallPrompt()
  const [isInstalling, setIsInstalling] = useState(false)

  if (isInstalled || !canInstall) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await install()
    } catch (error) {
      console.error('Install failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      disabled={isInstalling}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {isInstalling ? 'Installing...' : 'Install App'}
    </Button>
  )
}