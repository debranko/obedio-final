"use client"

import { useState, useEffect, useMemo } from 'react'
import { PlusCircle, Search, Filter, SlidersHorizontal, UserPlus, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useMediaQuery } from '@/hooks/use-media-query'

import GuestCard, { GuestPreferences } from '@/components/guests/guest-card'
import { ChangeCabinModal } from '@/components/guests/change-cabin-modal'

// Type definitions for improved TypeScript safety
export interface Guest {
  id: number
  name: string
  room: string | null
  status: string
  isVip: boolean
  guestType: "Owner" | "Guest" | "Family" | "Staff" | "Charter"
  imageUrl?: string | null
  partySize: number
  arrivalDate: string
  departureDate: string
  notes?: string | null
  assignedCrew?: string | null
  location?: string | null
  nationality?: string | null
  languagesSpoken: string[]
  tags: string[]
  preferences: GuestPreferences
  serviceRequests?: any[]
  broker?: string | null
}

export default function RedesignedGuestsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // State
  const [loading, setLoading] = useState(true)
  const [guests, setGuests] = useState<Guest[]>([])
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  
  // Modals
  const [changeCabinGuestId, setChangeCabinGuestId] = useState<number | null>(null)
  
  // Current vs upcoming guests
  const currentDate = new Date()
  
  // Fetch guests data
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/guests')
        
        if (!response.ok) {
          throw new Error('Failed to fetch guests')
        }
        
        const data = await response.json()
        
        // Ensure all guests have properly initialized arrays
        const processedData = data.map((guest: any) => ({
          ...guest,
          languagesSpoken: guest.languagesSpoken || [],
          tags: guest.tags || [],
          preferences: {
            food: guest.preferences?.food || [],
            drinks: guest.preferences?.drinks || [],
            allergies: guest.preferences?.allergies || [],
            roomTemperature: guest.preferences?.roomTemperature || 22,
            cleaningTime: guest.preferences?.cleaningTime || "Morning",
            dndActive: guest.preferences?.dndActive || false,
            dndLocations: guest.preferences?.dndLocations || []
          }
        }))
        
        setGuests(processedData)
        setError(null)
      } catch (err) {
        console.error("Error fetching guests:", err)
        setError("Failed to load guest data. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load guests data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchGuests()
  }, [toast])
  
  // Apply filters
  useEffect(() => {
    let result = [...guests]
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(guest => {
        return (
          guest.name.toLowerCase().includes(lowerSearchTerm) ||
          (guest.room && guest.room.toLowerCase().includes(lowerSearchTerm)) ||
          (guest.nationality && guest.nationality.toLowerCase().includes(lowerSearchTerm)) ||
          // Search in allergies and preferences
          (guest.preferences?.allergies && guest.preferences.allergies.some(allergy => 
            allergy.toLowerCase().includes(lowerSearchTerm)
          )) ||
          // Search in languages
          (guest.languagesSpoken && guest.languagesSpoken.some(language => 
            language.toLowerCase().includes(lowerSearchTerm)
          ))
        )
      })
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(guest => 
        guest.status.toLowerCase() === statusFilter.toLowerCase()
      )
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(guest => 
        guest.guestType.toLowerCase() === typeFilter.toLowerCase()
      )
    }
    
    setFilteredGuests(result)
  }, [guests, searchTerm, statusFilter, typeFilter])
  
  // Split guests into current and upcoming
  const currentGuests = useMemo(() => {
    return filteredGuests.filter(guest => {
      const arrivalDate = new Date(guest.arrivalDate)
      const departureDate = new Date(guest.departureDate)
      return arrivalDate <= currentDate && departureDate >= currentDate
    })
  }, [filteredGuests, currentDate])
  
  const upcomingGuests = useMemo(() => {
    return filteredGuests.filter(guest => {
      const arrivalDate = new Date(guest.arrivalDate)
      return arrivalDate > currentDate
    })
  }, [filteredGuests, currentDate])
  
  // Guest operations
  const handleUpdateGuest = async (id: number, data: any) => {
    try {
      const response = await fetch('/api/guests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update guest')
      }
      
      const updatedGuest = await response.json()
      
      // Update local state
      setGuests(prev => 
        prev.map(guest => 
          guest.id === id ? { ...guest, ...updatedGuest } : guest
        )
      )
      
      toast({
        title: "Success",
        description: "Guest updated successfully",
      })
      
      return true
    } catch (err) {
      console.error("Error updating guest:", err)
      toast({
        title: "Error",
        description: "Failed to update guest",
        variant: "destructive",
      })
      return false
    }
  }
  
  const handleCheckOut = async (id: number) => {
    try {
      const success = await handleUpdateGuest(id, { status: "Checked-Out" })
      if (success) {
        toast({
          title: "Success",
          description: "Guest checked out successfully",
        })
      }
    } catch (err) {
      console.error("Error checking out guest:", err)
      toast({
        title: "Error",
        description: "Failed to check out guest",
        variant: "destructive",
      })
    }
  }
  
  const handleChangeCabin = (id: number) => {
    setChangeCabinGuestId(id)
  }
  
  const handleChangeCabinSubmit = async (guestId: number, newRoom: string) => {
    try {
      const success = await handleUpdateGuest(guestId, { room: newRoom })
      if (success) {
        setChangeCabinGuestId(null)
        toast({
          title: "Room Updated",
          description: `Guest has been moved to ${newRoom}`,
        })
      }
    } catch (err) {
      console.error("Error changing cabin:", err)
      toast({
        title: "Error",
        description: "Failed to change guest's cabin",
        variant: "destructive",
      })
    }
  }
  
  const handleDeleteGuest = async (id: number) => {
    try {
      const response = await fetch(`/api/guests?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete guest')
      }
      
      // Update local state
      setGuests(prev => prev.filter(guest => guest.id !== id))
      
      toast({
        title: "Success",
        description: "Guest deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting guest:", err)
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive",
      })
    }
  }
  
  // Statistics for dashboard
  const totalGuests = filteredGuests.length
  const vipCount = filteredGuests.filter(g => g.isVip).length
  const currentGuestCount = currentGuests.length
  const upcomingGuestCount = upcomingGuests.length
  const allergiesCount = filteredGuests.filter(g => 
    g.preferences?.allergies && g.preferences.allergies.length > 0
  ).length
  
  // Component for rendering guest list
  const GuestsList = ({ guests }: { guests: Guest[] }) => {
    if (guests.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          No guests found. Adjust your filters or add new guests.
        </div>
      )
    }
    
    return (
      <div className="space-y-4 pb-4">
        {guests.map(guest => (
          <GuestCard
            key={guest.id}
            id={guest.id}
            name={guest.name}
            room={guest.room}
            status={guest.status}
            isVip={guest.isVip}
            guestType={guest.guestType}
            imageUrl={guest.imageUrl}
            partySize={guest.partySize || 1}
            arrivalDate={guest.arrivalDate}
            departureDate={guest.departureDate}
            notes={guest.notes}
            assignedCrew={guest.assignedCrew}
            location={guest.location}
            nationality={guest.nationality}
            languagesSpoken={guest.languagesSpoken || []}
            tags={guest.tags || []}
            preferences={guest.preferences}
            serviceRequests={guest.serviceRequests || []}
            broker={guest.broker}
            onUpdate={async (id, data) => {
              const result = await handleUpdateGuest(id, data);
              return;
            }}
            onCheckOut={handleCheckOut}
            onChangeCabin={async (id) => {
              handleChangeCabin(id);
              return Promise.resolve();
            }}
            onDelete={handleDeleteGuest}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Guests</h1>
          <p className="text-muted-foreground">
            Manage guest profiles and preferences
          </p>
        </div>
        <Button 
          onClick={() => router.push('/guests/add')}
          className="flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </div>
      
      {/* Stats section - Quick overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <p className="text-muted-foreground text-sm">Total Guests</p>
          <h3 className="text-2xl font-bold">{totalGuests}</h3>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <p className="text-muted-foreground text-sm">Current Guests</p>
          <h3 className="text-2xl font-bold">{currentGuestCount}</h3>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <p className="text-muted-foreground text-sm">Upcoming</p>
          <h3 className="text-2xl font-bold">{upcomingGuestCount}</h3>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 shadow-sm border border-amber-200 dark:border-amber-800">
          <p className="text-amber-700 dark:text-amber-400 text-sm">VIP Guests</p>
          <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-400">{vipCount}</h3>
        </div>
      </div>
      
      {/* Alerts section - important information */}
      {allergiesCount > 0 && (
        <Alert className="mb-6 bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            {allergiesCount} {allergiesCount === 1 ? 'guest has' : 'guests have'} dietary restrictions or allergies
          </AlertDescription>
        </Alert>
      )}
      
      {/* Filters section */}
      <div className="mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search guests, allergies, preferences..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="checked-in">Checked In</SelectItem>
              <SelectItem value="checked-out">Checked Out</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="charter">Charter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Main content - guests list */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <Spinner className="mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading guests...</p>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="my-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="current" className="flex-1">
              Current Guests
              <Badge variant="secondary" className="ml-2">{currentGuestCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming Guests
              <Badge variant="secondary" className="ml-2">{upcomingGuestCount}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="current">
            <ScrollArea className="h-[calc(100vh-380px)] pr-4">
              <GuestsList guests={currentGuests} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="upcoming">
            <ScrollArea className="h-[calc(100vh-380px)] pr-4">
              <GuestsList guests={upcomingGuests} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Modals */}
      {changeCabinGuestId !== null && (
        <ChangeCabinModal
          isOpen={changeCabinGuestId !== null}
          onClose={() => setChangeCabinGuestId(null)}
          guest={guests.find(g => g.id === changeCabinGuestId) || null}
          availableRooms={guests.map(g => g.room).filter(Boolean) as string[]}
          allGuests={guests}
          onUpdateRoom={handleChangeCabinSubmit}
        />
      )}
    </div>
  )
}