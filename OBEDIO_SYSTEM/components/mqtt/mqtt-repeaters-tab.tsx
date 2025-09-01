'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Router, Wifi, AlertTriangle, CheckCircle, Signal, Activity } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useToast } from '@/components/ui/use-toast'

interface Repeater {
  id: string
  name: string
  location: string
  ipAddress: string
  macAddress: string
  status: 'online' | 'offline' | 'degraded'
  uptime: number
  lastSeen: string
  firmware: string
  metrics: {
    cpu: number
    memory: number
    temperature: number
    signalStrength: number
    connectedDevices: number
    messagesProcessed: number
    errorRate: number
  }
  networkInfo: {
    meshRole: 'coordinator' | 'router' | 'end-device'
    parentDevice?: string
    childDevices: string[]
    hopCount: number
  }
}

export function MQTTRepeatersTab() {
  const [repeaters, setRepeaters] = useState<Repeater[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRepeater, setSelectedRepeater] = useState<Repeater | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth('/api/mqtt/health?type=repeaters')

      if (response.ok) {
        const data = await response.json()
        setRepeaters(data.repeaters || [])
      }
    } catch (error) {
      console.error('Error fetching repeater data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch repeater health data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Online</Badge>
      case 'offline':
        return <Badge variant="outline" className="text-red-600"><AlertTriangle className="w-3 h-3 mr-1" />Offline</Badge>
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Degraded</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getMeshRoleBadge = (role: string) => {
    const colors = {
      coordinator: 'bg-purple-100 text-purple-800',
      router: 'bg-blue-100 text-blue-800',
      'end-device': 'bg-gray-100 text-gray-800'
    }
    return <Badge className={colors[role as keyof typeof colors] || colors['end-device']}>{role}</Badge>
  }

  const getHealthScore = (repeater: Repeater) => {
    const { cpu, memory, temperature, signalStrength, errorRate } = repeater.metrics
    
    let score = 100
    if (cpu > 80) score -= 20
    if (memory > 80) score -= 20
    if (temperature > 70) score -= 15
    if (signalStrength < 50) score -= 15
    if (errorRate > 5) score -= 20
    
    return Math.max(0, score)
  }

  const formatUptime = (uptimeHours: number) => {
    const days = Math.floor(uptimeHours / 24)
    const hours = Math.floor(uptimeHours % 24)
    return `${days}d ${hours}h`
  }

  const overallStats = {
    totalRepeaters: repeaters.length,
    onlineRepeaters: repeaters.filter(r => r.status === 'online').length,
    degradedRepeaters: repeaters.filter(r => r.status === 'degraded').length,
    avgHealthScore: repeaters.length > 0 
      ? Math.round(repeaters.reduce((sum, r) => sum + getHealthScore(r), 0) / repeaters.length)
      : 0,
    totalDevices: repeaters.reduce((sum, r) => sum + r.metrics.connectedDevices, 0),
    totalMessages: repeaters.reduce((sum, r) => sum + r.metrics.messagesProcessed, 0)
  }

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Repeaters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalRepeaters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.onlineRepeaters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Degraded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overallStats.degradedRepeaters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgHealthScore}%</div>
            <Progress value={overallStats.avgHealthScore} className="h-2 mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalDevices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalMessages.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Repeater Status</h3>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Repeaters Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repeater</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Connected Devices</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading repeater data...
                  </TableCell>
                </TableRow>
              ) : repeaters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No repeaters found
                  </TableCell>
                </TableRow>
              ) : (
                repeaters.map((repeater) => (
                  <TableRow key={repeater.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRepeater(repeater)}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Router className="w-4 h-4" />
                          {repeater.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{repeater.location}</div>
                        <div className="text-xs text-muted-foreground">{repeater.ipAddress}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(repeater.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={getHealthScore(repeater)} className="h-2 w-16" />
                        <span className="text-sm">{getHealthScore(repeater)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getMeshRoleBadge(repeater.networkInfo.meshRole)}</TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{repeater.metrics.connectedDevices}</div>
                        <div className="text-xs text-muted-foreground">devices</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Activity className="w-3 h-3" />
                          CPU: {repeater.metrics.cpu}%
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Signal className="w-3 h-3" />
                          Signal: {repeater.metrics.signalStrength}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatUptime(repeater.uptime)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(repeater.lastSeen).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Repeater Info */}
      {selectedRepeater && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Information - {selectedRepeater.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{selectedRepeater.metrics.cpu}%</span>
                    </div>
                    <Progress value={selectedRepeater.metrics.cpu} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{selectedRepeater.metrics.memory}%</span>
                    </div>
                    <Progress value={selectedRepeater.metrics.memory} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Temperature</span>
                      <span>{selectedRepeater.metrics.temperature}°C</span>
                    </div>
                    <Progress value={(selectedRepeater.metrics.temperature / 100) * 100} className="h-2" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Network Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mesh Role:</span>
                    {getMeshRoleBadge(selectedRepeater.networkInfo.meshRole)}
                  </div>
                  <div className="flex justify-between">
                    <span>Hop Count:</span>
                    <span>{selectedRepeater.networkInfo.hopCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Child Devices:</span>
                    <span>{selectedRepeater.networkInfo.childDevices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Messages Processed:</span>
                    <span>{selectedRepeater.metrics.messagesProcessed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span className={selectedRepeater.metrics.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>
                      {selectedRepeater.metrics.errorRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Firmware:</span>
                    <span>{selectedRepeater.firmware}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}