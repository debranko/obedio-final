'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  RefreshCw,
  Download,
  Wifi,
  Router,
  Network,
  Zap,
  Shield,
  AlertTriangle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { toast } from '@/components/ui/use-toast'
import { RepeaterDevice } from '@/hooks/use-devices'

interface RepeaterRowProps {
  repeater: RepeaterDevice
  onViewDetails: () => void
  formatTimeAgo: (timestamp: string) => string
}

export function RepeaterRow({ repeater, onViewDetails, formatTimeAgo }: RepeaterRowProps) {
  const [isLoading, setIsLoading] = useState(false)

  const lastSeenFormatted = formatTimeAgo(repeater.lastSeen)

  // Toggle repeater active state
  const toggleRepeaterActive = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would call an API to toggle the repeater's active state
      toast({
        title: repeater.isActive ? 'Repeater deactivated' : 'Repeater activated',
        description: `Repeater ${repeater.name} has been ${repeater.isActive ? 'deactivated' : 'activated'} successfully.`,
      })
    } catch (error) {
      console.error('Error toggling repeater active state:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while updating the repeater.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle emergency mode
  const toggleEmergencyMode = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would call an API to toggle emergency mode
      toast({
        title: repeater.isEmergencyMode ? 'Emergency mode disabled' : 'Emergency mode enabled',
        description: `Emergency mode for ${repeater.name} has been ${repeater.isEmergencyMode ? 'disabled' : 'enabled'}.`,
      })
    } catch (error) {
      console.error('Error toggling emergency mode:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while updating emergency mode.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update repeater firmware
  const updateFirmware = async () => {
    setIsLoading(true)
    try {
      toast({
        title: 'Firmware update started',
        description: `Initiating firmware update for ${repeater.name}...`,
      })
      // In a real implementation, this would call an API endpoint to start the firmware update
      setTimeout(() => {
        toast({
          title: 'Firmware update complete',
          description: `Firmware update for ${repeater.name} completed successfully.`,
        })
        setIsLoading(false)
      }, 3000)
    } catch (error) {
      console.error('Error updating firmware:', error)
      toast({
        title: 'Error',
        description: 'An error occurred during the firmware update.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  // Test network connectivity
  const testNetwork = async () => {
    setIsLoading(true)
    try {
      toast({
        title: 'Network test initiated',
        description: `Testing network connectivity for ${repeater.name}...`,
      })
      
      setTimeout(() => {
        toast({
          title: 'Network test complete',
          description: `Network test for ${repeater.name} completed successfully.`,
        })
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error('Error during network test:', error)
      toast({
        title: 'Error',
        description: 'An error occurred during the network test.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <TableRow key={repeater.id}>
      <TableCell className="font-medium">
        <div>
          <p className="font-medium">{repeater.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{repeater.uid}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {repeater.isEmergencyMode ? (
            <Badge variant="destructive" className="border-none">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Emergency Mode
            </Badge>
          ) : repeater.isActive ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              <div className="h-2 w-2 rounded-full bg-gray-400 mr-1"></div>
              Inactive
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          {repeater.connectionType === 'Ethernet' ? (
            <>
              <Router className="h-4 w-4 mr-2 text-blue-500" />
              <span>Ethernet</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 mr-2 text-blue-500" />
              <span>Wi-Fi</span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p>{repeater.location}</p>
          <p className="text-xs text-muted-foreground">{repeater.coverageArea}</p>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex justify-center">
          <BatteryIndicator value={repeater.battery} />
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex justify-center">
          <SignalIndicator value={repeater.signalStrength} />
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          <Badge variant={repeater.connectedDevices > 0 ? "secondary" : "outline"}>
            {repeater.connectedDevices}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-xs font-mono">{repeater.operatingFrequency}</span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {lastSeenFormatted}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={onViewDetails}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Edit repeater', repeater.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={toggleRepeaterActive}
              disabled={isLoading}
            >
              {repeater.isActive ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {repeater.isActive && (
              <>
                <DropdownMenuItem 
                  onClick={toggleEmergencyMode}
                  disabled={isLoading}
                >
                  {repeater.isEmergencyMode ? (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Disable Emergency Mode
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Enable Emergency Mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={testNetwork}
                  disabled={isLoading}
                >
                  <Network className="mr-2 h-4 w-4" />
                  Test Connectivity
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={updateFirmware}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Update Firmware
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem 
              onClick={() => console.log('Delete repeater', repeater.id)}
              disabled={isLoading}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}