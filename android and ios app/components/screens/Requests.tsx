import { useState } from "react";
import { RequestCard } from "../RequestCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  SortAsc,
  CheckCircle2
} from "lucide-react";

interface RequestsProps {
  className?: string;
}

const activeRequests = [
  {
    id: "REQ-001",
    guestName: "Alexander Smith",
    room: "Suite 12A",
    deck: "Upper Deck",
    timeAgo: "2m ago",
    duration: "00:02:15",
    transcription: "Could someone please bring extra towels to our suite? We're expecting guests this evening.",
    status: "new" as const,
    priority: "medium" as const,
    isVIP: true,
  },
  {
    id: "REQ-002",
    guestName: "Isabella Rodriguez",
    room: "Cabin 8B",
    deck: "Main Deck",
    timeAgo: "5m ago",
    duration: "00:05:42",
    transcription: "The air conditioning seems to be making a strange noise. Could someone take a look?",
    status: "in-progress" as const,
    priority: "high" as const,
    assignedTo: "James Wilson",
  },
  {
    id: "REQ-003",
    guestName: "Michael Johnson",
    room: "Cabin 15C",
    deck: "Lower Deck",
    timeAgo: "8m ago",
    duration: "00:01:23",
    transcription: "Can we get some ice for the champagne? Thank you.",
    status: "in-progress" as const,
    priority: "low" as const,
    assignedTo: "Maria Santos",
  },
  {
    id: "REQ-004",
    guestName: "Sarah Williams",
    room: "Suite 9A",
    deck: "Upper Deck",
    timeAgo: "12m ago",
    duration: "00:03:45",
    transcription: "Could you please assist with the... um... the thing in the bathroom? It's not working properly.",
    status: "new" as const,
    priority: "medium" as const,
    isVIP: true,
    isUnclear: true,
  },
];

const historyRequests = [
  {
    id: "REQ-H001",
    guestName: "Emma Thompson",
    room: "Cabin 5C",
    deck: "Main Deck",
    timeAgo: "1h ago",
    duration: "00:02:30",
    transcription: "Could we have dinner reservations for tonight at 8 PM?",
    status: "resolved" as const,
    priority: "low" as const,
    resolvedBy: "Maria Santos",
    resolution: "Dinner reservation confirmed for 8 PM at Le Bernardin",
  },
  {
    id: "REQ-H002",
    guestName: "Robert Davis",
    room: "Suite 3A",
    deck: "Upper Deck",
    timeAgo: "2h ago",
    duration: "00:01:45",
    transcription: "The Wi-Fi password isn't working in our suite.",
    status: "resolved" as const,
    priority: "medium" as const,
    isVIP: true,
    resolvedBy: "James Wilson",
    resolution: "Wi-Fi credentials updated and tested successfully",
  },
];

export function Requests({ className }: RequestsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filters = [
    { id: "new", label: "New", count: 2 },
    { id: "in-progress", label: "In Progress", count: 2 },
    { id: "vip", label: "VIP", count: 3 },
    { id: "high", label: "High Priority", count: 1 },
    { id: "unclear", label: "Unclear", count: 1 },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className={className}>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Requests</h1>
            <p className="text-muted-foreground">Manage guest service requests</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search requests, guests, rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {filters.map((filter) => (
              <Badge
                key={filter.id}
                variant={selectedFilters.includes(filter.id) ? "default" : "secondary"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => toggleFilter(filter.id)}
              >
                {filter.label} ({filter.count})
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              <SortAsc className="h-4 w-4 mr-2" />
              Sort by SLA
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active (4)</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {/* Bulk Actions */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                4 active requests • 2 unassigned
              </p>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  Bulk Assign
                </Button>
                <Button size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark All Resolved
                </Button>
              </div>
            </div>

            {/* Active Requests List */}
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  {...request}
                  onAssign={() => console.log('Assign', request.id)}
                  onReassign={() => console.log('Reassign', request.id)}
                  onEscalate={() => console.log('Escalate', request.id)}
                  onPlayAudio={() => console.log('Play audio', request.id)}
                  onVisualConfirm={() => console.log('Visual confirm', request.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            {/* Export Options */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing last 24 hours • 15 total resolved
              </p>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* History Timeline */}
            <div className="space-y-4">
              {historyRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  id={request.id}
                  guestName={request.guestName}
                  room={request.room}
                  deck={request.deck}
                  timeAgo={request.timeAgo}
                  duration={request.duration}
                  transcription={request.transcription}
                  status={request.status}
                  priority={request.priority}
                  isVIP={request.isVIP}
                  onPlayAudio={() => console.log('Play audio', request.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}