import React from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, PlusCircle, Filter } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RequestsHeaderProps {
  refreshRequests: () => void
  totalRequests: number
  pendingRequests: number
  inProgressRequests: number
  filterStatus: string
  setFilterStatus: (status: string) => void
}

export function RequestsHeader({
  refreshRequests,
  totalRequests,
  pendingRequests,
  inProgressRequests,
  filterStatus,
  setFilterStatus
}: RequestsHeaderProps) {
  const { toast } = useToast()

  const handleRefresh = () => {
    refreshRequests()
    toast({
      description: 'Lista zahteva osvežena.',
      duration: 2000,
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aktivni zahtevi</h1>
        <p className="text-muted-foreground">
          Ukupno: {totalRequests} &bull; Na čekanju: {pendingRequests} &bull; U obradi: {inProgressRequests}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4" />
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Svi zahtevi</SelectItem>
              <SelectItem value="PENDING">Na čekanju</SelectItem>
              <SelectItem value="IN_PROGRESS">U obradi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Osveži
        </Button>
      </div>
    </div>
  )
}
