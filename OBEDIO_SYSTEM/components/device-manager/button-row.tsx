'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { DeviceStatusBadge } from '@/components/devices/device-status-badge'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Power, 
  PowerOff, 
  Trash2,
  RefreshCw,
  Download
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { toast } from '@/components/ui/use-toast'

interface ButtonDevice {
  id: number
  name: string
  room: string
  uid: string
  battery: number
  signalStrength: number
  isActive: boolean
  lastSeen: string
  firmwareVersion: string
  location: string
}

interface ButtonRowProps {
  button: ButtonDevice
  isOnline: boolean
  onViewDetails: () => void
}

export function ButtonRow({ button, isOnline, onViewDetails }: ButtonRowProps) {
  const [isLoading, setIsLoading] = useState(false)

  const lastSeenFormatted = formatDistanceToNow(new Date(button.lastSeen), {
    addSuffix: true
  })

  // Toggle button active state
  const toggleButtonActive = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${button.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !button.isActive,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Error updating button device')
      }
      
      toast({
        title: button.isActive ? 'Button deactivated' : 'Button activated',
        description: `Button ${button.name} has been ${button.isActive ? 'deactivated' : 'activated'} successfully.`,
      })
      
    } catch (error) {
      console.error('Error toggling button active state:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while updating the button.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Ping button device
  const pingButton = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${button.id}/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Error pinging button')
      }
      
      toast({
        title: 'Ping sent',
        description: `Ping message sent to ${button.name}.`,
      })
    } catch (error) {
      console.error('Error pinging button:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while pinging the button.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update button firmware
  const updateFirmware = async () => {
    setIsLoading(true)
    try {
      toast({
        title: 'Firmware update started',
        description: `Initiating firmware update for ${button.name}...`,
      })
      // In a real implementation, this would call an API endpoint to start the firmware update
      setTimeout(() => {
        toast({
          title: 'Firmware update complete',
          description: `Firmware update for ${button.name} completed successfully.`,
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

  return (
    <TableRow key={button.id}>
      <TableCell>
        <DeviceStatusBadge isOnline={isOnline} isActive={button.isActive} />
      </TableCell>
      <TableCell className="font-medium">{button.name}</TableCell>
      <TableCell>{button.location || button.room}</TableCell>
      <TableCell className="font-mono text-xs">{button.uid}</TableCell>
      <TableCell>
        <BatteryIndicator value={button.battery} />
      </TableCell>
      <TableCell>
        <SignalIndicator value={button.signalStrength} />
      </TableCell>
      <TableCell className="font-mono text-xs">v{button.firmwareVersion}</TableCell>
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
            <DropdownMenuItem onClick={() => console.log('Edit button', button.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={toggleButtonActive}
              disabled={isLoading}
            >
              {button.isActive ? (
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
            {button.isActive && (
              <>
                <DropdownMenuItem 
                  onClick={pingButton}
                  disabled={isLoading || !isOnline}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Connection
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={updateFirmware}
                  disabled={isLoading || !isOnline}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Update Firmware
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem 
              onClick={() => console.log('Delete button', button.id)}
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