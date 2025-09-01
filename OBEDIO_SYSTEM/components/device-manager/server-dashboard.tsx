"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type SystemStatusProps = {
  status: "operational" | "degraded" | "maintenance" | "offline"
}

const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const statusColors = {
    operational: "bg-green-500",
    degraded: "bg-yellow-500",
    maintenance: "bg-blue-500",
    offline: "bg-red-500"
  }

  const statusLabels = {
    operational: "Operational",
    degraded: "Degraded",
    maintenance: "Maintenance",
    offline: "Offline"
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${statusColors[status]}`} />
      <span className="font-medium">{statusLabels[status]}</span>
    </div>
  )
}

// Simple chart component for line visualization
const SimpleLineChart: React.FC<{
  data: { time: string; value: number }[];
  maxValue: number;
  color: string;
}> = ({ data, maxValue, color }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-end h-64 gap-1 mb-2">
        {data.map((item, i) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full relative">
                <div 
                  className={`w-full ${color} rounded-t`} 
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0].time}</span>
        <span>{data[data.length - 1].time}</span>
      </div>
    </div>
  )
}

// Simple bar chart component
const SimpleBarChart: React.FC<{
  data: { time: string; values: { name: string; value: number }[] }[];
  maxValue: number;
  colors: string[];
}> = ({ data, maxValue, colors }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-end h-64 gap-4 mb-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex items-end justify-center gap-1">
            {item.values.map((valueObj, j) => {
              const heightPercent = (valueObj.value / maxValue) * 100;
              return (
                <div 
                  key={j} 
                  className={`w-3 ${colors[j]} rounded-t`} 
                  style={{ height: `${heightPercent}%` }} 
                  title={`${valueObj.name}: ${valueObj.value}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0].time}</span>
        <span>{data[data.length - 1].time}</span>
      </div>
    </div>
  )
}

// Simple donut chart component
const SimpleDonutChart: React.FC<{
  data: { name: string; value: number; color: string }[];
}> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let cumulativeAngle = 0;
  const segments = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    
    return {
      ...item,
      startAngle,
      angle
    };
  });

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative h-48 w-48">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="20" />
          {segments.map((segment, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={segment.color}
              strokeWidth="20"
              strokeDasharray={`${segment.angle * 0.7} ${360 - segment.angle * 0.7}`}
              strokeDashoffset={`${90 - segment.startAngle * 0.7}`}
              transform="rotate(-90 50 50)"
            />
          ))}
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-5">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full`} style={{ backgroundColor: segment.color }} />
            <span className="text-sm">{segment.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mock data for demonstration
const cpuData = [
  { time: "00:00", value: 42 },
  { time: "02:00", value: 35 },
  { time: "04:00", value: 32 },
  { time: "06:00", value: 62 },
  { time: "08:00", value: 80 },
  { time: "10:00", value: 68 },
  { time: "12:00", value: 60 },
]

const memoryData = [
  { time: "00:00", value: 48 },
  { time: "02:00", value: 45 },
  { time: "04:00", value: 42 },
  { time: "06:00", value: 50 },
  { time: "08:00", value: 62 },
  { time: "10:00", value: 58 },
  { time: "12:00", value: 54 },
]

const networkData = [
  { 
    time: "00:00", 
    values: [
      { name: "incoming", value: 12 },
      { name: "outgoing", value: 8 }
    ] 
  },
  { 
    time: "04:00",
    values: [
      { name: "incoming", value: 8 },
      { name: "outgoing", value: 5 }
    ] 
  },
  { 
    time: "08:00", 
    values: [
      { name: "incoming", value: 36 },
      { name: "outgoing", value: 24 }
    ] 
  },
  { 
    time: "12:00", 
    values: [
      { name: "incoming", value: 20 },
      { name: "outgoing", value: 12 }
    ] 
  },
]

const connectedDevices = [
  { name: "Buttons", value: 24, color: "#3b82f6" },
  { name: "Smart Watches", value: 12, color: "#06b6d4" },
  { name: "Repeaters", value: 8, color: "#6366f1" },
]

const activityLog = [
  { time: "12:45:32", event: "Button 03A2F8 activated", level: "info" },
  { time: "12:32:15", event: "Smart Watch SW-92EC disconnected", level: "warning" },
  { time: "12:28:47", event: "System backup completed", level: "success" },
  { time: "12:15:03", event: "Database connection reset", level: "warning" },
  { time: "11:52:19", event: "Repeater RP-12D34 online", level: "info" },
  { time: "11:45:00", event: "Automated security scan completed", level: "info" },
  { time: "11:23:14", event: "Failed login attempt from IP 192.168.1.42", level: "error" },
  { time: "11:05:38", event: "System updates installed", level: "success" },
]

export function ServerDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SystemStatus status="operational" />
            <div className="mt-2 text-xs text-muted-foreground">
              Uptime: 23 days, 4 hours
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42%</div>
            <Progress value={42} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">54%</div>
            <Progress value={54} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">44</div>
            <div className="mt-2 text-xs text-muted-foreground">
              24 buttons, 12 watches, 8 repeaters
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cpu">
              <TabsList className="mb-4">
                <TabsTrigger value="cpu">CPU</TabsTrigger>
                <TabsTrigger value="memory">Memory</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cpu" className="h-80">
                <SimpleLineChart data={cpuData} maxValue={100} color="bg-blue-500" />
              </TabsContent>
              
              <TabsContent value="memory" className="h-80">
                <SimpleLineChart data={memoryData} maxValue={100} color="bg-green-500" />
              </TabsContent>
              
              <TabsContent value="network" className="h-80">
                <SimpleBarChart 
                  data={networkData} 
                  maxValue={40} 
                  colors={["bg-indigo-500", "bg-cyan-500"]} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Connected Devices Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleDonutChart data={connectedDevices} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLog.map((log, index) => (
              <div key={index} className="flex items-start gap-3">
                <Badge 
                  variant={
                    log.level === "error" ? "destructive" : 
                    log.level === "warning" ? "outline" :
                    log.level === "success" ? "default" : "secondary"
                  }
                  className="mt-0.5">
                  {log.time}
                </Badge>
                <span className="flex-1">{log.event}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}