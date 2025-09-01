'use client'

import React from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Clock, 
  User, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle 
} from 'lucide-react'

interface Shift {
  id: number
  userId: number
  startTime: string
  endTime: string | null
  status: string
  user: {
    id: number
    name: string
    role: string
  }
  durationMinutes?: number
}

interface ShiftsHistoryProps {
  shifts: Shift[]
  onViewDetails?: (shift: Shift) => void
}

export function ShiftsHistory({ shifts, onViewDetails }: ShiftsHistoryProps) {
  // Priprema podataka - dodavanje izračunatog trajanja
  const processedShifts = shifts.map(shift => {
    const startDate = new Date(shift.startTime)
    const endDate = shift.endTime ? new Date(shift.endTime) : new Date()
    const durationMs = endDate.getTime() - startDate.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))
    
    return {
      ...shift,
      durationMinutes
    }
  })

  // Pomoćna funkcija za formatiranje trajanja
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) {
      return `${mins} min`
    }
    
    return `${hours}h ${mins}min`
  }

  // Pomoćna funkcija za dobijanje boje badge-a na osnovu statusa
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <Clock className="mr-1 h-3 w-3" /> Aktivna
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            <CheckCircle className="mr-1 h-3 w-3" /> Završena
          </Badge>
        )
      case 'CANCELED':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="mr-1 h-3 w-3" /> Otkazana
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Istorija smena</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {processedShifts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Nema istorije smena za prikaz.</p>
          </div>
        ) : (
          <div className="divide-y">
            {processedShifts.map(shift => (
              <div key={shift.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">{shift.user.name}</span>
                      {getStatusBadge(shift.status)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(shift.startTime), 'dd.MM.yyyy.', { locale: sr })}</span>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>
                        {format(new Date(shift.startTime), 'HH:mm', { locale: sr })}
                        {shift.endTime && ` - ${format(new Date(shift.endTime), 'HH:mm', { locale: sr })}`}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {shift.status === 'COMPLETED' 
                        ? `Trajanje: ${formatDuration(shift.durationMinutes || 0)}`
                        : shift.status === 'ACTIVE'
                          ? `Aktivna ${formatDistanceToNow(new Date(shift.startTime), { locale: sr })}`
                          : `Status: ${shift.status}`
                      }
                    </div>
                  </div>
                  
                  {onViewDetails && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(shift)}>
                          Prikaži detalje
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
