'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Play, Pause, Square, Search, Download, Filter, Activity } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useToast } from '@/components/ui/use-toast'

interface MQTTMessage {
  id: string
  timestamp: string
  topic: string
  clientId: string
  qos: number
  retain: boolean
  payload: string
  size: number
  direction: 'inbound' | 'outbound'
}

interface TrafficStats {
  totalMessages: number
  messagesPerSecond: number
  totalBytes: number
  bytesPerSecond: number
  connectedClients: number
  activeTopics: string[]
}

export function MQTTTrafficTab() {
  const [messages, setMessages] = useState<MQTTMessage[]>([])
  const [stats, setStats] = useState<TrafficStats>({
    totalMessages: 0,
    messagesPerSecond: 0,
    totalBytes: 0,
    bytesPerSecond: 0,
    connectedClients: 0,
    activeTopics: []
  })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState<string>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [maxMessages] = useState(100)
  const { toast } = useToast()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const startMonitoring = async () => {
    try {
      // Get WebSocket endpoint info
      const response = await fetchWithAuth('/api/mqtt/ws')
      if (!response.ok) {
        throw new Error('Failed to get WebSocket info')
      }
      
      const wsInfo = await response.json()
      const ws = new WebSocket(wsInfo.endpoints.traffic)
      
      ws.onopen = () => {
        setIsMonitoring(true)
        toast({
          title: 'Monitoring Started',
          description: 'Real-time MQTT traffic monitoring is now active',
        })
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'message') {
          const message: MQTTMessage = data.message
          setMessages(prev => {
            const updated = [message, ...prev].slice(0, maxMessages)
            return updated
          })
        } else if (data.type === 'stats') {
          setStats(data.stats)
        }
      }

      ws.onclose = () => {
        setIsMonitoring(false)
        wsRef.current = null
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to MQTT traffic monitor',
          variant: 'destructive',
        })
        setIsMonitoring(false)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error starting monitoring:', error)
      toast({
        title: 'Error',
        description: 'Failed to start MQTT traffic monitoring',
        variant: 'destructive',
      })
    }
  }

  const stopMonitoring = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    setIsMonitoring(false)
    toast({
      title: 'Monitoring Stopped',
      description: 'MQTT traffic monitoring has been stopped',
    })
  }

  const clearMessages = () => {
    setMessages([])
    toast({
      title: 'Messages Cleared',
      description: 'Traffic log has been cleared',
    })
  }

  const exportMessages = () => {
    const data = {
      timestamp: new Date().toISOString(),
      stats,
      messages: filteredMessages
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mqtt-traffic-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.payload.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTopic = !topicFilter || message.topic.includes(topicFilter)
    const matchesDirection = directionFilter === 'all' || message.direction === directionFilter
    
    return matchesSearch && matchesTopic && matchesDirection
  })

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
    }
  }, [messages, autoScroll])

  const getDirectionBadge = (direction: string) => {
    return direction === 'inbound' 
      ? <Badge className="bg-blue-100 text-blue-800">Inbound</Badge>
      : <Badge className="bg-green-100 text-green-800">Outbound</Badge>
  }

  const getQosBadge = (qos: number) => {
    const colors = ['bg-gray-100 text-gray-800', 'bg-yellow-100 text-yellow-800', 'bg-red-100 text-red-800']
    return <Badge className={colors[qos] || colors[0]}>QoS {qos}</Badge>
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Traffic Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{stats.messagesPerSecond}/sec</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Data Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.totalBytes)}</div>
            <div className="text-xs text-muted-foreground">{formatBytes(stats.bytesPerSecond)}/sec</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connected Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTopics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Log Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMessages.length}</div>
            <div className="text-xs text-muted-foreground">of {maxMessages} max</div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          {!isMonitoring ? (
            <Button onClick={startMonitoring}>
              <Play className="w-4 h-4 mr-2" />
              Start Monitoring
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopMonitoring}>
              <Pause className="w-4 h-4 mr-2" />
              Stop Monitoring
            </Button>
          )}
          <Button variant="outline" onClick={clearMessages}>
            <Square className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" onClick={exportMessages}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-scroll"
            checked={autoScroll}
            onCheckedChange={setAutoScroll}
          />
          <Label htmlFor="auto-scroll" className="text-sm">Auto-scroll</Label>
          {isMonitoring && <Activity className="w-4 h-4 text-green-600 animate-pulse" />}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          placeholder="Filter by topic..."
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="w-full sm:w-48"
        />
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            MQTT Traffic Log
            {filteredMessages.length !== messages.length && (
              <Badge variant="outline">{filteredMessages.length} of {messages.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96" ref={scrollAreaRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>QoS</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {isMonitoring ? 'Waiting for messages...' : 'No messages captured. Start monitoring to see traffic.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div className="text-xs font-mono">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>{getDirectionBadge(message.direction)}</TableCell>
                      <TableCell>
                        <div className="font-mono text-sm max-w-48 truncate" title={message.topic}>
                          {message.topic}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-32 truncate" title={message.clientId}>
                          {message.clientId}
                        </div>
                      </TableCell>
                      <TableCell>{getQosBadge(message.qos)}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {formatBytes(message.size)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono max-w-64 truncate" title={message.payload}>
                          {message.payload}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}