import { KPICard } from "../KPICard";
import { RequestCard } from "../RequestCard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Clock, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Battery, 
  Radio,
  Watch,
  Server,
  ChevronRight,
  Users
} from "lucide-react";

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  return (
    <div className={className}>
      <div className="space-y-6 pb-20">




        {/* System Status */}
        <div>
          <h2>System Status</h2>
          <div className="space-y-3 mt-4">
            {/* Low Battery Devices */}
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Battery className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-600">Low Battery Alert</p>
                      <p className="text-xs text-muted-foreground">2 devices need attention</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Dining Room Button (5%) • Guest Cabin 8B (15%)
                </div>
              </CardContent>
            </Card>

            {/* UPS Power Warning */}
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-600">UPS Power</p>
                      <p className="text-xs text-muted-foreground">1 repeater on backup</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Main Deck Central • Check AC power connection
                </div>
              </CardContent>
            </Card>

            {/* System Overview */}
            <Card>
              <CardContent className="p-3">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="cursor-pointer">
                    <Radio className="h-4 w-4 mx-auto mb-1 text-accent" />
                    <p className="text-xs font-medium">Buttons</p>
                    <p className="text-xs text-muted-foreground">22/24</p>
                  </div>
                  <div className="cursor-pointer">
                    <Watch className="h-4 w-4 mx-auto mb-1 text-accent" />
                    <p className="text-xs font-medium">Watches</p>
                    <p className="text-xs text-muted-foreground">3 On Duty</p>
                  </div>
                  <div className="cursor-pointer">
                    <Activity className="h-4 w-4 mx-auto mb-1 text-accent" />
                    <p className="text-xs font-medium">Repeaters</p>
                    <p className="text-xs text-muted-foreground">6 Active</p>
                  </div>
                  <div className="cursor-pointer">
                    <Server className="h-4 w-4 mx-auto mb-1 text-green-600" />
                    <p className="text-xs font-medium">Server</p>
                    <p className="text-xs text-green-600">Healthy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>



        {/* Active Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2>Active Requests</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            <RequestCard
              id="REQ-001"
              guestName="Alexander Smith"
              room="Suite 12A"
              deck="Upper Deck"
              timeAgo="2m ago"
              duration="00:02:15"
              transcription="Could someone please bring extra towels to our suite? We're expecting guests this evening."
              status="new"
              priority="medium"
              isVIP={true}
              onAssign={() => {}}
              onPlayAudio={() => {}}
            />
            
            <RequestCard
              id="REQ-002"
              guestName="Isabella Rodriguez"
              room="Cabin 8B"
              deck="Main Deck"
              timeAgo="5m ago"
              duration="00:05:42"
              transcription="The air conditioning seems to be making a strange noise. Could someone take a look?"
              status="in-progress"
              priority="high"
              assignedTo="James Wilson"
              onReassign={() => {}}
              onEscalate={() => {}}
              onPlayAudio={() => {}}
            />
            
            <RequestCard
              id="REQ-003"
              guestName="Michael Johnson"
              room="Cabin 15C"
              deck="Lower Deck"
              timeAgo="8m ago"
              duration="00:01:23"
              transcription="Can we get some ice for the champagne? Thank you."
              status="in-progress"
              priority="low"
              assignedTo="Maria Santos"
              onReassign={() => {}}
              onPlayAudio={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}