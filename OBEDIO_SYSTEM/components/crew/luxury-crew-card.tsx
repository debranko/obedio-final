'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Eye,
  Battery,
  BatteryLow,
  BatteryWarning,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for the luxury crew card
type CrewStatus = 'on' | 'next' | 'break' | 'off' | 'sick'
type RoleIcon = 'service' | 'housekeeping' | 'barista' | 'laundry' | 'tender' | string

interface CrewCardProps {
  id: string
  name: string
  avatarUrl?: string
  roleIcon: RoleIcon
  status: CrewStatus
  skills: string[]
  todayAssignedHours: number
  batteryPercent?: number
  isStandby?: boolean
  onMessage?: (id: string) => void
  onPromoteDemote?: (id: string, to: 'duty' | 'standby') => void
  onViewDetails?: (id: string) => void
  testId?: string
  className?: string
}

// Role icon component
const RoleIcon = ({ role, className }: { role: RoleIcon; className?: string }) => {
  const roleIcons = {
    service: "🛎️",
    housekeeping: "🧹", 
    barista: "☕",
    laundry: "👕",
    tender: "🚤"
  }
  
  return (
    <div className={cn("w-6 h-6 flex items-center justify-center text-sm", className)}>
      {roleIcons[role as keyof typeof roleIcons] || "👤"}
    </div>
  )
}

// Battery indicator component
const BatteryIndicator = ({ percent = 0 }: { percent?: number }) => {
  const getBatteryIcon = () => {
    if (percent >= 75) return <Battery className="w-4 h-4 text-green-600" />
    if (percent >= 40) return <Battery className="w-4 h-4 text-yellow-600" />
    if (percent >= 10) return <BatteryLow className="w-4 h-4 text-orange-600" />
    return <BatteryWarning className="w-4 h-4 text-red-600" />
  }

  const getBatteryColor = () => {
    if (percent >= 75) return "text-green-600"
    if (percent >= 40) return "text-yellow-600"
    if (percent >= 10) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <div className="flex items-center gap-1">
      {getBatteryIcon()}
      <span className={cn("text-xs font-medium", getBatteryColor())}>
        {percent}%
      </span>
    </div>
  )
}

// Skills badges component
const SkillsBadges = ({ skills, maxVisible = 2 }: { skills: string[]; maxVisible?: number }) => {
  const [expanded, setExpanded] = useState(false)
  const visibleSkills = expanded ? skills : skills.slice(0, maxVisible)
  const remainingCount = skills.length - maxVisible

  return (
    <div className="flex flex-wrap gap-1">
      {visibleSkills.map((skill, index) => (
        <Badge 
          key={index}
          variant="secondary" 
          className="text-xs px-2 py-0.5 font-medium bg-blue-50 text-blue-700 border-blue-200"
        >
          {skill}
        </Badge>
      ))}
      {!expanded && remainingCount > 0 && (
        <Badge 
          variant="outline"
          className="text-xs px-2 py-0.5 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpanded(true)}
        >
          +{remainingCount}
        </Badge>
      )}
      {expanded && skills.length > maxVisible && (
        <Badge 
          variant="outline"
          className="text-xs px-2 py-0.5 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpanded(false)}
        >
          Show less
        </Badge>
      )}
    </div>
  )
}

// Workload progress bar component
const WorkloadProgressBar = ({ hours }: { hours: number }) => {
  const getProgressColor = () => {
    if (hours <= 4) return "bg-green-500"
    if (hours <= 6) return "bg-orange-500"
    return "bg-red-500"
  }

  const getProgressBg = () => {
    if (hours <= 4) return "bg-green-100"
    if (hours <= 6) return "bg-orange-100"
    return "bg-red-100"
  }

  const progressPercentage = Math.min((hours / 8) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">Today</span>
        <span className="text-xs font-medium">{hours}h assigned</span>
      </div>
      <div className={cn("w-full h-2 rounded-full", getProgressBg())}>
        <div 
          className={cn("h-full rounded-full transition-all duration-300", getProgressColor())}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
}

// Status chip component
const StatusChip = ({ status }: { status: CrewStatus }) => {
  const statusConfig = {
    on: { label: "On Duty", color: "bg-green-100 text-green-800 border-green-200" },
    next: { label: "Next", color: "bg-blue-100 text-blue-800 border-blue-200" },
    break: { label: "Break", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    off: { label: "Off", color: "bg-gray-100 text-gray-800 border-gray-200" },
    sick: { label: "Sick", color: "bg-red-100 text-red-800 border-red-200" }
  }

  const config = statusConfig[status] || statusConfig.off

  return (
    <Badge 
      variant="outline"
      className={cn("text-xs px-2 py-1 font-medium border", config.color)}
    >
      {config.label}
    </Badge>
  )
}

// Main luxury crew card component
export function LuxuryCrewCard({
  id,
  name,
  avatarUrl,
  roleIcon,
  status,
  skills,
  todayAssignedHours,
  batteryPercent,
  isStandby = false,
  onMessage,
  onPromoteDemote,
  onViewDetails,
  testId,
  className
}: CrewCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card 
      className={cn(
        "w-80 h-auto transition-all duration-200 hover:shadow-md hover:-translate-y-1",
        "border border-gray-200 rounded-xl bg-white",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={testId}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="text-sm font-medium bg-gray-100">
                  {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <RoleIcon role={roleIcon} className="bg-white rounded-full border border-gray-200 p-0.5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-gray-900 truncate">{name}</h3>
              <p className="text-sm text-gray-600 capitalize">{roleIcon}</p>
            </div>
          </div>
          <StatusChip status={status} />
        </div>

        {/* Body */}
        <div className="space-y-3">
          {/* Skills */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Skills</label>
            <SkillsBadges skills={skills} />
          </div>

          {/* Workload */}
          <WorkloadProgressBar hours={todayAssignedHours} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Battery */}
          <div className="flex items-center">
            {batteryPercent !== undefined && <BatteryIndicator percent={batteryPercent} />}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {onMessage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50"
                onClick={() => onMessage(id)}
                title="Send Message"
              >
                <MessageCircle className="w-4 h-4 text-blue-600" />
              </Button>
            )}
            
            {onPromoteDemote && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-green-50"
                onClick={() => onPromoteDemote(id, isStandby ? 'duty' : 'standby')}
                title={isStandby ? "Promote to Duty" : "Move to Standby"}
              >
                {isStandby ? (
                  <ArrowUpCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownCircle className="w-4 h-4 text-yellow-600" />
                )}
              </Button>
            )}
            
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-50"
                onClick={() => onViewDetails(id)}
                title="View Details"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export types for other components
export type { CrewCardProps, CrewStatus, RoleIcon }