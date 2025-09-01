// Auto-Distribution Algorithm for Crew Management System

import { Assignment, Lane, LaneTargets } from './conflict-detection'

export interface GroupMember {
  id: string
  name: string
  avatarUrl?: string
  skills?: string[]
}

export interface Group {
  id: string
  title: string
  targetSlots: number
  preferredLaneId?: string
  members: GroupMember[]
}

export type DistributionStrategy =
  | 'duty_first'      // Fill duty slots first, then standby
  | 'balanced'        // Distribute evenly between duty and standby
  | 'standby_first'   // Fill standby slots first, then duty
  | 'preferred_only'  // Only use preferred lanes

export interface DistributionOptions {
  strategy: DistributionStrategy
  timeSlot: {
    start: string
    end: string
  }
  staggerMinutes?: number // Minutes between each assignment start (default: 15)
  allowOverstaffing?: boolean // Allow exceeding lane targets (default: false)
  respectSkills?: boolean // Consider member skills when assigning (default: false)
}

export interface DistributionResult {
  success: boolean
  assignments: Assignment[]
  unassigned: GroupMember[]
  conflicts: string[]
  summary: {
    totalMembers: number
    assigned: number
    dutyAssignments: number
    standbyAssignments: number
    lanesUsed: string[]
  }
}

// Analyze current lane capacity
export function analyzeLaneCapacity(
  lanes: Lane[], 
  existingAssignments: Assignment[], 
  timeSlot: { start: string; end: string }
): Map<string, { dutyAvailable: number; standbyAvailable: number; currentDuty: number; currentStandby: number }> {
  const capacity = new Map()

  lanes.forEach(lane => {
    // Get assignments for this lane in the time slot
    const laneAssignments = existingAssignments.filter(assignment => 
      assignment.laneId === lane.id &&
      // Check if assignment overlaps with time slot
      (new Date(assignment.start) < new Date(timeSlot.end) && 
       new Date(assignment.end) > new Date(timeSlot.start))
    )

    const currentDuty = laneAssignments.filter(a => a.status === 'duty').length
    const currentStandby = laneAssignments.filter(a => a.status === 'standby').length

    capacity.set(lane.id, {
      dutyAvailable: Math.max(0, lane.targets.onDutyTarget - currentDuty),
      standbyAvailable: Math.max(0, lane.targets.standbyTarget - currentStandby),
      currentDuty,
      currentStandby
    })
  })

  return capacity
}

// Calculate priority score for lane assignment
function calculateLanePriority(
  lane: Lane,
  member: GroupMember,
  group: Group,
  capacity: { dutyAvailable: number; standbyAvailable: number }
): number {
  let score = 0

  // Prefer lanes with available capacity
  score += capacity.dutyAvailable * 10
  score += capacity.standbyAvailable * 5

  // Strong preference for group's preferred lane
  if (group.preferredLaneId === lane.id) {
    score += 100
  }

  // Skill matching (basic implementation)
  if (member.skills && member.skills.length > 0) {
    const laneLabel = lane.label.toLowerCase()
    const hasMatchingSkill = member.skills.some(skill => 
      laneLabel.includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(laneLabel)
    )
    if (hasMatchingSkill) {
      score += 20
    }
  }

  // Prefer lanes that are understaffed
  const totalTarget = lane.targets.onDutyTarget + lane.targets.standbyTarget
  const totalAvailable = capacity.dutyAvailable + capacity.standbyAvailable
  const understaffingRatio = totalAvailable / totalTarget
  score += understaffingRatio * 30

  return score
}

// Main auto-distribution algorithm
export function autoDistributeGroup(
  group: Group,
  lanes: Lane[],
  existingAssignments: Assignment[],
  options: DistributionOptions
): DistributionResult {
  const result: DistributionResult = {
    success: false,
    assignments: [],
    unassigned: [...group.members],
    conflicts: [],
    summary: {
      totalMembers: group.members.length,
      assigned: 0,
      dutyAssignments: 0,
      standbyAssignments: 0,
      lanesUsed: []
    }
  }

  if (group.members.length === 0) {
    result.success = true
    return result
  }

  // Analyze current capacity
  const capacity = analyzeLaneCapacity(lanes, existingAssignments, options.timeSlot)
  
  // Create mutable capacity tracking
  const workingCapacity = new Map()
  capacity.forEach((value, key) => {
    workingCapacity.set(key, { ...value })
  })

  // Sort lanes by priority for this group
  const sortedLanes = lanes
    .filter(lane => {
      const cap = workingCapacity.get(lane.id)
      return cap && (cap.dutyAvailable > 0 || cap.standbyAvailable > 0 || options.allowOverstaffing)
    })
    .sort((a, b) => {
      const scoreA = calculateLanePriority(a, group.members[0], group, workingCapacity.get(a.id))
      const scoreB = calculateLanePriority(b, group.members[0], group, workingCapacity.get(b.id))
      return scoreB - scoreA
    })

  // If using preferred_only strategy, filter to preferred lane only
  if (options.strategy === 'preferred_only' && group.preferredLaneId) {
    const preferredLane = sortedLanes.find(lane => lane.id === group.preferredLaneId)
    if (preferredLane) {
      sortedLanes.length = 0
      sortedLanes.push(preferredLane)
    } else {
      result.conflicts.push(`Preferred lane ${group.preferredLaneId} not available`)
      return result
    }
  }

  const staggerMinutes = options.staggerMinutes || 15
  let assignmentIndex = 0

  // Process each member
  for (const member of group.members) {
    let assigned = false

    // Calculate staggered start time
    const baseStart = new Date(options.timeSlot.start)
    const staggeredStart = new Date(baseStart.getTime() + assignmentIndex * staggerMinutes * 60 * 1000)
    const assignmentEnd = new Date(options.timeSlot.end)

    // Ensure staggered start doesn't exceed time slot
    if (staggeredStart >= assignmentEnd) {
      result.conflicts.push(`Cannot fit ${member.name} within time slot due to staggering`)
      continue
    }

    // Try to assign to lanes based on strategy
    for (const lane of sortedLanes) {
      const cap = workingCapacity.get(lane.id)
      let assignmentStatus: 'duty' | 'standby' | null = null

      // Determine assignment status based on strategy
      switch (options.strategy) {
        case 'duty_first':
          if (cap.dutyAvailable > 0 || options.allowOverstaffing) {
            assignmentStatus = 'duty'
          } else if (cap.standbyAvailable > 0) {
            assignmentStatus = 'standby'
          }
          break

        case 'standby_first':
          if (cap.standbyAvailable > 0 || options.allowOverstaffing) {
            assignmentStatus = 'standby'
          } else if (cap.dutyAvailable > 0) {
            assignmentStatus = 'duty'
          }
          break

        case 'balanced':
          // Try to balance duty and standby assignments
          const dutyRatio = cap.currentDuty / (lane.targets.onDutyTarget || 1)
          const standbyRatio = cap.currentStandby / (lane.targets.standbyTarget || 1)
          
          if (dutyRatio <= standbyRatio && (cap.dutyAvailable > 0 || options.allowOverstaffing)) {
            assignmentStatus = 'duty'
          } else if (cap.standbyAvailable > 0 || options.allowOverstaffing) {
            assignmentStatus = 'standby'
          }
          break

        case 'preferred_only':
          // Use duty_first strategy for preferred lane
          if (cap.dutyAvailable > 0 || options.allowOverstaffing) {
            assignmentStatus = 'duty'
          } else if (cap.standbyAvailable > 0) {
            assignmentStatus = 'standby'
          }
          break
      }

      if (assignmentStatus) {
        // Create assignment
        const assignment: Assignment = {
          id: `auto_${group.id}_${member.id}_${Date.now()}`,
          crewId: member.id,
          laneId: lane.id,
          start: staggeredStart.toISOString(),
          end: assignmentEnd.toISOString(),
          status: assignmentStatus,
          name: member.name
        }

        result.assignments.push(assignment)
        
        // Update working capacity
        if (assignmentStatus === 'duty') {
          cap.dutyAvailable = Math.max(0, cap.dutyAvailable - 1)
          cap.currentDuty++
          result.summary.dutyAssignments++
        } else {
          cap.standbyAvailable = Math.max(0, cap.standbyAvailable - 1)
          cap.currentStandby++
          result.summary.standbyAssignments++
        }

        // Track lane usage
        if (!result.summary.lanesUsed.includes(lane.id)) {
          result.summary.lanesUsed.push(lane.id)
        }

        // Remove from unassigned
        const unassignedIndex = result.unassigned.findIndex(m => m.id === member.id)
        if (unassignedIndex >= 0) {
          result.unassigned.splice(unassignedIndex, 1)
        }

        assigned = true
        assignmentIndex++
        break
      }
    }

    if (!assigned) {
      result.conflicts.push(`Could not assign ${member.name} - no available capacity`)
    }
  }

  result.summary.assigned = result.assignments.length
  result.success = result.assignments.length > 0

  return result
}

// Quick distribution presets
export const DISTRIBUTION_PRESETS = {
  OPTIMAL: {
    strategy: 'duty_first' as DistributionStrategy,
    staggerMinutes: 15,
    allowOverstaffing: false,
    respectSkills: true
  },
  EMERGENCY: {
    strategy: 'duty_first' as DistributionStrategy,
    staggerMinutes: 5,
    allowOverstaffing: true,
    respectSkills: false
  },
  BALANCED: {
    strategy: 'balanced' as DistributionStrategy,
    staggerMinutes: 20,
    allowOverstaffing: false,
    respectSkills: true
  },
  STANDBY_FOCUS: {
    strategy: 'standby_first' as DistributionStrategy,
    staggerMinutes: 15,
    allowOverstaffing: false,
    respectSkills: true
  }
} as const

// Helper function to create distribution options with time slot
export function createDistributionOptions(
  preset: keyof typeof DISTRIBUTION_PRESETS,
  timeSlot: { start: string; end: string }
): DistributionOptions {
  return {
    ...DISTRIBUTION_PRESETS[preset],
    timeSlot
  }
}