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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Battery, 
  Signal, 
  Clock, 
  Info, 
  Bell, 
  Settings, 
  RefreshCw,
  Download,
  X,
  RotateCw,
  ZapOff,
  Vibrate,
  UserCircle,
  Users,
  BadgeAlert,
  RadarIcon,
  Wifi,
  Globe,
  Bluetooth,
  Lock
} from 'lucide-react'
import { BatteryIndicator } from '@/components/devices/battery-indicator'
import { SignalIndicator } from '@/components/devices/signal-indicator'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SmartWatchDevice {
  id: number
  name: string
  uid: string
  battery: number
  signalStrength: number
  isActive: boolean
  lastSeen: string
  firmwareVersion: string
  model: string
  assignedTo?: {
    id: number
    name: string
    role?: string
    avatar?: string
  }
  lastSync?: string  // Made optional to be compatible with SmartWatchesList component
}

interface SmartWatchDetailsProps {
  smartwatch: SmartWatchDevice
  isOpen: boolean
  onClose: () => void
}

interface NotificationConfig {
  type: string // 'button_alerts', 'crew_messages', 'system_alerts', 'maintenance'
  enabled: boolean
  priority: string // 'high', 'medium', 'low'
  vibration: boolean
}

interface ActivityLogItem {
  id: number
  timestamp: string
  type: string
  description: string
}

export function SmartWatchDetails({ smartwatch, isOpen, onClose }: SmartWatchDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [notifications, setNotifications] = useState<NotificationConfig[]>([
    { type: 'button_alerts', enabled: true, priority: 'high', vibration: true },
    { type: 'crew_messages', enabled: true, priority: 'medium', vibration: true },
    { type: 'system_alerts', enabled: true, priority: 'low', vibration: false },
    { type: 'maintenance', enabled: false, priority: 'low', vibration: false },
  ])
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([])
  
  interface CrewMember {
    id: number
    name: string
    role: string
    avatar: string
  }
  
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([])
  const [loraEnabled, setLoraEnabled] = useState(true)
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true)
  const [gpsEnabled, setGpsEnabled] = useState(false)
  const [powerSaveMode, setPowerSaveMode] = useState(false)
  const [loadingAssignment, setLoadingAssignment] = useState(false)
  
  // Format dates for display
  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy HH:mm:ss')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const lastSeenFormatted = formatDistanceToNow(new Date(smartwatch.lastSeen), {
    addSuffix: true
  })

  const lastSyncFormatted = smartwatch.lastSync
    ? formatDistanceToNow(new Date(smartwatch.lastSync), {
        addSuffix: true
      })
    : 'Never synced'

  // Get activity history
  const getActivityHistory = async () => {
    setLoading(true)
    try {
      // In a real application, this would fetch activity history from an API
      // For now, just simulate a delay and show mock data
      setTimeout(() => {
        const mockActivityLog: ActivityLogItem[] = [
          { id: 1, timestamp: new Date().toISOString(), type: 'sync', description: 'Device synced with server' },
          { id: 2, timestamp: new Date(Date.now() - 15 * 60000).toISOString(), type: 'notification', description: 'Button alert received from Room 204' },
          { id: 3, timestamp: new Date(Date.now() - 30 * 60000).toISOString(), type: 'configuration', description: 'Notification settings updated' },
          { id: 4, timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), type: 'assignment', description: 'Device assigned to Emma Thompson' },
          { id: 5, timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), type: 'firmware', description: 'Firmware updated to v1.2.0' },
        ]
        setActivityLog(mockActivityLog)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching activity history:', error)
      setLoading(false)
    }
  }

  // Load crew members for assignment
  const loadCrewMembers = async () => {
    setLoadingAssignment(true)
    try {
      // In a real application, this would fetch crew members from an API
      setTimeout(() => {
        const mockCrewMembers: CrewMember[] = [
          { id: 1, name: 'John Smith', role: 'Service Manager', avatar: '' },
          { id: 2, name: 'Emma Thompson', role: 'Head of Housekeeping', avatar: '' },
          { id: 3, name: 'Michael Johnson', role: 'Head Chef', avatar: '' },
          { id: 4, name: 'Sophia Garcia', role: 'First Officer', avatar: '' },
          { id: 5, name: 'David Wilson', role: 'Engineer', avatar: '' },
        ]
        setCrewMembers(mockCrewMembers)
        setLoadingAssignment(false)
      }, 800)
    } catch (error) {
      console.error('Error loading crew members:', error)
      setLoadingAssignment(false)
    }
  }

  // Load smartwatch configuration data
  useEffect(() => {
    if (isOpen) {
      getActivityHistory()
      loadCrewMembers()
    }
  }, [isOpen])

  // Save smartwatch configuration
  const saveConfiguration = async () => {
    setLoading(true)
    try {
      // In a real application, this would save the configuration to an API
      // For now, just simulate a delay and show success toast
      setTimeout(() => {
        toast({
          title: 'Configuration saved',
          description: `Smartwatch ${smartwatch.name} configuration has been updated.`,
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to save smartwatch configuration.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Test connection with smartwatch
  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/devices/${smartwatch.id}/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Error pinging smartwatch')
      }
      
      toast({
        title: 'Test notification sent',
        description: `${smartwatch.name} should now display a test notification and vibrate if online.`,
      })
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: 'Error',
        description: 'Connection test failed. Smartwatch may be offline.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset smartwatch to factory settings
  const resetSmartWatch = async () => {
    setLoading(true)
    try {
      // In a real application, this would call an API to reset the smartwatch
      toast({
        title: 'Reset initiated',
        description: 'The smartwatch will be reset to factory settings.',
      })
      
      setTimeout(() => {
        setLoading(false)
        toast({
          title: 'Reset complete',
          description: 'Smartwatch has been reset to factory settings.',
        })
      }, 2000)
    } catch (error) {
      console.error('Error resetting smartwatch:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset the smartwatch.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Update smartwatch firmware
  const updateFirmware = async () => {
    setLoading(true)
    try {
      toast({
        title: 'Firmware update initiated',
        description: 'Starting firmware update. Please keep the smartwatch within range.',
      })
      
      setTimeout(() => {
        setLoading(false)
        toast({
          title: 'Firmware update complete',
          description: `Firmware for ${smartwatch.name} has been updated successfully.`,
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

  // Toggle enabled status for a notification
  const toggleNotification = (type: string) => {
    setNotifications(prev => prev.map(item => 
      item.type === type ? {...item, enabled: !item.enabled} : item
    ))
  }

  // Update priority for a notification
  const updateNotificationPriority = (type: string, priority: string) => {
    setNotifications(prev => prev.map(item => 
      item.type === type ? {...item, priority} : item
    ))
  }

  // Toggle vibration for a notification
  const toggleVibration = (type: string) => {
    setNotifications(prev => prev.map(item => 
      item.type === type ? {...item, vibration: !item.vibration} : item
    ))
  }

  const getNotificationLabel = (type: string) => {
    switch (type) {
      case 'button_alerts': return 'Button Alerts'
      case 'crew_messages': return 'Crew Messages'
      case 'system_alerts': return 'System Alerts'
      case 'maintenance': return 'Maintenance Alerts'
      default: return type
    }
  }

  // Assign smartwatch to crew member
  const assignToCrewMember = async (crewId: number) => {
    setLoading(true)
    try {
      // In a real application, this would call an API to assign the smartwatch
      const selectedCrewMember = crewMembers.find((crew) => crew.id === crewId)
      
      if (!selectedCrewMember) {
        throw new Error('Selected crew member not found')
      }
      
      toast({
        title: 'Assignment in progress',
        description: `Assigning ${smartwatch.name} to ${selectedCrewMember.name}...`,
      })
      
      setTimeout(() => {
        setLoading(false)
        toast({
          title: 'Assignment complete',
          description: `${smartwatch.name} has been assigned to ${selectedCrewMember.name}.`,
        })
      }, 1500)
    } catch (error) {
      console.error('Error assigning smartwatch:', error)
      toast({
        title: 'Error',
        description: 'Failed to assign the smartwatch.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'SW';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Get activity log item icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sync': return <RefreshCw className="h-4 w-4 text-blue-500" />
      case 'notification': return <Bell className="h-4 w-4 text-amber-500" />
      case 'configuration': return <Settings className="h-4 w-4 text-violet-500" />
      case 'assignment': return <UserCircle className="h-4 w-4 text-green-500" />
      case 'firmware': return <Download className="h-4 w-4 text-cyan-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
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
                <span>{smartwatch.name || 'Smartwatch Device'}</span>
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
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{smartwatch.uid}</span>
                  <span className="text-xs text-muted-foreground">({smartwatch.model})</span>
                </div>
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
                  <TabsTrigger value="notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="assignment">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Assignment
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
                            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${smartwatch.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <p className="text-sm">{smartwatch.isActive ? 'Active' : 'Inactive'}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Assignment</p>
                          <p className="text-sm">
                            {smartwatch.assignedTo ? (
                              <span className="text-green-600 font-medium">
                                {smartwatch.assignedTo.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Battery</p>
                          <div className="flex items-center gap-2">
                            <Battery className="h-4 w-4 text-muted-foreground" />
                            <BatteryIndicator value={smartwatch.battery} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Signal</p>
                          <div className="flex items-center gap-2">
                            <Signal className="h-4 w-4 text-muted-foreground" />
                            <SignalIndicator value={smartwatch.signalStrength} />
                          </div>
                        </div>
                      </div>

                      {/* Device Details */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Device Information</h3>
                        <div className="rounded-md border divide-y">
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Model</span>
                            <span className="text-sm font-medium">{smartwatch.model}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Firmware Version</span>
                            <span className="text-sm font-medium">v{smartwatch.firmwareVersion}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Last Seen</span>
                            <span className="text-sm font-medium">{lastSeenFormatted}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">Last Sync</span>
                            <span className="text-sm font-medium">{lastSyncFormatted}</span>
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
                          <Bell className="h-4 w-4 mr-2" />
                          Send Test Notification
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
                          onClick={resetSmartWatch}
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Factory Reset
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications" className="p-4 pt-2">
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Notification Settings</h3>
                  
                  {/* Notification Configuration */}
                  <div className="space-y-4">
                    {notifications.map(notification => (
                      <div key={notification.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`enable-${notification.type}`} className="text-base">
                            {getNotificationLabel(notification.type)}
                          </Label>
                          <Switch 
                            id={`enable-${notification.type}`}
                            checked={notification.enabled}
                            onCheckedChange={() => toggleNotification(notification.type)}
                          />
                        </div>
                        {notification.enabled && (
                          <div className="pl-2 border-l-2 border-muted space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`priority-${notification.type}`}>Priority</Label>
                              <Select 
                                value={notification.priority}
                                onValueChange={(value) => updateNotificationPriority(notification.type, value)}
                              >
                                <SelectTrigger id={`priority-${notification.type}`} className="w-full">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High Priority</SelectItem>
                                  <SelectItem value="medium">Medium Priority</SelectItem>
                                  <SelectItem value="low">Low Priority</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor={`vibration-${notification.type}`} className="text-sm">
                                  Vibration Alert
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Vibrate watch when this notification is received
                                </p>
                              </div>
                              <Switch 
                                id={`vibration-${notification.type}`}
                                checked={notification.vibration}
                                onCheckedChange={() => toggleVibration(notification.type)}
                              />
                            </div>
                          </div>
                        )}
                        <Separator className="my-2" />
                      </div>
                    ))}
                  </div>

                  {/* Communication Settings */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Communication Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RadarIcon className="h-4 w-4 text-purple-500" />
                          <div>
                            <Label htmlFor="lora-enabled" className="text-sm">
                              LoRa Communication
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Enable long-range communication for button alerts
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="lora-enabled"
                          checked={loraEnabled}
                          onCheckedChange={setLoraEnabled}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-blue-500" />
                          <div>
                            <Label htmlFor="wifi-enabled" className="text-sm">
                              Wi-Fi
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Enable Wi-Fi for data sync with server
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="wifi-enabled"
                          checked={wifiEnabled}
                          onCheckedChange={setWifiEnabled}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bluetooth className="h-4 w-4 text-indigo-500" />
                          <div>
                            <Label htmlFor="bluetooth-enabled" className="text-sm">
                              Bluetooth
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Enable Bluetooth for pairing with mobile devices
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="bluetooth-enabled"
                          checked={bluetoothEnabled}
                          onCheckedChange={setBluetoothEnabled}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Power Management */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Power Management</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ZapOff className="h-4 w-4 text-amber-500" />
                          <div>
                            <Label htmlFor="power-save" className="text-sm">
                              Power Save Mode
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Optimize battery usage by reducing screen brightness and update frequency
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="power-save"
                          checked={powerSaveMode}
                          onCheckedChange={setPowerSaveMode}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Assignment Tab */}
              <TabsContent value="assignment" className="p-4 pt-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Current Assignment</h3>
                  </div>
                  
                  {/* Current Assignment */}
                  <div className="rounded-md border p-4">
                    {smartwatch.assignedTo ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            {smartwatch.assignedTo.avatar ? (
                              <AvatarImage src={smartwatch.assignedTo.avatar} alt={smartwatch.assignedTo.name} />
                            ) : (
                              <AvatarFallback>{getInitials(smartwatch.assignedTo.name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{smartwatch.assignedTo.name}</p>
                            {smartwatch.assignedTo.role && (
                              <p className="text-xs text-muted-foreground">{smartwatch.assignedTo.role}</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => console.log('Unassign watch')}
                        >
                          Unassign
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <Users className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">This smartwatch is not assigned to any crew member.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Assign to Crew */}
                  {!smartwatch.assignedTo && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Assign to Crew Member</h3>
                      
                      {loadingAssignment ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Select
                            onValueChange={(value) => assignToCrewMember(Number(value))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select crew member" />
                            </SelectTrigger>
                            <SelectContent>
                              {crewMembers.map((crew) => (
                                <SelectItem key={crew.id} value={crew.id.toString()}>
                                  {crew.name} - {crew.role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => console.log('Manage crew members')}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Manage Crew Members
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Assignment Options */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Assignment Options</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="auto-assign" className="text-sm">Auto-Assign Policy</Label>
                      <Select defaultValue="manual">
                        <SelectTrigger id="auto-assign" className="w-full">
                          <SelectValue placeholder="Select assignment policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Assignment Only</SelectItem>
                          <SelectItem value="shift_start">Assign at Shift Start</SelectItem>
                          <SelectItem value="role_based">Role-Based Auto Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* History Tab */}
              <TabsContent value="history" className="p-4 pt-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Activity History</h3>
                    <Button variant="outline" size="sm" onClick={() => getActivityHistory()} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : activityLog.length === 0 ? (
                    <div className="py-6 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-muted-foreground">No activity history available.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLog.map(activity => (
                            <TableRow key={activity.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  {getActivityIcon(activity.type)}
                                  <span className="ml-2 capitalize text-xs">
                                    {activity.type}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{activity.description}</TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DrawerFooter>
            {activeTab === 'notifications' || activeTab === 'assignment' ? (
              <Button onClick={saveConfiguration} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            ) : null}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}