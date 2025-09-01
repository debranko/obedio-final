'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LuxuryCrewCardDemo } from './luxury-crew-card-demo'
import { DutyTimeline } from './duty-timeline'
import { GroupsPanel } from './groups-panel'
import type { Lane, Assignment } from './duty-timeline'
import type { Group } from './groups-panel'

// Sample data for timeline demo
const sampleLanes = [
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

const sampleAssignments = [
  {
    id: "a1",
    crewId: "c1",
    laneId: "service",
    start: "2024-01-15T06:00:00Z",
    end: "2024-01-15T10:00:00Z",
    status: "duty" as const,
    name: "Ana Petrović"
  },
  {
    id: "a2",
    crewId: "c2", 
    laneId: "housekeeping",
    start: "2024-01-15T08:00:00Z",
    end: "2024-01-15T14:00:00Z",
    status: "standby" as const,
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

export function CrewManagementDemo() {
  const [assignments, setAssignments] = useState(sampleAssignments)
  const [groups, setGroups] = useState(sampleGroups)
  const [currentDate] = useState(new Date().toISOString().split('T')[0])

  const handleCreateAssignment = (laneId: string, crewId: string, start: string, end: string, status: 'duty' | 'standby') => {
    const newAssignment = {
      id: `a${Date.now()}`,
      crewId,
      laneId,
      start,
      end,
      status,
      name: `Crew ${crewId}`
    }
    setAssignments(prev => [...prev, newAssignment])
  }

  const handleUpdateAssignment = (id: string, updates: any) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const handleRemoveAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id))
  }

  // Groups handlers
  const handleCreateGroup = () => {
    const newGroup: Group = {
      id: `g${Date.now()}`,
      title: "New Team",
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Obedio Crew Management System
          </h1>
          <p className="text-lg text-gray-600">
            Luxury yacht service crew management with timeline scheduling and team grouping
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cards">Crew Cards</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">✨ Luxury Crew Cards</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Premium crew cards with role icons, battery indicators, skills badges, 
                    and workload progress bars.
                  </p>
                  <ul className="text-xs space-y-1 text-gray-500">
                    <li>• 280-320px luxury design</li>
                    <li>• 4-state battery indicator</li>
                    <li>• Expandable skills system</li>
                    <li>• Color-coded workload bars</li>
                    <li>• Quick action buttons</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">📅 Duty Timeline</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Professional timeline with zoom levels, lane system, and assignment blocks.
                  </p>
                  <ul className="text-xs space-y-1 text-gray-500">
                    <li>• 6h / 12h / 24h zoom levels</li>
                    <li>• Role/Location lane views</li>
                    <li>• On Duty / Stand-by sub-rows</li>
                    <li>• 15-minute precision</li>
                    <li>• Conflict detection</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">👥 Team Groups</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Smart grouping system with auto-distribution and visual fill states.
                  </p>
                  <ul className="text-xs space-y-1 text-gray-500">
                    <li>• Collapsible panel design</li>
                    <li>• Target slot management</li>
                    <li>• Fill state indicators</li>
                    <li>• Drag & drop ready</li>
                    <li>• Lane preferences</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">🎯 MVP Features Implemented</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">✅ Completed</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Luxury crew card design</li>
                      <li>• Role icons & battery indicators</li>
                      <li>• Skills badge system</li>
                      <li>• Workload progress bars</li>
                      <li>• Timeline with zoom levels</li>
                      <li>• Lane system design</li>
                      <li>• Groups panel UI</li>
                      <li>• Assignment blocks</li>
                      <li>• 3-panel layout</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">🚧 Next Phase</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Drag & drop integration</li>
                      <li>• API data integration</li>
                      <li>• Conflict detection logic</li>
                      <li>• Auto-distribution algorithm</li>
                      <li>• Mobile responsiveness</li>
                      <li>• Real crew data</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards">
            <LuxuryCrewCardDemo />
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Duty Timeline Demo</h3>
                <DutyTimeline
                  dateISO={currentDate}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Groups Panel Demo</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      The groups panel allows quick team management and bulk assignment to timeline lanes.
                    </p>
                    <div className="border rounded-lg overflow-hidden">
                      <GroupsPanel
                        groups={groups}
                        onCreateGroup={handleCreateGroup}
                        onRenameGroup={handleRenameGroup}
                        onSetTargetSlots={handleSetTargetSlots}
                        onRemoveMember={handleRemoveMember}
                        onDeleteGroup={handleDeleteGroup}
                        onApplyGroup={(groupId, laneId) =>
                          console.log(`Apply group ${groupId} to lane ${laneId}`)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Group Features</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Editable group titles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Target slot controls</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Member management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Fill state indicators</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Filter by status</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">○</span>
                        <span>Drag to timeline (next)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Group Features</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Editable group titles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Target slot controls</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Member management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Fill state indicators</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Filter by status</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">○</span>
                        <span>Drag to timeline (next)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}