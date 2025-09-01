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
import { 
  Battery, 
  Signal, 
  Clock, 
  MapPin, 
  Info, 
  Bell, 
  Settings, 
  RefreshCw,
  Download,
  X,
  Workflow,
  RotateCw,
  ZapOff,
  Vibrate
} from 'lucide-react'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from '@/components/ui/use-toast'

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
  location: string
}

interface ButtonDetailsProps {
  button: ButtonDevice
  isOpen: boolean
  onClose: () => void
}

interface InteractionConfig {
  type: string // 'single_press', 'double_press', 'long_press', 'touch'
  enabled: boolean
  action: string // 'request', 'call', 'message', 'custom'
  target?: string
  message?: string
}

export function ButtonDetails({ button, isOpen, onClose }: ButtonDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [interactions, setInteractions] = useState<InteractionConfig[]>([
    { type: 'single_press', enabled: true, action: 'request' },
    { type: 'double_press', enabled: true, action: 'call' },
    { type: 'long_press', enabled: false, action: 'message' },
    { type: 'touch', enabled: false, action: 'custom' },
  ])
  const [shakeToCall, setShakeToCall] = useState(true)
  const [ledEnabled, setLedEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  
  // Format dates for display
  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy HH:mm:ss')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const lastSeenFormatted = formatDistanceToNow(new Date(button.lastSeen), {
    addSuffix: true
  })

  // Get activity history
  const getActivityHistory = async () => {
    setLoading(true)
    try {
      // In a real application, this would fetch activity history from an API
      // For now, just simulate a delay and show loading state
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching activity history:', error)
      setLoading(false)
    }
  }

  // Load button configuration data
  useEffect(() => {
    if (isOpen) {
      getActivityHistory()
    }
  }, [isOpen])

  // Save button configuration
  const saveConfiguration = async () => {
    setLoading(true)
    try {
      // In a real application, this would save the configuration to an API
      // For now, just simulate a delay and show success toast
      setTimeout(() => {
        toast({
          title: 'Configuration saved',
          description: `Button ${button.name} configuration has been updated.`,
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to save button configuration.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Test connection with button
  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/devices/${button.id}/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Error pinging button')
      }
      
      toast({
        title: 'Connection test initiated',
        description: `Button ${button.name} should now blink and vibrate if online.`,
      })
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: 'Error',
        description: 'Connection test failed. Button may be offline.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset button to factory settings
  const resetButton = async () => {
    setLoading(true)
    try {
      // In a real application, this would call an API to reset the button
      toast({
        title: 'Reset initiated',
        description: 'The button will be reset to factory settings.',
      })
      
      setTimeout(() => {
        setLoading(false)
        toast({
          title: 'Reset complete',
          description: 'Button has been reset to factory settings.',
        })
      }, 2000)
    } catch (error) {
      console.error('Error resetting button:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset the button.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Update button firmware
  const updateFirmware = async () => {
    setLoading(true)
    try {
      toast({
        title: 'Firmware update initiated',
        description: 'Starting firmware update. Please keep the button within range.',
      })
      
      setTimeout(() => {
        setLoading(false)
        toast({
          title: 'Firmware update complete',
          description: `Firmware for ${button.name} has been updated successfully.`,
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

  // Toggle enabled status for an interaction
  const toggleInteraction = (type: string) => {
    setInteractions(prev => prev.map(item => 
      item.type === type ? {...item, enabled: !item.enabled} : item
    ))
  }

  // Update action for an interaction
  const updateInteractionAction = (type: string, action: string) => {
    setInteractions(prev => prev.map(item => 
      item.type === type ? {...item, action} : item
    ))
  }

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case 'single_press': return 'Single Press'
      case 'double_press': return 'Double Press'
      case 'long_press': return 'Long Press'
      case 'touch': return 'Touch'
      default: return type
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-3xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between">
              {loading ? (
                <Skeleton className="h-6 w-[150px]" />
              ) : (
                <span>{button.name || 'Button Device'}</span>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </DrawerTitle>
            <DrawerDescription>
              {loading ? (
                <Skeleton className="h-4 w-[200px]" />
              ) : (
                <span className="font-mono text-xs">{button.uid}</span>
              )}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="pb-4">
            <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">
                    <Info className="mr-2 h-4 w-4" />
                    Information
                  </TabsTrigger>
                  <TabsTrigger value="interactions">
                    <Workflow className="mr-2 h-4 w-4" />
                    Interactions
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <Clock className="mr-2 h-4 w-4" />
                    History
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
                            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${button.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <p className="text-sm">{button.isActive ? 'Active' : 'Inactive'}</p>
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
                            <BatteryIndicator value={button.battery} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Signal</p>
                          <div className="flex items-center gap-2">
                            <Signal className="h-4 w-4 text-muted-foreground" />
                            <SignalIndicator value={button.signalStrength} />
                          </div>
                        </div>
                      </div>

                      {/* Device Details */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Device Information</h3>
                        <div className="rounded-md border divide-y">
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Location</span>
                            <span className="text-sm font-medium">{button.location || button.room}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Firmware Version</span>
                            <span className="text-sm font-medium">v{button.firmwareVersion}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Registered On</span>
                            <span className="text-sm font-medium">{formatDateTime(button.lastSeen)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-auto py-2"
                          onClick={testConnection}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Test Connection
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
                          onClick={resetButton}
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Factory Reset
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              {/* Interactions Tab */}
              <TabsContent value="interactions" className="p-4 pt-2">
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Button Interaction Settings</h3>
                  
                  {/* Button Interaction Config */}
                  <div className="space-y-4">
                    {interactions.map(interaction => (
                      <div key={interaction.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`enable-${interaction.type}`} className="text-base">
                            {getInteractionLabel(interaction.type)}
                          </Label>
                          <Switch 
                            id={`enable-${interaction.type}`}
                            checked={interaction.enabled}
                            onCheckedChange={() => toggleInteraction(interaction.type)}
                          />
                        </div>
                        {interaction.enabled && (
                          <div className="pl-2 border-l-2 border-muted space-y-2">
                            <div className="space-y-2">
                              <Label htmlFor={`action-${interaction.type}`}>Action</Label>
                              <Select 
                                value={interaction.action}
                                onValueChange={(value) => updateInteractionAction(interaction.type, value)}
                              >
                                <SelectTrigger id={`action-${interaction.type}`}>
                                  <SelectValue placeholder="Select an action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="request">Create Service Request</SelectItem>
                                  <SelectItem value="call">Call Crew Member</SelectItem>
                                  <SelectItem value="message">Send Voice Message</SelectItem>
                                  <SelectItem value="custom">Custom Action</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {interaction.action === 'call' && (
                              <div className="space-y-2">
                                <Label htmlFor={`target-${interaction.type}`}>Call Target</Label>
                                <Select defaultValue="closest">
                                  <SelectTrigger id={`target-${interaction.type}`}>
                                    <SelectValue placeholder="Select call target" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="closest">Closest Crew Member</SelectItem>
                                    <SelectItem value="specific">Specific Crew Member</SelectItem>
                                    <SelectItem value="department">Department</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {interaction.action === 'message' && (
                              <div className="space-y-2">
                                <Label htmlFor={`message-${interaction.type}`}>Pre-recorded Message</Label>
                                <Select defaultValue="assistance">
                                  <SelectTrigger id={`message-${interaction.type}`}>
                                    <SelectValue placeholder="Select message" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="assistance">Request Assistance</SelectItem>
                                    <SelectItem value="emergency">Emergency Help</SelectItem>
                                    <SelectItem value="supplies">Request Supplies</SelectItem>
                                    <SelectItem value="custom">Record Custom Message</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}
                        <Separator className="my-2" />
                      </div>
                    ))}
                  </div>

                  {/* Shake to Call Feature */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="shake-to-call" className="text-base">
                          Shake to Call
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          When enabled, shaking the button will trigger an emergency call
                        </p>
                      </div>
                      <Switch 
                        id="shake-to-call"
                        checked={shakeToCall}
                        onCheckedChange={setShakeToCall}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="p-4 pt-2">
                <div className="space-y-6">
                  {/* Button Settings Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="button-name">Button Name</Label>
                      <Input id="button-name" defaultValue={button.name} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="button-location">Location</Label>
                      <Input id="button-location" defaultValue={button.location || button.room} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="led-enabled">LED Feedback</Label>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Enable LED</span>
                          <Switch 
                            id="led-enabled" 
                            checked={ledEnabled} 
                            onCheckedChange={setLedEnabled}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="vibration-enabled">Vibration Feedback</Label>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Enable Vibration</span>
                          <Switch 
                            id="vibration-enabled" 
                            checked={vibrationEnabled} 
                            onCheckedChange={setVibrationEnabled}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Communication Settings */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Communication Settings</h3>
                    
                    <div className="rounded-md border p-3 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">LoRa Communication</p>
                          <p className="text-sm text-muted-foreground">Primary communication method</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Enabled</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Wi-Fi Connection</p>
                          <p className="text-sm text-muted-foreground">Used for voice messages and updates</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">On-Demand</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">AES-128 Encryption</p>
                          <p className="text-sm text-muted-foreground">Secure communication</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* History Tab */}
              <TabsContent value="history" className="p-4 pt-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Activity History</h3>
                  
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : (
                    <div className="rounded-md border divide-y">
                      <div className="px-3 py-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Single Press</p>
                            <p className="text-xs text-muted-foreground">May 10, 2025, 14:22:33</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            Service Request
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Double Press</p>
                            <p className="text-xs text-muted-foreground">May 10, 2025, 12:10:05</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            Call
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Firmware Update</p>
                            <p className="text-xs text-muted-foreground">May 8, 2025, 09:45:12</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            System
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Connection Test</p>
                            <p className="text-xs text-muted-foreground">May 8, 2025, 09:40:22</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            System
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    View Full History
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DrawerFooter>
            {activeTab === 'interactions' || activeTab === 'settings' ? (
              <Button disabled={loading} onClick={saveConfiguration}>
                Save Configuration
              </Button>
            ) : null}
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}