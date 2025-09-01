import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Clock, Play, MoreHorizontal, AlertTriangle } from "lucide-react";
import { cn } from "./ui/utils";

interface RequestCardProps {
  id: string;
  guestName: string;
  room: string;
  deck: string;
  timeAgo: string;
  duration: string;
  transcription: string;
  status: "new" | "in-progress" | "resolved";
  isVIP?: boolean;
  isUnclear?: boolean;
  assignedTo?: string;
  priority: "high" | "medium" | "low";
  onAssign?: () => void;
  onReassign?: () => void;
  onEscalate?: () => void;
  onPlayAudio?: () => void;
  onVisualConfirm?: () => void;
  className?: string;
}

export function RequestCard({
  id,
  guestName,
  room,
  deck,
  timeAgo,
  duration,
  transcription,
  status,
  isVIP = false,
  isUnclear = false,
  assignedTo,
  priority,
  onAssign,
  onReassign,
  onEscalate,
  onPlayAudio,
  onVisualConfirm,
  className
}: RequestCardProps) {
  const priorityColors = {
    high: "border-l-red-500",
    medium: "border-l-yellow-500",
    low: "border-l-green-500"
  };

  return (
    <Card className={cn(
      "border-l-4 bg-white dark:bg-card shadow-sm",
      priorityColors[priority],
      className
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {guestName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{guestName}</span>
                  {isVIP && <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs">VIP</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{room} • {deck}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Status and Duration */}
          <div className="flex items-center justify-between">
            <StatusBadge status={status} />
            <span className="text-sm font-mono text-muted-foreground">{duration}</span>
          </div>

          {/* Transcription */}
          <div className={cn(
            "p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50",
            isUnclear && "border border-orange-200 dark:border-orange-800"
          )}>
            <div className="flex items-start justify-between">
              <p className="text-sm flex-1">{transcription}</p>
              <div className="flex items-center space-x-1 ml-2">
                {onPlayAudio && (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onPlayAudio}>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                {isUnclear && (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>
            {isUnclear && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Transcription may be unclear
              </p>
            )}
          </div>

          {/* Assignment */}
          {assignedTo && (
            <div className="text-sm text-muted-foreground">
              Assigned to: <span className="font-medium text-foreground">{assignedTo}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {status === "new" && onAssign && (
                <Button size="sm" onClick={onAssign}>
                  Assign
                </Button>
              )}
              {status === "in-progress" && onReassign && (
                <Button size="sm" variant="outline" onClick={onReassign}>
                  Reassign
                </Button>
              )}
              {onEscalate && (
                <Button size="sm" variant="outline" onClick={onEscalate}>
                  Escalate
                </Button>
              )}
              {isUnclear && onVisualConfirm && (
                <Button size="sm" variant="outline" onClick={onVisualConfirm}>
                  Visual Confirm
                </Button>
              )}
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}