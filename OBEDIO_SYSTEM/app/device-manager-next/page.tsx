'use client'

import { useState } from 'react'
import { DeviceManagerTabsNext } from '@/components/device-manager/device-manager-tabs-next'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function DeviceManagerPageNext() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Function to refresh data when needed
  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      // In a real implementation, this would refresh all device data
      // We're simulating an API call here
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error refreshing device data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Device Manager</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="bg-background/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <p className="text-muted-foreground mb-4">
          Manage and configure all devices in the Obedio system including buttons, smart watches, 
          repeaters, and server settings. Select a tab to access specific device management options.
        </p>
      </div>
      
      <div className="mt-4">
        {/* Use our new improved device manager tabs component */}
        <DeviceManagerTabsNext />
      </div>
    </div>
  )
}