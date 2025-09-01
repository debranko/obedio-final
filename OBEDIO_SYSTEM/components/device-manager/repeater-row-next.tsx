'use client'

import React from 'react'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { RepeaterDevice } from '@/hooks/use-devices-next'

// Define props interface to ensure type safety
interface RepeaterRowNextProps {
  repeater: RepeaterDevice
  onViewDetails: () => void
  formatTimeAgo: (timestamp: string) => string
}

export function RepeaterRowNext({ repeater, onViewDetails, formatTimeAgo }: RepeaterRowNextProps) {
  return (
    <TableRow>
      {/* Device Name */}
      <TableCell>
        <div className="font-medium">{repeater.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{repeater.uid}</div>
      </TableCell>

      {/* Status */}
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

      {/* Connection Type */}
      <TableCell>{repeater.connectionType}</TableCell>

      {/* Location */}
      <TableCell>{repeater.location}</TableCell>

      {/* Battery Level */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          <BatteryIndicator value={repeater.battery} />
          <span className="ml-1 text-xs">{repeater.battery}%</span>
        </div>
      </TableCell>

      {/* Signal Strength */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          <SignalIndicator value={repeater.signal} />
          <span className="ml-1 text-xs">{repeater.signal}%</span>
        </div>
      </TableCell>

      {/* Connected Devices Count */}
      <TableCell className="text-center">
        <span className="text-sm">{repeater.connectedDevices}</span>
      </TableCell>

      {/* Operating Frequency */}
      <TableCell>
        <span className="text-sm">{repeater.operatingFrequency}</span>
      </TableCell>

      {/* Last Seen */}
      <TableCell>
        <span className="text-sm">{formatTimeAgo(repeater.lastSeen)}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={onViewDetails}>
          Details <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}