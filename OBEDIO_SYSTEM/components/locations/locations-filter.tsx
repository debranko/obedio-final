'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LocationsFilterProps {
  filters: {
    search: string
    type: string
    floor: string
    status: string
  }
  onFilterChange: (filters: {
    search: string
    type: string
    floor: string
    status: string
  }) => void
  floors: string[]
}

export function LocationsFilter({ filters, onFilterChange, floors }: LocationsFilterProps) {
  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      type: 'all',
      floor: 'all',
      status: 'all'
    })
  }

  const hasActiveFilters = filters.search || filters.type !== 'all' || filters.floor !== 'all' || filters.status !== 'all'

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search by room or device name..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      <Select value={filters.type} onValueChange={(value) => onFilterChange({ ...filters, type: value })}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Location Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="deck">Deck</SelectItem>
          <SelectItem value="cabin">Cabin</SelectItem>
          <SelectItem value="common">Common Area</SelectItem>
          <SelectItem value="service">Service Area</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={filters.floor} onValueChange={(value) => onFilterChange({ ...filters, floor: value })}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Floor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Floors</SelectItem>
          {floors.map((floor) => (
            <SelectItem key={floor} value={floor}>
              {floor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(value) => onFilterChange({ ...filters, status: value })}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="online">Online</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
          <SelectItem value="low-battery">Low Battery</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleClearFilters}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}