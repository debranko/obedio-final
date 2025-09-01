'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw, Plus } from 'lucide-react'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { DeviceStatusBadge } from '@/components/devices/device-status-badge'
import { ButtonRow } from './button-row'
import { ButtonDetails } from './button-details'
import { useDeviceUpdateEvents } from '@/hooks/useEventSource'

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
  location: string  // For more specific location within a room
}

interface ButtonsListProps {
  className?: string
}

export function ButtonsList({ className }: ButtonsListProps) {
  const [buttons, setButtons] = useState<ButtonDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedButton, setSelectedButton] = useState<ButtonDevice | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Load button devices with pagination and filtering
  const loadButtonDevices = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        type: 'BUTTON',  // Filter by device type
      })
      
      if (search) {
        params.append('search', search)
      }
      
      if (filter === 'active') {
        params.append('isActive', 'true')
      } else if (filter === 'inactive') {
        params.append('isActive', 'false')
      } else if (filter === 'lowBattery') {
        params.append('battery', 'lt:20')
      }
      
      // Fetch the button devices
      console.log('DEBUG: Fetching button devices from API...')
      const response = await fetch(`/api/devices?${params}`)
      console.log('DEBUG: API response status:', response.status)
      
      const data = await response.json()
      console.log('DEBUG: API response meta:', data.meta)
      console.log('DEBUG: Received devices count:', data.devices?.length || 0)
      
      // Log sample data if available
      if (Array.isArray(data.devices) && data.devices.length > 0) {
        const sampleDevice = data.devices[0]
        console.log('DEBUG: Sample button device:', JSON.stringify(sampleDevice).substring(0, 200))
      }
      
      // Transform devices to include additional button-specific properties
      const buttonsWithDefaults = Array.isArray(data.devices)
        ? data.devices.map((device: any) => ({
            ...device,
            firmwareVersion: device.firmwareVersion || '1.0.0',
            location: device.location || device.room
          }))
        : []; // Default to empty array if data.devices doesn't exist
      
      setButtons(buttonsWithDefaults)
      setTotalPages(data.meta?.totalPages || 1)
    } catch (error) {
      console.error('Error loading button devices:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Subscribe to device update events with fallback polling
  const { connected: sseConnected } = useDeviceUpdateEvents((data) => {
    if (data.deviceType === 'BUTTON') {
      setButtons(prev => 
        prev.map(button => 
          button.id === data.deviceId 
            ? { 
                ...button, 
                battery: data.battery, 
                signalStrength: data.signal,
                lastSeen: data.lastSeen
              } 
            : button
        )
      )
    }
  })
  
  // Fallback polling if SSE doesn't work
  useEffect(() => {
    // Initial load
    loadButtonDevices()
    
    // Set up polling only if SSE is not connected
    if (!sseConnected) {
      console.log('SSE not connected, using polling as fallback')
      
      const intervalId = setInterval(() => {
        loadButtonDevices()
      }, 15000) // Every 15 seconds
      
      return () => clearInterval(intervalId)
    }
  }, [sseConnected, search, filter, page])
  
  // Load devices when search/filter/page changes
  useEffect(() => {
    loadButtonDevices()
  }, [search, filter, page])
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset page when search changes
  }
  
  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value)
    setPage(1) // Reset page when filter changes
  }

  // Calculate if a device is online (seen in the last 5 minutes)
  const isDeviceOnline = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return lastSeenDate > fiveMinutesAgo
  }

  // Open button details panel
  const openButtonDetails = (button: ButtonDevice) => {
    setSelectedButton(button);
  }

  // Close button details panel
  const closeButtonDetails = () => {
    setSelectedButton(null);
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, location or UID..."
              className="pl-8"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex flex-row items-center gap-2">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buttons</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="lowBattery">Low Battery</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => loadButtonDevices()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="default" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Pair New Button
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>UID</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead>Firmware</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : buttons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No buttons found.
                </TableCell>
              </TableRow>
            ) : (
              buttons.map((button) => (
                <ButtonRow 
                  key={button.id} 
                  button={button} 
                  isOnline={isDeviceOnline(button.lastSeen)} 
                  onViewDetails={() => openButtonDetails(button)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Button Details Panel */}
      {selectedButton && (
        <ButtonDetails 
          button={selectedButton} 
          isOpen={!!selectedButton} 
          onClose={closeButtonDetails}
        />
      )}
    </div>
  )
}