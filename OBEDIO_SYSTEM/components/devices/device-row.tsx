'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { BatteryIndicator } from './battery-indicator'
import { SignalIndicator } from './signal-indicator'
import { DeviceStatusBadge } from './device-status-badge'
import { DeviceActionButtons } from './device-action-buttons'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'

interface Device {
  id: number
  name: string
  room: string
  type: string
  uid: string
  battery: number
  signalStrength: number
  isActive: boolean
  lastSeen: string
}

interface DeviceRowProps {
  device: Device
  isOnline: boolean
}

export function DeviceRow({ device, isOnline }: DeviceRowProps) {
  const lastSeenFormatted = formatDistanceToNow(new Date(device.lastSeen), {
    addSuffix: true,
    locale: sr
  })

  return (
    <TableRow key={device.id}>
      <TableCell>
        <DeviceStatusBadge isOnline={isOnline} isActive={device.isActive} />
      </TableCell>
      <TableCell className="font-medium">{device.name}</TableCell>
      <TableCell>{device.room}</TableCell>
      <TableCell className="font-mono text-xs">{device.uid}</TableCell>
      <TableCell>
        <BatteryIndicator value={device.battery} />
      </TableCell>
      <TableCell>
        <SignalIndicator value={device.signalStrength} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {lastSeenFormatted}
      </TableCell>
      <TableCell className="text-right">
        <DeviceActionButtons device={device} isOnline={isOnline} />
      </TableCell>
    </TableRow>
  )
}
