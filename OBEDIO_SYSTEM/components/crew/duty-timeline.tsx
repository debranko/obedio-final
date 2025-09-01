'use client'

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Calendar,
  ZoomIn,
  ZoomOut,
  Users,
  MapPin,
  Plus,
  Minus,
  MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DroppableTimelineLane } from './droppable-timeline-lane'
import { EnhancedAssignmentBlock } from './enhanced-assignment-block'

// Types
type ViewMode = 'role' | 'location'
type ZoomLevel = '6h' | '12h' | '24h'

interface LaneTarget {
  onDutyTarget: number
  standbyTarget: number
}

interface Lane {
  id: string
  label: string
  targets: LaneTarget
}

interface Assignment {
  id: string
  crewId: string
  laneId: string
  start: string // ISO
  end: string   // ISO
  status: 'duty' | 'standby'
  name?: string
}

interface DutyTimelineProps {
  dateISO: string
  zoom: ZoomLevel
  viewMode: ViewMode
  lanes: Lane[]
  assignments: Assignment[]
  // Callbacks
  onCreateAssignment?: (laneId: string, crewId: string, start: string, end: string, status: 'duty' | 'standby') => void
  onUpdateAssignment?: (id: string, updates: Partial<Assignment>) => void
  onRemoveAssignment?: (id: string) => void
  onFillToTarget?: (laneId: string) => void
  onPromoteDemote?: (id: string, to: 'duty' | 'standby') => void
  onApplyTemplate?: (templateId: 'morning' | 'turnaround') => void
  onDropCrewMember?: (crewId: string, laneId: string, status: 'duty' | 'standby') => void
  onDropGroup?: (groupId: string, laneId: string, status: 'duty' | 'standby') => void
}

// Timeline Header Component
const TimelineHeader = ({
  dateISO,
  zoom,
  viewMode,
  onZoomChange,
  onViewModeChange,
  onApplyTemplate
}: {
  dateISO: string
  zoom: ZoomLevel
  viewMode: ViewMode
  onZoomChange: (zoom: ZoomLevel) => void
  onViewModeChange: (mode: ViewMode) => void
  onApplyTemplate?: (templateId: 'morning' | 'turnaround') => void
}) => {
  const formattedDate = new Date(dateISO).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border-b">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900">{formattedDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'role' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('role')}
            className="rounded-none"
          >
            <Users className="w-4 h-4 mr-1" />
            By Role
          </Button>
          <Button
            variant={viewMode === 'location' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('location')}
            className="rounded-none"
          >
            <MapPin className="w-4 h-4 mr-1" />
            By Location
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={zoom === '6h' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onZoomChange('6h')}
            className="rounded-none"
          >
            6h
          </Button>
          <Button
            variant={zoom === '12h' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onZoomChange('12h')}
            className="rounded-none"
          >
            12h
          </Button>
          <Button
            variant={zoom === '24h' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onZoomChange('24h')}
            className="rounded-none"
          >
            24h
          </Button>
        </div>

        {/* Templates */}
        {onApplyTemplate && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyTemplate('morning')}
            >
              Morning Charter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyTemplate('turnaround')}
            >
              Turnaround
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Time Grid Component
const TimeGrid = ({ zoom, startHour = 6 }: { zoom: ZoomLevel; startHour?: number }) => {
  const hours = zoom === '6h' ? 6 : zoom === '12h' ? 12 : 24
  const intervals = hours * 4 // 15-minute intervals
  
  const timeSlots = useMemo(() => {
    const slots = []
    for (let i = 0; i <= intervals; i++) {
      const totalMinutes = startHour * 60 + (i * 15)
      const hour = Math.floor(totalMinutes / 60) % 24
      const minute = totalMinutes % 60
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      
      slots.push({
        time: timeString,
        isHour: minute === 0,
        position: (i / intervals) * 100
      })
    }
    return slots
  }, [zoom, startHour, intervals])

  return (
    <div className="relative h-8 bg-gray-50 border-b">
      {timeSlots.map((slot, index) => (
        <div
          key={index}
          className="absolute top-0 bottom-0"
          style={{ left: `${slot.position}%` }}
        >
          <div className={cn(
            "h-full border-l",
            slot.isHour ? "border-gray-300" : "border-gray-200"
          )} />
          {slot.isHour && (
            <div className="absolute top-1 left-1 text-xs text-gray-600 font-medium">
              {slot.time}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Lane Counter Component
const LaneCounter = ({ 
  current, 
  target, 
  type,
  onIncrement,
  onDecrement 
}: { 
  current: number
  target: number
  type: 'duty' | 'standby'
  onIncrement?: () => void
  onDecrement?: () => void
}) => {
  const getStatusColor = () => {
    if (current < target) return "text-orange-600 bg-orange-50 border-orange-200"
    if (current === target) return "text-green-600 bg-green-50 border-green-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 min-w-0 truncate">
        {type === 'duty' ? 'On Duty' : 'Stand-by'}:
      </span>
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium",
        getStatusColor()
      )}>
        <span>{current}/{target}</span>
      </div>
      {(onIncrement || onDecrement) && (
        <div className="flex">
          {onDecrement && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDecrement}>
              <Minus className="w-3 h-3" />
            </Button>
          )}
          {onIncrement && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onIncrement}>
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Legacy Assignment Block Component (keeping for compatibility)
const AssignmentBlock = ({
  assignment,
  startHour,
  totalHours,
  onUpdate,
  onRemove
}: {
  assignment: Assignment
  startHour: number
  totalHours: number
  onUpdate?: (updates: Partial<Assignment>) => void
  onRemove?: () => void
}) => {
  return (
    <EnhancedAssignmentBlock
      assignment={assignment}
      startHour={startHour}
      totalHours={totalHours}
      onUpdate={onUpdate}
      onRemove={onRemove}
    />
  )
}

// Lane Component
const LaneRow = ({
  lane,
  assignments,
  zoom,
  startHour,
  onFillToTarget,
  onCreateAssignment,
  onUpdateAssignment,
  onRemoveAssignment,
  onDropCrewMember,
  onDropGroup
}: {
  lane: Lane
  assignments: Assignment[]
  zoom: ZoomLevel
  startHour: number
  onFillToTarget?: (laneId: string) => void
  onCreateAssignment?: (laneId: string, crewId: string, start: string, end: string, status: 'duty' | 'standby') => void
  onUpdateAssignment?: (id: string, updates: Partial<Assignment>) => void
  onRemoveAssignment?: (id: string) => void
  onDropCrewMember?: (crewId: string, laneId: string, status: 'duty' | 'standby') => void
  onDropGroup?: (groupId: string, laneId: string, status: 'duty' | 'standby') => void
}) => {
  const laneAssignments = assignments.filter(a => a.laneId === lane.id)
  const dutyAssignments = laneAssignments.filter(a => a.status === 'duty')
  const standbyAssignments = laneAssignments.filter(a => a.status === 'standby')
  
  const totalHours = zoom === '6h' ? 6 : zoom === '12h' ? 12 : 24

  return (
    <div className="border-b bg-white">
      {/* Lane Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{lane.label}</h3>
        </div>
        <div className="flex items-center gap-4">
          <LaneCounter
            current={dutyAssignments.length}
            target={lane.targets.onDutyTarget}
            type="duty"
          />
          <LaneCounter
            current={standbyAssignments.length}
            target={lane.targets.standbyTarget}
            type="standby"
          />
          {onFillToTarget && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFillToTarget(lane.id)}
              className="text-xs"
            >
              Fill to Target
            </Button>
          )}
        </div>
      </div>

      {/* On Duty Sub-lane */}
      <DroppableTimelineLane
        laneId={lane.id}
        status="duty"
        onDropCrewMember={onDropCrewMember}
        onDropGroup={onDropGroup}
        className="relative h-16 border-b border-gray-100"
      >
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gray-50 border-r flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">On Duty</span>
        </div>
        <div className="ml-20 relative h-full">
          {dutyAssignments.map((assignment) => (
            <EnhancedAssignmentBlock
              key={assignment.id}
              assignment={assignment}
              startHour={startHour}
              totalHours={totalHours}
              onUpdate={onUpdateAssignment ? (updates) => onUpdateAssignment(assignment.id, updates) : undefined}
              onRemove={onRemoveAssignment ? () => onRemoveAssignment(assignment.id) : undefined}
            />
          ))}
        </div>
      </DroppableTimelineLane>

      {/* Stand-by Sub-lane */}
      <DroppableTimelineLane
        laneId={lane.id}
        status="standby"
        onDropCrewMember={onDropCrewMember}
        onDropGroup={onDropGroup}
        className="relative h-12 border-b border-gray-100"
      >
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gray-50 border-r flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">Stand-by</span>
        </div>
        <div className="ml-20 relative h-full">
          {standbyAssignments.map((assignment) => (
            <EnhancedAssignmentBlock
              key={assignment.id}
              assignment={assignment}
              startHour={startHour}
              totalHours={totalHours}
              onUpdate={onUpdateAssignment ? (updates) => onUpdateAssignment(assignment.id, updates) : undefined}
              onRemove={onRemoveAssignment ? () => onRemoveAssignment(assignment.id) : undefined}
            />
          ))}
        </div>
      </DroppableTimelineLane>
    </div>
  )
}

// Main DutyTimeline Component
export function DutyTimeline({
  dateISO,
  zoom,
  viewMode,
  lanes,
  assignments,
  onCreateAssignment,
  onUpdateAssignment,
  onRemoveAssignment,
  onFillToTarget,
  onPromoteDemote,
  onApplyTemplate,
  onDropCrewMember,
  onDropGroup
}: DutyTimelineProps) {
  const [currentZoom, setCurrentZoom] = useState<ZoomLevel>(zoom)
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode)
  const startHour = 6 // Start timeline at 6 AM

  // Calculate global counters
  const totalOnDuty = assignments.filter(a => a.status === 'duty').length
  const totalStandby = assignments.filter(a => a.status === 'standby').length
  const targetOnDuty = lanes.reduce((sum, lane) => sum + lane.targets.onDutyTarget, 0)
  const targetStandby = lanes.reduce((sum, lane) => sum + lane.targets.standbyTarget, 0)

  if (lanes.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Timeline Data</h3>
            <p className="text-sm text-gray-500 mt-2">
              Set up lanes and assignments to view the duty timeline
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <TimelineHeader
        dateISO={dateISO}
        zoom={currentZoom}
        viewMode={currentViewMode}
        onZoomChange={setCurrentZoom}
        onViewModeChange={setCurrentViewMode}
        onApplyTemplate={onApplyTemplate}
      />
      
      {/* Global Counters */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Total:</span>
          <LaneCounter current={totalOnDuty} target={targetOnDuty} type="duty" />
          <LaneCounter current={totalStandby} target={targetStandby} type="standby" />
        </div>
        <div className="text-xs text-gray-500">
          View: {currentViewMode === 'role' ? 'By Role' : 'By Location'} • Zoom: {currentZoom}
        </div>
      </div>

      <div className="relative">
        {/* Time Grid */}
        <div className="sticky top-0 z-10">
          <div className="w-20 h-8 bg-gray-50 border-b border-r absolute left-0 top-0"></div>
          <div className="ml-20">
            <TimeGrid zoom={currentZoom} startHour={startHour} />
          </div>
        </div>

        {/* Lanes */}
        <div className="max-h-96 overflow-y-auto">
          {lanes.map((lane) => (
            <LaneRow
              key={lane.id}
              lane={lane}
              assignments={assignments}
              zoom={currentZoom}
              startHour={startHour}
              onFillToTarget={onFillToTarget}
              onCreateAssignment={onCreateAssignment}
              onUpdateAssignment={onUpdateAssignment}
              onRemoveAssignment={onRemoveAssignment}
              onDropCrewMember={onDropCrewMember}
              onDropGroup={onDropGroup}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

export type { DutyTimelineProps, Lane, Assignment, LaneTarget, ViewMode, ZoomLevel }