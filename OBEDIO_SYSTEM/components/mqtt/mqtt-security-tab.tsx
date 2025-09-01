'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, Shield, Key, Eye, EyeOff, Copy } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useToast } from '@/components/ui/use-toast'

interface DeviceCredential {
  id: string
  deviceName: string
  deviceType: 'BUTTON' | 'SMARTWATCH' | 'REPEATER' | 'SENSOR'
  username: string
  password: string
  isActive: boolean
  createdAt: string
  lastUsed?: string
}

export function MQTTSecurityTab() {
  const [credentials, setCredentials] = useState<DeviceCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [showCredentialDialog, setShowCredentialDialog] = useState(false)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Form state
  const [credentialForm, setCredentialForm] = useState({
    deviceName: '',
    deviceType: 'BUTTON' as const,
    username: '',
    generatePassword: true
  })

  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    try {
      setLoading(true)
      // Use mock data for MVP demo
      const mockCredentials: DeviceCredential[] = [
        {
          id: '1',
          deviceName: 'Button Room 101',
          deviceType: 'BUTTON',
          username: 'btn_room101',
          password: 'SecurePass123!',
          isActive: true,
          createdAt: '2024-01-15T10:30:00Z',
          lastUsed: '2024-01-20T14:22:00Z'
        },
        {
          id: '2',
          deviceName: 'Watch Staff-001',
          deviceType: 'SMARTWATCH',
          username: 'watch_staff001',
          password: 'WatchKey456@',
          isActive: true,
          createdAt: '2024-01-10T09:15:00Z',
          lastUsed: '2024-01-20T16:45:00Z'
        },
        {
          id: '3',
          deviceName: 'Repeater Floor-2',
          deviceType: 'REPEATER',
          username: 'rep_floor2',
          password: 'RepNet789#',
          isActive: false,
          createdAt: '2024-01-08T12:00:00Z'
        }
      ]
      setCredentials(mockCredentials)
    } catch (error) {
      console.error('Error fetching credentials:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch device credentials',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleCreateCredential = async () => {
    try {
      const password = credentialForm.generatePassword ? generatePassword() : 'DefaultPass123!'
      const newCredential: DeviceCredential = {
        id: Date.now().toString(),
        deviceName: credentialForm.deviceName,
        deviceType: credentialForm.deviceType,
        username: credentialForm.username,
        password,
        isActive: true,
        createdAt: new Date().toISOString()
      }
      
      setCredentials(prev => [...prev, newCredential])
      setShowCredentialDialog(false)
      resetForm()
      toast({
        title: 'Success',
        description: 'Device credentials created successfully',
      })
    } catch (error) {
      console.error('Error creating credentials:', error)
      toast({
        title: 'Error',
        description: 'Failed to create device credentials',
        variant: 'destructive',
      })
    }
  }

  const toggleCredentialStatus = (credentialId: string, isActive: boolean) => {
    setCredentials(prev => prev.map(cred =>
      cred.id === credentialId ? { ...cred, isActive } : cred
    ))
    toast({
      title: 'Success',
      description: `Credential ${isActive ? 'activated' : 'deactivated'}`,
    })
  }

  const resetForm = () => {
    setCredentialForm({
      deviceName: '',
      deviceType: 'BUTTON',
      username: '',
      generatePassword: true
    })
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      BUTTON: 'bg-blue-100 text-blue-800',
      SMARTWATCH: 'bg-green-100 text-green-800',
      REPEATER: 'bg-purple-100 text-purple-800',
      SENSOR: 'bg-orange-100 text-orange-800'
    }
    return <Badge className={colors[type as keyof typeof colors] || colors.BUTTON}>{type}</Badge>
  }

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Password copied to clipboard',
    })
  }

  const overallStats = {
    totalCredentials: credentials.length,
    activeCredentials: credentials.filter(c => c.isActive).length,
    recentlyUsed: credentials.filter(c => c.lastUsed && 
      new Date(c.lastUsed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Device Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCredentials}</div>
            <div className="text-xs text-muted-foreground">
              {overallStats.activeCredentials} active
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recently Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.recentlyUsed}</div>
            <div className="text-xs text-muted-foreground">Last 7 days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Standard</div>
            <div className="text-xs text-muted-foreground">Password-based auth</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connection Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">MQTT</div>
            <div className="text-xs text-muted-foreground">Username & Password</div>
          </CardContent>
        </Card>
      </div>

      {/* Device Credentials Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Device Authentication
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage device credentials for MQTT authentication
              </p>
            </div>
            <Button onClick={() => setShowCredentialDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Credential
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading credentials...
                  </TableCell>
                </TableRow>
              ) : credentials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No device credentials found
                  </TableCell>
                </TableRow>
              ) : (
                credentials.map((credential) => (
                  <TableRow key={credential.id}>
                    <TableCell>
                      <div className="font-medium">{credential.deviceName}</div>
                    </TableCell>
                    <TableCell>{getTypeBadge(credential.deviceType)}</TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{credential.username}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm">
                          {showPassword[credential.id] ? credential.password : '••••••••'}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(credential.id)}
                        >
                          {showPassword[credential.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(credential.password)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={credential.isActive}
                          onCheckedChange={(checked) => toggleCredentialStatus(credential.id, checked)}
                        />
                        <span className="text-sm">
                          {credential.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {credential.lastUsed 
                          ? new Date(credential.lastUsed).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
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

      {/* Create Credential Dialog */}
      <Dialog open={showCredentialDialog} onOpenChange={setShowCredentialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Device Credential</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  value={credentialForm.deviceName}
                  onChange={(e) => setCredentialForm({ ...credentialForm, deviceName: e.target.value })}
                  placeholder="Enter device name"
                />
              </div>
              <div>
                <Label htmlFor="device-type">Device Type</Label>
                <Select value={credentialForm.deviceType} onValueChange={(value) => setCredentialForm({ ...credentialForm, deviceType: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUTTON">Button</SelectItem>
                    <SelectItem value="SMARTWATCH">Smart Watch</SelectItem>
                    <SelectItem value="REPEATER">Repeater</SelectItem>
                    <SelectItem value="SENSOR">Sensor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={credentialForm.username}
                onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                placeholder="Enter MQTT username"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="generate-password"
                checked={credentialForm.generatePassword}
                onCheckedChange={(checked) => setCredentialForm({ ...credentialForm, generatePassword: checked })}
              />
              <Label htmlFor="generate-password">Auto-generate secure password</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCredentialDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCredential}>Create Credential</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}