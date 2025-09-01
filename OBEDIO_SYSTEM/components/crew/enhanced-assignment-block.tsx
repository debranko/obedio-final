'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GripVertical, 
  X, 
  Clock, 
  User,
  MoreHorizontal 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedAssignmentBlockProps {
  assignment: {
    id: string
    crewId: string
    laneId: string
    start: string
    end: string
    status: 'duty' | 'standby'
    name?: string
  }
  startHour: number
  totalHours: number
  onUpdate?: (updates: Partial<any>) => void
  onRemove?: () => void
  onResize?: (newStart: string, newEnd: string) => void
  className?: string
}

export function EnhancedAssignmentBlock({
  assignment,
  startHour,
  totalHours,
  onUpdate,
  onRemove,
  onResize,
  className
}: EnhancedAssignmentBlockProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const startTime = new Date(assignment.start)
  const endTime = new Date(assignment.end)
  
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes()
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes()
  const timelineStartMinutes = startHour * 60
  const timelineTotalMinutes = totalHours * 60
  
  const left = Math.max(0, (startMinutes - timelineStartMinutes) / timelineTotalMinutes * 100)
  const width = Math.min(100 - left, (endMinutes - startMinutes) / timelineTotalMinutes * 100)
  
  const duration = (endMinutes - startMinutes) / 60
  
  const statusConfig = {
    duty: {
      bg: "bg-blue-500",
      border: "border-blue-600",
      text: "text-white",
      badge: "bg-blue-600 text-blue-100"
    },
    standby: {
      bg: "bg-yellow-400", 
      border: "border-yellow-500",
      text: "text-yellow-900",
      badge: "bg-yellow-600 text-yellow-100"
    }
  }

  const config = statusConfig[assignment.status]

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'assignment_block',
      assignmentId: assignment.id,
      crewId: assignment.crewId
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleResizeStart = (direction: 'left' | 'right') => {
    setIsResizing(true)
    // In a real implementation, this would set up mouse/touch event listeners
    // for resize functionality
  }

  return (
    <div
      className={cn(
        "absolute top-1 bottom-1 rounded-lg border-l-4 transition-all duration-200 group",
        "min-w-20 cursor-move select-none",
        config.bg,
        config.border,
        config.text,
        isHovered && "shadow-lg transform scale-105 z-10",
        isDragging && "opacity-50 rotate-2",
        isResizing && "cursor-ew-resize",
        className
      )}
      style={{ left: `${left}%`, width: `${width}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={() => handleResizeStart('left')}
        title="Resize start time"
      />

      {/* Main content */}
      <div className="px-3 py-2 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs font-medium truncate">
              {assignment.name || `Crew ${assignment.crewId}`}
            </span>
          </div>
          
          {/* Actions - visible on hover */}
          {isHovered && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-white/20"
                onClick={() => onRemove?.()}
                title="Remove assignment"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="text-xs">
              {startTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })} - {endTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </span>
          </div>
          
          <Badge 
            variant="secondary" 
            className={cn("text-xs px-1 py-0", config.badge)}
          >
            {duration}h
          </Badge>
        </div>
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={() => handleResizeStart('right')}
        title="Resize end time"
      />

      {/* Drag handle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
        <GripVertical className="w-4 h-4" />
      </div>
    </div>
  )
}