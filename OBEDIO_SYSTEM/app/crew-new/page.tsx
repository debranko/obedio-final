'use client'

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LuxuryCrewCard, type CrewCardProps } from '@/components/crew/luxury-crew-card'
import { DutyTimeline, type Lane, type Assignment, type ViewMode, type ZoomLevel } from '@/components/crew/duty-timeline'
import { GroupsPanel, type Group, type GroupMember } from '@/components/crew/groups-panel'
import { 
  Users, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  PanelLeftClose,
  PanelRightClose
} from "lucide-react"
import { cn } from "@/lib/utils"

// Sample data for demo
const sampleCrewMembers: CrewCardProps[] = [
  {
    id: "c1",
    name: "Ana Petrović",
    avatarUrl: "",
    roleIcon: "service",
    status: "on",
    skills: ["Service", "Barista", "Silver"],
    todayAssignedHours: 3.5,
    batteryPercent: 82,
    isStandby: false
  },
  {
    id: "c2",
    name: "Marko Jovanović",
    avatarUrl: "",
    roleIcon: "housekeeping",
    status: "next",
    skills: ["Housekeeping"],
    todayAssignedHours: 5.0,
    batteryPercent: 34,
    isStandby: true
  },
  {
    id: "c3",
    name: "Jovana Ilić",
    avatarUrl: "",
    roleIcon: "barista",
    status: "break",
    skills: ["Barista", "Service", "Wine"],
    todayAssignedHours: 6.5,
    batteryPercent: 9,
    isStandby: false
  },
  {
    id: "c4",
    name: "Stefan Milic",
    avatarUrl: "",
    roleIcon: "tender",
    status: "on",
    skills: ["Navigation", "Safety", "Tender"],
    todayAssignedHours: 4.0,
    batteryPercent: 67,
    isStandby: false
  },
  {
    id: "c5",
    name: "Milica Stojanović",
    avatarUrl: "",
    roleIcon: "laundry",
    status: "off",
    skills: ["Laundry", "Housekeeping"],
    todayAssignedHours: 2.0,
    batteryPercent: 95,
    isStandby: true
  }
]

const sampleLanes: Lane[] = [
  {
    id: "service",
    label: "Service",
    targets: { onDutyTarget: 2, standbyTarget: 1 }
  },
  {
    id: "housekeeping",
    label: "Housekeeping",
    targets: { onDutyTarget: 1, standbyTarget: 1 }
  },
  {
    id: "galley",
    label: "Galley",
    targets: { onDutyTarget: 1, standbyTarget: 0 }
  },
  {
    id: "tender",
    label: "Tender Ops",
    targets: { onDutyTarget: 1, standbyTarget: 1 }
  }
]

const sampleAssignments: Assignment[] = [
  {
    id: "a1",
    crewId: "c1",
    laneId: "service",
    start: "2024-01-15T06:00:00Z",
    end: "2024-01-15T10:00:00Z",
    status: "duty",
    name: "Ana Petrović"
  },
  {
    id: "a2",
    crewId: "c2",
    laneId: "housekeeping",
    start: "2024-01-15T08:00:00Z",
    end: "2024-01-15T14:00:00Z",
    status: "standby",
    name: "Marko Jovanović"
  }
]

const sampleGroups: Group[] = [
  {
    id: "g1",
    title: "Service Team A",
    targetSlots: 3,
    preferredLaneId: "service",
    members: [
      { id: "c1", name: "Ana Petrović", skills: ["Service", "Barista"] },
      { id: "c3", name: "Jovana Ilić", skills: ["Barista", "Wine"] }
    ]
  },
  {
    id: "g2",
    title: "Housekeeping Team",
    targetSlots: 2,
    preferredLaneId: "housekeeping",
    members: [
      { id: "c2", name: "Marko Jovanović", skills: ["Housekeeping"] }
    ]
  }
]

export default function CrewManagementPage() {
  // Panel visibility state
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  
  // Timeline state
  const [currentDate] = useState(new Date().toISOString().split('T')[0])
  const [zoom, setZoom] = useState<ZoomLevel>('12h')
  const [viewMode, setViewMode] = useState<ViewMode>('role')
  
  // Data state
  const [crewMembers] = useState(sampleCrewMembers)
  const [lanes] = useState(sampleLanes)
  const [assignments, setAssignments] = useState(sampleAssignments)
  const [groups, setGroups] = useState(sampleGroups)

  // Crew card event handlers
  const handleMessage = (id: string) => {
    console.log(`Send message to crew member: ${id}`)
    // TODO: Open message modal
  }

  const handlePromoteDemote = (id: string, to: 'duty' | 'standby') => {
    console.log(`${to === 'duty' ? 'Promote' : 'Demote'} crew member: ${id} to ${to}`)
    // TODO: Update crew member status
  }

  const handleViewDetails = (id: string) => {
    console.log(`View details for crew member: ${id}`)
    // TODO: Open crew details drawer
  }

  // Timeline event handlers
  const handleCreateAssignment = (laneId: string, crewId: string, start: string, end: string, status: 'duty' | 'standby') => {
    const newAssignment: Assignment = {
      id: `a${Date.now()}`,
      crewId,
      laneId,
      start,
      end,
      status,
      name: crewMembers.find(c => c.id === crewId)?.name
    }
    setAssignments(prev => [...prev, newAssignment])
  }

  const handleUpdateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const handleRemoveAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id))
  }

  const handleFillToTarget = (laneId: string) => {
    console.log(`Fill lane ${laneId} to target`)
    // TODO: Auto-assign crew to meet lane targets
  }

  const handleApplyTemplate = (templateId: 'morning' | 'turnaround') => {
    console.log(`Apply template: ${templateId}`)
    // TODO: Apply predefined assignment template
  }

  // Groups event handlers
  const handleCreateGroup = () => {
    const newGroup: Group = {
      id: `g${Date.now()}`,
      title: "New Group",
      targetSlots: 2,
      members: []
    }
    setGroups(prev => [...prev, newGroup])
  }

  const handleRenameGroup = (groupId: string, title: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, title } : g))
  }

  const handleSetTargetSlots = (groupId: string, targetSlots: number) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, targetSlots } : g))
  }

  const handleAddMember = (groupId: string, memberId: string) => {
    // TODO: Open member picker dialog
    console.log(`Add member to group ${groupId}`)
  }

  const handleRemoveMember = (groupId: string, memberId: string) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, members: g.members.filter(m => m.id !== memberId) }
        : g
    ))
  }

  const handleDeleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  const handleApplyGroup = (groupId: string, laneId: string) => {
    console.log(`Apply group ${groupId} to lane ${laneId}`)
    // TODO: Distribute group members to lane
  }

  // Calculate panel widths
  const leftPanelWidth = leftPanelCollapsed ? 48 : 360
  const rightPanelWidth = rightPanelCollapsed ? 48 : 320
  const centerPanelWidth = `calc(100% - ${leftPanelWidth + rightPanelWidth}px)`

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crew Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage crew assignments and schedules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            >
              <Users className="w-4 h-4 mr-2" />
              {leftPanelCollapsed ? 'Show' : 'Hide'} Roster
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {rightPanelCollapsed ? 'Show' : 'Hide'} Groups
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Crew Roster */}
        <div 
          className={cn(
            "bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0",
            leftPanelCollapsed ? "w-12" : "w-90"
          )}
          style={{ width: leftPanelCollapsed ? '48px' : '360px' }}
        >
          {leftPanelCollapsed ? (
            <div className="flex flex-col items-center py-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 mb-4"
                onClick={() => setLeftPanelCollapsed(false)}
              >
                <Users className="w-4 h-4" />
              </Button>
              <div className="writing-mode-vertical text-xs text-gray-500 font-medium">
                Roster
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h2 className="font-semibold text-gray-900">Crew Roster</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftPanelCollapsed(true)}
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-4">
                  {crewMembers.map((crew) => (
                    <LuxuryCrewCard
                      key={crew.id}
                      {...crew}
                      onMessage={handleMessage}
                      onPromoteDemote={handlePromoteDemote}
                      onViewDetails={handleViewDetails}
                      className="w-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - Timeline */}
        <div 
          className="flex-1 flex flex-col"
          style={{ width: centerPanelWidth }}
        >
          <div className="p-4 bg-white border-b">
            <h2 className="font-semibold text-gray-900 mb-2">Duty Timeline</h2>
            <p className="text-sm text-gray-600">
              Drag crew members from the roster to assign duties
            </p>
          </div>
          
          <div className="flex-1 overflow-hidden p-4">
            <DutyTimeline
              dateISO={currentDate}
              zoom={zoom}
              viewMode={viewMode}
              lanes={lanes}
              assignments={assignments}
              onCreateAssignment={handleCreateAssignment}
              onUpdateAssignment={handleUpdateAssignment}
              onRemoveAssignment={handleRemoveAssignment}
              onFillToTarget={handleFillToTarget}
              onApplyTemplate={handleApplyTemplate}
            />
          </div>
        </div>

        {/* Right Panel - Groups */}
        <div 
          className="flex-shrink-0 transition-all duration-300"
          style={{ width: rightPanelCollapsed ? '48px' : '320px' }}
        >
          <GroupsPanel
            groups={groups}
            isCollapsed={rightPanelCollapsed}
            onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            onCreateGroup={handleCreateGroup}
            onRenameGroup={handleRenameGroup}
            onSetTargetSlots={handleSetTargetSlots}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onDeleteGroup={handleDeleteGroup}
            onApplyGroup={handleApplyGroup}
          />
        </div>
      </div>
    </div>
  )
}