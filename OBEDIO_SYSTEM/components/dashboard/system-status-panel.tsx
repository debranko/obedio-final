'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Battery, Signal, Power, Clock, AlertCircle, CheckCircle, Users } from 'lucide-react'

interface SystemStatusProps {
  devices: {
    total: number
    online: number
    offline: number
    lowBattery: number
    lowSignal: number
    uptime: number
  }
  requests: {
    active: number
    today: {
      new: number
      completed: number
    }
    byStatus: Record<string, number>
    statusCounts: Array<{ status: string, count: number }>
    averageResponseTime: number
  }
  timestamp: string
}

export function SystemStatusPanel({ data }: { data: SystemStatusProps }) {
  const { devices, requests, timestamp } = data

  // Formatira i prikazuje vreme zadnjeg ažuriranja
  const lastUpdated = new Date(timestamp).toLocaleTimeString('sr-RS', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  // Statusi uređaja
  const deviceStatusItems = [
    {
      label: 'Ukupno uređaja',
      value: devices.total,
      icon: <Power className="w-4 h-4 text-muted-foreground" />,
      color: 'text-foreground'
    },
    {
      label: 'Online',
      value: devices.online,
      icon: <Power className="w-4 h-4 text-green-500" />,
      color: 'text-green-500'
    },
    {
      label: 'Offline',
      value: devices.offline,
      icon: <Power className="w-4 h-4 text-red-500" />,
      color: 'text-red-500'
    },
    {
      label: 'Niska baterija',
      value: devices.lowBattery,
      icon: <Battery className="w-4 h-4 text-amber-500" />,
      color: 'text-amber-500'
    },
    {
      label: 'Slab signal',
      value: devices.lowSignal,
      icon: <Signal className="w-4 h-4 text-amber-500" />,
      color: 'text-amber-500'
    },
  ]

  // Statusi zahteva
  const requestStatusItems = [
    {
      label: 'Aktivni zahtevi',
      value: requests.active,
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      color: 'text-blue-500'
    },
    {
      label: 'Novi danas',
      value: requests.today.new,
      icon: <AlertCircle className="w-4 h-4 text-violet-500" />,
      color: 'text-violet-500'
    },
    {
      label: 'Završeni danas',
      value: requests.today.completed,
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      color: 'text-green-500'
    },
    {
      label: 'Prosečno vreme (min)',
      value: requests.averageResponseTime,
      icon: <Clock className="w-4 h-4 text-muted-foreground" />,
      color: 'text-muted-foreground'
    },
  ]

  return (
    <Card className="col-span-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Sistemski status</CardTitle>
          <span className="text-xs text-muted-foreground">
            Ažurirano: {lastUpdated}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="devices" className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="devices">Uređaji</TabsTrigger>
            <TabsTrigger value="requests">Zahtevi</TabsTrigger>
          </TabsList>
          
          <TabsContent value="devices" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {deviceStatusItems.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/30 mb-2">
                      {item.icon}
                    </div>
                    <div className={cn("text-2xl font-bold", item.color)}>
                      {item.value}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="relative h-5 rounded-full bg-muted overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                style={{ width: `${devices.uptime}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                {Math.round(devices.uptime)}% online
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {requestStatusItems.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/30 mb-2">
                      {item.icon}
                    </div>
                    <div className={cn("text-2xl font-bold", item.color)}>
                      {item.value}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Zahtevi po statusu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(requests.byStatus).map(([status, count]) => (
                    <div className="flex items-center" key={status}>
                      <div className="flex items-center gap-2 flex-1 truncate">
                        <span className={cn(
                          "h-2 w-2 rounded-full",
                          status === 'PENDING' ? "bg-yellow-500" :
                          status === 'IN_PROGRESS' ? "bg-blue-500" :
                          status === 'COMPLETED' ? "bg-green-500" :
                          "bg-gray-500"
                        )} />
                        <span className="text-sm truncate">
                          {status === 'PENDING' ? 'Na čekanju' :
                           status === 'IN_PROGRESS' ? 'U obradi' :
                           status === 'COMPLETED' ? 'Završeni' :
                           status}
                        </span>
                      </div>
                      <div className="font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
