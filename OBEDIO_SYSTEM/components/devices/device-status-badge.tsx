'use client'

import { Badge } from '@/components/ui/badge'

interface DeviceStatusBadgeProps {
  isOnline: boolean;
  isActive: boolean;
}

export function DeviceStatusBadge({ isOnline, isActive }: DeviceStatusBadgeProps) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
        Disabled
      </Badge>
    )
  }

  return (
    <Badge 
      variant={isOnline ? "default" : "outline"} 
      className={isOnline ? "bg-green-600 hover:bg-green-700" : "text-amber-500 border-amber-500/30"}
    >
      {isOnline ? 'Online' : 'Offline'}
    </Badge>
  )
}
