import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Cpu, Battery, WifiOff } from 'lucide-react'

interface LocationsHeaderProps {
  totalDevices: number
  totalRooms: number
  lowBatteryCount: number
  offlineCount: number
}

export function LocationsHeader({
  totalDevices,
  totalRooms,
  lowBatteryCount,
  offlineCount,
}: LocationsHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Locations</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{totalRooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Cpu className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold">{totalDevices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Battery className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Battery</p>
                <p className="text-2xl font-bold">{lowBatteryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold">{offlineCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}