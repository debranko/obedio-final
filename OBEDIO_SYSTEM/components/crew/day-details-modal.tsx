'use client'

import { useState } from "react"
import { X, Clock, Users, Plus, Sun, Moon, Sunrise } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CrewMember {
  id: number
  name: string
  role: string
  department?: string | null
  avatar?: string | null
}

interface Shift {
  id: number
  startsAt: string
  endsAt: string
  crewMember: CrewMember
  type?: 'morning' | 'afternoon' | 'night'
}

interface DayDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  shifts: Shift[]
  onAddShift?: (date: Date, type?: string) => void
  onEditShift?: (shift: Shift) => void
  onDeleteShift?: (shiftId: number) => void
}

export function DayDetailsModal({
  isOpen,
  onClose,
  date,
  shifts,
  onAddShift,
  onEditShift,
  onDeleteShift
}: DayDetailsModalProps) {
  // Group shifts by type/time period
  const groupShiftsByPeriod = (shifts: Shift[]) => {
    const morning: Shift[] = []
    const afternoon: Shift[] = []
    const night: Shift[] = []
    
    shifts.forEach(shift => {
      const startHour = new Date(shift.startsAt).getHours()
      
      if (shift.type) {
        switch (shift.type) {
          case 'morning':
            morning.push(shift)
            break
          case 'afternoon':
            afternoon.push(shift)
            break
          case 'night':
            night.push(shift)
            break
        }
      } else {
        // Auto-detect based on time
        if (startHour >= 6 && startHour < 14) {
          morning.push(shift)
        } else if (startHour >= 14 && startHour < 22) {
          afternoon.push(shift)
        } else {
          night.push(shift)
        }
      }
    })
    
    return { morning, afternoon, night }
  }
  
  const { morning, afternoon, night } = groupShiftsByPeriod(shifts)
  
  const ShiftPeriodCard = ({ 
    title, 
    icon, 
    shifts, 
    periodType,
    color 
  }: { 
    title: string
    icon: React.ReactNode
    shifts: Shift[]
    periodType: string
    color: string
  }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", color)}>
              {icon}
            </div>
            <span>{title}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddShift?.(date, periodType)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No shifts scheduled
          </p>
        ) : (
          <div className="space-y-2">
            {shifts.map(shift => (
              <div
                key={shift.id}
                className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
                onClick={() => onEditShift?.(shift)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={shift.crewMember.avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {shift.crewMember.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {shift.crewMember.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(shift.startsAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {new Date(shift.endsAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {shift.crewMember.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Shifts</p>
                    <p className="text-2xl font-bold">{shifts.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Crew on Duty</p>
                    <p className="text-2xl font-bold">
                      {new Set(shifts.map(s => s.crewMember.id)).size}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage</p>
                    <p className="text-2xl font-bold">
                      {Math.round((shifts.length / 24) * 100)}%
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/20" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Shift Periods */}
          <div className="grid grid-cols-3 gap-4">
            <ShiftPeriodCard
              title="Morning Shift"
              icon={<Sunrise className="h-4 w-4" />}
              shifts={morning}
              periodType="morning"
              color="bg-orange-100 text-orange-600"
            />
            
            <ShiftPeriodCard
              title="Afternoon Shift"
              icon={<Sun className="h-4 w-4" />}
              shifts={afternoon}
              periodType="afternoon"
              color="bg-blue-100 text-blue-600"
            />
            
            <ShiftPeriodCard
              title="Night Shift"
              icon={<Moon className="h-4 w-4" />}
              shifts={night}
              periodType="night"
              color="bg-indigo-100 text-indigo-600"
            />
          </div>
          
          {/* Department Distribution */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Department Distribution</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                shifts.reduce((acc, shift) => {
                  const dept = shift.crewMember.department || 'Other'
                  acc[dept] = (acc[dept] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([dept, count]) => (
                <Badge key={dept} variant="secondary">
                  {dept}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}