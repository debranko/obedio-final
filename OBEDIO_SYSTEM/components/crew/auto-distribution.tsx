'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Zap,
  Settings,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  autoDistributeGroup,
  createDistributionOptions,
  DISTRIBUTION_PRESETS,
  DistributionStrategy,
  DistributionResult,
  Group
} from "@/utils/auto-distribution"
import { Assignment, Lane } from "@/utils/conflict-detection"

interface AutoDistributionProps {
  groups: Group[]
  lanes: Lane[]
  assignments: Assignment[]
  onApplyDistribution?: (result: DistributionResult, groupId: string) => void
  className?: string
}

interface DistributionSettings {
  strategy: DistributionStrategy
  staggerMinutes: number
  allowOverstaffing: boolean
  respectSkills: boolean
}

const DistributionStrategyDisplay = {
  duty_first: { label: 'Duty First', icon: '🎯', description: 'Fill duty slots first, then standby' },
  balanced: { label: 'Balanced', icon: '⚖️', description: 'Distribute evenly between duty and standby' },
  standby_first: { label: 'Standby First', icon: '🛡️', description: 'Fill standby slots first, then duty' },
  preferred_only: { label: 'Preferred Only', icon: '📌', description: 'Only use preferred lanes' }
}

export function AutoDistribution({
  groups,
  lanes,
  assignments,
  onApplyDistribution,
  className
}: AutoDistributionProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [settings, setSettings] = useState<DistributionSettings>({
    strategy: 'duty_first',
    staggerMinutes: 15,
    allowOverstaffing: false,
    respectSkills: true
  })
  const [isDistributing, setIsDistributing] = useState(false)
  const [lastResult, setLastResult] = useState<DistributionResult | null>(null)

  const currentTimeSlot = {
    start: new Date().toISOString(),
    end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours from now
  }

  const handleDistribute = async () => {
    if (!selectedGroup) return

    const group = groups.find(g => g.id === selectedGroup)
    if (!group) return

    setIsDistributing(true)
    
    try {
      // Simulate processing time for UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const options = {
        ...settings,
        timeSlot: currentTimeSlot
      }

      const result = autoDistributeGroup(group, lanes, assignments, options)
      setLastResult(result)
      
      if (result.success && onApplyDistribution) {
        onApplyDistribution(result, group.id)
      }
    } finally {
      setIsDistributing(false)
    }
  }

  const handleQuickDistribute = (preset: keyof typeof DISTRIBUTION_PRESETS) => {
    const presetSettings = DISTRIBUTION_PRESETS[preset]
    setSettings({
      strategy: presetSettings.strategy,
      staggerMinutes: presetSettings.staggerMinutes || 15,
      allowOverstaffing: presetSettings.allowOverstaffing || false,
      respectSkills: presetSettings.respectSkills || true
    })
  }

  const availableGroups = groups.filter(group => group.members.length > 0)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-blue-600" />
          Auto-Distribution
        </CardTitle>
        <p className="text-sm text-gray-600">
          Automatically assign group members to timeline lanes
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Group Selection */}
        <div className="space-y-2">
          <Label htmlFor="group-select">Select Group</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a group to distribute" />
            </SelectTrigger>
            <SelectContent>
              {availableGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex items-center gap-2">
                    <span>{group.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {group.members.length} members
                    </Badge>
                    {group.preferredLaneId && (
                      <Badge variant="outline" className="text-xs">
                        → {lanes.find(l => l.id === group.preferredLaneId)?.label}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(DISTRIBUTION_PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handleQuickDistribute(key as keyof typeof DISTRIBUTION_PRESETS)}
                className="justify-start"
              >
                <Target className="w-3 h-3 mr-2" />
                {key.replace('_', ' ').toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-2">
          <Label htmlFor="strategy-select">Distribution Strategy</Label>
          <Select 
            value={settings.strategy} 
            onValueChange={(value: DistributionStrategy) => 
              setSettings(prev => ({ ...prev, strategy: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DistributionStrategyDisplay).map(([key, display]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{display.icon}</span>
                    <div>
                      <div className="font-medium">{display.label}</div>
                      <div className="text-xs text-gray-500">{display.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-600" />
            <Label className="text-sm font-medium">Advanced Settings</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="stagger" className="text-xs">Stagger (minutes)</Label>
              <Select 
                value={settings.staggerMinutes.toString()} 
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, staggerMinutes: parseInt(value) }))
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="20">20 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="overstaffing" className="text-xs">Allow Overstaffing</Label>
              <Switch
                id="overstaffing"
                checked={settings.allowOverstaffing}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, allowOverstaffing: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="skills" className="text-xs">Respect Skills</Label>
              <Switch
                id="skills"
                checked={settings.respectSkills}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, respectSkills: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Distribute Button */}
        <Button 
          onClick={handleDistribute}
          disabled={!selectedGroup || isDistributing}
          className="w-full"
          size="lg"
        >
          {isDistributing ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Distributing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Auto-Distribute Group
            </>
          )}
        </Button>

        {/* Results */}
        {lastResult && (
          <div className={cn(
            "p-3 rounded-lg border",
            lastResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span className={cn(
                "font-medium text-sm",
                lastResult.success ? "text-green-800" : "text-red-800"
              )}>
                {lastResult.success ? 'Distribution Successful' : 'Distribution Failed'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Assigned:</span>
                <span className="font-medium ml-1">{lastResult.summary.assigned}/{lastResult.summary.totalMembers}</span>
              </div>
              <div>
                <span className="text-gray-600">Duty:</span>
                <span className="font-medium ml-1">{lastResult.summary.dutyAssignments}</span>
              </div>
              <div>
                <span className="text-gray-600">Standby:</span>
                <span className="font-medium ml-1">{lastResult.summary.standbyAssignments}</span>
              </div>
            </div>

            {lastResult.conflicts.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-red-700 mb-1">Conflicts:</div>
                <ul className="text-xs text-red-600 space-y-1">
                  {lastResult.conflicts.slice(0, 3).map((conflict, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{conflict}</span>
                    </li>
                  ))}
                  {lastResult.conflicts.length > 3 && (
                    <li className="text-red-500">
                      +{lastResult.conflicts.length - 3} more conflicts
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type { AutoDistributionProps }