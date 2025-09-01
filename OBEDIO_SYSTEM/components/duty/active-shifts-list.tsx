'use client'

import React from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { sr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, UserCheck, AlertCircle, LogOut } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useEventSource } from '@/hooks/useEventSource'
import { SSE_EVENTS } from '@/lib/sseEmitter'

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
}

interface User {
  id: number
  name: string
  role: string
}

interface ActiveShiftsListProps {
  shifts: Shift[]
  availableUsers: User[]
  onRefresh: () => void
}

export function ActiveShiftsList({ shifts, availableUsers, onRefresh }: ActiveShiftsListProps) {
  const [activeShifts, setActiveShifts] = React.useState<Shift[]>(shifts)
  const [selectedUserId, setSelectedUserId] = React.useState<string>('')
  const [transferNotes, setTransferNotes] = React.useState<string>('')
  const [endingShift, setEndingShift] = React.useState<Shift | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const { toast } = useToast()

  // Pratite SSE događaje za ažuriranje smena
  useEventSource<any>(
    SSE_EVENTS.SHIFT_UPDATE,
    (data: any) => {
      if (data.action === 'STARTED') {
        // Dodaj novu smenu
        const newShift: Shift = {
          id: data.shiftId,
          userId: data.userId,
          startTime: data.startTime,
          endTime: null,
          status: 'ACTIVE',
          user: {
            id: data.userId,
            name: data.userName,
            role: 'CREW'  // Default, možda ažurirati kasnije
          }
        }
        
        setActiveShifts(prev => [newShift, ...prev])
      } else if (data.action === 'ENDED') {
        // Ukloni završenu smenu
        setActiveShifts(prev => prev.filter(shift => shift.id !== data.shiftId))
      }
    }
  )

  // Funkcija za završavanje smene
  const handleEndShift = async () => {
    if (!endingShift) return
    
    setLoading(true)
    
    try {
      const payload: any = {
        action: 'end'
      }
      
      // Ako je izabran korisnik za prebacivanje zahteva
      if (selectedUserId) {
        payload.transferRequestsTo = selectedUserId
        payload.transferNotes = transferNotes
      }
      
      const response = await fetch(`/api/shifts/${endingShift.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error('Nije moguće završiti smenu')
      }
      
      toast({
        title: 'Smena završena',
        description: `Smena za korisnika ${endingShift.user.name} je uspešno završena.`,
        duration: 3000
      })
      
      // Resetujte dijalog i osvežite listu
      setSelectedUserId('')
      setTransferNotes('')
      setEndingShift(null)
      onRefresh()
    } catch (error) {
      console.error('Greška pri završavanju smene:', error)
      toast({
        title: 'Greška',
        description: 'Nije moguće završiti smenu. Pokušajte ponovo.',
        variant: 'destructive',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  // Ako nema aktivnih smena, prikaži odgovarajuću poruku
  if (activeShifts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivne smene</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nema aktivnih smena</h3>
          <p className="text-muted-foreground">
            Trenutno nema članova posade u aktivnoj smeni.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Aktivne smene ({activeShifts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {activeShifts.map(shift => (
              <div key={shift.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium flex items-center">
                      <UserCheck className="h-4 w-4 mr-2 text-primary" />
                      {shift.user.name}
                      <Badge className="ml-2" variant="outline">
                        {shift.user.role}
                      </Badge>
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Počela{' '}
                      <span className="font-medium ml-1">
                        {formatDistanceToNow(new Date(shift.startTime), { addSuffix: true, locale: sr })}
                      </span>
                      {' '} • {format(new Date(shift.startTime), 'HH:mm', { locale: sr })}
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEndingShift(shift)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Završi smenu
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Završi aktivnu smenu</DialogTitle>
                        <DialogDescription>
                          Završavate aktivnu smenu za korisnika <strong>{endingShift?.user.name}</strong>. 
                          Možete preneti njegove aktivne zahteve drugom članu posade.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="transfer-user">Prenesi aktivne zahteve korisniku (opciono)</Label>
                          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger id="transfer-user">
                              <SelectValue placeholder="Izaberite korisnika" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Bez prenosa zahteva</SelectItem>
                              {availableUsers
                                .filter(user => user.id !== endingShift?.userId)
                                .map(user => (
                                  <SelectItem key={user.id} value={String(user.id)}>
                                    {user.name} ({user.role})
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedUserId && (
                          <div className="space-y-2">
                            <Label htmlFor="transfer-notes">Napomena o prenosu</Label>
                            <Textarea
                              id="transfer-notes"
                              placeholder="Unesite napomenu o prenosu zahteva"
                              value={transferNotes}
                              onChange={(e) => setTransferNotes(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                      
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEndingShift(null)
                            setSelectedUserId('')
                            setTransferNotes('')
                          }}
                        >
                          Odustani
                        </Button>
                        <Button 
                          onClick={handleEndShift}
                          disabled={loading}
                        >
                          {loading ? 'Završavanje...' : 'Završi smenu'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
