'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LuxuryCrewCard, type CrewCardProps } from '@/components/crew/luxury-crew-card'
import { DutyTimeline, type Lane, type Assignment } from '@/components/crew/duty-timeline'
import { GroupsPanel, type Group, type GroupMember } from '@/components/crew/groups-panel'
import { 
  Users, 
  Calendar, 
  Plus,
  UserPlus,
  UsersIcon,
  PanelLeftClose,
  PanelRightClose
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

// Interface for API crew data  
interface ApiCrewMember {
  id: number
  name: string
  email?: string
  role: string
  department?: string
  avatar?: string
  onDuty: boolean
  assignedSmartwatchUid?: string
  currentShift?: {
    startTime: string
    endTime: string  
    hoursLeft: number
  }
}

// Convert API data to luxury card format
function convertApiToLuxuryCard(apiCrew: ApiCrewMember): CrewCardProps {
  // Parse additional data from avatar field if it exists (JSON format)
  let additionalData: any = {}
  if (apiCrew.avatar) {
    try {
      additionalData = JSON.parse(apiCrew.avatar)
    } catch {
      // If not JSON, treat as avatar URL
      additionalData = { avatarUrl: apiCrew.avatar }
    }
  }

  return {
    id: apiCrew.id.toString(),
    name: apiCrew.name,
    avatarUrl: additionalData.avatarUrl || "",
    roleIcon: mapRoleToIcon(apiCrew.role),
    status: apiCrew.onDuty ? "on" : "off",
    skills: additionalData.skills || [apiCrew.role],
    todayAssignedHours: additionalData.todayAssignedHours || (apiCrew.currentShift ? 8 : 0),
    batteryPercent: additionalData.batteryPercent || getRandomBattery(),
    isStandby: additionalData.isStandby || false
  }
}

function mapRoleToIcon(role: string): any {
  const roleMap: Record<string, string> = {
    'service': 'service',
    'housekeeping': 'housekeeping', 
    'barista': 'barista',
    'laundry': 'laundry',
    'tender': 'tender',
    'captain': 'service',
    'steward': 'service',
    'chef': 'barista'
  }
  return roleMap[role.toLowerCase()] || 'service'
}

function getRandomBattery() {
  return Math.floor(Math.random() * 100)
}

// Sample lanes for timeline
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
  }
]

export default function CrewProductionPage() {
  // Panel visibility
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  
  // Data state
  const [crewMembers, setCrewMembers] = useState<CrewCardProps[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showAddCrewModal, setShowAddCrewModal] = useState(false)
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  
  // Form data
  const [newCrewForm, setNewCrewForm] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    skills: '',
    batteryPercent: 100
  })
  
  const [newGroupForm, setNewGroupForm] = useState({
    title: '',
    targetSlots: 2,
    preferredLaneId: ''
  })

  // Load crew from database
  const loadCrew = async () => {
    setLoading(true)
    try {
      const response = await fetchWithAuth('/api/crew')
      if (!response.ok) throw new Error('Failed to fetch crew')
      
      const data = await response.json()
      const luxuryCrewData = data.crew.map(convertApiToLuxuryCard)
      setCrewMembers(luxuryCrewData)
    } catch (error) {
      console.error('Error loading crew:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCrew()
  }, [])

  // Add new crew member
  const handleAddCrew = async () => {
    try {
      const additionalData = {
        skills: newCrewForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        batteryPercent: newCrewForm.batteryPercent,
        todayAssignedHours: 0,
        isStandby: false
      }

      const response = await fetchWithAuth('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCrewForm.name,
          email: newCrewForm.email || undefined,
          role: newCrewForm.role,
          department: newCrewForm.department || undefined,
          password: 'temp123', // Default password
          avatar: JSON.stringify(additionalData) // Store additional data as JSON
        })
      })

      if (!response.ok) throw new Error('Failed to add crew member')
      
      // Reload crew data
      await loadCrew()
      
      // Reset form and close modal
      setNewCrewForm({
        name: '',
        email: '',
        role: '',
        department: '',
        skills: '',
        batteryPercent: 100
      })
      setShowAddCrewModal(false)
      
    } catch (error) {
      console.error('Error adding crew:', error)
      alert('Failed to add crew member')
    }
  }

  // Create new group
  const handleCreateGroup = () => {
    const newGroup: Group = {
      id: `g${Date.now()}`,
      title: newGroupForm.title || 'New Team',
      targetSlots: newGroupForm.targetSlots,
      preferredLaneId: newGroupForm.preferredLaneId || undefined,
      members: []
    }
    
    setGroups(prev => [...prev, newGroup])
    setNewGroupForm({
      title: '',
      targetSlots: 2,
      preferredLaneId: ''
    })
    setShowAddGroupModal(false)
  }

  // Crew card event handlers
  const handleMessage = (id: string) => {
    alert(`Message sent to crew member ${id}`)
  }

  const handlePromoteDemote = async (id: string, to: 'duty' | 'standby') => {
    try {
      // Update crew member status in database
      const response = await fetchWithAuth(`/api/crew/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: to === 'duty' ? 'on_duty' : 'standby' 
        })
      })

      if (response.ok) {
        // Reload crew data to reflect changes
        await loadCrew()
        console.log(`${to === 'duty' ? 'Promoted' : 'Demoted'} crew member: ${id}`)
      }
    } catch (error) {
      console.error('Error updating crew status:', error)
    }
  }

  const handleViewDetails = (id: string) => {
    alert(`View details for crew member ${id}`)
  }

  // Timeline handlers
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

  // Groups handlers
  const handleRenameGroup = (groupId: string, title: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, title } : g))
  }

  const handleSetTargetSlots = (groupId: string, targetSlots: number) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, targetSlots } : g))
  }

  const handleAddMemberToGroup = (groupId: string, memberId: string) => {
    const crewMember = crewMembers.find(c => c.id === memberId)
    if (!crewMember) return

    const groupMember: GroupMember = {
      id: crewMember.id,
      name: crewMember.name,
      avatarUrl: crewMember.avatarUrl,
      skills: crewMember.skills
    }

    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, members: [...g.members, groupMember] }
        : g
    ))
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crew Management (Production)</h1>
            <p className="text-sm text-gray-600 mt-1">
              Connected to database • Real crew data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showAddCrewModal} onOpenChange={setShowAddCrewModal}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Crew
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Crew Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newCrewForm.name}
                      onChange={(e) => setNewCrewForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter crew member name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCrewForm.email}
                      onChange={(e) => setNewCrewForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Input
                      id="role"
                      value={newCrewForm.role}
                      onChange={(e) => setNewCrewForm(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g. Service, Housekeeping, Barista"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newCrewForm.department}
                      onChange={(e) => setNewCrewForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g. Interior, Deck, Engine"
                    />
                  </div>
                  <div>
                    <Label htmlFor="skills">Skills (comma separated)</Label>
                    <Input
                      id="skills"
                      value={newCrewForm.skills}
                      onChange={(e) => setNewCrewForm(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="e.g. Service, Wine, Silver Service"
                    />
                  </div>
                  <div>
                    <Label htmlFor="battery">Battery Level (%)</Label>
                    <Input
                      id="battery"
                      type="number"
                      min="0"
                      max="100"
                      value={newCrewForm.batteryPercent}
                      onChange={(e) => setNewCrewForm(prev => ({ ...prev, batteryPercent: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddCrew}
                      disabled={!newCrewForm.name || !newCrewForm.role}
                    >
                      Add Crew Member
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddCrewModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddGroupModal} onOpenChange={setShowAddGroupModal}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Add Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupTitle">Group Name *</Label>
                    <Input
                      id="groupTitle"
                      value={newGroupForm.title}
                      onChange={(e) => setNewGroupForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Service Team A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetSlots">Target Slots</Label>
                    <Input
                      id="targetSlots"
                      type="number"
                      min="1"
                      max="10"
                      value={newGroupForm.targetSlots}
                      onChange={(e) => setNewGroupForm(prev => ({ ...prev, targetSlots: parseInt(e.target.value) || 2 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredLane">Preferred Lane</Label>
                    <select
                      id="preferredLane"
                      value={newGroupForm.preferredLaneId}
                      onChange={(e) => setNewGroupForm(prev => ({ ...prev, preferredLaneId: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">No preference</option>
                      <option value="service">Service</option>
                      <option value="housekeeping">Housekeeping</option>
                      <option value="galley">Galley</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCreateGroup}
                      disabled={!newGroupForm.title}
                    >
                      Create Group
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddGroupModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {crewMembers.length}
                  </span>
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
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                    ))}
                  </div>
                ) : crewMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No crew members</h3>
                    <p className="text-xs text-gray-500 mb-4">Add crew members to get started</p>
                    <Button size="sm" onClick={() => setShowAddCrewModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Crew Member
                    </Button>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - Timeline */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b">
            <h2 className="font-semibold text-gray-900 mb-2">Duty Timeline</h2>
            <p className="text-sm text-gray-600">
              Drag crew members from the roster to assign duties
            </p>
          </div>
          
          <div className="flex-1 overflow-hidden p-4">
            <DutyTimeline
              dateISO={new Date().toISOString().split('T')[0]}
              zoom="12h"
              viewMode="role"
              lanes={sampleLanes}
              assignments={assignments}
              onCreateAssignment={handleCreateAssignment}
              onUpdateAssignment={handleUpdateAssignment}
              onRemoveAssignment={handleRemoveAssignment}
              onFillToTarget={(laneId) => console.log(`Fill ${laneId} to target`)}
              onApplyTemplate={(template) => console.log(`Apply ${template} template`)}
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
            onAddMember={handleAddMemberToGroup}
            onRemoveMember={handleRemoveMember}
            onDeleteGroup={handleDeleteGroup}
            onApplyGroup={(groupId, laneId) => 
              console.log(`Apply group ${groupId} to lane ${laneId}`)
            }
          />
        </div>
      </div>
    </div>
  )
}
