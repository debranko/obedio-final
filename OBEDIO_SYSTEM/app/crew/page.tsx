'use client'

import { useState, useEffect, useMemo } from 'react'
import { DraggableCrewCard } from '@/components/crew/draggable-crew-card'
import { CrewCalendar, type CalendarLane, type CalendarAssignment } from '@/components/crew/crew-calendar'
import { GroupsPanel } from '@/components/crew/groups-panel'
import { ConflictAlert } from '@/components/crew/conflict-alert'
import { AutoDistribution } from '@/components/crew/auto-distribution'
import { CrewDragDropProvider } from '@/components/crew/drag-drop-context'
import { AddCrewModal } from '@/components/crew/add-crew-modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Users, Calendar, Settings, AlertTriangle } from 'lucide-react'
import { detectAllConflicts, Conflict } from '@/utils/conflict-detection'

// Types matching the components exactly
type CrewStatus = 'on' | 'next' | 'break' | 'off' | 'sick'
type RoleIcon = 'service' | 'housekeeping' | 'barista' | 'laundry' | 'tender' | string

interface CrewMember {
  id: string
  name: string
  role: string
  status: CrewStatus
  onDuty: boolean
  skills: string[]
  batteryLevel: number
  workloadHours: number
  avatar?: string
}

interface Assignment {
  id: string
  crewId: string
  laneId: string
  start: string
  end: string
  status: 'duty' | 'standby'
  name?: string
}

interface GroupMember {
  id: string
  name: string
  avatarUrl?: string
  skills?: string[]
}

interface Group {
  id: string
  title: string
  targetSlots: number
  preferredLaneId?: string
  members: GroupMember[]
}

// Remove old Lane interface since we're using CalendarLane now

export default function CrewManagementPage() {
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [lanes] = useState<CalendarLane[]>([
    {
      id: 'service',
      label: 'Service',
      color: 'bg-blue-500',
      targets: { onDutyTarget: 4, standbyTarget: 2 }
    },
    {
      id: 'housekeeping',
      label: 'Housekeeping',
      color: 'bg-green-500',
      targets: { onDutyTarget: 3, standbyTarget: 1 }
    }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedConflicts, setDismissedConflicts] = useState<Set<string>>(new Set())
  
  // Modal states
  const [showAddCrewModal, setShowAddCrewModal] = useState(false)
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [newGroupForm, setNewGroupForm] = useState({
    title: '',
    targetSlots: 2,
    preferredLaneId: ''
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch crew data
        const crewResponse = await fetch('/api/crew', {
          headers: {
            'x-auth-bypass': 'development'
          }
        })

        if (!crewResponse.ok) {
          throw new Error(`Failed to fetch crew data: ${crewResponse.status}`)
        }

        const crewData = await crewResponse.json()
        
        // Transform API data to component format
        const transformedCrew: CrewMember[] = crewData.crew.map((member: any) => {
          // Map database status to component status
          let status: CrewStatus = 'off'
          if (member.onDuty) status = 'on'
          else if (member.status === 'on_leave') status = 'sick'
          else if (member.status === 'break') status = 'break'
          
          return {
            id: member.id.toString(),
            name: member.name,
            role: member.role,
            status,
            onDuty: member.onDuty || false,
            // Use proper database fields for MVP crew card data
            skills: member.skills || [],
            batteryLevel: member.batteryLevel || 100,
            workloadHours: member.workloadHours || 0,
            avatar: member.avatar
          }
        })

        setCrew(transformedCrew)

        // Fetch assignments
        const assignmentsResponse = await fetch('/api/assignments', {
          headers: {
            'x-auth-bypass': 'development'
          }
        })

        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          setAssignments(assignmentsData.assignments || [])
        }

        // Create sample groups with crew members for testing
        const sampleGroups: Group[] = [
          {
            id: 'morning-service',
            title: 'Morning Service Team',
            targetSlots: 3,
            preferredLaneId: 'service',
            members: transformedCrew.slice(0, 2).map(member => ({
              id: member.id,
              name: member.name,
              avatarUrl: member.avatar,
              skills: member.skills
            }))
          },
          {
            id: 'housekeeping-team',
            title: 'Housekeeping Squad',
            targetSlots: 2,
            preferredLaneId: 'housekeeping',
            members: transformedCrew.slice(2, 3).map(member => ({
              id: member.id,
              name: member.name,
              avatarUrl: member.avatar,
              skills: member.skills
            }))
          }
        ]
        
        setGroups(sampleGroups)
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddCrew = () => {
    setShowAddCrewModal(true)
  }

  const handleAddGroup = () => {
    setShowAddGroupModal(true)
  }
  
  const handleCreateGroup = () => {
    if (!newGroupForm.title.trim()) return
    
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      title: newGroupForm.title.trim(),
      targetSlots: newGroupForm.targetSlots,
      preferredLaneId: newGroupForm.preferredLaneId || undefined,
      members: []
    }
    
    setGroups([...groups, newGroup])
    setNewGroupForm({
      title: '',
      targetSlots: 2,
      preferredLaneId: ''
    })
    setShowAddGroupModal(false)
  }
  
  const handleCrewAdded = async () => {
    // Reload crew data when a new crew member is added
    try {
      const crewResponse = await fetch('/api/crew', {
        headers: {
          'x-auth-bypass': 'development'
        }
      })

      if (crewResponse.ok) {
        const crewData = await crewResponse.json()
        
        const transformedCrew: CrewMember[] = crewData.crew.map((member: any) => {
          let status: CrewStatus = 'off'
          if (member.onDuty) status = 'on'
          else if (member.status === 'on_leave') status = 'sick'
          else if (member.status === 'break') status = 'break'
          
          return {
            id: member.id.toString(),
            name: member.name,
            role: member.role,
            status,
            onDuty: member.onDuty || false,
            skills: member.skills || [],
            batteryLevel: member.batteryLevel || 100,
            workloadHours: member.workloadHours || 0,
            avatar: member.avatar
          }
        })

        setCrew(transformedCrew)
      }
    } catch (error) {
      console.error('Error reloading crew data:', error)
    }
  }

  const handleDropCrewMember = (crewId: string, laneId: string, start: Date, status: 'duty' | 'standby') => {
    // Create a new assignment when crew is dropped on calendar
    const crewMember = crew.find(c => c.id === crewId)
    if (!crewMember) return

    // Create a 2-hour assignment starting at the drop time
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 hours later

    const newAssignment: Assignment = {
      id: Date.now().toString(),
      crewId,
      laneId,
      start: start.toISOString(),
      end: end.toISOString(),
      status,
      name: crewMember.name
    }

    setAssignments([...assignments, newAssignment])
    console.log(`Assigned ${crewMember.name} to ${laneId} at ${start.toLocaleTimeString()} (${status})`)
  }

  const handleDropGroup = (groupId: string, laneId: string, start: Date, status: 'duty' | 'standby') => {
    // Create assignments for all members of the group
    const group = groups.find(g => g.id === groupId)
    if (!group || group.members.length === 0) return

    const newAssignments: Assignment[] = group.members.map((member, index) => {
      // Stagger start times by 30 minutes to avoid overlap
      const staggeredStart = new Date(start.getTime() + index * 30 * 60 * 1000)
      const staggeredEnd = new Date(staggeredStart.getTime() + 2 * 60 * 60 * 1000) // 2 hours later
      
      return {
        id: `${Date.now()}-${index}`,
        crewId: member.id,
        laneId,
        start: staggeredStart.toISOString(),
        end: staggeredEnd.toISOString(),
        status,
        name: member.name
      }
    })

    setAssignments([...assignments, ...newAssignments])
    console.log(`Assigned group "${group.title}" (${group.members.length} members) to ${laneId} at ${start.toLocaleTimeString()} (${status})`)
  }

  // Real-time conflict detection
  const currentTimeSlot = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0) // 6 AM
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0) // 10 PM
    
    return {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    }
  }, [])

  const detectedConflicts = useMemo(() => {
    const conflicts = detectAllConflicts(assignments, lanes, currentTimeSlot)
    // Filter out dismissed conflicts
    return conflicts.filter(conflict => !dismissedConflicts.has(conflict.id))
  }, [assignments, lanes, currentTimeSlot, dismissedConflicts])

  const handleDismissConflict = (conflictId: string) => {
    setDismissedConflicts(prev => new Set(Array.from(prev).concat(conflictId)))
  }

  const handleResolveConflict = (conflictId: string) => {
    // For now, just dismiss the conflict
    // In a real app, this would trigger resolution actions
    handleDismissConflict(conflictId)
    console.log(`Conflict ${conflictId} marked as resolved`)
  }

  const handleApplyAutoDistribution = (result: any, groupId: string) => {
    // Apply the auto-distribution result
    if (result.assignments && result.assignments.length > 0) {
      setAssignments([...assignments, ...result.assignments])
      console.log(`Auto-distributed ${result.assignments.length} assignments for group ${groupId}`)
    }
  }

  const handleCreateCalendarAssignment = (laneId: string, start: Date, end: Date, status: 'duty' | 'standby') => {
    // Create a new assignment directly on the calendar
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      crewId: '', // Will be filled when crew is assigned
      laneId,
      start: start.toISOString(),
      end: end.toISOString(),
      status,
      name: 'Unassigned'
    }

    setAssignments([...assignments, newAssignment])
    console.log(`Created new ${status} assignment in ${laneId} at ${start.toLocaleTimeString()}`)
  }

  const handleUpdateCalendarAssignment = (assignmentId: string, updates: Partial<CalendarAssignment>) => {
    setAssignments(assignments.map(a => a.id === assignmentId ? { ...a, ...updates } : a))
  }

  const handleDeleteCalendarAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId))
  }

  // Convert assignments to calendar format
  const calendarAssignments: CalendarAssignment[] = assignments.map(assignment => {
    const crewMember = crew.find(c => c.id === assignment.crewId)
    const lane = lanes.find(l => l.id === assignment.laneId)
    
    return {
      id: assignment.id,
      crewId: assignment.crewId,
      crewName: assignment.name || crewMember?.name || 'Unknown',
      crewAvatar: crewMember?.avatar,
      laneId: assignment.laneId,
      start: assignment.start,
      end: assignment.end,
      status: assignment.status,
      color: lane?.color
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="col-span-6 h-96 bg-gray-200 rounded-lg"></div>
              <div className="col-span-3 h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Crew Data</h3>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CrewDragDropProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crew Management</h1>
            <p className="text-gray-600 mt-1">
              Connected to database • {crew.length} crew members • NO hardcode!
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddGroup} variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Add Group
            </Button>
            <Button onClick={handleAddCrew} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Crew
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          <div className="col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Crew Roster</h2>
                <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                  {crew.length}
                </span>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-full">
              {crew.map((member) => {
                const roleIcon: RoleIcon = member.role.toLowerCase().includes('service') ? 'service' :
                                         member.role.toLowerCase().includes('housekeeping') ? 'housekeeping' :
                                         member.role.toLowerCase().includes('barista') ? 'barista' :
                                         member.role.toLowerCase().includes('laundry') ? 'laundry' :
                                         member.role.toLowerCase().includes('tender') ? 'tender' :
                                         'service'

                return (
                  <DraggableCrewCard
                    key={member.id}
                    id={member.id}
                    name={member.name}
                    avatarUrl={member.avatar}
                    roleIcon={roleIcon}
                    status={member.status}
                    skills={member.skills}
                    todayAssignedHours={member.workloadHours}
                    batteryPercent={member.batteryLevel}
                    isStandby={!member.onDuty}
                    onDragStart={(crewId) => console.log(`Started dragging ${crewId}`)}
                    onDragEnd={(crewId, result) => console.log(`Finished dragging ${crewId}`, result)}
                  />
                )
              })}
              
              {crew.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No crew members found</p>
                  <Button onClick={handleAddCrew} size="sm" className="mt-3">
                    Add First Crew Member
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Crew Schedule</h2>
              </div>
              <div className="text-sm text-gray-600">
                Drag crew members to time slots
              </div>
            </div>
            
            <CrewCalendar
              date={new Date()}
              lanes={lanes}
              assignments={calendarAssignments}
              onCreateAssignment={handleCreateCalendarAssignment}
              onUpdateAssignment={handleUpdateCalendarAssignment}
              onDeleteAssignment={handleDeleteCalendarAssignment}
              onDropCrewMember={handleDropCrewMember}
              onDropGroup={handleDropGroup}
            />
          </div>

          <div className="col-span-3 space-y-6">
            <GroupsPanel
              groups={groups}
              onCreateGroup={() => {
                const newGroup: Group = {
                  id: Date.now().toString(),
                  title: `Group ${groups.length + 1}`,
                  targetSlots: 2,
                  members: []
                }
                setGroups([...groups, newGroup])
              }}
              onRenameGroup={(groupId, title) => {
                setGroups(groups.map(g => g.id === groupId ? {...g, title} : g))
              }}
              onSetTargetSlots={(groupId, targetSlots) => {
                setGroups(groups.map(g => g.id === groupId ? {...g, targetSlots} : g))
              }}
              onDeleteGroup={(groupId) => {
                setGroups(groups.filter(g => g.id !== groupId))
              }}
              onDragGroupStart={(groupId) => {
                console.log(`Started dragging group ${groupId}`)
              }}
              onDragGroupEnd={(groupId, result) => {
                console.log(`Finished dragging group ${groupId}`, result)
              }}
            />

            {/* Conflict Detection Display */}
            {detectedConflicts.length > 0 && (
              <ConflictAlert
                conflicts={detectedConflicts}
                onDismissConflict={handleDismissConflict}
                onResolveConflict={handleResolveConflict}
              />
            )}

            {/* Auto-Distribution Component */}
            <AutoDistribution
              groups={groups}
              lanes={lanes}
              assignments={assignments}
              onApplyDistribution={handleApplyAutoDistribution}
            />
          </div>
        </div>
      </div>
      
      {/* Add Crew Modal */}
      <AddCrewModal
        isOpen={showAddCrewModal}
        onClose={() => setShowAddCrewModal(false)}
        onCrewAdded={handleCrewAdded}
      />
      
      {/* Add Group Modal */}
      <Dialog open={showAddGroupModal} onOpenChange={setShowAddGroupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a team group to quickly assign multiple crew members to timeline lanes.
            </DialogDescription>
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
              <Label htmlFor="preferredLane">Preferred Lane (Optional)</Label>
              <select
                id="preferredLane"
                value={newGroupForm.preferredLaneId}
                onChange={(e) => setNewGroupForm(prev => ({ ...prev, preferredLaneId: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="">No preference</option>
                <option value="service">Service</option>
                <option value="housekeeping">Housekeeping</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateGroup}
              disabled={!newGroupForm.title.trim()}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </CrewDragDropProvider>
  )
}
