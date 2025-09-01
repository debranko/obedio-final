'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Users,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Settings,
  GripVertical,
  X,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DraggableGroupCard } from './draggable-group-card'

// Types
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

interface GroupsPanelProps {
  groups: Group[]
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  // Callbacks
  onCreateGroup?: () => void
  onRenameGroup?: (groupId: string, title: string) => void
  onSetTargetSlots?: (groupId: string, targetSlots: number) => void
  onAddMember?: (groupId: string, memberId: string) => void
  onRemoveMember?: (groupId: string, memberId: string) => void
  onSetPreferredLane?: (groupId: string, laneId?: string) => void
  onApplyGroup?: (groupId: string, laneId: string) => void
  onDeleteGroup?: (groupId: string) => void
  // Drag & drop callbacks
  onDragGroupStart?: (groupId: string) => void
  onDragGroupEnd?: (groupId: string, dropResult: any) => void
}

// Group Member Chip Component
const GroupMemberChip = ({ 
  member, 
  onRemove 
}: { 
  member: GroupMember
  onRemove?: () => void 
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <Avatar className="w-6 h-6">
        <AvatarImage src={member.avatarUrl} alt={member.name} />
        <AvatarFallback className="text-xs">
          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-gray-900 truncate block">
          {member.name}
        </span>
        {member.skills && member.skills.length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {member.skills.slice(0, 2).map((skill, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-blue-400"
                title={skill}
              />
            ))}
            {member.skills.length > 2 && (
              <div
                className="w-2 h-2 rounded-full bg-gray-400"
                title={`+${member.skills.length - 2} more skills`}
              />
            )}
          </div>
        )}
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-red-100"
          onClick={onRemove}
        >
          <X className="w-3 h-3 text-red-600" />
        </Button>
      )}
    </div>
  )
}

// Add Member Button Component
const AddMemberButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <Button
      variant="ghost"
      className="w-full p-2 border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-500 hover:text-blue-600"
      onClick={onClick}
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Member
    </Button>
  )
}

// Group Card Component
const GroupCard = ({
  group,
  onRename,
  onSetTargetSlots,
  onAddMember,
  onRemoveMember,
  onSetPreferredLane,
  onDelete,
  isDragging = false
}: {
  group: Group
  onRename?: (title: string) => void
  onSetTargetSlots?: (targetSlots: number) => void
  onAddMember?: () => void
  onRemoveMember?: (memberId: string) => void
  onSetPreferredLane?: (laneId?: string) => void
  onDelete?: () => void
  isDragging?: boolean
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(group.title)
  const [showActions, setShowActions] = useState(false)

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== group.title) {
      onRename?.(editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    }
    if (e.key === 'Escape') {
      setEditTitle(group.title)
      setIsEditing(false)
    }
  }

  const fillPercentage = group.targetSlots > 0 ? (group.members.length / group.targetSlots) * 100 : 0
  const fillStatus = group.members.length < group.targetSlots ? 'underfilled' : 
                   group.members.length === group.targetSlots ? 'met' : 'overfilled'

  const getBorderColor = () => {
    if (fillStatus === 'underfilled') return 'border-orange-200 shadow-orange-100'
    if (fillStatus === 'met') return 'border-green-200 shadow-green-100'
    return 'border-red-200 shadow-red-100'
  }

  const getStatusBadgeColor = () => {
    if (fillStatus === 'underfilled') return 'bg-orange-100 text-orange-700 border-orange-300'
    if (fillStatus === 'met') return 'bg-green-100 text-green-700 border-green-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-move",
        getBorderColor(),
        isDragging && "opacity-50 rotate-2"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="h-7 text-sm font-medium"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleSaveTitle}
                >
                  <Check className="w-3 h-3 text-green-600" />
                </Button>
              </div>
            ) : (
              <h3 
                className="font-medium text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600"
                onClick={() => setIsEditing(true)}
              >
                {group.title}
              </h3>
            )}
          </div>
          
          {showActions && !isEditing && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-3 h-3 text-gray-500" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100"
                  onClick={onDelete}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Slot Counter and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs font-medium", getStatusBadgeColor())}>
              {group.members.length} / {group.targetSlots}
            </Badge>
            {group.preferredLaneId && (
              <Badge variant="secondary" className="text-xs">
                Default: {group.preferredLaneId}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onSetTargetSlots?.(Math.max(1, group.targetSlots - 1))}
              disabled={group.targetSlots <= 1}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium min-w-[20px] text-center">
              {group.targetSlots}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onSetTargetSlots?.(group.targetSlots + 1)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Members */}
        <div className="space-y-2">
          {group.members.map((member) => (
            <GroupMemberChip
              key={member.id}
              member={member}
              onRemove={() => onRemoveMember?.(member.id)}
            />
          ))}
          
          {group.members.length < group.targetSlots && (
            <AddMemberButton onClick={onAddMember} />
          )}
        </div>

        {/* Fill Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                fillStatus === 'underfilled' && "bg-orange-400",
                fillStatus === 'met' && "bg-green-400",
                fillStatus === 'overfilled' && "bg-red-400"
              )}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty State Component
const EmptyState = ({ onCreateGroup }: { onCreateGroup?: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Users className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Yet</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">
        Create groups to quickly assign multiple crew members to timeline lanes
      </p>
      {onCreateGroup && (
        <Button onClick={onCreateGroup} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      )}
    </div>
  )
}

// Main Groups Panel Component
export function GroupsPanel({
  groups,
  isCollapsed = false,
  onToggleCollapse,
  onCreateGroup,
  onRenameGroup,
  onSetTargetSlots,
  onAddMember,
  onRemoveMember,
  onSetPreferredLane,
  onApplyGroup,
  onDeleteGroup,
  onDragGroupStart,
  onDragGroupEnd
}: GroupsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'underfilled' | 'overfilled'>('all')

  const filteredGroups = groups.filter(group => {
    if (filter === 'underfilled') return group.members.length < group.targetSlots
    if (filter === 'overfilled') return group.members.length > group.targetSlots
    return true
  })

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 mb-4"
          onClick={onToggleCollapse}
        >
          <Users className="w-4 h-4" />
        </Button>
        <div className="writing-mode-vertical text-xs text-gray-500 font-medium">
          Groups
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Groups</h2>
          <Badge variant="secondary" className="text-xs">
            {groups.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onCreateGroup && (
            <Button variant="ghost" size="sm" onClick={onCreateGroup}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
          {onToggleCollapse && (
            <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {groups.length > 0 && (
        <div className="flex gap-1 p-3 border-b">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={filter === 'underfilled' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('underfilled')}
            className="text-xs"
          >
            Underfilled
          </Button>
          <Button
            variant={filter === 'overfilled' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('overfilled')}
            className="text-xs"
          >
            Overfilled
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredGroups.length === 0 ? (
          groups.length === 0 ? (
            <EmptyState onCreateGroup={onCreateGroup} />
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No groups match the current filter</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <DraggableGroupCard
                key={group.id}
                group={group}
                onDragStart={onDragGroupStart}
                onDragEnd={onDragGroupEnd}
              >
                <GroupCard
                  group={group}
                  onRename={onRenameGroup ? (title) => onRenameGroup(group.id, title) : undefined}
                  onSetTargetSlots={onSetTargetSlots ? (slots) => onSetTargetSlots(group.id, slots) : undefined}
                  onAddMember={onAddMember ? () => onAddMember(group.id, '') : undefined}
                  onRemoveMember={onRemoveMember ? (memberId) => onRemoveMember(group.id, memberId) : undefined}
                  onSetPreferredLane={onSetPreferredLane ? (laneId) => onSetPreferredLane(group.id, laneId) : undefined}
                  onDelete={onDeleteGroup ? () => onDeleteGroup(group.id) : undefined}
                />
              </DraggableGroupCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export type { Group, GroupMember, GroupsPanelProps }