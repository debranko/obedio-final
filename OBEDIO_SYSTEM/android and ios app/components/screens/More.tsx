import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { 
  Users, 
  Home, 
  Bell, 
  Shield, 
  FileText, 
  Settings, 
  Map,
  ChevronRight,
  Moon,
  Sun,
  Download,
  Palette,
  Globe,
  Battery,
  Zap
} from "lucide-react";

interface MoreProps {
  className?: string;
}

const menuItems = [
  {
    category: "Management",
    items: [
      {
        id: "guests",
        title: "Guests & Preferences",
        description: "Guest profiles and service preferences",
        icon: Users,
        badge: "24 Active",
        href: "#"
      },
      {
        id: "rooms",
        title: "Rooms & Assignments",
        description: "Room assignments and device mappings",
        icon: Home,
        badge: "18 Occupied",
        href: "#"
      }
    ]
  },
  {
    category: "System",
    items: [
      {
        id: "notifications",
        title: "Notifications",
        description: "Alert preferences and history",
        icon: Bell,
        badge: "3 New",
        href: "#"
      },
      {
        id: "permissions",
        title: "Permissions & Roles",
        description: "User access and role management",
        icon: Shield,
        href: "#"
      },
      {
        id: "logs",
        title: "Logs & Audit",
        description: "System activity and audit trails",
        icon: FileText,
        href: "#"
      },
      {
        id: "coverage",
        title: "Coverage Map",
        description: "Signal coverage and device locations",
        icon: Map,
        href: "#"
      }
    ]
  }
];

export function More({ className }: MoreProps) {
  return (
    <div className={className}>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>More</h1>
            <p className="text-muted-foreground">Additional settings and tools</p>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Download className="h-6 w-6 text-accent" />
                <span className="text-sm">Export Data</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Map className="h-6 w-6 text-accent" />
                <span className="text-sm">Coverage Map</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        {menuItems.map((category) => (
          <div key={category.category} className="space-y-3">
            <h3 className="font-medium text-muted-foreground px-1">
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.id} className="cursor-pointer hover:bg-accent/5 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-accent/10">
                            <Icon className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* Settings */}
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground px-1">Settings</h3>
          
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Palette className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Appearance</p>
                    <p className="text-sm text-muted-foreground">Luxury Dark theme</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch />
                  <Moon className="h-4 w-4" />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Battery className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Battery Alerts</p>
                      <p className="text-sm text-muted-foreground">Device battery thresholds</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>5% Critical</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>10% Warning</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>30% Low</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Region & RF</p>
                      <p className="text-sm text-muted-foreground">EU (868 MHz)</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Integrations</p>
                      <p className="text-sm text-muted-foreground">External systems and APIs</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    2 Connected
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">System Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>OBEDIO Admin v2.1.3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server</span>
                <span>OBEDIO-SRV-001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sync</span>
                <span>Just now</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Retention</span>
                <span>90 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}