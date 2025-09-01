'use client'

import { useState } from 'react'
import { ItemTypes } from './drag-drop-context'
import { cn } from '@/lib/utils'

interface Group {
  id: string
  title: string
  targetSlots: number
  preferredLaneId?: string
  members: Array<{
    id: string
    name: string
    avatarUrl?: string
    skills?: string[]
  }>
}

interface DraggableGroupCardProps {
  group: Group
  children: React.ReactNode
  onDragStart?: (groupId: string) => void
  onDragEnd?: (groupId: string, dropResult: any) => void
  className?: string
}

export function DraggableGroupCard({
  group,
  children,
  onDragStart,
  onDragEnd,
  className
}: DraggableGroupCardProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: ItemTypes.GROUP_CARD,
      id: group.id,
      groupId: group.id,
      name: group.title,
      memberCount: group.members.length,
      targetSlots: group.targetSlots
    }))
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(group.id)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    onDragEnd?.(group.id, null)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50 cursor-grabbing scale-105 rotate-2 shadow-2xl",
        !isDragging && "cursor-grab hover:shadow-lg",
        className
      )}
      style={{
        transform: isDragging ? 'rotate(2deg) scale(1.05)' : undefined,
        zIndex: isDragging ? 1000 : undefined
      }}
    >
      {children}
    </div>
  )
}