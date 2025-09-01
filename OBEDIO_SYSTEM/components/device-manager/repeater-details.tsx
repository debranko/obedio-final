'use client'

import { useState, useEffect } from 'react'
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Battery,
  Signal,
  Clock,
  MapPin,
  Info,
  Settings,
  Network,
  RefreshCw,
  Download,
  X,
  Workflow,
  RotateCw,
  Shield,
  Wifi,
  Router,
  Radio,
  Zap,
  AlertTriangle,
  ChevronRight,
  Link2,
  Smartphone,
  Activity,
  Trash2
} from 'lucide-react'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from '@/components/ui/use-toast'
import { RepeaterDevice } from '@/hooks/use-devices'

interface ConnectedDevice {
  id: number
  name: string
  type: 'button' | 'watch' | 'repeater'
  signalStrength: number
  lastCommunication: string
}

interface RepeaterDetailsProps {
  repeater: RepeaterDevice
  isOpen: boolean
  onClose: () => void
}

export function RepeaterDetails({ repeater, isOpen, onClose }: RepeaterDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  
  const [frequencyValue, setFrequencyValue] = useState(repeater.operatingFrequency)
  const [txPower, setTxPower] = useState(80) // Transmission power percentage (0-100)
  const [emergencyModeEnabled, setEmergencyModeEnabled] = useState(repeater.isEmergencyMode)
  const [meshNetworkingEnabled, setMeshNetworkingEnabled] = useState(true)
  const [dynamicPowerScaling, setDynamicPowerScaling] = useState(true)
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [activityHistory, setActivityHistory] = useState<any[]>([])
  
  // Format dates for display
  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy HH:mm:ss')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const lastSeenFormatted = formatDistanceToNow(new Date(repeater.lastSeen), {
    addSuffix: true
  })

  // Get connected devices
  const fetchConnectedDevices = async () => {
    setLoading(true)
    try {
      // In a real application, this would fetch data from an API
      setTimeout(() => {
        const mockConnectedDevices: ConnectedDevice[] = [
          {
            id: 1,
            name: 'Button-Main-Suite',
            type: 'button',
            signalStrength: 90,
            lastCommunication: new Date(Date.now() - 5 * 60000).toISOString()
          },
          {
            id: 2,
            name: 'Watch-Crew1',
            type: 'watch',
            signalStrength: 85,
            lastCommunication: new Date(Date.now() - 2 * 60000).toISOString()
          },
          {
            id: 3,
            name: 'Button-Deck-Bar',
            type: 'button',
            signalStrength: 65,
            lastCommunication: new Date(Date.now() - 15 * 60000).toISOString()
          },
          {
            id: 4,
            name: 'Watch-Guest2',
            type: 'watch',
            signalStrength: 70,
            lastCommunication: new Date(Date.now() - 8 * 60000).toISOString()
          },
        ]
        setConnectedDevices(mockConnectedDevices)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching connected devices:', error)
      toast({
        title: 'Error',
        description: 'Failed to load connected devices.',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  // Get activity history
  const fetchActivityHistory = async () => {
    setLoading(true)
    try {
      setTimeout(() => {
        const mockHistory = [
          { type: 'status', message: 'Repeater online', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
          { type: 'connection', message: 'Connected to mesh network', timestamp: new Date(Date.now() - 1.9 * 3600000).toISOString() },
          { type: 'device', message: 'Button-Main-Suite connected', timestamp: new Date(Date.now() - 1.8 * 3600000).toISOString() },
          { type: 'firmware', message: 'Firmware update started', timestamp: new Date(Date.now() - 1 * 3600000).toISOString() },
          { type: 'firmware', message: 'Firmware update completed', timestamp: new Date(Date.now() - 0.9 * 3600000).toISOString() },
          { type: 'power', message: 'Power scaling adjusted', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
          { type: 'device', message: 'Watch-Crew1 connected', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
        ]
        setActivityHistory(mockHistory)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching activity history:', error)
      setLoading(false)
    }
  }

  // Load repeater data when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchConnectedDevices()
      fetchActivityHistory()
    }
  }, [isOpen])

  // Save configuration
  const saveConfiguration = async () => {
    setLoading(true)
    try {
      // In a real application, this would save the configuration to an API
      setTimeout(() => {
        toast({
          title: 'Configuration saved',
          description: `Repeater ${repeater.name} configuration has been updated.`,
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to save repeater configuration.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Toggle emergency mode
  const toggleEmergencyMode = async () => {
    setLoading(true)
    try {
      setEmergencyModeEnabled(!emergencyModeEnabled)
      toast({
        title: emergencyModeEnabled ? 'Emergency mode disabled' : 'Emergency mode enabled',
        description: `Emergency mode for ${repeater.name} has been ${emergencyModeEnabled ? 'disabled' : 'enabled'}.`,
      })
      setLoading(false)
    } catch (error) {
      console.error('Error toggling emergency mode:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while toggling emergency mode.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Test connectivity
  const testConnectivity = async () => {
    setLoading(true)
    try {
      toast({
        title: 'Testing network connectivity',
        description: `Checking connectivity for ${repeater.name}...`,
      })
      
      setTimeout(() => {
        toast({
          title: 'Connectivity test complete',
          description: `${repeater.name} is online and responding.`,
        })
        setLoading(false)
      }, 2000)
    } catch (error) {
      console.error('Error testing connectivity:', error)
      toast({
        title: 'Error',
        description: 'Failed to test connectivity.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Update repeater firmware
  const updateFirmware = async () => {
    setLoading(true)
    try {
      toast({
        title: 'Firmware update started',
        description: `Initiating firmware update for ${repeater.name}...`,
      })
      
      setTimeout(() => {
        setLoading(false)
        toast({
          title: 'Firmware update complete',
          description: `Firmware for ${repeater.name} has been updated successfully.`,
        })
      }, 3000)
    } catch (error) {
      console.error('Error updating firmware:', error)
      toast({
        title: 'Error',
        description: 'Failed to update firmware.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Reset repeater
  const resetRepeater = async () => {
    setLoading(true)
    try {
      toast({
        title: 'Reset initiated',
        description: `${repeater.name} is being reset...`,
      })
      
      setTimeout(() => {
        setLoading(false)
        toast({
          title: 'Reset complete',
          description: `${repeater.name} has been reset successfully.`,
        })
      }, 2000)
    } catch (error) {
      console.error('Error resetting repeater:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset the repeater.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }
  
  // Format time display
  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return 'Unknown'
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between">
              {loading ? (
                <Skeleton className="h-6 w-[150px]" />
              ) : (
                <span>{repeater.name || 'Repeater Device'}</span>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </DrawerTitle>
            <DrawerDescription>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{repeater.uid}</span>
                {repeater.isEmergencyMode && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Emergency Mode
                  </Badge>
                )}
              </div>
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="pb-4">
            <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info">
                    <Info className="mr-2 h-4 w-4" />
                    Information
                  </TabsTrigger>
                  <TabsTrigger value="network">
                    <Network className="mr-2 h-4 w-4" />
                    Network
                  </TabsTrigger>
                  <TabsTrigger value="devices">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Devices
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    <Activity className="mr-2 h-4 w-4" />
                    Activity
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Information Tab */}
              <TabsContent value="info" className="p-4 pt-2">
                <div className="space-y-6">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <>
                      {/* Status Card */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Status</p>
                          <div className="flex items-center">
                            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${repeater.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <p className="text-sm">{repeater.isActive ? 'Active' : 'Inactive'}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Last Seen</p>
                          <p className="text-sm">{lastSeenFormatted}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Battery</p>
                          <div className="flex items-center gap-2">
                            <Battery className="h-4 w-4 text-muted-foreground" />
                            <BatteryIndicator value={repeater.battery} />
                            <span className="text-sm font-medium ml-1">{repeater.battery}%</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Signal</p>
                          <div className="flex items-center gap-2">
                            <Signal className="h-4 w-4 text-muted-foreground" />
                            <SignalIndicator value={repeater.signalStrength} />
                            <span className="text-sm font-medium ml-1">{repeater.signalStrength}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Coverage Visualization (Simple version) */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Coverage Area</h3>
                        <Card>
                          <CardContent className="p-4">
                            <div className="aspect-video relative bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                              <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                                  <Radio className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="absolute inset-0 opacity-50 rounded-full animate-pulse" style={{
                                  background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 70%)',
                                  width: '100%',
                                  height: '100%',
                                  transform: 'scale(1.5)'
                                }}></div>
                                <p className="mt-2 text-sm font-medium">
                                  {repeater.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {repeater.coverageArea}
                                </p>
                                <Badge variant="outline" className="mt-2">
                                  {repeater.connectedDevices} connected devices
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Device Details */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Device Information</h3>
                        <div className="rounded-md border divide-y">
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Location</span>
                            <span className="text-sm font-medium">{repeater.location}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Firmware Version</span>
                            <span className="text-sm font-medium">v{repeater.firmwareVersion}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Operating Frequency</span>
                            <span className="text-sm font-medium">{repeater.operatingFrequency}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Connection Type</span>
                            <span className="text-sm font-medium">{repeater.connectionType}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Mesh Network Role</span>
                            <span className="text-sm font-medium capitalize">{repeater.meshRole}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">IP Address</span>
                            <span className="text-sm font-mono">{repeater.ipAddress}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">MAC Address</span>
                            <span className="text-sm font-mono">{repeater.macAddress}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-auto py-2"
                          onClick={testConnectivity}
                        >
                          <Network className="h-4 w-4 mr-2" />
                          Test Connectivity
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-auto py-2"
                          onClick={updateFirmware}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Update Firmware
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-auto py-2"
                          onClick={resetRepeater}
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Reset Device
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              {/* Network Tab */}
              <TabsContent value="network" className="p-4 pt-2">
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Network Configuration</h3>
                  
                  {/* Network Status */}
                  <div className="rounded-md border p-4">
                    <h4 className="text-sm font-medium mb-4">Network Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Connection Type</p>
                        <div className="flex items-center">
                          {repeater.connectionType === 'Ethernet' ? (
                            <>
                              <Router className="h-4 w-4 mr-2 text-blue-500" />
                              <p className="text-sm font-medium">Ethernet</p>
                            </>
                          ) : (
                            <>
                              <Wifi className="h-4 w-4 mr-2 text-blue-500" />
                              <p className="text-sm font-medium">Wi-Fi</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">IP Address</p>
                        <p className="text-sm font-mono">{repeater.ipAddress}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">MAC Address</p>
                        <p className="text-sm font-mono">{repeater.macAddress}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Mesh Network Role</p>
                        <p className="text-sm font-medium capitalize">{repeater.meshRole}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={testConnectivity}>
                        <Network className="h-4 w-4 mr-2" />
                        Test Network Connection
                      </Button>
                    </div>
                  </div>
                  
                  {/* Operating Frequency */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Operating Frequency</Label>
                      <Select value={frequencyValue} onValueChange={setFrequencyValue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="433 MHz">433 MHz</SelectItem>
                          <SelectItem value="868 MHz">868 MHz</SelectItem>
                          <SelectItem value="915 MHz">915 MHz</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select the appropriate frequency for your region and devices
                      </p>
                    </div>
                  </div>
                  
                  {/* Transmission Power */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Transmission Power</Label>
                        <span className="text-sm">{txPower}%</span>
                      </div>
                      <Slider
                        defaultValue={[txPower]}
                        max={100}
                        step={5}
                        onValueChange={(value) => setTxPower(value[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Higher values increase range but consume more power
                      </p>
                    </div>
                  </div>

                  {/* Mesh Network Settings */}
                  <div className="rounded-md border p-4 space-y-4">
                    <h4 className="text-sm font-medium">Mesh Network Settings</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="mesh-networking" className="text-sm">Enable Mesh Networking</Label>
                        <p className="text-xs text-muted-foreground">
                          Connect with other repeaters to extend range and reliability
                        </p>
                      </div>
                      <Switch
                        id="mesh-networking"
                        checked={meshNetworkingEnabled}
                        onCheckedChange={setMeshNetworkingEnabled}
                      />
                    </div>
                    
                    {meshNetworkingEnabled && (
                      <div className="space-y-2 pl-4 border-l-2 border-muted mt-2">
                        <div className="space-y-1">
                          <Label htmlFor="mesh-role">Mesh Role</Label>
                          <Select defaultValue={repeater.meshRole}>
                            <SelectTrigger id="mesh-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primary">Primary</SelectItem>
                              <SelectItem value="secondary">Secondary</SelectItem>
                              <SelectItem value="standalone">Standalone</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Connected Devices Tab */}
              <TabsContent value="devices" className="p-4 pt-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Connected Devices</h3>
                    <Badge variant="secondary">{connectedDevices.length} Devices</Badge>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : connectedDevices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No devices currently connected to this repeater</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {connectedDevices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-3 rounded-md border">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              device.type === 'button' ? 'bg-blue-100' : 
                              device.type === 'watch' ? 'bg-purple-100' : 'bg-green-100'
                            }`}>
                              {device.type === 'button' && <Radio className="h-4 w-4 text-blue-500" />}
                              {device.type === 'watch' && <Smartphone className="h-4 w-4 text-purple-500" />}
                              {device.type === 'repeater' && <Network className="h-4 w-4 text-green-500" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{device.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{device.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="flex items-center justify-end">
                                <SignalIndicator value={device.signalStrength} />
                                <span className="text-xs ml-1">{device.signalStrength}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatTimeAgo(device.lastCommunication)}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full" onClick={fetchConnectedDevices} disabled={loading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Device List
                  </Button>
                </div>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="p-4 pt-2">
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Device Settings</h3>
                  
                  {/* Device Name */}
                  <div className="space-y-2">
                    <Label htmlFor="device-name">Device Name</Label>
                    <Input id="device-name" defaultValue={repeater.name} />
                  </div>
                  
                  {/* Device Location */}
                  <div className="space-y-2">
                    <Label htmlFor="device-location">Location</Label>
                    <Input id="device-location" defaultValue={repeater.location} />
                  </div>
                  
                  <Separator />
                  
                  {/* Advanced Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Advanced Settings</h4>
                    
                    {/* Emergency Mode */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="emergency-mode" className="text-base">Emergency Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          Enables direct device-to-device communication when the central server is unavailable
                        </p>
                      </div>
                      <Switch
                        id="emergency-mode"
                        checked={emergencyModeEnabled}
                        onCheckedChange={setEmergencyModeEnabled}
                      />
                    </div>
                    
                    {/* Dynamic TX Power Scaling */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="dynamic-power" className="text-base">Dynamic TX Power Scaling</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically adjusts transmission power to optimize battery life
                        </p>
                      </div>
                      <Switch
                        id="dynamic-power"
                        checked={dynamicPowerScaling}
                        onCheckedChange={setDynamicPowerScaling}
                      />
                    </div>
                    
                    {/* Encryption */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="encryption" className="text-base">AES-128 Encryption</Label>
                        <p className="text-xs text-muted-foreground">
                          Secures communication between devices
                        </p>
                      </div>
                      <Switch
                        id="encryption"
                        checked={encryptionEnabled}
                        onCheckedChange={setEncryptionEnabled}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-red-500">Danger Zone</h4>
                    
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50" onClick={resetRepeater}>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Factory Reset
                      </Button>
                      
                      <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Repeater
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Activity Tab */}
              <TabsContent value="activity" className="p-4 pt-2">
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Activity History</h3>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : activityHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No activity history available</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activityHistory.map((activity, index) => (
                        <div key={index} className="flex items-start py-2 border-b last:border-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-3 ${
                            activity.type === 'status' ? 'bg-green-100' : 
                            activity.type === 'firmware' ? 'bg-blue-100' : 
                            activity.type === 'error' ? 'bg-red-100' : 
                            activity.type === 'connection' ? 'bg-purple-100' : 
                            activity.type === 'device' ? 'bg-amber-100' :
                            activity.type === 'power' ? 'bg-cyan-100' : 'bg-slate-100'
                          }`}>
                            {activity.type === 'status' && <Activity className="h-4 w-4 text-green-500" />}
                            {activity.type === 'firmware' && <Download className="h-4 w-4 text-blue-500" />}
                            {activity.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {activity.type === 'connection' && <Network className="h-4 w-4 text-purple-500" />}
                            {activity.type === 'device' && <Smartphone className="h-4 w-4 text-amber-500" />}
                            {activity.type === 'power' && <Zap className="h-4 w-4 text-cyan-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full" onClick={fetchActivityHistory} disabled={loading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Activity History
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DrawerFooter>
            {(activeTab === 'network' || activeTab === 'settings') && (
              <Button onClick={saveConfiguration} disabled={loading}>
                Save Changes
              </Button>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}