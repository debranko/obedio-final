'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

type TopDevice = {
  id: number
  name: string
  room: string
  requestCount: number
}

interface TopDevicesCardProps {
  devices: TopDevice[]
}

export function TopDevicesCard({ devices }: TopDevicesCardProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-xl">Najaktivniji uređaji</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {devices.length === 0 ? (
          <div className="px-6 py-4 text-center text-muted-foreground">
            Nema podataka o aktivnosti uređaja
          </div>
        ) : (
          <div className="divide-y">
            {devices.map(device => (
              <div key={device.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{device.name}</div>
                  <div className="text-sm text-muted-foreground">{device.room}</div>
                </div>
                <div className="flex items-center">
                  <div className="font-medium text-sm">
                    {device.requestCount} {device.requestCount === 1 ? 'zahtev' : 'zahteva'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-muted/40 px-6 py-3">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/devices">
              Prikaži sve uređaje
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
