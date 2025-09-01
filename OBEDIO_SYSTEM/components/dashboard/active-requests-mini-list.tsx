'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, User, ArrowRight } from 'lucide-react'
import { useEventSource } from '@/hooks/useEventSource'
import { SSE_EVENTS } from '@/lib/sseEmitter'

// Tip za zahtev
export type MiniRequest = {
  id: number
  deviceId: number
  timestamp: string
  status: string
  assignedTo: number | null
  device: {
    name: string
    room: string
  }
  assignedUser?: {
    name: string
  } | null
}

interface ActiveRequestsMiniListProps {
  initialRequests: MiniRequest[]
}

export function ActiveRequestsMiniList({ initialRequests }: ActiveRequestsMiniListProps) {
  const [requests, setRequests] = React.useState<MiniRequest[]>(initialRequests)

  // Pratite SSE događaje za nove i ažurirane zahteve
  useEventSource<any>(
    SSE_EVENTS.NEW_REQUEST,
    (data: any) => {
      // Dodajte novi zahtev na početak liste
      const newRequest: MiniRequest = {
        id: data.requestId,
        deviceId: data.deviceId,
        status: 'PENDING',
        timestamp: data.timestamp,
        assignedTo: null,
        device: {
          name: data.deviceName,
          room: data.room
        }
      }
      
      setRequests(prevList => {
        const newList = [newRequest, ...prevList]
        // Zadržite samo 5 najnovijih zahteva
        return newList.slice(0, 5)
      })
    }
  )

  useEventSource<any>(
    SSE_EVENTS.REQUEST_UPDATE,
    (data: any) => {
      // Ažurirajte postojeći zahtev
      setRequests(prevList => 
        prevList.map(req => 
          req.id === data.requestId 
            ? {
                ...req,
                status: data.status,
                assignedTo: data.assignedTo,
                assignedUser: data.assignedName ? {
                  name: data.assignedName
                } : null
              }
            : req
        )
      )
    }
  )

  // Sortiraj po vremenu, najnoviji prvi
  const sortedRequests = [...requests]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5) // Samo 5 najnovijih

  // Funkcija za prikazivanje statusa
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="mr-1 h-3 w-3" /> Na čekanju
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            <User className="mr-1 h-3 w-3" /> U obradi
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
        <CardTitle className="text-xl">Aktivni zahtevi</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sortedRequests.length === 0 ? (
          <div className="px-6 py-4 text-center text-muted-foreground">
            Trenutno nema aktivnih zahteva
          </div>
        ) : (
          <div className="divide-y">
            {sortedRequests.map(request => (
              <div key={request.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{request.id}</span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {request.device.name} • {request.device.room}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(request.timestamp), { addSuffix: true, locale: sr })}
                  </div>
                </div>
                <div>
                  {request.assignedUser ? (
                    <div className="flex items-center text-sm">
                      <User className="h-3 w-3 mr-1" />
                      {request.assignedUser.name}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/40 px-6 py-3">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/requests/active">
            Prikaži sve aktivne zahteve
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
