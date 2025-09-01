'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { MQTTDevicesTab } from '@/components/mqtt/mqtt-devices-tab'
import { MQTTTrafficTab } from '@/components/mqtt/mqtt-traffic-tab'
import { MQTTSecurityTab } from '@/components/mqtt/mqtt-security-tab'
import { MQTTRepeatersTab } from '@/components/mqtt/mqtt-repeaters-tab'

export default function MQTTPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MQTT Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage MQTT devices, monitor traffic, and configure security settings
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="repeaters">Repeaters</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">MQTT Devices</h2>
                <p className="text-muted-foreground">
                  Manage MQTT device provisioning, monitor device status, and configure device settings.
                </p>
              </div>
              <MQTTDevicesTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">MQTT Traffic Monitor</h2>
                <p className="text-muted-foreground">
                  Real-time monitoring of MQTT message traffic with filtering and analysis capabilities.
                </p>
              </div>
              <MQTTTrafficTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Security Profiles</h2>
                <p className="text-muted-foreground">
                  Manage MQTT security profiles, access control lists, and user permissions.
                </p>
              </div>
              <MQTTSecurityTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repeaters">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Repeater Health</h2>
                <p className="text-muted-foreground">
                  Monitor MQTT repeater health, network topology, and performance metrics.
                </p>
              </div>
              <MQTTRepeatersTab />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </>
  )
}