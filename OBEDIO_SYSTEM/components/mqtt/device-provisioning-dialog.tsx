'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Copy, RefreshCw, Smartphone, Wifi } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useToast } from '@/components/ui/use-toast'
import QRCode from 'qrcode'

interface DeviceProvisioningDialogProps {
  open: boolean
  onClose: () => void
  onDeviceProvisioned: () => void
}

interface ProvisioningData {
  deviceId: string
  clientId: string
  username: string
  password: string
  mqttHost: string
  mqttPort: number
  topics: {
    command: string
    telemetry: string
    status: string
  }
}

export function DeviceProvisioningDialog({ open, onClose, onDeviceProvisioned }: DeviceProvisioningDialogProps) {
  const [step, setStep] = useState<'configure' | 'provision' | 'complete'>('configure')
  const [loading, setLoading] = useState(false)
  const [provisioningData, setProvisioningData] = useState<ProvisioningData | null>(null)
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    type: 'BUTTON',
    site: 'yacht-1',
    room: '',
    description: '',
    securityProfile: 'standard'
  })

  const resetDialog = () => {
    setStep('configure')
    setProvisioningData(null)
    setFormData({
      name: '',
      type: 'BUTTON',
      site: 'yacht-1',
      room: '',
      description: '',
      securityProfile: 'standard'
    })
  }

  const handleClose = () => {
    resetDialog()
    onClose()
  }

  const handleProvision = async () => {
    try {
      setLoading(true)
      
      const response = await fetchWithAuth('/api/mqtt/provision', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setProvisioningData(data)
        
        // Generate QR Code with provisioning data
        const qrData = JSON.stringify({
          deviceId: data.deviceId,
          clientId: data.clientId,
          mqtt: {
            host: data.mqttHost,
            port: data.mqttPort,
            username: data.username,
            password: data.password,
            topics: data.topics
          },
          device: {
            name: formData.name,
            type: formData.type,
            site: formData.site,
            room: formData.room
          }
        })
        
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeDataURL(qrUrl)
        
        setStep('provision')
        toast({
          title: 'Success',
          description: 'Device provisioning data generated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate provisioning data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error provisioning device:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate provisioning data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    setStep('complete')
    onDeviceProvisioned()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Data copied to clipboard',
    })
  }

  const downloadQRCode = () => {
    if (!provisioningData || !qrCodeDataURL) return
    
    const a = document.createElement('a')
    a.href = qrCodeDataURL
    a.download = `${provisioningData.clientId}-qr.png`
    a.click()
  }

  const downloadConfig = () => {
    if (!provisioningData) return
    
    const config = {
      device: {
        id: provisioningData.deviceId,
        clientId: provisioningData.clientId,
        name: formData.name,
        type: formData.type,
        site: formData.site,
        room: formData.room
      },
      mqtt: {
        host: provisioningData.mqttHost,
        port: provisioningData.mqttPort,
        username: provisioningData.username,
        password: provisioningData.password,
        topics: provisioningData.topics
      }
    }
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${provisioningData.clientId}-config.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'configure' && 'Add New MQTT Device'}
            {step === 'provision' && 'Device Provisioning'}
            {step === 'complete' && 'Device Added Successfully'}
          </DialogTitle>
        </DialogHeader>

        {step === 'configure' && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Device Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter device name"
                />
              </div>
              <div>
                <Label htmlFor="type">Device Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
              <div>
                <Label htmlFor="site">Site</Label>
                <Select value={formData.site} onValueChange={(value) => setFormData({ ...formData, site: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yacht-1">Yacht 1</SelectItem>
                    <SelectItem value="yacht-2">Yacht 2</SelectItem>
                    <SelectItem value="marina">Marina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="room">Room/Location</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., Main Deck, Cabin 1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional device information"
              />
            </div>
            <div>
              <Label htmlFor="security">Authentication Method</Label>
              <Select value={formData.securityProfile} onValueChange={(value) => setFormData({ ...formData, securityProfile: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Username & Password</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 'provision' && provisioningData && (
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">QR Code</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    {qrCodeDataURL ? (
                      <img
                        src={qrCodeDataURL}
                        alt="Device QR Code"
                        className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                        <div className="text-center text-gray-500">
                          <Smartphone className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-sm">Generating QR Code...</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                      <Wifi className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan with device to configure MQTT connection
                    </p>
                    <Button variant="outline" onClick={downloadQRCode} disabled={!qrCodeDataURL}>
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Connection Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Client ID</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={provisioningData.clientId} readOnly className="flex-1" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(provisioningData.clientId)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">MQTT Host</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={provisioningData.mqttHost} readOnly className="flex-1" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(provisioningData.mqttHost)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Port</Label>
                    <Input value={provisioningData.mqttPort.toString()} readOnly />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Username</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={provisioningData.username} readOnly className="flex-1" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(provisioningData.username)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Password</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input type="password" value={provisioningData.password} readOnly className="flex-1" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(provisioningData.password)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MQTT Topics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Command Topic</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input value={provisioningData.topics.command} readOnly className="flex-1" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(provisioningData.topics.command)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Telemetry Topic</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input value={provisioningData.topics.telemetry} readOnly className="flex-1" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(provisioningData.topics.telemetry)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status Topic</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input value={provisioningData.topics.status} readOnly className="flex-1" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(provisioningData.topics.status)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button onClick={downloadConfig} className="w-full md:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Download Complete Configuration
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h3 className="text-lg font-semibold mb-2">Device Added Successfully!</h3>
            <p className="text-muted-foreground">
              The device has been added to your MQTT network and is ready for use.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'configure' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleProvision} 
                disabled={loading || !formData.name || !formData.room}
              >
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Generate Provisioning Data
              </Button>
            </>
          )}
          {step === 'provision' && (
            <>
              <Button variant="outline" onClick={() => setStep('configure')}>
                Back
              </Button>
              <Button onClick={handleComplete}>
                Complete Setup
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}