'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Plus, Search, Wifi, WifiOff, Battery, Signal, Settings, QrCode, Trash2, Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useToast } from '@/components/ui/use-toast'
import { DeviceProvisioningDialog } from './device-provisioning-dialog'

interface MQTTDevice {
  id: string
  clientId: string
  name: string
  type: 'BUTTON' | 'SMARTWATCH' | 'REPEATER' | 'SENSOR'
  status: 'online' | 'offline' | 'provisioning'
  site: string
  room: string
  lastSeen: string
  battery?: number
  signal?: number
  firmware?: string
  createdAt: string
}

export function MQTTDevicesTab() {
  const [mounted, setMounted] = useState(false)
  const [devices, setDevices] = useState<MQTTDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showProvisionDialog, setShowProvisionDialog] = useState(false)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth('/api/mqtt/devices')
      
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || [])
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch MQTT devices',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch MQTT devices',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    setMounted(true)
    fetchDevices()
    
    // Cleanup WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [fetchDevices])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">MQTT Devices</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const startRealTimeMonitoring = async () => {
    try {
      // Get WebSocket endpoint info
      const response = await fetchWithAuth('/api/mqtt/ws')
      if (!response.ok) {
        throw new Error('Failed to get WebSocket info')
      }
      
      const wsInfo = await response.json()
      const ws = new WebSocket(wsInfo.endpoints.devices)
      
      ws.onopen = () => {
        setRealTimeEnabled(true)
        toast({
          title: 'Real-time Monitoring Active',
          description: 'Device status updates are now live',
        })
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'device_update') {
          setDevices(prev => prev.map(device =>
            device.id === data.device.id
              ? { ...device, ...data.device, lastSeen: new Date().toISOString() }
              : device
          ))
          setLastUpdate(new Date())
        } else if (data.type === 'device_added') {
          setDevices(prev => [...prev, data.device])
          setLastUpdate(new Date())
        } else if (data.type === 'device_removed') {
          setDevices(prev => prev.filter(device => device.id !== data.deviceId))
          setLastUpdate(new Date())
        }
      }

      ws.onclose = () => {
        setRealTimeEnabled(false)
        wsRef.current = null
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to real-time monitoring',
          variant: 'destructive',
        })
        setRealTimeEnabled(false)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error starting real-time monitoring:', error)
      toast({
        title: 'Error',
        description: 'Failed to start real-time monitoring',
        variant: 'destructive',
      })
    }
  }

  const stopRealTimeMonitoring = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    setRealTimeEnabled(false)
    toast({
      title: 'Real-time Monitoring Stopped',
      description: 'Device monitoring has been disabled',
    })
  }

  const toggleRealTimeMonitoring = () => {
    if (realTimeEnabled) {
      stopRealTimeMonitoring()
    } else {
      startRealTimeMonitoring()
    }
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.room.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    const matchesType = typeFilter === 'all' || device.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800"><Wifi className="w-3 h-3 mr-1" />Online</Badge>
      case 'offline':
        return <Badge variant="outline" className="text-gray-600"><WifiOff className="w-3 h-3 mr-1" />Offline</Badge>
      case 'provisioning':
        return <Badge className="bg-yellow-100 text-yellow-800">Provisioning</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getBatteryBadge = (battery?: number) => {
    if (!battery) return null
    
    const color = battery > 50 ? 'text-green-600' : battery > 20 ? 'text-yellow-600' : 'text-red-600'
    return (
      <div className={`flex items-center ${color}`}>
        <Battery className="w-3 h-3 mr-1" />
        {battery}%
      </div>
    )
  }

  const getSignalBadge = (signal?: number) => {
    if (!signal) return null
    
    const color = signal > 70 ? 'text-green-600' : signal > 40 ? 'text-yellow-600' : 'text-red-600'
    return (
      <div className={`flex items-center ${color}`}>
        <Signal className="w-3 h-3 mr-1" />
        {signal}%
      </div>
    )
  }

  const handleDeviceProvisioned = () => {
    fetchDevices()
    setShowProvisionDialog(false)
    toast({
      title: 'Success',
      description: 'Device provisioned successfully',
    })
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          {realTimeEnabled ? (
            <>
              <Activity className="w-5 h-5 text-green-600 animate-pulse" />
              <div>
                <h3 className="font-semibold text-green-800">Live Monitoring Active</h3>
                <p className="text-sm text-green-600">Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</p>
              </div>
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="font-semibold text-gray-700">Static View</h3>
                <p className="text-sm text-gray-500">Enable real-time monitoring for live updates</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Label htmlFor="real-time" className="text-sm font-medium">
            Real-time monitoring
          </Label>
          <Switch
            id="real-time"
            checked={realTimeEnabled}
            onCheckedChange={toggleRealTimeMonitoring}
          />
        </div>
      </div>

      {/* Enhanced Device Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {devices.length > 0 ? `${Math.round((devices.filter(d => d.status === 'online').length / devices.length) * 100)}% online` : 'No devices'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wifi className="w-4 h-4 mr-2 text-green-600" />
              Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devices.filter(d => d.status === 'online').length}
            </div>
            <Progress
              value={devices.length ? (devices.filter(d => d.status === 'online').length / devices.length) * 100 : 0}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <WifiOff className="w-4 h-4 mr-2 text-red-600" />
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {devices.filter(d => d.status === 'offline').length}
            </div>
            <Progress
              value={devices.length ? (devices.filter(d => d.status === 'offline').length / devices.length) * 100 : 0}
              className="mt-2 h-2 [&>div]:bg-red-500"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="w-4 h-4 mr-2 text-yellow-600" />
              Provisioning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {devices.filter(d => d.status === 'provisioning').length}
            </div>
            <Progress
              value={devices.length ? (devices.filter(d => d.status === 'provisioning').length / devices.length) * 100 : 0}
              className="mt-2 h-2 [&>div]:bg-yellow-500"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Battery className="w-4 h-4 mr-2" />
              Avg Battery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.filter(d => d.battery).length > 0
                ? `${Math.round(devices.filter(d => d.battery).reduce((acc, d) => acc + (d.battery || 0), 0) / devices.filter(d => d.battery).length)}%`
                : 'N/A'
              }
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {devices.filter(d => d.battery && d.battery < 20).length > 0 && (
                <span className="flex items-center text-red-500">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {devices.filter(d => d.battery && d.battery < 20).length} low battery
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Management Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="provisioning">Provisioning</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="BUTTON">Button</SelectItem>
              <SelectItem value="SMARTWATCH">Watch</SelectItem>
              <SelectItem value="REPEATER">Repeater</SelectItem>
              <SelectItem value="SENSOR">Sensor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowProvisionDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Devices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading devices...
                  </TableCell>
                </TableRow>
              ) : filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No devices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground">{device.clientId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{device.type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{device.site}</div>
                        <div className="text-sm text-muted-foreground">{device.room}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getBatteryBadge(device.battery)}</TableCell>
                    <TableCell>{getSignalBadge(device.signal)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(device.lastSeen).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Device Provisioning Dialog */}
      <DeviceProvisioningDialog
        open={showProvisionDialog}
        onClose={() => setShowProvisionDialog(false)}
        onDeviceProvisioned={handleDeviceProvisioned}
      />
    </div>
  )
}