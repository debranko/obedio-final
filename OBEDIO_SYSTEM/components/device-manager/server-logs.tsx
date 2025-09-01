"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"

// Mock log data
const systemLogs = [
  { id: 1, timestamp: "2025-05-11 21:45:32", level: "info", source: "system", message: "Server health check successful" },
  { id: 2, timestamp: "2025-05-11 21:38:17", level: "warning", source: "database", message: "Database connection pool reaching capacity (85%)" },
  { id: 3, timestamp: "2025-05-11 21:32:15", level: "error", source: "auth", message: "Failed login attempt from IP 192.168.1.42 (5th attempt)" },
  { id: 4, timestamp: "2025-05-11 21:28:47", level: "info", source: "system", message: "Automated system backup completed successfully" },
  { id: 5, timestamp: "2025-05-11 21:15:03", level: "warning", source: "network", message: "High latency detected in LoRa communication" },
  { id: 6, timestamp: "2025-05-11 21:10:42", level: "info", source: "devices", message: "New device registration: Button ID BC42F9" },
  { id: 7, timestamp: "2025-05-11 20:58:31", level: "error", source: "voice", message: "Voice processing service crashed: Out of memory" },
  { id: 8, timestamp: "2025-05-11 20:52:19", level: "info", source: "devices", message: "Repeater RP-12D34 came online" },
  { id: 9, timestamp: "2025-05-11 20:45:00", level: "info", source: "system", message: "Automated security scan completed: No vulnerabilities found" },
  { id: 10, timestamp: "2025-05-11 20:30:28", level: "warning", source: "auth", message: "Session token expired for user admin@obedio.com" },
  { id: 11, timestamp: "2025-05-11 20:23:14", level: "error", source: "api", message: "API rate limit exceeded for endpoint /api/devices" },
  { id: 12, timestamp: "2025-05-11 20:15:38", level: "info", source: "system", message: "System updates installed successfully" },
  { id: 13, timestamp: "2025-05-11 20:05:42", level: "info", source: "database", message: "Automatic database optimization completed" },
  { id: 14, timestamp: "2025-05-11 19:58:11", level: "warning", source: "devices", message: "Button ID A76E23 low battery (15%)" },
  { id: 15, timestamp: "2025-05-11 19:45:33", level: "info", source: "mqtt", message: "MQTT broker restarted after configuration update" },
  { id: 16, timestamp: "2025-05-11 19:32:27", level: "error", source: "voice", message: "Failed to transcribe voice message: Unsupported language" },
  { id: 17, timestamp: "2025-05-11 19:28:55", level: "info", source: "network", message: "LoRa gateway status check: All channels operational" },
  { id: 18, timestamp: "2025-05-11 19:20:06", level: "warning", source: "system", message: "CPU usage spike detected (82% for 2 minutes)" },
  { id: 19, timestamp: "2025-05-11 19:15:21", level: "info", source: "devices", message: "Smart Watch SW-92EC reconnected to network" },
  { id: 20, timestamp: "2025-05-11 19:08:44", level: "error", source: "database", message: "Failed to write to audit log table: Disk space low" },
]

interface LogItemProps {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

const LogItem: React.FC<LogItemProps> = ({ timestamp, level, source, message }) => {
  const levelColors = {
    info: "bg-blue-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  } as const;

  const sourceColors = {
    system: "border-gray-400",
    database: "border-green-400",
    auth: "border-purple-400",
    network: "border-blue-400",
    devices: "border-indigo-400",
    voice: "border-pink-400",
    api: "border-orange-400",
    mqtt: "border-teal-400",
  } as const;
  
  return (
    <div className="border-l-4 pl-3 py-2 mb-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm transition-colors" 
         style={{ borderLeftColor: `var(--${source}-color, #ccc)` }}>
      <div className="flex items-start gap-2">
        <div className="font-mono text-xs text-gray-500 mt-0.5">
          {timestamp}
        </div>
        <Badge 
          variant={level === "error" ? "destructive" : level === "warning" ? "outline" : "secondary"}
          className="text-xs">
          {level.toUpperCase()}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {source}
        </Badge>
        <span className="flex-1 text-sm">{message}</span>
      </div>
    </div>
  );
};

export function ServerLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLogLevel, setSelectedLogLevel] = useState<string | undefined>(undefined);
  const [selectedLogSource, setSelectedLogSource] = useState<string | undefined>(undefined);
  
  // Filter logs based on search query, level, and source
  const filteredLogs = systemLogs.filter(log => {
    let matches = true;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = log.message.toLowerCase().includes(query) || 
                log.source.toLowerCase().includes(query) ||
                log.timestamp.toLowerCase().includes(query);
    }
    
    // Filter by log level
    if (selectedLogLevel && matches) {
      matches = log.level === selectedLogLevel;
    }
    
    // Filter by source
    if (selectedLogSource && matches) {
      matches = log.source === selectedLogSource;
    }
    
    return matches;
  });
  
  // Get unique log sources
  const logSources = Array.from(new Set(systemLogs.map(log => log.source)));
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[40%]">
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-32">
                <Select 
                  value={selectedLogLevel} 
                  onValueChange={setSelectedLogLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Log Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Select 
                  value={selectedLogSource} 
                  onValueChange={setSelectedLogSource}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sources</SelectItem>
                    {logSources.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLogLevel(undefined);
                  setSelectedLogSource(undefined);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full border-b rounded-none">
                <TabsTrigger value="all" className="flex-1">
                  All Logs
                </TabsTrigger>
                <TabsTrigger value="errors" className="flex-1">
                  Errors
                  <Badge variant="destructive" className="ml-2">
                    {systemLogs.filter(log => log.level === "error").length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="warnings" className="flex-1">
                  Warnings
                  <Badge variant="outline" className="ml-2">
                    {systemLogs.filter(log => log.level === "warning").length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex-1">
                  System
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="m-0 p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-4">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <LogItem
                          key={log.id}
                          timestamp={log.timestamp}
                          level={log.level}
                          source={log.source}
                          message={log.message}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No logs match your search criteria
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="errors" className="m-0 p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-4">
                    {filteredLogs.filter(log => log.level === "error").length > 0 ? (
                      filteredLogs
                        .filter(log => log.level === "error")
                        .map((log) => (
                          <LogItem
                            key={log.id}
                            timestamp={log.timestamp}
                            level={log.level}
                            source={log.source}
                            message={log.message}
                          />
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No error logs found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="warnings" className="m-0 p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-4">
                    {filteredLogs.filter(log => log.level === "warning").length > 0 ? (
                      filteredLogs
                        .filter(log => log.level === "warning")
                        .map((log) => (
                          <LogItem
                            key={log.id}
                            timestamp={log.timestamp}
                            level={log.level}
                            source={log.source}
                            message={log.message}
                          />
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No warning logs found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="system" className="m-0 p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-4">
                    {filteredLogs.filter(log => log.source === "system").length > 0 ? (
                      filteredLogs
                        .filter(log => log.source === "system")
                        .map((log) => (
                          <LogItem
                            key={log.id}
                            timestamp={log.timestamp}
                            level={log.level}
                            source={log.source}
                            message={log.message}
                          />
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No system logs found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-4 flex justify-between">
            <Button variant="outline">
              Export Logs
            </Button>
            <Button variant="outline">
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="log-retention">Log Retention (days)</Label>
                <Input id="log-retention" defaultValue="30" />
              </div>
              
              <div className="space-y-2">
                <Label>Log Levels to Collect</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="logs-info" defaultChecked />
                    <Label htmlFor="logs-info">Info</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="logs-warning" defaultChecked />
                    <Label htmlFor="logs-warning">Warning</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="logs-error" defaultChecked />
                    <Label htmlFor="logs-error">Error</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="logs-debug" />
                    <Label htmlFor="logs-debug">Debug</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>External Log Storage</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="external-storage" defaultChecked />
                    <Label htmlFor="external-storage">Enable External Storage</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="log-path">External Log Path</Label>
                <Input id="log-path" defaultValue="/var/log/obedio" />
              </div>
              
              <Button className="mt-2">Save Log Settings</Button>
            </div> 
          </div>
        </CardContent>
      </Card>
    </div>
  )
}