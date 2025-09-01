import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  Radio, 
  Battery, 
  Wifi, 
  Settings, 
  Zap,
  Watch,
  MoreHorizontal,
  TestTube
} from "lucide-react";
import { cn } from "./ui/utils";

interface DeviceCardProps {
  id: string;
  name: string;
  type: "button" | "repeater" | "watch";
  status: "online" | "offline" | "charging" | "on-duty" | "off-duty";
  location?: string;
  battery?: number;
  signalStrength?: number;
  additionalInfo?: {
    firmware?: string;
    lastSync?: string;
    connectedDevices?: number;
    powerSource?: "AC" | "UPS";
    assignedTo?: string;
  };
  onTest?: () => void;
  onSettings?: () => void;
  onReboot?: () => void;
  className?: string;
}

export function DeviceCard({
  id,
  name,
  type,
  status,
  location,
  battery,
  signalStrength,
  additionalInfo,
  onTest,
  onSettings,
  onReboot,
  className
}: DeviceCardProps) {
  const getDeviceIcon = () => {
    switch (type) {
      case "button":
        return <Radio className="h-5 w-5" />;
      case "repeater":
        return <Wifi className="h-5 w-5" />;
      case "watch":
        return <Watch className="h-5 w-5" />;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-green-600";
    if (level > 20) return "text-yellow-600";
    return "text-red-600";
  };

  const getSignalColor = (strength: number) => {
    if (strength > 70) return "text-green-600";
    if (strength > 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className={cn("bg-white dark:bg-card shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                {getDeviceIcon()}
              </div>
              <div>
                <h3 className="font-medium">{name}</h3>
                {location && (
                  <p className="text-sm text-muted-foreground">{location}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={status} />
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {battery !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Battery</span>
                  <span className={getBatteryColor(battery)}>
                    <Battery className="h-4 w-4 inline mr-1" />
                    {battery}%
                  </span>
                </div>
                <Progress 
                  value={battery} 
                  className="h-2"
                />
              </div>
            )}

            {signalStrength !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Signal</span>
                  <span className={getSignalColor(signalStrength)}>
                    <Radio className="h-4 w-4 inline mr-1" />
                    {signalStrength}%
                  </span>
                </div>
                <Progress 
                  value={signalStrength} 
                  className="h-2"
                />
              </div>
            )}
          </div>

          {/* Additional Info */}
          {additionalInfo && (
            <div className="space-y-2 pt-2 border-t">
              {additionalInfo.firmware && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Firmware</span>
                  <span>{additionalInfo.firmware}</span>
                </div>
              )}
              {additionalInfo.lastSync && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span>{additionalInfo.lastSync}</span>
                </div>
              )}
              {additionalInfo.connectedDevices !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Connected</span>
                  <span>{additionalInfo.connectedDevices} devices</span>
                </div>
              )}
              {additionalInfo.powerSource && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Power</span>
                  <Badge 
                    variant={additionalInfo.powerSource === "AC" ? "default" : "secondary"}
                    className="h-6"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {additionalInfo.powerSource}
                  </Badge>
                </div>
              )}
              {additionalInfo.assignedTo && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Assigned to</span>
                  <span className="font-medium">{additionalInfo.assignedTo}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            {onTest && (
              <Button size="sm" variant="outline" onClick={onTest}>
                <TestTube className="h-4 w-4 mr-1" />
                Test
              </Button>
            )}
            {onSettings && (
              <Button size="sm" variant="outline" onClick={onSettings}>
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            )}
            {onReboot && type === "repeater" && (
              <Button size="sm" variant="outline" onClick={onReboot}>
                Reboot
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}