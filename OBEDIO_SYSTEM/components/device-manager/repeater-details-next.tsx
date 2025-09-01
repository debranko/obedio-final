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
import { RepeaterDevice } from '@/hooks/use-devices-next'

interface ConnectedDevice {
  id: number
  name: string
  type: 'button' | 'watch' | 'repeater'
  signal: number  // Updated to use consistent field name
  lastCommunication: string
}

interface RepeaterDetailsNextProps {
  repeater: RepeaterDevice
  isOpen: boolean
  onClose: () => void
}

export function RepeaterDetailsNext({ repeater, isOpen, onClose }: RepeaterDetailsNextProps) {
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
            signal: 90,  // Updated to use consistent field name
            lastCommunication: new Date(Date.now() - 5 * 60000).toISOString()
          },
          {
            id: 2,
            name: 'Watch-Crew1',
            type: 'watch',
            signal: 85,  // Updated to use consistent field name
            lastCommunication: new Date(Date.now() - 2 * 60000).toISOString()
          },
          {
            id: 3,
            name: 'Button-Deck-Bar',
            type: 'button',
            signal: 65,  // Updated to use consistent field name
            lastCommunication: new Date(Date.now() - 15 * 60000).toISOString()
          },
          {
            id: 4,
            name: 'Watch-Guest2',
            type: 'watch',
            signal: 70,  // Updated to use consistent field name
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
                            <SignalIndicator value={repeater.signal} />
                            <span className="text-sm font-medium ml-1">{repeater.signal}%</span>
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
                          variant={emergencyModeEnabled ? "destructive" : "outline"}
                          size="sm"
                          className={`h-auto py-2 ${!emergencyModeEnabled && "border-amber-200 text-amber-600 hover:bg-amber-50"}`}
                          onClick={toggleEmergencyMode}
                        >
                          {emergencyModeEnabled ? (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Disable Emergency
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Enable Emergency
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Network Tab */}
              <TabsContent value="network" className="p-4 pt-2">
                <div className="space-y-6">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border p-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Connection Status</h3>
                            <div className="flex items-center">
                              <div className={`h-2.5 w-2.5 rounded-full mr-2 ${repeater.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <p className="text-sm">{repeater.isActive ? 'Connected' : 'Disconnected'}</p>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium mb-2">Connection Type</h3>
                            <div className="flex items-center">
                              {repeater.connectionType === 'Ethernet' ? (
                                <>
                                  <Router className="h-4 w-4 mr-2 text-blue-500" />
                                  <span>Ethernet</span>
                                </>
                              ) : (
                                <>
                                  <Wifi className="h-4 w-4 mr-2 text-blue-500" />
                                  <span>Wi-Fi</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <h3 className="text-sm font-medium mb-1">Network Information</h3>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">IP Address</span>
                                <span className="font-mono">{repeater.ipAddress}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">MAC Address</span>
                                <span className="font-mono">{repeater.macAddress}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Network SSID</span>
                                <span>Yacht-Network-5G</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      
                        <div className="mt-4">
                          <Button variant="outline" size="sm" onClick={testConnectivity}>
                            <Network className="h-4 w-4 mr-2" />
                            Test Connectivity
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Frequency Settings</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="frequency">Operating Frequency</Label>
                              <span className="text-sm font-mono">{frequencyValue}</span>
                            </div>
                            <Select value={frequencyValue} onValueChange={setFrequencyValue}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="433 MHz">433 MHz</SelectItem>
                                <SelectItem value="868 MHz">868 MHz</SelectItem>
                                <SelectItem value="915 MHz">915 MHz</SelectItem>
                                <SelectItem value="2.4 GHz">2.4 GHz</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="txPower">Transmission Power</Label>
                              <span className="text-sm font-mono">{txPower}%</span>
                            </div>
                            <Slider
                              id="txPower"
                              min={0}
                              max={100}
                              step={5}
                              value={[txPower]}
                              onValueChange={([value]) => setTxPower(value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Network Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="dynamicPower" className="text-base">Dynamic Power Scaling</Label>
                              <p className="text-sm text-muted-foreground">
                                Automatically adjust power based on signal requirements
                              </p>
                            </div>
                            <Switch
                              id="dynamicPower"
                              checked={dynamicPowerScaling}
                              onCheckedChange={setDynamicPowerScaling}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="meshNetworking" className="text-base">Mesh Networking</Label>
                              <p className="text-sm text-muted-foreground">
                                Connect with other repeaters to extend coverage
                              </p>
                            </div>
                            <Switch
                              id="meshNetworking"
                              checked={meshNetworkingEnabled}
                              onCheckedChange={setMeshNetworkingEnabled}
                            />
                          </div>
                          
                          {meshNetworkingEnabled && (
                            <div className="ml-6 border-l-2 pl-4 border-slate-100 space-y-2">
                              <div className="space-y-1">
                                <Label htmlFor="meshRole" className="text-sm">Mesh Network Role</Label>
                                <Select defaultValue={repeater.meshRole}>
                                  <SelectTrigger id="meshRole">
                                    <SelectValue placeholder="Select a role" />
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
                    </>
                  )}
                </div>
              </TabsContent>
              
              {/* Devices Tab */}
              <TabsContent value="devices" className="p-4 pt-2">
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Connected Devices ({connectedDevices.length})</h3>
                  
                  {loading ? (
                    <div className="space-y-2">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : connectedDevices.length === 0 ? (
                    <div className="text-center p-6 border rounded-md">
                      <p className="text-sm text-muted-foreground">No devices connected to this repeater</p>
                    </div>
                  ) : (
                    <div className="rounded-md border divide-y">
                      {connectedDevices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                          <div className="flex items-center">
                            <div className="mr-3">
                              {device.type === 'button' ? (
                                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                                  <Zap className="h-4 w-4 text-blue-500" />
                                </div>
                              ) : device.type === 'watch' ? (
                                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                                  <Smartphone className="h-4 w-4 text-green-500" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                                  <Radio className="h-4 w-4 text-purple-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{device.name}</p>
                              <p className="text-xs text-muted-foreground">Last seen {formatTimeAgo(device.lastCommunication)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <SignalIndicator value={device.signal} />
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full" onClick={fetchConnectedDevices} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh Devices'}
                  </Button>
                </div>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="p-4 pt-2">
                <div className="space-y-6">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-medium mb-2">Device Settings</h3>
                      
                      <div className="rounded-md border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="emergencyMode" className="text-base">Emergency Mode</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable mesh network emergency broadcasting
                            </p>
                          </div>
                          <Switch
                            id="emergencyMode"
                            checked={emergencyModeEnabled}
                            onCheckedChange={setEmergencyModeEnabled}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="encryption" className="text-base">Encryption</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable end-to-end encryption for device communication
                            </p>
                          </div>
                          <Switch
                            id="encryption"
                            checked={encryptionEnabled}
                            onCheckedChange={setEncryptionEnabled}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="deviceName" className="text-base">Device Name</Label>
                          <Input 
                            id="deviceName" 
                            placeholder="Enter device name" 
                            defaultValue={repeater.name}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="deviceRoom" className="text-base">Room/Location</Label>
                          <Input 
                            id="deviceRoom" 
                            placeholder="Enter room or location" 
                            defaultValue={repeater.location}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-4">
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50" onClick={resetRepeater}>
                            <RotateCw className="h-4 w-4 mr-2" />
                            Reset Device
                          </Button>
                          <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Device
                          </Button>
                        </div>
                        
                        <Button onClick={saveConfiguration}>
                          Save Configuration
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="p-4 pt-2">
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Activity History</h3>
                  
                  {loading ? (
                    <div className="space-y-2">
                      {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : activityHistory.length === 0 ? (
                    <div className="text-center p-6 border rounded-md">
                      <p className="text-sm text-muted-foreground">No activity history available</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activityHistory.map((activity, index) => (
                        <div key={index} className="flex items-center p-2 rounded-md hover:bg-slate-50">
                          <div className="mr-3">
                            {activity.type === 'status' && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
                            {activity.type === 'connection' && <div className="h-2 w-2 bg-green-500 rounded-full" />}
                            {activity.type === 'firmware' && <div className="h-2 w-2 bg-amber-500 rounded-full" />}
                            {activity.type === 'device' && <div className="h-2 w-2 bg-purple-500 rounded-full" />}
                            {activity.type === 'power' && <div className="h-2 w-2 bg-red-500 rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.message}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full" onClick={fetchActivityHistory} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh Activity'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DrawerFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}