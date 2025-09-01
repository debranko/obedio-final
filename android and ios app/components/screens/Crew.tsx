import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Switch } from "../ui/switch";
import { 
  Clock, 
  Users, 
  Calendar,
  Watch,
  AlertTriangle,
  Plus,
  Settings
} from "lucide-react";

interface CrewProps {
  className?: string;
}

const crewMembers = [
  {
    id: "crew-001",
    name: "Maria Santos",
    role: "Chief Steward",
    status: "on-duty",
    avatar: "",
    watch: "WTC-001",
    shift: {
      start: "08:00",
      end: "20:00",
      remaining: "2h 15m"
    }
  },
  {
    id: "crew-002",
    name: "James Wilson",
    role: "Steward",
    status: "on-duty",
    avatar: "",
    watch: "WTC-002",
    shift: {
      start: "06:00",
      end: "18:00",
      remaining: "45m"
    }
  },
  {
    id: "crew-003",
    name: "Alex Turner",
    role: "Engineer/ETO",
    status: "off-duty",
    avatar: "",
    watch: "WTC-003",
    shift: {
      start: "18:00",
      end: "06:00",
      next: "5h 30m"
    }
  },
  {
    id: "crew-004",
    name: "Sarah Chen",
    role: "Steward",
    status: "off-duty",
    avatar: "",
    watch: null,
    shift: {
      start: "20:00",
      end: "08:00",
      next: "2h 45m"
    }
  },
  {
    id: "crew-005",
    name: "David Brown",
    role: "Support",
    status: "off-duty",
    avatar: "",
    watch: null,
    shift: {
      start: "10:00",
      end: "22:00",
      next: "7h 15m"
    }
  }
];

const upcomingShifts = [
  { time: "18:00", member: "Alex Turner", role: "Engineer/ETO", type: "start" },
  { time: "18:00", member: "James Wilson", role: "Steward", type: "end" },
  { time: "20:00", member: "Maria Santos", role: "Chief Steward", type: "end" },
  { time: "20:00", member: "Sarah Chen", role: "Steward", type: "start" },
];

export function Crew({ className }: CrewProps) {
  return (
    <div className={className}>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Crew & Schedules</h1>
            <p className="text-muted-foreground">Duty management and scheduling</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Rules
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Shift
            </Button>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-accent text-accent-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Currently On Duty</p>
                    <p className="text-sm opacity-90">2 crew members active</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">Next Change</p>
                  <p className="text-sm opacity-90">45 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Duty Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Watch className="h-5 w-5" />
              <span>Quick Duty Change</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    Manual Override Active
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Use this panel for emergency duty changes. Regular schedule will resume automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {crewMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    {member.watch && (
                      <Badge variant="outline" className="text-xs">
                        {member.watch}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant={member.status === "on-duty" ? "default" : "secondary"}
                      className={member.status === "on-duty" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}
                    >
                      {member.status === "on-duty" ? "On Duty" : "Off Duty"}
                    </Badge>
                    <Switch 
                      checked={member.status === "on-duty"}
                      disabled={!member.watch}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {crewMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">
                      {member.shift.start} - {member.shift.end}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.status === "on-duty" 
                        ? `${member.shift.remaining} remaining`
                        : `Starts in ${member.shift.next}`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Upcoming Changes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingShifts.map((shift, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 bg-accent/20 rounded flex items-center justify-center">
                      <span className="text-sm font-mono">{shift.time}</span>
                    </div>
                    <div>
                      <p className="font-medium">{shift.member}</p>
                      <p className="text-sm text-muted-foreground">{shift.role}</p>
                    </div>
                  </div>
                  <Badge variant={shift.type === "start" ? "default" : "secondary"}>
                    {shift.type === "start" ? "Starts Duty" : "Ends Duty"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Escalation Chain */}
        <Card>
          <CardHeader>
            <CardTitle>Escalation Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <span className="font-medium text-green-800 dark:text-green-200 text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium">On-Duty Steward</p>
                    <p className="text-sm text-muted-foreground">First responder</p>
                  </div>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">0-2 minutes</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                    <span className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Chief Steward</p>
                    <p className="text-sm text-muted-foreground">If no response</p>
                  </div>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">After 3 minutes</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                    <span className="font-medium text-red-800 dark:text-red-200 text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Captain</p>
                    <p className="text-sm text-muted-foreground">Final escalation</p>
                  </div>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">After 5 minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}