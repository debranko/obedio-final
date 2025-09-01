'use client'

import { useState } from 'react'
import { ItemTypes, DragItem, DropResult } from './drag-drop-context'
import { cn } from '@/lib/utils'

interface DroppableTimelineLaneProps {
  laneId: string
  status: 'duty' | 'standby'
  children: React.ReactNode
  onDropCrewMember?: (crewId: string, laneId: string, status: 'duty' | 'standby') => void
  onDropGroup?: (groupId: string, laneId: string, status: 'duty' | 'standby') => void
  className?: string
}

export function DroppableTimelineLane({
  laneId,
  status,
  children,
  onDropCrewMember,
  onDropGroup,
  className
}: DroppableTimelineLaneProps) {
  const [isOver, setIsOver] = useState(false)
  const [canDrop, setCanDrop] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(true)
    setCanDrop(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    setIsOver(false)
    setCanDrop(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    setCanDrop(false)

    try {
      const data = e.dataTransfer.getData('application/json')
      const item: DragItem = JSON.parse(data)
      
      if (item.type === ItemTypes.CREW_CARD && item.crewId && onDropCrewMember) {
        onDropCrewMember(item.crewId, laneId, status)
      } else if (item.type === ItemTypes.GROUP_CARD && item.groupId && onDropGroup) {
        onDropGroup(item.groupId, laneId, status)
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative transition-colors duration-200",
        isOver && canDrop && "bg-blue-50 border-blue-200",
        isOver && !canDrop && "bg-red-50 border-red-200",
        canDrop && "border-dashed border-2",
        className
      )}
    >
      {children}
      
      {/* Drop indicator */}
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
            Drop crew or group to {status === 'duty' ? 'On Duty' : 'Stand-by'}
          </div>
        </div>
      )}
      
      {/* Invalid drop indicator */}
      {isOver && !canDrop && (
        <div className="absolute inset-0 bg-red-100 bg-opacity-50 flex items-center justify-center pointer-events-none">
          <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
            Cannot drop here
          </div>
        </div>
      )}
    </div>
  )
}