"use client"

import React from 'react'
import { PlusCircle, Wifi, Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AddDeviceModal } from './add-device-modal'

interface DevicesHeaderProps {
  totalDevices: number
  onlineDevices: number
  lowBatteryDevices: number
}

export function DevicesHeader({ totalDevices, onlineDevices, lowBatteryDevices }: DevicesHeaderProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Uređaji</h1>
        <AddDeviceButton />
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard 
          title="Ukupno uređaja" 
          value={totalDevices} 
          description="Svi registrovani uređaji" 
        />
        <StatsCard 
          title="Online" 
          value={onlineDevices} 
          description="Aktivni u posljednjih 5 minuta"
          icon={<Wifi className="h-4 w-4 text-primary" />}
        />
        <StatsCard 
          title="Niska baterija" 
          value={lowBatteryDevices} 
          description="Uređaji sa baterijom ispod 20%"
          icon={<Battery className="h-4 w-4 text-red-500" />}
        />
      </div>
    </div>
  )
}

function AddDeviceButton() {
  const [open, setOpen] = React.useState(false)
  
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Dodaj uređaj
      </Button>
      
      <AddDeviceModal open={open} onOpenChange={setOpen} />
    </>
  )
}

interface StatsCardProps {
  title: string
  value: number
  description: string
  icon?: React.ReactNode
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          {icon && (
            <div className="rounded-full p-3 bg-primary/10">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
