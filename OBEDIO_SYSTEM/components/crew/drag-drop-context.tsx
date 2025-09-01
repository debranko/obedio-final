'use client'

import React, { createContext, useContext } from 'react'

// Types for drag & drop operations
interface DragItem {
  type: string
  id: string
  crewId?: string
  groupId?: string
  name?: string
}

interface DropResult {
  laneId: string
  status: 'duty' | 'standby'
  position?: number // For timeline position
}

// Drag types
const ItemTypes = {
  CREW_CARD: 'crew_card',
  ASSIGNMENT_BLOCK: 'assignment_block',
  GROUP_CARD: 'group_card'
} as const

// Context for sharing drag & drop state
interface DragDropContextType {
  // Add any shared state here if needed
}

const DragDropContext = createContext<DragDropContextType>({})

const useDragDropContext = () => useContext(DragDropContext)

// Simplified provider component without DndProvider for now
interface CrewDragDropProviderProps {
  children: React.ReactNode
}

function CrewDragDropProvider({ children }: CrewDragDropProviderProps) {
  return (
    <DragDropContext.Provider value={{}}>
      {children}
    </DragDropContext.Provider>
  )
}

// Export everything at the end
export { CrewDragDropProvider, useDragDropContext, ItemTypes }
export type { DragItem, DropResult }