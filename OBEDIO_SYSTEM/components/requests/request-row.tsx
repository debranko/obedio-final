import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { sr } from 'date-fns/locale'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Check, X, AlertCircle, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { Request } from './request-table'

interface RequestRowProps {
  request: Request
  onRefresh: () => void
}

export function RequestRow({ request, onRefresh }: RequestRowProps) {
  const { toast } = useToast()
  const router = useRouter()
  
  // Formatiranje vremena
  const formattedTime = formatDistanceToNow(new Date(request.timestamp), {
    addSuffix: true,
    locale: sr
  })

  // Status badge varijanta i tekst
  const getStatusBadge = () => {
    switch (request.status) {
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
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <Check className="mr-1 h-3 w-3" /> Završeno
          </Badge>
        )
      case 'CANCELED':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <X className="mr-1 h-3 w-3" /> Otkazano
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" /> {request.status}
          </Badge>
        )
    }
  }

  // Prihvatanje zahteva - dodela sebi
  const handleAccept = async () => {
    try {
      const response = await fetch(`/api/requests/${request.id}/accept`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Nije moguće prihvatiti zahtev')
      }
      
      toast({
        title: 'Zahtev prihvaćen',
        description: `Zahtev #${request.id} je dodeljen vama.`,
        duration: 3000,
      })
      
      onRefresh()
    } catch (error) {
      console.error('Greška pri prihvatanju zahteva:', error)
      toast({
        title: 'Greška',
        description: 'Nije moguće prihvatiti zahtev. Pokušajte ponovo.',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }
  
  // Označavanje zahteva kao završenog
  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/requests/${request.id}/complete`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Nije moguće završiti zahtev')
      }
      
      toast({
        title: 'Zahtev završen',
        description: `Zahtev #${request.id} je označen kao završen.`,
        duration: 3000,
      })
      
      onRefresh()
    } catch (error) {
      console.error('Greška pri završavanju zahteva:', error)
      toast({
        title: 'Greška',
        description: 'Nije moguće završiti zahtev. Pokušajte ponovo.',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }
  
  return (
    <TableRow>
      <TableCell className="font-medium">#{request.id}</TableCell>
      <TableCell>{getStatusBadge()}</TableCell>
      <TableCell>{request.device.name}</TableCell>
      <TableCell>{request.device.room}</TableCell>
      <TableCell title={new Date(request.timestamp).toLocaleString()}>
        {formattedTime}
      </TableCell>
      <TableCell>
        {request.assignedUser ? (
          <span className="flex items-center">
            <User className="mr-1 h-3 w-3" />
            {request.assignedUser.name}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {request.status === 'PENDING' && (
          <Button variant="outline" size="sm" onClick={handleAccept}>
            <User className="mr-1 h-4 w-4" />
            Preuzmi
          </Button>
        )}
        {request.status === 'IN_PROGRESS' && (
          <Button variant="outline" size="sm" onClick={handleComplete}>
            <Check className="mr-1 h-4 w-4" />
            Završi
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
