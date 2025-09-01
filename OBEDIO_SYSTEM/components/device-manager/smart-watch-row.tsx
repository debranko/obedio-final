'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { DeviceStatusBadge } from '@/components/devices/device-status-badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  RefreshCw,
  Download,
  UserCircle,
  UserMinus,
  Bell,
  History
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

interface SmartWatchDevice {
  id: number
  name: string
  uid: string
  battery: number
  signalStrength: number
  isActive: boolean
  lastSeen: string
  firmwareVersion: string
  model: string
  assignedTo?: {
    id: number
    name: string
    role?: string
    avatar?: string
  }
  lastSync: string
}

interface SmartWatchRowProps {
  smartwatch: SmartWatchDevice
  isOnline: boolean
  onViewDetails: () => void
}

export function SmartWatchRow({ smartwatch, isOnline, onViewDetails }: SmartWatchRowProps) {
  const [isLoading, setIsLoading] = useState(false)

  const lastSyncFormatted = formatDistanceToNow(new Date(smartwatch.lastSync), {
    addSuffix: true
  })

  // Toggle smartwatch active state
  const toggleSmartWatchActive = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${smartwatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !smartwatch.isActive,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Error updating smartwatch device')
      }
      
      toast({
        title: smartwatch.isActive ? 'Smartwatch deactivated' : 'Smartwatch activated',
        description: `Smartwatch ${smartwatch.name} has been ${smartwatch.isActive ? 'deactivated' : 'activated'} successfully.`,
      })
      
    } catch (error) {
      console.error('Error toggling smartwatch active state:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while updating the smartwatch.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Ping smartwatch device
  const pingSmartWatch = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${smartwatch.id}/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Error pinging smartwatch')
      }
      
      toast({
        title: 'Test notification sent',
        description: `A test notification has been sent to ${smartwatch.name}.`,
      })
    } catch (error) {
      console.error('Error pinging smartwatch:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while sending the test notification.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update smartwatch firmware
  const updateFirmware = async () => {
    setIsLoading(true)
    try {
      toast({
        title: 'Firmware update started',
        description: `Initiating firmware update for ${smartwatch.name}...`,
      })
      // In a real implementation, this would call an API endpoint to start the firmware update
      setTimeout(() => {
        toast({
          title: 'Firmware update complete',
          description: `Firmware update for ${smartwatch.name} completed successfully.`,
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

  // Unassign smartwatch from crew member
  const unassignSmartWatch = async () => {
    if (!smartwatch.assignedTo) return;
    
    setIsLoading(true)
    try {
      // In a real implementation, this would call an API endpoint to unassign the smartwatch
      toast({
        title: 'Processing unassignment',
        description: `Unassigning ${smartwatch.name} from ${smartwatch.assignedTo.name}...`,
      })
      
      setTimeout(() => {
        toast({
          title: 'Smartwatch unassigned',
          description: `${smartwatch.name} has been unassigned from ${smartwatch.assignedTo?.name}.`,
        })
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      console.error('Error unassigning smartwatch:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while unassigning the smartwatch.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  return (
    <TableRow key={smartwatch.id}>
      <TableCell>
        <DeviceStatusBadge isOnline={isOnline} isActive={smartwatch.isActive} />
      </TableCell>
      <TableCell className="font-medium">{smartwatch.name}</TableCell>
      <TableCell>
        {smartwatch.assignedTo ? (
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              {smartwatch.assignedTo.avatar ? (
                <AvatarImage src={smartwatch.assignedTo.avatar} alt={smartwatch.assignedTo.name} />
              ) : (
                <AvatarFallback>{getInitials(smartwatch.assignedTo.name)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-sm font-medium">{smartwatch.assignedTo.name}</p>
              {smartwatch.assignedTo.role && (
                <p className="text-xs text-muted-foreground">{smartwatch.assignedTo.role}</p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Not assigned</span>
        )}
      </TableCell>
      <TableCell className="text-sm">{smartwatch.model}</TableCell>
      <TableCell>
        <BatteryIndicator value={smartwatch.battery} />
      </TableCell>
      <TableCell>
        <SignalIndicator value={smartwatch.signalStrength} />
      </TableCell>
      <TableCell className="font-mono text-xs">v{smartwatch.firmwareVersion}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {lastSyncFormatted}
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
            <DropdownMenuItem onClick={() => console.log('Edit smartwatch', smartwatch.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={toggleSmartWatchActive}
              disabled={isLoading}
            >
              {smartwatch.isActive ? (
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
            {smartwatch.isActive && (
              <>
                <DropdownMenuItem 
                  onClick={pingSmartWatch}
                  disabled={isLoading || !isOnline}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Send Test Notification
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
            <DropdownMenuItem onClick={() => console.log('View history', smartwatch.id)}>
              <History className="mr-2 h-4 w-4" />
              View Activity History
            </DropdownMenuItem>
            {smartwatch.assignedTo && (
              <DropdownMenuItem 
                onClick={unassignSmartWatch}
                disabled={isLoading}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Unassign from {smartwatch.assignedTo.name}
              </DropdownMenuItem>
            )}
            {!smartwatch.assignedTo && (
              <DropdownMenuItem 
                onClick={() => console.log('Assign to crew member', smartwatch.id)}
                disabled={isLoading}
              >
                <UserCircle className="mr-2 h-4 w-4" />
                Assign to Crew Member
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => console.log('Remove smartwatch', smartwatch.id)}
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