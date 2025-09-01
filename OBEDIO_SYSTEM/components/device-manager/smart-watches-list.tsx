'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  UserCircle, 
  Download, 
  RotateCw, 
  Plus, 
  Search, 
  Bell,
  Filter,
  RefreshCw,
  Bluetooth,
  SlidersHorizontal
} from 'lucide-react'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { toast } from '@/components/ui/use-toast'
import { SmartWatchDetails } from './smart-watch-details'
import { format, formatDistanceToNow } from 'date-fns'
import { useDeviceUpdateEvents } from '@/hooks/useEventSource'

interface SmartWatchDevice {
  id: number
  name: string
  uid: string
  battery: number
  signal: number  // Changed from signalStrength to match the schema
  signalStrength?: number  // Added for compatibility with SmartWatchRow
  isActive: boolean
  lastSeen: string
  firmwareVersion: string
  location: string
  model: string
  assignedToUserId?: number
  lastSync?: string  // Optional since some devices might not have synced
  // We'll need to join user data for display if we have assignedToUserId
  assignedTo?: {
    id: number
    name: string
    role?: string
    avatar?: string
  }
}

export function SmartWatchesList() {
  const [loading, setLoading] = useState(true)
  const [smartwatches, setSmartWatches] = useState<SmartWatchDevice[]>([])
  const [selectedSmartWatch, setSelectedSmartWatch] = useState<SmartWatchDevice | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignmentFilter, setAssignmentFilter] = useState('all')
  const [batteryFilter, setBatteryFilter] = useState('all')
  const [sortOption, setSortOption] = useState('name')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Subscribe to device update events
  const { connected: sseConnected } = useDeviceUpdateEvents((data) => {
    if (data.deviceType === 'SMART_WATCH') {
      setSmartWatches(prev =>
        prev.map(watch =>
          watch.id === data.deviceId
            ? {
                ...watch,
                battery: data.battery || watch.battery,
                signal: data.signal || watch.signal,
                lastSeen: data.lastSeen || watch.lastSeen
              }
            : watch
        )
      )
    }
  })

  // Fetch smartwatches data from API with pagination and filtering
  const fetchSmartWatches = async () => {
    setLoading(true)
    try {
      console.log('=== DEBUG: Starting smartwatches fetch ===')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        type: 'SMART_WATCH',  // Filter by device type
      })
      
      // Log parameters being used
      console.log('DEBUG: Fetch params:', params.toString())
      
      // Add search filter if set
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      // Add status filter
      if (statusFilter === 'active') {
        params.append('isActive', 'true')
      } else if (statusFilter === 'inactive') {
        params.append('isActive', 'false')
      }
      
      // Add battery filter
      if (batteryFilter === 'critical') {
        params.append('battery', 'lt:20')
      } else if (batteryFilter === 'low') {
        params.append('battery', 'range:20:50')
      } else if (batteryFilter === 'good') {
        params.append('battery', 'gt:50')
      }
      
      // Add assignment filter
      if (assignmentFilter === 'assigned') {
        params.append('hasAssignee', 'true')
      } else if (assignmentFilter === 'unassigned') {
        params.append('hasAssignee', 'false')
      }
      
      // Fetch the smartwatches
      console.log('DEBUG: Fetching from API...')
      const response = await fetch(`/api/devices?${params}`)
      console.log('DEBUG: API response status:', response.status)
      
      const data = await response.json()
      console.log('DEBUG: API response meta:', data.meta)
      console.log('DEBUG: Received devices count:', data.devices?.length || 0)
      
      // Check if devices array exists and log sample data
      if (Array.isArray(data.devices) && data.devices.length > 0) {
        const sampleDevice = data.devices[0]
        console.log('DEBUG: Sample device keys:', Object.keys(sampleDevice))
        console.log('DEBUG: Sample device signal:', sampleDevice.signal)
        console.log('DEBUG: Sample device signalStrength:', sampleDevice.signalStrength)
      }
      
      // Transform the device data to include additional smartwatch-specific properties
      const smartwatchesWithDefaults = Array.isArray(data.devices)
        ? data.devices.map((device: any) => {
            const processedDevice = {
              ...device,
              firmwareVersion: device.firmwareVersion || '1.0.0',
              location: device.location || device.room,
              model: device.model || 'Unknown Model',
              // Add signalStrength for compatibility with SmartWatchRow
              signalStrength: device.signal || 0
            };
            return processedDevice;
          })
        : []; // Default to empty array if data.devices doesn't exist
      
      console.log('DEBUG: First processed device:',
        smartwatchesWithDefaults.length > 0 ?
        JSON.stringify(smartwatchesWithDefaults[0]).substring(0, 200) : 'No devices'
      )
      
      setSmartWatches(smartwatchesWithDefaults)
      setTotalPages(data.meta?.totalPages || 1)
      console.log('DEBUG: SmartWatches fetch completed successfully')
    } catch (error) {
      console.error('ERROR DETAILS:', error)
      console.error('ERROR MESSAGE:', error instanceof Error ? error.message : 'Unknown error')
      console.error('ERROR STACK:', error instanceof Error && error.stack ? error.stack : 'No stack trace')
      toast({
        title: 'Error',
        description: 'Failed to load smartwatch data.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Load smartwatches data initially and on filter changes
  useEffect(() => {
    fetchSmartWatches()
  }, [searchQuery, statusFilter, batteryFilter, assignmentFilter, page])
  
  // Set up polling fallback if SSE doesn't work
  useEffect(() => {
    // Initial load handled by the other useEffect
    
    // Set up polling only if SSE is not connected
    if (!sseConnected) {
      console.log('SSE not connected for smartwatches, using polling as fallback')
      
      const intervalId = setInterval(() => {
        fetchSmartWatches()
      }, 15000) // Every 15 seconds
      
      return () => clearInterval(intervalId)
    }
  }, [sseConnected])

  // Sort smartwatches based on the current sort option
  const sortedSmartWatches = [...smartwatches].sort((a, b) => {
    // Safely log properties for debugging
    console.log('DEBUG: Sorting smartwatch with props:',
      a.id, 'signal:', a.signal, 'signalStrength:', a.signalStrength || 'not set')
    
    switch (sortOption) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'status':
        return Number(b.isActive) - Number(a.isActive)
      case 'battery':
        return b.battery - a.battery
      case 'signal':
        // Use signalStrength if available, otherwise fall back to signal
        const aSignal = a.signalStrength !== undefined ? a.signalStrength : a.signal
        const bSignal = b.signalStrength !== undefined ? b.signalStrength : b.signal
        return bSignal - aSignal
      case 'lastActivity':
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      default:
        return 0
    }
  })

  // Open smartwatch details
  const openSmartWatchDetails = (smartwatch: SmartWatchDevice) => {
    setSelectedSmartWatch(smartwatch)
    setDetailsOpen(true)
  }

  // Close smartwatch details drawer
  const closeDetails = () => {
    setDetailsOpen(false)
  }

  // Format time display
  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Unknown'
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return 'Unknown'
    }
  }
  
  // Format firmware version display
  const formatFirmwareVersion = (version: string) => {
    return `v${version}`
  }

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setAssignmentFilter('all')
    setBatteryFilter('all')
    setSortOption('name')
  }

  // Quick actions
  const sendTestNotification = async (smartwatchId: number) => {
    try {
      toast({
        title: 'Sending Test Notification',
        description: 'Sending a test notification to the smartwatch...'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test notification.',
        variant: 'destructive'
      })
    }
  }

  const pairSmartWatch = async (smartwatchId: number) => {
    try {
      toast({
        title: 'Pairing Initiated',
        description: 'Attempting to pair with smartwatch...'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pair with smartwatch.',
        variant: 'destructive'
      })
    }
  }

  // Get battery class based on level
  const getBatteryClass = (level: number) => {
    if (level < 20) return 'text-red-500'
    if (level < 50) return 'text-amber-500'
    return 'text-green-500'
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search smartwatches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs pl-8"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={batteryFilter} onValueChange={setBatteryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Battery" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batteries</SelectItem>
                <SelectItem value="critical">Critical (&lt;20%)</SelectItem>
                <SelectItem value="low">Low (20-50%)</SelectItem>
                <SelectItem value="good">Good (&gt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="battery">Battery</SelectItem>
              <SelectItem value="signal">Signal</SelectItem>
              <SelectItem value="lastActivity">Last Activity</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={resetFilters} title="Reset filters">
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={fetchSmartWatches} title="Refresh list">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="default" className="whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Add Smartwatch
          </Button>
        </div>
      </div>

      {/* Smartwatches Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-center">Battery</TableHead>
              <TableHead className="text-center">Signal</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead>Firmware</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : sortedSmartWatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No smartwatches found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              sortedSmartWatches.map((smartwatch) => (
                <TableRow key={smartwatch.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openSmartWatchDetails(smartwatch)}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-medium">{smartwatch.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{smartwatch.uid}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`h-2.5 w-2.5 rounded-full mr-2 ${smartwatch.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>{smartwatch.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {smartwatch.assignedTo ? (
                      <div className="flex items-center">
                        <UserCircle className="h-4 w-4 mr-2 text-primary" />
                        <span>{smartwatch.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <BatteryIndicator value={smartwatch.battery} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <SignalIndicator value={smartwatch.signal} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatTimeAgo(smartwatch.lastSync)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{formatFirmwareVersion(smartwatch.firmwareVersion)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation()
                          sendTestNotification(smartwatch.id)
                        }}
                        title="Send test notification"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation()
                          pairSmartWatch(smartwatch.id)
                        }}
                        title="Pair device"
                      >
                        <Bluetooth className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          openSmartWatchDetails(smartwatch)
                        }}
                        title="View details"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Summary row - shows counts */}
      <div className="text-sm text-muted-foreground flex justify-between">
        <div>
          {loading ? (
            <Skeleton className="h-5 w-52" />
          ) : (
            <span>
              Showing {sortedSmartWatches.length} of {smartwatches.length} smartwatches
              {searchQuery && " (filtered)"}
            </span>
          )}
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <span>
              {loading ? <Skeleton className="h-5 w-12" /> : 
                `${smartwatches.filter(sw => sw.isActive).length} Active`
              }
            </span>
          </div>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
            <span>
              {loading ? <Skeleton className="h-5 w-16" /> : 
                `${smartwatches.filter(sw => !sw.isActive).length} Inactive`
              }
            </span>
          </div>
        </div>
      </div>

      {/* SmartWatch details drawer */}
      {selectedSmartWatch && (
        <SmartWatchDetails
          smartwatch={{
            ...selectedSmartWatch,
            // Add signalStrength property for compatibility with the details component
            signalStrength: selectedSmartWatch.signal
          }}
          isOpen={detailsOpen}
          onClose={closeDetails}
        />
      )}
    </div>
  )
}