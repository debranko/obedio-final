import React from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RequestRow } from './request-row'
import { useEventSource } from '@/hooks/useEventSource'
import { SSE_EVENTS } from '@/lib/sseEmitter'

export type Request = {
  id: number
  deviceId: number
  timestamp: string
  status: string
  assignedTo: number | null
  device: {
    id: number
    name: string
    room: string
  }
  assignedUser?: {
    id: number
    name: string
  } | null
}

interface RequestTableProps {
  requests: Request[]
  onRefresh: () => void
  filterStatus: string
}

export function RequestTable({ requests, onRefresh, filterStatus }: RequestTableProps) {
  const [requestList, setRequestList] = React.useState<Request[]>(requests)

  // Primeniti filter
  const filteredRequests = React.useMemo(() => {
    if (filterStatus === 'ALL') return requestList
    return requestList.filter(request => request.status === filterStatus)
  }, [requestList, filterStatus])

  // Pratite SSE događaje za nove i ažurirane zahteve
  useEventSource<any>(
    SSE_EVENTS.NEW_REQUEST,
    (data: any) => {
      // Dodajte novi zahtev na početak liste
      const newRequest: Request = {
        id: data.requestId,
        deviceId: data.deviceId,
        status: 'PENDING',
        timestamp: data.timestamp,
        assignedTo: null,
        device: {
          id: data.deviceId,
          name: data.deviceName,
          room: data.room
        }
      }
      
      setRequestList(prevList => [newRequest, ...prevList])
    }
  )

  useEventSource<any>(
    SSE_EVENTS.REQUEST_UPDATE,
    (data: any) => {
      // Ažurirajte postojeći zahtev
      setRequestList(prevList => 
        prevList.map(req => 
          req.id === data.requestId 
            ? {
                ...req,
                status: data.status,
                assignedTo: data.assignedTo,
                assignedUser: data.assignedName ? {
                  id: data.assignedTo,
                  name: data.assignedName
                } : null
              }
            : req
        )
      )
    }
  )

  // Sortiraj po vremenu, najnoviji prvi
  const sortedRequests = [...filteredRequests].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Ako nema zahteva, prikaži poruku
  if (sortedRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium mb-2">Nema aktivnih zahteva</h3>
        <p className="text-muted-foreground mb-4">
          {filterStatus !== 'ALL'
            ? `Nema zahteva sa statusom "${filterStatus === 'PENDING' ? 'Na čekanju' : 'U obradi'}"`
            : 'Trenutno nema aktivnih zahteva'}
        </p>
        <Button variant="outline" onClick={onRefresh}>
          Osveži listu
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uređaj</TableHead>
            <TableHead>Prostorija</TableHead>
            <TableHead>Vreme</TableHead>
            <TableHead>Dodeljeno</TableHead>
            <TableHead className="text-right">Akcije</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRequests.map((request) => (
            <RequestRow 
              key={request.id} 
              request={request} 
              onRefresh={onRefresh}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
