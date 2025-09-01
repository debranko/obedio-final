'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addDays,
  parseISO
} from 'date-fns'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Users,
  Sun,
  Moon,
  Sunset,
  Plus,
  X
} from 'lucide-react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/components/ui/use-toast'

// Drag item types
const ItemTypes = {
  CREW_MEMBER: 'crewMember',
}

// Define shift times
const SHIFT_TIMES = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  NIGHT: 'night'
}

interface CrewMember {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Shift {
  id: number;
  startsAt: string;
  endsAt: string;
  completed: boolean;
  userId: number;
}

interface DutyAssignment {
  crewId: number;
  shift: 'morning' | 'afternoon' | 'night';
}

interface EnhancedDutyCalendarProps {
  crew: CrewMember[];
  shifts: Shift[];
  onAssignShift?: (userId: number, date: Date, shiftType: string) => Promise<void>;
  onRemoveShift?: (shiftId: number) => Promise<void>;
}

export function EnhancedDutyCalendar({ 
  crew, 
  shifts,
  onAssignShift,
  onRemoveShift
}: EnhancedDutyCalendarProps) {
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>(['All Crew'])
  const [dutyAssignments, setDutyAssignments] = useState<Record<string, DutyAssignment[]>>({})
  const [showSidebar, setShowSidebar] = useState(true)
  const [activeTab, setActiveTab] = useState('monthly')
  const [currentView, setCurrentView] = useState('calendar') // 'calendar' or 'detail'

  // Department grouping
  const departments = useMemo(() => {
    const deptMap: Record<string, CrewMember[]> = {
      'All Crew': crew
    }
    
    // Group crew by role
    crew.forEach(member => {
      if (!deptMap[member.role]) {
        deptMap[member.role] = []
      }
      deptMap[member.role].push(member)
    })
    
    return deptMap
  }, [crew])

  // Navigation handlers
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Generate days for the current month view
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [currentMonth])

  // Convert shifts data to internal duty assignments format
  useEffect(() => {
    const assignments: Record<string, DutyAssignment[]> = {}
    
    shifts.forEach(shift => {
      const shiftStart = parseISO(shift.startsAt)
      const shiftEnd = parseISO(shift.endsAt)
      
      // Skip completed shifts
      if (shift.completed) return
      
      // Determine shift type based on start time
      const hour = shiftStart.getHours()
      let shiftType: 'morning' | 'afternoon' | 'night'
      
      if (hour >= 6 && hour < 14) {
        shiftType = 'morning'
      } else if (hour >= 14 && hour < 22) {
        shiftType = 'afternoon'
      } else {
        shiftType = 'night'
      }
      
      // Add to assignments using date string as key
      const dateString = format(shiftStart, 'yyyy-MM-dd')
      if (!assignments[dateString]) {
        assignments[dateString] = []
      }
      
      assignments[dateString].push({
        crewId: shift.userId,
        shift: shiftType
      })
    })
    
    setDutyAssignments(assignments)
  }, [shifts])

  // Toggle department expansion
  const toggleDepartment = (department: string) => {
    setExpandedDepartments(prev => 
      prev.includes(department)
        ? prev.filter(d => d !== department)
        : [...prev, department]
    )
  }

  // Get crew on duty for a specific date and shift
  const getCrewOnDuty = (date: Date, shiftType?: string) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const assignments = dutyAssignments[dateString] || []
    
    if (shiftType) {
      return assignments
        .filter(a => a.shift === shiftType)
        .map(a => {
          const member = crew.find(c => c.id === a.crewId)
          return member ? { ...member, shift: a.shift } : null
        })
        .filter(Boolean) as (CrewMember & { shift: string })[]
    }
    
    return assignments
      .map(a => {
        const member = crew.find(c => c.id === a.crewId)
        return member ? { ...member, shift: a.shift } : null
      })
      .filter(Boolean) as (CrewMember & { shift: string })[]
  }

  // Handle date selection
  const handleDateClick = (date: Date) => {
    setSelectedDate(prev => isSameDay(prev || new Date(0), date) ? null : date)
    setCurrentView('detail')
  }

  // Handle assigning crew to a shift
  const handleAssignToShift = async (crewId: number, date: Date, shiftType: string) => {
    try {
      // Call the API to create a shift if callback is provided
      if (onAssignShift) {
        await onAssignShift(crewId, date, shiftType)
        toast({
          title: "Success",
          description: "Shift assigned successfully",
        })
      } else {
        // For demo purposes without API
        const dateString = format(date, 'yyyy-MM-dd')
        setDutyAssignments(prev => {
          const current = prev[dateString] || []
          // Remove any existing assignment for this crew member on this date with this shift
          const filtered = current.filter(a => !(a.crewId === crewId && a.shift === shiftType))
          return {
            ...prev,
            [dateString]: [...filtered, { crewId, shift: shiftType as 'morning' | 'afternoon' | 'night' }]
          }
        })
        
        toast({
          title: "Success",
          description: "Shift assigned successfully (demo mode)",
        })
      }
    } catch (error) {
      console.error('Error assigning shift:', error)
      toast({
        title: "Error",
        description: "Failed to assign shift",
        variant: "destructive"
      })
    }
  }

  // Handle removing crew from a shift
  const handleRemoveFromShift = async (crewId: number, date: Date, shiftType: string) => {
    try {
      // Call the API to remove the shift if callback is provided
      if (onRemoveShift) {
        // Find the shift ID
        const dateString = format(date, 'yyyy-MM-dd')
        const shiftToRemove = shifts.find(s => {
          const shiftStart = parseISO(s.startsAt)
          return s.userId === crewId && format(shiftStart, 'yyyy-MM-dd') === dateString
        })
        
        if (shiftToRemove) {
          await onRemoveShift(shiftToRemove.id)
          toast({
            title: "Success",
            description: "Shift removed successfully",
          })
        }
      } else {
        // For demo purposes without API
        const dateString = format(date, 'yyyy-MM-dd')
        setDutyAssignments(prev => {
          const current = prev[dateString] || []
          return {
            ...prev,
            [dateString]: current.filter(a => !(a.crewId === crewId && a.shift === shiftType))
          }
        })
        
        toast({
          title: "Success",
          description: "Shift removed successfully (demo mode)",
        })
      }
    } catch (error) {
      console.error('Error removing shift:', error)
      toast({
        title: "Error",
        description: "Failed to remove shift",
        variant: "destructive"
      })
    }
  }

  // Draggable Crew Member Component
  const CrewMemberItem = ({ member }: { member: CrewMember }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.CREW_MEMBER,
      item: { id: member.id },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }))

    return (
      <div
        ref={drag}
        className={`flex items-center p-2 rounded-md border mb-2 cursor-move 
          ${isDragging ? 'opacity-50 border-dashed' : 'border-solid'}
          hover:border-primary transition-colors`}
      >
        <Avatar className="h-8 w-8 mr-2">
          {member.avatar ? (
            <AvatarImage src={member.avatar} alt={member.name} />
          ) : (
            <AvatarFallback>
              {member.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="text-sm font-medium">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.role}</p>
        </div>
      </div>
    )
  }

  // Department Section Component
  const DepartmentSection = ({
    title,
    children,
    isExpanded,
    onToggle,
  }: {
    title: string
    children: React.ReactNode
    isExpanded: boolean
    onToggle: () => void
  }) => {
    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle} className="mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 border-b">
          <span className="font-medium">{title}</span>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronLeft className="h-4 w-4" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          {children}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Droppable Calendar Cell for a specific shift
  const ShiftDropZone = ({ 
    day, 
    shift,
    icon,
    crewOnDuty 
  }: { 
    day: Date; 
    shift: 'morning' | 'afternoon' | 'night';
    icon: React.ReactNode;
    crewOnDuty: (CrewMember & { shift: string })[];
  }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.CREW_MEMBER,
      drop: (item: { id: number }) => {
        handleAssignToShift(item.id, day, shift)
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }))

    return (
      <div
        ref={drop}
        className={`p-1 rounded-md border min-h-[40px]
          ${isOver ? 'border-primary bg-primary/10' : 'border-dashed'}
        `}
      >
        <div className="flex items-center gap-1 mb-1">
          {icon}
          <span className="text-xs font-medium">{shift.charAt(0).toUpperCase() + shift.slice(1)}</span>
        </div>
        
        {crewOnDuty.length > 0 ? (
          <div className="space-y-1">
            {crewOnDuty.map(member => (
              <div key={member.id} className="flex items-center justify-between bg-card text-card-foreground rounded p-1 text-xs">
                <div className="flex items-center">
                  <Avatar className="h-4 w-4 mr-1">
                    {member.avatar ? (
                      <AvatarImage src={member.avatar} alt={member.name} />
                    ) : (
                      <AvatarFallback className="text-[8px]">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="truncate max-w-[60px]">{member.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4"
                  onClick={() => handleRemoveFromShift(member.id, day, shift)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Drop here</span>
          </div>
        )}
      </div>
    )
  }

  // Droppable Calendar Cell
  const CalendarCell = ({ day }: { day: Date }) => {
    const dateString = format(day, 'yyyy-MM-dd')
    const assignments = dutyAssignments[dateString] || []
    
    const isCurrentMonth = isSameMonth(day, currentMonth)
    const isCurrentDay = isToday(day)
    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
    
    // Get crew on duty for each shift
    const morningCrew = getCrewOnDuty(day, SHIFT_TIMES.MORNING)
    const afternoonCrew = getCrewOnDuty(day, SHIFT_TIMES.AFTERNOON)
    const nightCrew = getCrewOnDuty(day, SHIFT_TIMES.NIGHT)
    
    const totalCrewOnDuty = assignments.length
    
    return (
      <div 
        className={`
          min-h-24 border rounded-md p-1
          ${isCurrentMonth ? 'bg-card' : 'bg-muted/50'}
          ${isCurrentDay ? 'border-primary' : ''}
          ${isSelected ? 'ring-2 ring-primary' : ''}
          ${!isCurrentMonth ? 'opacity-50' : ''}
          cursor-pointer
        `}
        onClick={() => handleDateClick(day)}
      >
        <div className="flex justify-between items-start mb-1">
          <div className={`
            text-sm font-medium p-1 rounded-full w-6 h-6 flex items-center justify-center
            ${isCurrentDay ? 'bg-primary text-primary-foreground' : ''}
          `}>
            {format(day, 'd')}
          </div>
          
          {totalCrewOnDuty > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalCrewOnDuty}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          <ShiftDropZone 
            day={day} 
            shift={SHIFT_TIMES.MORNING} 
            icon={<Sun className="h-3 w-3 text-yellow-500" />}
            crewOnDuty={morningCrew}
          />
          <ShiftDropZone 
            day={day} 
            shift={SHIFT_TIMES.AFTERNOON} 
            icon={<Sunset className="h-3 w-3 text-orange-500" />}
            crewOnDuty={afternoonCrew}
          />
          <ShiftDropZone 
            day={day} 
            shift={SHIFT_TIMES.NIGHT} 
            icon={<Moon className="h-3 w-3 text-blue-500" />}
            crewOnDuty={nightCrew}
          />
        </div>
      </div>
    )
  }

  // Detailed view of a day's schedule
  const DateDetailView = () => {
    if (!selectedDate) return null
    
    const morningCrew = getCrewOnDuty(selectedDate, SHIFT_TIMES.MORNING)
    const afternoonCrew = getCrewOnDuty(selectedDate, SHIFT_TIMES.AFTERNOON)
    const nightCrew = getCrewOnDuty(selectedDate, SHIFT_TIMES.NIGHT)
    
    return (
      <Card className="mt-4">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              {format(selectedDate, 'MMMM d, yyyy')} - Duty Schedule
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentView('calendar')}>
                Back to Calendar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                Close
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="morning">
            <TabsList className="w-full">
              <TabsTrigger value="morning" className="flex-1">
                <Sun className="mr-2 h-4 w-4 text-yellow-500" />
                Morning Shift
              </TabsTrigger>
              <TabsTrigger value="afternoon" className="flex-1">
                <Sunset className="mr-2 h-4 w-4 text-orange-500" />
                Afternoon Shift
              </TabsTrigger>
              <TabsTrigger value="night" className="flex-1">
                <Moon className="mr-2 h-4 w-4 text-blue-500" />
                Night Shift
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="morning">
              {morningCrew.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No crew assigned for morning shift</p>
                  <p className="text-xs text-muted-foreground mt-2">Drag crew members from the sidebar to assign</p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {morningCrew.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {member.avatar ? (
                            <AvatarImage src={member.avatar} alt={member.name} />
                          ) : (
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveFromShift(member.id, selectedDate, SHIFT_TIMES.MORNING)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="afternoon">
              {afternoonCrew.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No crew assigned for afternoon shift</p>
                  <p className="text-xs text-muted-foreground mt-2">Drag crew members from the sidebar to assign</p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {afternoonCrew.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {member.avatar ? (
                            <AvatarImage src={member.avatar} alt={member.name} />
                          ) : (
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveFromShift(member.id, selectedDate, SHIFT_TIMES.AFTERNOON)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="night">
              {nightCrew.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No crew assigned for night shift</p>
                  <p className="text-xs text-muted-foreground mt-2">Drag crew members from the sidebar to assign</p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {nightCrew.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {member.avatar ? (
                            <AvatarImage src={member.avatar} alt={member.name} />
                          ) : (
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveFromShift(member.id, selectedDate, SHIFT_TIMES.NIGHT)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex">
        {/* Sidebar with draggable crew members */}
        {showSidebar && (
          <div className="w-64 border-r pr-4 mr-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Crew Members</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSidebar(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-200px)]">
              {/* Departments and crew members */}
              {Object.entries(departments).map(([department, members]) => (
                <DepartmentSection
                  key={department}
                  title={department}
                  isExpanded={expandedDepartments.includes(department)}
                  onToggle={() => toggleDepartment(department)}
                >
                  {members.map(member => (
                    <CrewMemberItem key={member.id} member={member} />
                  ))}
                </DepartmentSection>
              ))}
            </ScrollArea>
          </div>
        )}
        
        {/* Main calendar view */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setShowSidebar(true)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="h-5 w-5" />
                <h3 className="font-medium">Duty Calendar</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <Sun className="h-3 w-3 text-yellow-500" />
              <span>Morning (6-14)</span>
            </div>
            <div className="flex items-center gap-1">
              <Sunset className="h-3 w-3 text-orange-500" />
              <span>Afternoon (14-22)</span>
            </div>
            <div className="flex items-center gap-1">
              <Moon className="h-3 w-3 text-blue-500" />
              <span>Night (22-6)</span>
            </div>
          </div>
          
          {currentView === 'calendar' ? (
            <>
              {/* Calendar Day Headers */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Cells */}
                {days.map(day => (
                  <CalendarCell key={day.toString()} day={day} />
                ))}
              </div>
            </>
          ) : (
            <DateDetailView />
          )}
        </div>
      </div>
    </DndProvider>
  )
}
