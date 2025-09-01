'use client'

import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Plus, SlidersHorizontal, Download, RefreshCw } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'

// Custom components and hooks
import { useDevicesNext, RepeaterDevice, StatusFilter, ConnectionFilter, SortOption } from '@/hooks/use-devices-next'
import { RepeaterRowNext } from './repeater-row-next'
import { RepeaterDetails } from './repeater-details'

export function RepeatersListNext() {
  // Use the next-gen hook for repeater devices
  const {
    filteredDevices: repeaters,
    loading,
    filters,
    availableLocations,
    fetchDevices,
    updateFilters,
    resetFilters
  } = useDevicesNext<RepeaterDevice>('REPEATER', {
    statusFilter: 'all',
    connectionTypeFilter: 'all',
    locationFilter: 'all',
    sortBy: 'name'
  });

  // Local state for device details dialog
  const [selectedRepeater, setSelectedRepeater] = useState<RepeaterDevice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

                      <RadioGroupItem value="Ethernet" id="ethernet" />
                      <Label htmlFor="ethernet">Ethernet</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Wi-Fi" id="wifi" />
                      <Label htmlFor="wifi">Wi-Fi</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Location</h3>
                  <Select 
                    value={filters.locationFilter || 'all'} 
                    onValueChange={handleLocationFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {availableLocations.map((location) => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Sort By</h3>
                  <Select 
                    value={filters.sortBy || 'name'} 
                    onValueChange={(value) => handleSortChange(value as SortOption)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="connectedDevices">Connected Devices</SelectItem>
                      <SelectItem value="signal">Signal</SelectItem> {/* Consistent naming: "Signal" not "Signal Strength" */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={handleBulkFirmwareUpdate}>
            <Download className="mr-2 h-4 w-4" />
            Update Firmware
          </Button>
          
          <Button onClick={handleAddRepeater}>
            <Plus className="mr-2 h-4 w-4" />
            Add Repeater
          </Button>
        </div>
      </div>

      {/* Filter Summary */}
      {(filters.statusFilter !== 'all' || filters.connectionTypeFilter !== 'all' || filters.locationFilter !== 'all') && (
        <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-2">
          <span className="mr-1">Filtered by:</span>
          {filters.statusFilter !== 'all' && (
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-xs">
              Status: {filters.statusFilter}
            </span>
          )}
          {filters.connectionTypeFilter !== 'all' && (
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-xs">
              Connection: {filters.connectionTypeFilter}
            </span>
          )}
          {filters.locationFilter !== 'all' && (
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-xs">
              Location: {filters.locationFilter}
            </span>
          )}
        </div>
      )}

      {/* Repeater Table - Note the consistent column name "Signal" */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Connection</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-center">Battery</TableHead>
              <TableHead className="text-center">Signal</TableHead> {/* Consistent naming */}
              <TableHead className="text-center">Devices</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading state with skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 10 }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  ))}
                </TableRow>
              ))
            ) : repeaters.length === 0 ? (
              // No results state
              <TableRow>
                <td colSpan={10} className="h-24 text-center">
                  {filters.searchTerm || filters.statusFilter !== 'all' || filters.connectionTypeFilter !== 'all' || filters.locationFilter !== 'all'
                    ? "No repeaters match the current filters"
                    : "No repeaters found. Add one to get started."}
                </td>
              </TableRow>
            ) : (
              // Results - Using our new improved row component
              repeaters.map((repeater) => (
                <RepeaterRowNext
                  key={repeater.id}
                  repeater={repeater}
                  onViewDetails={() => handleViewDetails(repeater)}
                  formatTimeAgo={formatTimeAgo}
                />
              ))
            )}
          </TableBody>
          {repeaters.length > 0 && (
            <TableCaption>
              Showing {repeaters.length} repeater{repeaters.length !== 1 ? 's' : ''}
            </TableCaption>
          )}
        </Table>
      </div>

      {/* Repeater Details - Using our new improved details component */}
      {selectedRepeater && (
        <RepeaterDetailsNext
          repeater={selectedRepeater}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </div>
  );
}