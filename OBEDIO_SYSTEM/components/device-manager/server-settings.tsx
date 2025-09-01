"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export function ServerSettings() {
  return (
    <div className="space-y-6 mb-6">
      <Tabs defaultValue="network">
        <TabsList className="w-full flex justify-start mb-6 overflow-x-auto">
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="voice">Voice Processing</TabsTrigger>
          <TabsTrigger value="automation">Task Automation</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="backup">Backup & Redundancy</TabsTrigger>
        </TabsList>
        
        {/* Network Settings */}
        <TabsContent value="network" className="space-y-6">
          {/* LoRa Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                LoRa Network Settings
                <Badge variant="outline">Advanced</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency (MHz)</Label>
                  <Input id="frequency" defaultValue="915.0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spreading-factor">Spreading Factor</Label>
                  <Input id="spreading-factor" defaultValue="7" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bandwidth">Bandwidth (kHz)</Label>
                  <Input id="bandwidth" defaultValue="125" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coding-rate">Coding Rate</Label>
                  <Input id="coding-rate" defaultValue="5" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="adaptive-data-rate">Adaptive Data Rate</Label>
                  <Switch id="adaptive-data-rate" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="channel-hopping">Channel Hopping</Label>
                  <Switch id="channel-hopping" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="extended-range">Extended Range Mode</Label>
                  <Switch id="extended-range" />
                </div>
              </div>
              
              <Separator />
              
              <Button>Save LoRa Settings</Button>
            </CardContent>
          </Card>

          {/* Wi-Fi Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Wi-Fi Network Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wifi-ssid">Wi-Fi SSID</Label>
                <Input id="wifi-ssid" defaultValue="OBEDIO_SERVER" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifi-password">Wi-Fi Password</Label>
                <Input id="wifi-password" type="password" defaultValue="••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Network Mode</Label>
                <RadioGroup defaultValue="wpa2" className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wpa2" id="wpa2" />
                    <Label htmlFor="wpa2">WPA2-PSK</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wpa3" id="wpa3" />
                    <Label htmlFor="wpa3">WPA3-PSK</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button>Save Wi-Fi Settings</Button>
            </CardContent>
          </Card>
          
          {/* MQTT Settings */}
          <Card>
            <CardHeader>
              <CardTitle>MQTT Broker Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mqtt-host">MQTT Host</Label>
                  <Input id="mqtt-host" defaultValue="localhost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mqtt-port">MQTT Port</Label>
                  <Input id="mqtt-port" defaultValue="1883" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mqtt-username">MQTT Username</Label>
                  <Input id="mqtt-username" defaultValue="obedio_server" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mqtt-password">MQTT Password</Label>
                  <Input id="mqtt-password" type="password" defaultValue="••••••••••••" />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mqtt-tls">Enable TLS</Label>
                <Switch id="mqtt-tls" defaultChecked />
              </div>
              
              <Button>Save MQTT Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Encryption Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Encryption Type</Label>
                <RadioGroup defaultValue="aes-128" className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aes-128" id="aes-128" />
                    <Label htmlFor="aes-128">AES-128</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aes-256" id="aes-256" />
                    <Label htmlFor="aes-256">AES-256</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="encryption-key-rotation">Key Rotation Period (days)</Label>
                <Input id="encryption-key-rotation" defaultValue="30" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="end-to-end">End-to-End Encryption</Label>
                <Switch id="end-to-end" defaultChecked />
              </div>
              
              <Button>Save Encryption Settings</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Authentication Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Authentication Method</Label>
                <RadioGroup defaultValue="oauth2" className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oauth2" id="oauth2" />
                    <Label htmlFor="oauth2">OAuth 2.0</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="jwt" id="jwt" />
                    <Label htmlFor="jwt">JWT</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="api-key" id="api-key" />
                    <Label htmlFor="api-key">API Key</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <Switch id="two-factor" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input id="session-timeout" className="w-24" defaultValue="30" />
              </div>
              
              <Button>Save Authentication Settings</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allowed-ips">Allowed IP Addresses (comma separated)</Label>
                <Textarea 
                  id="allowed-ips" 
                  placeholder="192.168.1.0/24, 10.0.0.0/16"
                  defaultValue="192.168.1.0/24, 10.0.0.0/16" 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="restrict-api">Restrict API Access</Label>
                <Switch id="restrict-api" defaultChecked />
              </div>
              
              <Button>Save Access Control Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Database Settings */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PostgreSQL Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-host">Host</Label>
                  <Input id="db-host" defaultValue="localhost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input id="db-port" defaultValue="5432" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input id="db-name" defaultValue="obedio_production" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-user">Username</Label>
                  <Input id="db-user" defaultValue="obedio_admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-password">Password</Label>
                  <Input id="db-password" type="password" defaultValue="••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-connections">Max Connections</Label>
                  <Input id="max-connections" defaultValue="100" />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label htmlFor="db-ssl">Enable SSL</Label>
                <Switch id="db-ssl" defaultChecked />
              </div>

              <Button>Save Database Settings</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Redis Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="redis-host">Host</Label>
                  <Input id="redis-host" defaultValue="localhost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="redis-port">Port</Label>
                  <Input id="redis-port" defaultValue="6379" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="redis-password">Password</Label>
                  <Input id="redis-password" type="password" defaultValue="" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="redis-database">Database</Label>
                  <Input id="redis-database" defaultValue="0" />
                </div>
              </div>
              
              <Button>Save Redis Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Processing Settings */}
        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Recognition Engine</Label>
                <RadioGroup defaultValue="local-ai" className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="local-ai" id="local-ai" />
                    <Label htmlFor="local-ai">Local AI Engine</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cloud-api" id="cloud-api" />
                    <Label htmlFor="cloud-api">Cloud API Service</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language-primary">Primary Language</Label>
                <Input id="language-primary" defaultValue="English (US)" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language-secondary">Secondary Languages (comma separated)</Label>
                <Input id="language-secondary" defaultValue="Spanish, French, German" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="noise-reduction">Noise Reduction</Label>
                <Switch id="noise-reduction" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="speaker-identification">Speaker Identification</Label>
                <Switch id="speaker-identification" defaultChecked />
              </div>
              
              <Button>Save Voice Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Automation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-center text-muted-foreground">
                Task automation settings will be implemented in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-center text-muted-foreground">
                Notification settings will be implemented in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Redundancy</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-center text-muted-foreground">
                Backup and redundancy settings will be implemented in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}