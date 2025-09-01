"use client"

import { useState, useMemo } from "react"
import { Calendar, ChevronLeft, ChevronRight, Plus, Users } from "lucide-react"
import { addMonths, format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CrewMember {
  id: number;
  name: string;
  email?: string;
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

interface DutyCalendarProps {
  crew: CrewMember[];
  shifts: Shift[];
}

export function DutyCalendar({ crew, shifts }: DutyCalendarProps) {
  // Basic state for the calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Simple navigation functions that won't cause render issues
  const previousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  
  // Use useMemo to prevent recalculation of days on each render
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);
  
  // Simple utility function to get count of shifts for a date
  const getShiftCountForDate = (date: Date): number => {
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.startsAt);
      const shiftEnd = new Date(shift.endsAt);
      return isSameDay(date, shiftStart);
    }).length;
  };
  
  // Calculate empty cells at start of month
  const emptyCellsAtStart = startOfMonth(currentMonth).getDay();
  
  // Calculate empty cells at end of month
  const emptyCellsAtEnd = (7 - ((emptyCellsAtStart + days.length) % 7)) % 7;

  return (
    <div className="space-y-6">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Duty
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-medium text-sm py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before the start of month */}
        {Array.from({ length: emptyCellsAtStart }).map((_, i) => (
          <div key={`empty-start-${i}`} className="h-24 p-1 border rounded-md bg-muted/20"></div>
        ))}

        {/* Calendar days */}
        {days.map((day) => {
          const shiftsCount = getShiftCountForDate(day);
          return (
            <div
              key={day.toString()}
              className={`h-24 p-1 border rounded-md transition-all hover:border-primary
                ${isToday(day) ? "border-primary" : ""}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${isToday(day) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : ""}`}>
                  {format(day, "d")}
                </span>
                {shiftsCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {shiftsCount} on duty
                  </Badge>
                )}
              </div>
              
              {/* Simplified crew list with colored indicators */}
              <div className="mt-2 space-y-1">
                {shifts
                  .filter(shift => isSameDay(day, new Date(shift.startsAt)))
                  .slice(0, 3)
                  .map(shift => {
                    const member = crew.find(m => m.id === shift.userId);
                    if (!member) return null;
                    
                    // Determine shift type by hours
                    const startHour = new Date(shift.startsAt).getHours();
                    const shiftType = startHour < 12 ? "Morning" : startHour < 18 ? "Afternoon" : "Night";
                    
                    return (
                      <div key={shift.id} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${shiftType === "Morning" ? "bg-blue-500" : 
                                         shiftType === "Afternoon" ? "bg-amber-500" : "bg-indigo-700"}`} />
                        <Avatar className="h-5 w-5 mr-1">
                          <AvatarFallback className="text-[10px]">
                            {member.name?.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                          {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                        </Avatar>
                        <span className="text-xs truncate">{member.name}</span>
                      </div>
                    );
                  }).filter(Boolean)}
              </div>
            </div>
          );
        })}

        {/* Empty cells for days after the end of month */}
        {Array.from({ length: emptyCellsAtEnd }).map((_, i) => (
          <div key={`empty-end-${i}`} className="h-24 p-1 border rounded-md bg-muted/20"></div>
        ))}
      </div>

      {/* Simple summary card with statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Duty Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 grid-cols-3">
            <div className="border rounded-md p-3 text-center">
              <p className="text-3xl font-bold">{shifts.length}</p>
              <p className="text-xs text-muted-foreground">Total Shifts</p>
            </div>
            <div className="border rounded-md p-3 text-center">
              <p className="text-3xl font-bold">{crew.length}</p>
              <p className="text-xs text-muted-foreground">Crew Members</p>
            </div>
            <div className="border rounded-md p-3 text-center">
              <p className="text-3xl font-bold">
                {shifts.filter(s => isToday(new Date(s.startsAt))).length}
              </p>
              <p className="text-xs text-muted-foreground">Today's Shifts</p>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Shift Types</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Morning</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Afternoon</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-indigo-700" />
                <span>Night</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
