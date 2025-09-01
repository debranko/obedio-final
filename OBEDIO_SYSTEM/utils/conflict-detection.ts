// Conflict Detection Utilities for Crew Management System

export interface TimeSlot {
  start: string // ISO string
  end: string   // ISO string
}

export interface Assignment {
  id: string
  crewId: string
  laneId: string
  start: string
  end: string
  status: 'duty' | 'standby'
  name?: string
}

export interface LaneTargets {
  onDutyTarget: number
  standbyTarget: number
}

export interface Lane {
  id: string
  label: string
  targets: LaneTargets
}

export type ConflictType = 
  | 'crew_overlap'       // Same crew member in multiple assignments at same time
  | 'lane_understaffed'  // Lane has fewer crew than target
  | 'lane_overstaffed'   // Lane has more crew than target
  | 'schedule_gap'       // Gaps in coverage for critical lanes

export interface Conflict {
  id: string
  type: ConflictType
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  affectedItems: {
    assignments?: string[]
    lanes?: string[]
    crewIds?: string[]
  }
  timeRange?: TimeSlot
  suggestions?: string[]
}

// Helper function to check if two time ranges overlap
export function timeRangesOverlap(range1: TimeSlot, range2: TimeSlot): boolean {
  const start1 = new Date(range1.start).getTime()
  const end1 = new Date(range1.end).getTime()
  const start2 = new Date(range2.start).getTime()
  const end2 = new Date(range2.end).getTime()

  return start1 < end2 && start2 < end1
}

// Detect crew member overlapping assignments
export function detectCrewOverlapConflicts(assignments: Assignment[]): Conflict[] {
  const conflicts: Conflict[] = []
  const crewAssignments = new Map<string, Assignment[]>()

  // Group assignments by crew member
  assignments.forEach(assignment => {
    if (!crewAssignments.has(assignment.crewId)) {
      crewAssignments.set(assignment.crewId, [])
    }
    crewAssignments.get(assignment.crewId)!.push(assignment)
  })

  // Check for overlaps within each crew member's assignments
  crewAssignments.forEach((crewAssignmentList, crewId) => {
    for (let i = 0; i < crewAssignmentList.length; i++) {
      for (let j = i + 1; j < crewAssignmentList.length; j++) {
        const assignment1 = crewAssignmentList[i]
        const assignment2 = crewAssignmentList[j]

        if (timeRangesOverlap(
          { start: assignment1.start, end: assignment1.end },
          { start: assignment2.start, end: assignment2.end }
        )) {
          conflicts.push({
            id: `crew_overlap_${assignment1.id}_${assignment2.id}`,
            type: 'crew_overlap',
            severity: 'high',
            message: `${assignment1.name || 'Crew member'} has overlapping assignments`,
            affectedItems: {
              assignments: [assignment1.id, assignment2.id],
              crewIds: [crewId]
            },
            timeRange: {
              start: assignment1.start,
              end: assignment1.end
            },
            suggestions: [
              'Reschedule one of the assignments',
              'Split the assignment between multiple crew members',
              'Adjust assignment duration to eliminate overlap'
            ]
          })
        }
      }
    }
  })

  return conflicts
}

// Detect lane staffing conflicts
export function detectLaneStaffingConflicts(
  assignments: Assignment[], 
  lanes: Lane[], 
  timeSlot: TimeSlot
): Conflict[] {
  const conflicts: Conflict[] = []

  lanes.forEach(lane => {
    // Get assignments for this lane within the time slot
    const laneAssignments = assignments.filter(assignment => 
      assignment.laneId === lane.id &&
      timeRangesOverlap(
        { start: assignment.start, end: assignment.end },
        timeSlot
      )
    )

    const dutyAssignments = laneAssignments.filter(a => a.status === 'duty')
    const standbyAssignments = laneAssignments.filter(a => a.status === 'standby')

    // Check duty staffing
    if (dutyAssignments.length < lane.targets.onDutyTarget) {
      const shortage = lane.targets.onDutyTarget - dutyAssignments.length
      conflicts.push({
        id: `understaffed_duty_${lane.id}`,
        type: 'lane_understaffed',
        severity: shortage > 2 ? 'critical' : shortage > 1 ? 'high' : 'medium',
        message: `${lane.label} duty lane is understaffed by ${shortage} crew members`,
        affectedItems: {
          lanes: [lane.id],
          assignments: dutyAssignments.map(a => a.id)
        },
        timeRange: timeSlot,
        suggestions: [
          'Assign more crew members to duty',
          'Promote standby crew to duty status',
          'Extend existing assignments'
        ]
      })
    } else if (dutyAssignments.length > lane.targets.onDutyTarget) {
      const excess = dutyAssignments.length - lane.targets.onDutyTarget
      conflicts.push({
        id: `overstaffed_duty_${lane.id}`,
        type: 'lane_overstaffed',
        severity: 'low',
        message: `${lane.label} duty lane is overstaffed by ${excess} crew members`,
        affectedItems: {
          lanes: [lane.id],
          assignments: dutyAssignments.map(a => a.id)
        },
        timeRange: timeSlot,
        suggestions: [
          'Move excess crew to standby',
          'Reassign crew to understaffed lanes',
          'Reduce assignment duration'
        ]
      })
    }

    // Check standby staffing
    if (standbyAssignments.length < lane.targets.standbyTarget) {
      const shortage = lane.targets.standbyTarget - standbyAssignments.length
      conflicts.push({
        id: `understaffed_standby_${lane.id}`,
        type: 'lane_understaffed',
        severity: shortage > 1 ? 'medium' : 'low',
        message: `${lane.label} standby is understaffed by ${shortage} crew members`,
        affectedItems: {
          lanes: [lane.id],
          assignments: standbyAssignments.map(a => a.id)
        },
        timeRange: timeSlot,
        suggestions: [
          'Assign more crew members to standby',
          'Adjust duty crew to provide standby coverage'
        ]
      })
    } else if (standbyAssignments.length > lane.targets.standbyTarget) {
      const excess = standbyAssignments.length - lane.targets.standbyTarget
      conflicts.push({
        id: `overstaffed_standby_${lane.id}`,
        type: 'lane_overstaffed',
        severity: 'low',
        message: `${lane.label} standby is overstaffed by ${excess} crew members`,
        affectedItems: {
          lanes: [lane.id],
          assignments: standbyAssignments.map(a => a.id)
        },
        timeRange: timeSlot,
        suggestions: [
          'Reassign excess standby crew to other lanes',
          'Promote standby crew to duty if needed elsewhere'
        ]
      })
    }
  })

  return conflicts
}

// Main conflict detection function
export function detectAllConflicts(
  assignments: Assignment[], 
  lanes: Lane[], 
  currentTimeSlot: TimeSlot
): Conflict[] {
  const conflicts: Conflict[] = []

  // Detect crew overlap conflicts
  conflicts.push(...detectCrewOverlapConflicts(assignments))

  // Detect lane staffing conflicts
  conflicts.push(...detectLaneStaffingConflicts(assignments, lanes, currentTimeSlot))

  return conflicts
}

// Get conflict severity color
export function getConflictSeverityColor(severity: Conflict['severity']): string {
  switch (severity) {
    case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'high': return 'text-red-600 bg-red-50 border-red-200'
    case 'critical': return 'text-red-800 bg-red-100 border-red-300'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// Get conflict icon
export function getConflictIcon(type: ConflictType): string {
  switch (type) {
    case 'crew_overlap': return '⚠️'
    case 'lane_understaffed': return '📉'
    case 'lane_overstaffed': return '📈'
    case 'schedule_gap': return '🕳️'
    default: return '⚠️'
  }
}