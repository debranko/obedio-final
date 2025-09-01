'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Clock,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  Conflict, 
  getConflictSeverityColor, 
  getConflictIcon 
} from "@/utils/conflict-detection"

interface ConflictAlertProps {
  conflicts: Conflict[]
  onResolveConflict?: (conflictId: string) => void
  onDismissConflict?: (conflictId: string) => void
  className?: string
}

interface ConflictItemProps {
  conflict: Conflict
  onResolve?: () => void
  onDismiss?: () => void
}

const ConflictItem = ({ conflict, onResolve, onDismiss }: ConflictItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getSeverityIcon = () => {
    switch (conflict.severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'medium': return <Clock className="w-4 h-4 text-orange-500" />
      case 'low': return <Users className="w-4 h-4 text-yellow-500" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTimeRange = (timeRange?: { start: string; end: string }) => {
    if (!timeRange) return null
    
    const start = new Date(timeRange.start)
    const end = new Date(timeRange.end)
    
    return `${start.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${end.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
  }

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-all duration-200",
      getConflictSeverityColor(conflict.severity)
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {getSeverityIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{getConflictIcon(conflict.type)}</span>
              <Badge variant="outline" className="text-xs">
                {conflict.severity.toUpperCase()}
              </Badge>
              {conflict.timeRange && (
                <span className="text-xs text-gray-600">
                  {formatTimeRange(conflict.timeRange)}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {conflict.message}
            </p>
            
            {isExpanded && conflict.suggestions && conflict.suggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-700">Suggestions:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {conflict.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {conflict.suggestions && conflict.suggestions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          )}
          
          {onResolve && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-green-100"
              onClick={onResolve}
              title="Mark as resolved"
            >
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-100"
              onClick={onDismiss}
              title="Dismiss"
            >
              <X className="w-3 h-3 text-red-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ConflictAlert({ 
  conflicts, 
  onResolveConflict, 
  onDismissConflict,
  className 
}: ConflictAlertProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (conflicts.length === 0) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              No conflicts detected
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const criticalCount = conflicts.filter(c => c.severity === 'critical').length
  const highCount = conflicts.filter(c => c.severity === 'high').length
  const mediumCount = conflicts.filter(c => c.severity === 'medium').length
  const lowCount = conflicts.filter(c => c.severity === 'low').length

  return (
    <Card className={cn("border-red-200 bg-red-50", className)}>
      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Severity counts */}
            <div className="flex gap-1">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalCount} Critical
                </Badge>
              )}
              {highCount > 0 && (
                <Badge variant="destructive" className="text-xs bg-red-100 text-red-700">
                  {highCount} High
                </Badge>
              )}
              {mediumCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  {mediumCount} Medium
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {lowCount} Low
                </Badge>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Conflict List */}
        {!isCollapsed && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {conflicts
              .sort((a, b) => {
                // Sort by severity: critical > high > medium > low
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                return severityOrder[b.severity] - severityOrder[a.severity]
              })
              .map((conflict) => (
                <ConflictItem
                  key={conflict.id}
                  conflict={conflict}
                  onResolve={onResolveConflict ? () => onResolveConflict(conflict.id) : undefined}
                  onDismiss={onDismissConflict ? () => onDismissConflict(conflict.id) : undefined}
                />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type { ConflictAlertProps }