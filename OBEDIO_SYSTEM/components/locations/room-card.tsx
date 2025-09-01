'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  AlertCircle, 
  Home,
  Anchor,
  Building2,
  Wrench,
  Users,
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Device {
  id: string
  name: string
  type: 'button' | 'repeater' | 'smartwatch'
  battery: number
  signal: number
  lastSeen: string
  isActive: boolean
}

interface Guest {
  id: string
  name: string
  photo?: string
}

interface Location {
  id: string
  name: string
  type: 'deck' | 'cabin' | 'common' | 'service'
  floor?: string
  devices: Device[]
  guests?: Guest[]
}

interface RoomCardProps {
  location: Location
}

export function RoomCard({ location }: RoomCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate location status
  const hasLowBattery = location.devices.some(d => d.battery < 20)
  const hasOfflineDevices = location.devices.some(d => !d.isActive)
  const hasIssues = hasLowBattery || hasOfflineDevices

  // Get location type icon
  const getLocationIcon = () => {
    switch (location.type) {
      case 'deck':
        return <Anchor className="h-5 w-5" />
      case 'cabin':
        return <Home className="h-5 w-5" />
      case 'common':
        return <Building2 className="h-5 w-5" />
      case 'service':
        return <Wrench className="h-5 w-5" />
      default:
        return <MapPin className="h-5 w-5" />
    }
  }

  // Get device type icon
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'button':
        return <Smartphone className="h-4 w-4" />
      case 'repeater':
        return <Wifi className="h-4 w-4" />
      case 'smartwatch':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Smartphone className="h-4 w-4" />
    }
  }

  // Format last seen time
  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      hasIssues && "border-amber-200 bg-amber-50/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              hasIssues ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
            )}>
              {getLocationIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{location.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {location.floor && <span>{location.floor}</span>}
                <span>•</span>
                <span className="capitalize">{location.type}</span>
              </div>
            </div>
          </div>
          {hasIssues && (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{location.devices.length} devices</span>
          </div>
          {location.guests && location.guests.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{location.guests.length} guests</span>
            </div>
          )}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {hasOfflineDevices && (
            <Badge variant="destructive" className="text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Devices
            </Badge>
          )}
          {hasLowBattery && (
            <Badge variant="destructive" className="text-xs">
              <BatteryLow className="h-3 w-3 mr-1" />
              Low Battery
            </Badge>
          )}
          {!hasIssues && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              All Systems OK
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Guests section */}
        {location.guests && location.guests.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Current Guests</p>
            <div className="flex -space-x-2">
              {location.guests.slice(0, 3).map((guest) => (
                <Avatar key={guest.id} className="h-8 w-8 border-2 border-white">
                  <AvatarImage src={guest.photo} alt={guest.name} />
                  <AvatarFallback className="text-xs">
                    {guest.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {location.guests.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">
                    +{location.guests.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between"
        >
          <span className="text-sm">View Devices</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Expanded devices list */}
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {location.devices.map((device) => (
              <div
                key={device.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  !device.isActive && "bg-red-50 border-red-200",
                  device.battery < 20 && device.isActive && "bg-amber-50 border-amber-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded",
                    device.isActive ? "bg-slate-100" : "bg-red-100"
                  )}>
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{device.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {device.type} • {formatLastSeen(device.lastSeen)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Battery indicator */}
                  <div className="flex items-center gap-1">
                    <Battery className={cn(
                      "h-4 w-4",
                      device.battery < 20 ? "text-red-500" : 
                      device.battery < 50 ? "text-amber-500" : 
                      "text-green-500"
                    )} />
                    <span className="text-xs font-medium">{device.battery}%</span>
                  </div>
                  {/* Signal indicator */}
                  <div className="flex items-center gap-1">
                    <Wifi className={cn(
                      "h-4 w-4",
                      !device.isActive ? "text-red-500" :
                      device.signal < 50 ? "text-amber-500" : 
                      "text-green-500"
                    )} />
                    <span className="text-xs font-medium">{device.signal}%</span>
                  </div>
                  {/* Status badge */}
                  <Badge 
                    variant={device.isActive ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {device.isActive ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}