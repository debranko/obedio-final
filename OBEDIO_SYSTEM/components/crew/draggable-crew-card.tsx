'use client'

import { useState } from 'react'
import { LuxuryCrewCard, CrewCardProps } from './luxury-crew-card'
import { ItemTypes } from './drag-drop-context'
import { cn } from '@/lib/utils'

interface DraggableCrewCardProps extends CrewCardProps {
  onDragStart?: (crewId: string) => void
  onDragEnd?: (crewId: string, dropResult: any) => void
}

export function DraggableCrewCard({
  id,
  name,
  onDragStart,
  onDragEnd,
  className,
  ...props
}: DraggableCrewCardProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    // Use both formats for compatibility with different drop targets
    const dragData = {
      type: 'crew',
      id,
      crewId: id,
      name
    }
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: ItemTypes.CREW_CARD,
      id,
      crewId: id,
      name
    }))
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(id)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    onDragEnd?.(id, null)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "transition-opacity duration-200",
        isDragging && "opacity-50 cursor-grabbing",
        !isDragging && "cursor-grab",
        className
      )}
      style={{
        transform: isDragging ? 'rotate(2deg)' : undefined
      }}
    >
      <LuxuryCrewCard
        id={id}
        name={name}
        className={cn(
          isDragging && "shadow-2xl border-blue-300",
          className
        )}
        {...props}
      />
    </div>
  )
}