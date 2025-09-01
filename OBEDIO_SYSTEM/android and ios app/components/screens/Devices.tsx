import { useState } from "react";
import { DeviceCard } from "../DeviceCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Search, 
  Plus, 
  Scan, 
  RefreshCw, 
  Filter,
  Bluetooth,
  Wifi
} from "lucide-react";

interface DevicesProps {
  className?: string;
}

const buttonDevices = [
  {
    id: "BTN-001",
    name: "Master Suite Button",
    type: "button" as const,
    status: "online" as const,
    location: "Master Suite 1A • Upper Deck",
    battery: 85,
    signalStrength: 92,
    additionalInfo: {
      firmware: "v2.1.3",
      lastSync: "2m ago",
    },
  },
  {
    id: "BTN-002",
    name: "VIP Lounge Button",
    type: "button" as const,
    status: "online" as const,
    location: "VIP Lounge • Main Deck",
    battery: 65,
    signalStrength: 88,
    additionalInfo: {
      firmware: "v2.1.3",
      lastSync: "5m ago",
    },
  },
  {
    id: "BTN-003",
    name: "Guest Cabin 8B",
    type: "button" as const,
    status: "online" as const,
    location: "Cabin 8B • Main Deck",
    battery: 15,
    signalStrength: 76,
    additionalInfo: {
      firmware: "v2.1.2",
      lastSync: "1m ago",
    },
  },
  {
    id: "BTN-004",
    name: "Dining Room Button",
    type: "button" as const,
    status: "offline" as const,
    location: "Dining Room • Main Deck",
    battery: 5,
    signalStrength: 0,
    additionalInfo: {
      firmware: "v2.1.3",
      lastSync: "45m ago",
    },
  },
];

const repeaterDevices = [
  {
    id: "RPT-001",
    name: "Bridge Repeater",
    type: "repeater" as const,
    status: "online" as const,
    location: "Bridge • Upper Deck",
    signalStrength: 95,
    additionalInfo: {
      firmware: "v1.8.2",
      lastSync: "30s ago",
      connectedDevices: 8,
      powerSource: "AC" as const,
    },
  },
  {
    id: "RPT-002",
    name: "Main Deck Central",
    type: "repeater" as const,
    status: "online" as const,
    location: "Central Hub • Main Deck",
    signalStrength: 89,
    additionalInfo: {
      firmware: "v1.8.2",
      lastSync: "1m ago",
      connectedDevices: 12,
      powerSource: "UPS" as const,
    },
  },
  {
    id: "RPT-003",
    name: "Lower Deck Hub",
    type: "repeater" as const,
    status: "online" as const,
    location: "Service Area • Lower Deck",
    signalStrength: 83,
    additionalInfo: {
      firmware: "v1.8.1",
      lastSync: "2m ago",
      connectedDevices: 6,
      powerSource: "AC" as const,
    },
  },
];

const watchDevices = [
  {
    id: "WTC-001",
    name: "Chief Steward Watch",
    type: "watch" as const,
    status: "on-duty" as const,
    battery: 78,
    additionalInfo: {
      firmware: "v3.2.1",
      lastSync: "30s ago",
      assignedTo: "Maria Santos",
    },
  },
  {
    id: "WTC-002",
    name: "Steward Watch #2",
    type: "watch" as const,
    status: "on-duty" as const,
    battery: 92,
    additionalInfo: {
      firmware: "v3.2.1",
      lastSync: "1m ago",
      assignedTo: "James Wilson",
    },
  },
  {
    id: "WTC-003",
    name: "Engineer Watch",
    type: "watch" as const,
    status: "off-duty" as const,
    battery: 45,
    additionalInfo: {
      firmware: "v3.2.0",
      lastSync: "15m ago",
      assignedTo: "Alex Turner",
    },
  },
  {
    id: "WTC-004",
    name: "Backup Watch #1",
    type: "watch" as const,
    status: "charging" as const,
    battery: 35,
    additionalInfo: {
      firmware: "v3.2.1",
      lastSync: "5m ago",
    },
  },
];

export function Devices({ className }: DevicesProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={className}>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Devices</h1>
            <p className="text-muted-foreground">Manage OBEDIO hardware</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search devices, locations, IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buttons">Buttons (24)</TabsTrigger>
            <TabsTrigger value="repeaters">Repeaters (6)</TabsTrigger>
            <TabsTrigger value="watches">Watches (8)</TabsTrigger>
          </TabsList>

          <TabsContent value="buttons" className="space-y-4 mt-6">
            {/* Quick Actions */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Scan className="h-4 w-4 mr-2" />
                Provision New
              </Button>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Bluetooth className="h-4 w-4 mr-2" />
                Bluetooth Scan
              </Button>
              <Badge variant="secondary" className="whitespace-nowrap">
                22 Online
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 whitespace-nowrap">
                2 Low Battery
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 whitespace-nowrap">
                2 Offline
              </Badge>
            </div>

            {/* Buttons Grid */}
            <div className="grid grid-cols-1 gap-4">
              {buttonDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  {...device}
                  onTest={() => console.log('Test LED', device.id)}
                  onSettings={() => console.log('Settings', device.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="repeaters" className="space-y-4 mt-6">
            {/* Quick Actions */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Wifi className="h-4 w-4 mr-2" />
                Network Scan
              </Button>
              <Badge variant="secondary" className="whitespace-nowrap">
                6 Online
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                5 AC Power
              </Badge>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 whitespace-nowrap">
                1 UPS
              </Badge>
            </div>

            {/* Repeaters Grid */}
            <div className="grid grid-cols-1 gap-4">
              {repeaterDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  {...device}
                  onTest={() => console.log('Test signal', device.id)}
                  onSettings={() => console.log('Settings', device.id)}
                  onReboot={() => console.log('Reboot', device.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="watches" className="space-y-4 mt-6">
            {/* Quick Actions */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                Change Duty
              </Button>
              <Badge variant="secondary" className="whitespace-nowrap">
                8 Total
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                3 On Duty
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                2 Charging
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 whitespace-nowrap">
                3 Off Duty
              </Badge>
            </div>

            {/* Watches Grid */}
            <div className="grid grid-cols-1 gap-4">
              {watchDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  {...device}
                  onTest={() => console.log('Test notifications', device.id)}
                  onSettings={() => console.log('Settings', device.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}