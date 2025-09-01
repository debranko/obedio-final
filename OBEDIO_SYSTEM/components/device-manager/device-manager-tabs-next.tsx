"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ButtonsList } from "./buttons-list"
import { SmartWatchesList } from "./smart-watches-list"
import { RepeatersListNext } from "./repeaters-list-next"
import { ServerDashboard } from "./server-dashboard"
import { ServerSettings } from "./server-settings"
import { ServerLogs } from "./server-logs"
import { ServerActions } from "./server-actions"

type DeviceManagerTabsProps = {
  className?: string
}

export function DeviceManagerTabsNext({ className }: DeviceManagerTabsProps) {
  return (
    <Tabs defaultValue="repeaters" className={className}>
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="buttons">Buttons</TabsTrigger>
        <TabsTrigger value="smartwatches">Smart Watches</TabsTrigger>
        <TabsTrigger value="repeaters">Repeaters</TabsTrigger>
        <TabsTrigger value="server">Server</TabsTrigger>
      </TabsList>
      
      {/* Buttons Tab Content */}
      <TabsContent value="buttons">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Buttons</h2>
              <p className="text-muted-foreground">
                Manage and configure Obedio Smart Buttons with customizable interactions and features.
              </p>
            </div>
            <ButtonsList />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Smart Watches Tab Content */}
      <TabsContent value="smartwatches">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Smart Watches</h2>
              <p className="text-muted-foreground">
                Manage Obedio wearables with LoRa communication, touchscreen interface, and crew assignment features.
              </p>
            </div>
            <SmartWatchesList />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Repeaters Tab Content */}
      <TabsContent value="repeaters">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Repeaters</h2>
              <p className="text-muted-foreground">
                Manage LoRa Repeaters that extend network coverage and reliability with mesh networking, emergency mode, and secure communication.
              </p>
            </div>
            {/* Use our new improved repeaters list component instead of the old one */}
            <RepeatersListNext />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Server Tab Content */}
      <TabsContent value="server">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Server</h2>
              <p className="text-muted-foreground">
                Configure and monitor the Obedio Server - the central hub that handles all communication, data processing, and device coordination.
              </p>
            </div>
            
            {/* Server Management Sections */}
            <div className="space-y-8">
              {/* Server Dashboard Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Server Status Dashboard</h3>
                <ServerDashboard />
              </div>

              {/* Server Actions Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Server Management</h3>
                <ServerActions />
              </div>
              
              {/* Server Logs Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4">System Logs</h3>
                <ServerLogs />
              </div>
              
              {/* Server Settings Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Server Configuration</h3>
                <ServerSettings />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}