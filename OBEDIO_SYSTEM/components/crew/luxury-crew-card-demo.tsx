'use client'

import { LuxuryCrewCard } from './luxury-crew-card'

const sampleCrewData = [
  {
    id: "c1",
    name: "Ana Petrović",
    avatarUrl: "",
    roleIcon: "service" as const,
    status: "on" as const,
    skills: ["Service", "Barista", "Silver"],
    todayAssignedHours: 3.5,
    batteryPercent: 82,
    isStandby: false
  },
  {
    id: "c2",
    name: "Marko Jovanović",
    avatarUrl: "",
    roleIcon: "housekeeping" as const,
    status: "next" as const,
    skills: ["Housekeeping"],
    todayAssignedHours: 5.0,
    batteryPercent: 34,
    isStandby: true
  },
  {
    id: "c3",
    name: "Jovana Ilić",
    avatarUrl: "",
    roleIcon: "barista" as const,
    status: "break" as const,
    skills: ["Barista", "Service", "Wine"],
    todayAssignedHours: 6.5,
    batteryPercent: 9,
    isStandby: false
  }
]

export function LuxuryCrewCardDemo() {
  const handleMessage = (id: string) => {
    console.log(`Send message to crew member: ${id}`)
  }

  const handlePromoteDemote = (id: string, to: 'duty' | 'standby') => {
    console.log(`${to === 'duty' ? 'Promote' : 'Demote'} crew member: ${id} to ${to}`)
  }

  const handleViewDetails = (id: string) => {
    console.log(`View details for crew member: ${id}`)
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Luxury Crew Cards Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleCrewData.map((crew) => (
            <LuxuryCrewCard
              key={crew.id}
              id={crew.id}
              name={crew.name}
              avatarUrl={crew.avatarUrl}
              roleIcon={crew.roleIcon}
              status={crew.status}
              skills={crew.skills}
              todayAssignedHours={crew.todayAssignedHours}
              batteryPercent={crew.batteryPercent}
              isStandby={crew.isStandby}
              onMessage={handleMessage}
              onPromoteDemote={handlePromoteDemote}
              onViewDetails={handleViewDetails}
              testId={`crew-card-${crew.id}`}
            />
          ))}
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Component Features</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✅ Luxury design with subtle hover animations</li>
            <li>✅ Role icons for different crew positions</li>
            <li>✅ Battery indicator with 4 color states</li>
            <li>✅ Skills badges with expandable functionality</li>
            <li>✅ Workload progress bar with color thresholds</li>
            <li>✅ Quick action buttons (Message, Promote/Demote, View Details)</li>
            <li>✅ Status chips with appropriate colors</li>
            <li>✅ Responsive design (280-320px width)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}