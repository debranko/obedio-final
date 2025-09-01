'use client'

import { useState, useMemo, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  X,
  Users,
  MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
interface CalendarAssignment {
  id: string
  crewId: string
  crewName: string
  crewAvatar?: string
  laneId: string
  start: string // ISO datetime
  end: string   // ISO datetime
  status: 'duty' | 'standby'
  color?: string
}

interface CalendarLane {
  id: string
  label: string
  color: string
  targets: {
    onDutyTarget: number
    standbyTarget: number
  }
}

interface CrewCalendarProps {
  date: Date
  lanes: CalendarLane[]
  assignments: CalendarAssignment[]
  onCreateAssignment?: (laneId: string, start: Date, end: Date, status: 'duty' | 'standby') => void
  onUpdateAssignment?: (assignmentId: string, updates: Partial<CalendarAssignment>) => void
  onDeleteAssignment?: (assignmentId: string) => void
  onDropCrewMember?: (crewId: string, laneId: string, start: Date, status: 'duty' | 'standby') => void
  onDropGroup?: (groupId: string, laneId: string, start: Date, status: 'duty' | 'standby') => void
}

// Time slot component
const TimeSlot = ({ 
  hour, 
  minute, 
  laneId,
  status,
  assignments,
  onDrop,
  onClick
}: {
  hour: number
  minute: number
  laneId: string
  status: 'duty' | 'standby'
  assignments: CalendarAssignment[]
  onDrop?: (e: React.DragEvent) => void
  onClick?: () => void
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  
  const handleDragLeave = () => {
    setIsDragOver(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop?.(e)
  }
  
  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  
  // Check if this time slot has an assignment
  const slotAssignments = assignments.filter(assignment => {
    const startTime = new Date(assignment.start)
    const endTime = new Date(assignment.end)
    const slotTime = new Date()
    slotTime.setHours(hour, minute, 0, 0)
    
    return assignment.laneId === laneId && 
           assignment.status === status &&
           slotTime >= startTime && 
           slotTime < endTime
  })
  
  return (
    <div
      className={cn(
        "h-12 border-b border-r border-gray-100 relative group cursor-pointer transition-colors",
        isDragOver && "bg-blue-50 border-blue-300",
        minute === 0 && "border-t border-gray-200",
        hour === 6 && "border-l border-gray-200",
        status === 'standby' && "bg-gray-25"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
    >
      {/* Time label for first column */}
      {laneId === 'time-header' && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
          {minute === 0 && timeString}
        </div>
      )}
      
      {/* Assignment blocks */}
      {slotAssignments.map((assignment) => (
        <AssignmentBlock
          key={assignment.id}
          assignment={assignment}
          className="absolute inset-0"
        />
      ))}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-30 transition-opacity" />
      
      {/* Add button on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Plus className="w-4 h-4 text-blue-600" />
      </div>
    </div>
  )
}

// Assignment block component
const AssignmentBlock = ({ 
  assignment, 
  className,
  onUpdate,
  onDelete 
}: {
  assignment: CalendarAssignment
  className?: string
  onUpdate?: (updates: Partial<CalendarAssignment>) => void
  onDelete?: () => void
}) => {
  const [showActions, setShowActions] = useState(false)
  
  const startTime = new Date(assignment.start)
  const endTime = new Date(assignment.end)
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // minutes
  
  const getStatusColor = () => {
    if (assignment.status === 'duty') {
      return assignment.color || 'bg-blue-500'
    }
    return 'bg-gray-400'
  }
  
  return (
    <div
      className={cn(
        "rounded p-1 text-white text-xs font-medium shadow-sm cursor-pointer transition-all",
        getStatusColor(),
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          {assignment.crewAvatar && (
            <Avatar className="w-4 h-4">
              <AvatarImage src={assignment.crewAvatar} />
              <AvatarFallback className="text-xs">
                {assignment.crewName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="truncate">{assignment.crewName}</span>
        </div>
        
        {showActions && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 text-white hover:text-red-200"
            onClick={onDelete}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      <div className="text-xs opacity-90">
        {startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })} - {endTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })}
      </div>
    </div>
  )
}

// Lane header component
const LaneHeader = ({ 
  lane, 
  assignments,
  isTimeColumn = false 
}: { 
  lane?: CalendarLane
  assignments?: CalendarAssignment[]
  isTimeColumn?: boolean
}) => {
  if (isTimeColumn) {
    return (
      <div className="h-16 bg-gray-50 border-b border-r border-gray-200 flex items-center justify-center">
        <Clock className="w-4 h-4 text-gray-500" />
      </div>
    )
  }
  
  if (!lane || !assignments) return null
  
  const laneAssignments = assignments.filter(a => a.laneId === lane.id)
  const dutyCount = laneAssignments.filter(a => a.status === 'duty').length
  const standbyCount = laneAssignments.filter(a => a.status === 'standby').length
  
  return (
    <div className="h-16 bg-white border-b border-r border-gray-200 p-2">
      <div className="flex items-center justify-between h-full">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm text-gray-900 truncate">{lane.label}</h3>
          <div className="flex gap-2 mt-1">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                dutyCount >= lane.targets.onDutyTarget ? "text-green-600 border-green-300" : "text-orange-600 border-orange-300"
              )}
            >
              {dutyCount}/{lane.targets.onDutyTarget} duty
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                standbyCount >= lane.targets.standbyTarget ? "text-green-600 border-green-300" : "text-orange-600 border-orange-300"
              )}
            >
              {standbyCount}/{lane.targets.standbyTarget} standby
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

// Calendar header with navigation
const CalendarHeader = ({ 
  date, 
  onDateChange 
}: { 
  date: Date
  onDateChange: (date: Date) => void 
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const goToPrevDay = () => {
    const prevDay = new Date(date)
    prevDay.setDate(date.getDate() - 1)
    onDateChange(prevDay)
  }
  
  const goToNextDay = () => {
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    onDateChange(nextDay)
  }
  
  const goToToday = () => {
    onDateChange(new Date())
  }
  
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">{formatDate(date)}</h2>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToPrevDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        Drag crew members to time slots to schedule
      </div>
    </div>
  )
}

// Main calendar component
export function CrewCalendar({
  date,
  lanes,
  assignments,
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onDropCrewMember,
  onDropGroup
}: CrewCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(date)
  
  // Generate time slots (6 AM to 10 PM, 30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({ hour, minute })
      }
    }
    return slots
  }, [])
  
  const handleDropInSlot = (e: React.DragEvent, laneId: string, hour: number, minute: number, status: 'duty' | 'standby') => {
    e.preventDefault()
    
    const dragData = e.dataTransfer.getData('text/plain')
    
    try {
      const data = JSON.parse(dragData)
      const slotTime = new Date(selectedDate)
      slotTime.setHours(hour, minute, 0, 0)
      
      if (data.type === 'crew') {
        onDropCrewMember?.(data.id, laneId, slotTime, status)
      } else if (data.type === 'group') {
        onDropGroup?.(data.id, laneId, slotTime, status)
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }
  
  const handleSlotClick = (laneId: string, hour: number, minute: number, status: 'duty' | 'standby') => {
    const slotTime = new Date(selectedDate)
    slotTime.setHours(hour, minute, 0, 0)
    
    const endTime = new Date(slotTime)
    endTime.setHours(hour + 2) // Default 2-hour assignment
    
    onCreateAssignment?.(laneId, slotTime, endTime, status)
  }
  
  return (
    <Card className="w-full h-full flex flex-col">
      <CalendarHeader date={selectedDate} onDateChange={setSelectedDate} />
      
      <div className="flex-1 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `120px repeat(${lanes.length}, 1fr)` }}>
          {/* Headers */}
          <LaneHeader isTimeColumn />
          {lanes.map((lane) => (
            <LaneHeader key={lane.id} lane={lane} assignments={assignments} />
          ))}
          
          {/* Time slots grid */}
          {timeSlots.map(({ hour, minute }) => (
            <div key={`${hour}-${minute}`} className="contents">
              {/* Time column */}
              <TimeSlot
                hour={hour}
                minute={minute}
                laneId="time-header"
                status="duty"
                assignments={[]}
              />
              
              {/* Lane columns */}
              {lanes.map((lane) => (
                <TimeSlot
                  key={`${lane.id}-${hour}-${minute}`}
                  hour={hour}
                  minute={minute}
                  laneId={lane.id}
                  status="duty"
                  assignments={assignments}
                  onDrop={(e) => handleDropInSlot(e, lane.id, hour, minute, 'duty')}
                  onClick={() => handleSlotClick(lane.id, hour, minute, 'duty')}
                />
              ))}
            </div>
          ))}
          
          {/* Standby section header */}
          <div className="col-span-full border-t-2 border-gray-300 bg-gray-50 p-2">
            <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Stand-by Schedule
            </div>
          </div>
          
          {/* Standby time slots */}
          {timeSlots.slice(0, 8).map(({ hour, minute }) => (
            <div key={`standby-${hour}-${minute}`} className="contents">
              <TimeSlot
                hour={hour}
                minute={minute}
                laneId="time-header"
                status="standby"
                assignments={[]}
              />
              
              {lanes.map((lane) => (
                <TimeSlot
                  key={`${lane.id}-standby-${hour}-${minute}`}
                  hour={hour}
                  minute={minute}
                  laneId={lane.id}
                  status="standby"
                  assignments={assignments}
                  onDrop={(e) => handleDropInSlot(e, lane.id, hour, minute, 'standby')}
                  onClick={() => handleSlotClick(lane.id, hour, minute, 'standby')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export type { CalendarAssignment, CalendarLane, CrewCalendarProps }