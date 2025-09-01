"use client"

import { useState, useEffect, useMemo } from 'react'
import { UserPlus, Search, Filter, AlertCircle, X, Camera, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/use-toast'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import { ChangeCabinModal } from '@/components/guests/change-cabin-modal'
import { ImageCapture } from '@/components/ui/image-capture'
import { GuestDetailPanel, GuestPreferences as FixedGuestPreferences } from '@/components/guests/guest-detail-panel-fixed'

// Type definitions
export interface GuestPreferences {
  food: string[]
  drinks: string[]
  allergies: string[]
  roomTemperature: number
  cleaningTime: "Morning" | "Afternoon" | "Evening"
  dndActive: boolean
  dndLocations?: string[]
}

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

// Guest Card Component - Used in the list view
const GuestCard = ({ 
  guest, 
  onSelect,
  onUpdate,
  onCheckOut,
  onChangeCabin,
  onDelete 
}: { 
  guest: Guest
  onSelect: (guest: Guest) => void
  onUpdate: (id: number, data: any) => Promise<boolean>
  onCheckOut: (id: number) => Promise<boolean>
  onChangeCabin: (id: number) => void
  onDelete: (id: number) => Promise<boolean>
}) => {
  const arrivalDate = new Date(guest.arrivalDate)
  const departureDate = new Date(guest.departureDate)
  const daysLeft = Math.ceil((departureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  const hasAllergies = guest.preferences?.allergies && guest.preferences.allergies.length > 0
  
  return (
    <div 
      className="border rounded-lg p-4 bg-card hover:shadow-md transition-all cursor-pointer"
      onClick={() => onSelect(guest)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Avatar className="h-10 w-10 border cursor-pointer">
              {guest.imageUrl ? (
                <AvatarImage src={guest.imageUrl} alt={guest.name} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  {guest.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            {guest.isVip && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                ★
              </span>
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-base">{guest.name}</h3>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <Badge variant="outline" className={
                guest.guestType === "Owner" ? "bg-purple-100 text-purple-800" :
                guest.guestType === "Family" ? "bg-green-100 text-green-800" :
                guest.guestType === "Guest" ? "bg-blue-100 text-blue-800" :
                guest.guestType === "Staff" ? "bg-gray-100 text-gray-800" :
                "bg-amber-100 text-amber-800"
              }>
                {guest.guestType}
              </Badge>
              {guest.room && (
                <span className="text-xs text-muted-foreground">{guest.room}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right text-sm">
          <div className={`font-medium ${daysLeft <= 1 ? 'text-red-500' : ''}`}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Departing today'}
          </div>
          <div className="text-xs text-muted-foreground">
            {departureDate.toLocaleDateString()}
          </div>
        </div>
      </div>
      
      {/* Quick Info - Most important details visible at a glance */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex flex-wrap gap-1.5">
          {/* Nationality */}
          {guest.nationality && (
            <Badge variant="outline" className="bg-gray-50">
              {guest.nationality}
            </Badge>
          )}
          
          {/* Languages */}
          {guest.languagesSpoken && guest.languagesSpoken.slice(0, 2).map(lang => (
            <Badge key={lang} variant="outline" className="bg-blue-50 text-blue-700">
              {lang}
            </Badge>
          ))}
          
          {/* Allergies - High visibility if present */}
          {hasAllergies && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Allergies
            </Badge>
          )}

          {/* Food Preferences */}
          {guest.preferences?.food && guest.preferences.food.length > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Food Preferences
            </Badge>
          )}
          
          {/* Truncated badges indicator if there are more languages or preferences */}
          {((guest.languagesSpoken && guest.languagesSpoken.length > 2) || 
            (guest.preferences?.food && guest.preferences.food.length > 1)) && (
            <Badge variant="outline" className="bg-slate-50">
              <Info className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function SimplifiedChangeCabinModal({
  isOpen,
  guest,
  onConfirm,
  onClose,
}: {
  isOpen: boolean
  guest: Guest | null
  onConfirm: (room: string) => Promise<void>
  onClose: () => void
}) {
  // Create mock data for the required props
  const availableRooms = ["Cabin 1", "Cabin 2", "Cabin 3", "Suite 1", "Master Suite"];
  const allGuests: Guest[] = [];
  
  // Adapter function to match the expected interface
  const handleUpdateRoom = (guestId: number, oldRoom: string | null, newRoom: string) => {
    if (guest) onConfirm(newRoom);
  };
  
  return (
    <ChangeCabinModal
      isOpen={isOpen}
      guest={guest}
      availableRooms={availableRooms}
      allGuests={allGuests}
      onUpdateRoom={handleUpdateRoom}
      onClose={onClose}
    />
  )
}

export default function GuestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [expanded, setExpanded] = useState<{[key: number]: boolean}>({})
  
  // Cabin change modal state
  const [showCabinModal, setShowCabinModal] = useState(false)
  const [cabinChangeGuestId, setCabinChangeGuestId] = useState<number | null>(null)

  // Filter guests based on search and filter type
  const filteredGuests = useMemo(() => {
    let result = [...guests]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(guest => 
        guest.name.toLowerCase().includes(query) || 
        guest.nationality?.toLowerCase().includes(query) ||
        (guest.room && guest.room.toLowerCase().includes(query))
      )
    }
    
    if (filterType !== "all") {
      result = result.filter(guest => guest.guestType === filterType)
    }
    
    return result
  }, [guests, searchQuery, filterType])

  // Fetch guests data
  const fetchGuests = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch guests using authenticated API
      const response = await fetch('/api/guests', {
        headers: {
          'x-auth-bypass': 'true'  // Development bypass for authentication
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Ensure dates are properly formatted
      const guestsWithParsedDates = data.map((guest: any) => ({
        ...guest,
        preferences: {
          ...guest.preferences,
          dndLocations: guest.preferences?.dndLocations || []  // Ensure dndLocations is always an array
        }
      }))
      
      setGuests(guestsWithParsedDates)
    } catch (err) {
      console.error("Error loading guests:", err)
      setError("Failed to load guests. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Update guest information
  const handleUpdateGuest = async (id: number, data: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/guests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-bypass': 'true'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Update local state
      setGuests(prevGuests => 
        prevGuests.map(guest => 
          guest.id === id ? { ...guest, ...data } : guest
        )
      )
      
      return true
    } catch (err) {
      console.error("Error updating guest:", err)
      toast({
        title: "Error",
        description: "Failed to update guest information.",
        variant: "destructive"
      })
      return false
    }
  }

  // Check out a guest
  const handleCheckOut = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/guests/${id}/checkout`, {
        method: 'POST',
        headers: {
          'x-auth-bypass': 'true'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Remove from local state
      setGuests(prevGuests => 
        prevGuests.filter(guest => guest.id !== id)
      )
      
      // If this was the selected guest, deselect
      if (selectedGuest && selectedGuest.id === id) {
        setSelectedGuest(null)
      }
      
      toast({
        title: "Guest Checked Out",
        description: "The guest has been successfully checked out.",
      })
      
      return true
    } catch (err) {
      console.error("Error checking out guest:", err)
      toast({
        title: "Error",
        description: "Failed to check out guest.",
        variant: "destructive"
      })
      return false
    }
  }

  // Open cabin change modal
  const handleChangeCabin = (id: number) => {
    setCabinChangeGuestId(id)
    setShowCabinModal(true)
  }

  // Delete guest
  const handleDeleteGuest = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/guests/${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-bypass': 'true'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Remove from local state
      setGuests(prevGuests => prevGuests.filter(guest => guest.id !== id))
      
      // If this was the selected guest, deselect
      if (selectedGuest && selectedGuest.id === id) {
        setSelectedGuest(null)
      }
      
      toast({
        title: "Guest Deleted",
        description: "The guest has been successfully deleted.",
      })
      
      return true
    } catch (err) {
      console.error("Error deleting guest:", err)
      toast({
        title: "Error",
        description: "Failed to delete guest.",
        variant: "destructive"
      })
      return false
    }
  }

  // Handle cabin change confirmation
  const handleCabinChangeConfirm = async (room: string) => {
    if (!cabinChangeGuestId) return
    
    try {
      await handleUpdateGuest(cabinChangeGuestId, { room })
      toast({
        title: "Room Updated",
        description: "Guest room has been successfully updated.",
      })
    } catch (err) {
      console.error("Error updating room:", err)
    } finally {
      setShowCabinModal(false)
      setCabinChangeGuestId(null)
    }
  }

  // Fetch guests on component mount
  useEffect(() => {
    fetchGuests()
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col space-y-1.5 p-6">
        <h2 className="text-2xl font-semibold">Guests</h2>
        <p className="text-muted-foreground">Manage guest information and preferences</p>
      </div>
      
      <div className="px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:w-auto w-full">
            <div className="relative flex-grow max-w-md">
              <Input
                placeholder="Search guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] shrink-0">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Guests</SelectItem>
                <SelectItem value="Owner">Owners</SelectItem>
                <SelectItem value="Guest">Guests</SelectItem>
                <SelectItem value="Family">Family</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
                <SelectItem value="Charter">Charter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="default" onClick={() => router.push("/add-guest")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Guest
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="pb-6">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="detailed">Detailed View</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="min-h-[70vh] py-2">
                <div className={isMobile ? "flex flex-col space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
                  {filteredGuests.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground mb-2">No guests found</div>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Try adjusting your search or filters to find what you're looking for.
                      </p>
                    </div>
                  ) : (
                    <>
                      {filteredGuests.map(guest => (
                        <GuestCard
                          key={guest.id}
                          guest={guest}
                          onSelect={() => setSelectedGuest(guest)}
                          onUpdate={handleUpdateGuest}
                          onCheckOut={handleCheckOut}
                          onChangeCabin={handleChangeCabin}
                          onDelete={handleDeleteGuest}
                        />
                      ))}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="detailed" className="min-h-[70vh]">
                <div className="space-y-2">
                  {selectedGuest ? (
                    <GuestDetailPanel
                      id={selectedGuest.id}
                      name={selectedGuest.name}
                      isVip={selectedGuest.isVip}
                      imageUrl={selectedGuest.imageUrl || undefined}
                      room={selectedGuest.room}
                      guestType={selectedGuest.guestType}
                      partySize={selectedGuest.partySize}
                      nationality={selectedGuest.nationality || undefined}
                      languagesSpoken={selectedGuest.languagesSpoken}
                      tags={selectedGuest.tags}
                      arrivalDate={selectedGuest.arrivalDate}
                      departureDate={selectedGuest.departureDate}
                      preferences={{
                        food: selectedGuest.preferences?.food || [],
                        drinks: selectedGuest.preferences?.drinks || [],
                        roomTemperature: selectedGuest.preferences?.roomTemperature || 22,
                        cleaningTime: selectedGuest.preferences?.cleaningTime || "Morning",
                        dndActive: selectedGuest.preferences?.dndActive || false,
                        dndLocations: selectedGuest.preferences?.dndLocations || []
                      }}
                      notes={selectedGuest.notes || null}
                      broker={selectedGuest.broker}
                      serviceHistory={[]}
                      isExpanded={true}
                      onToggleExpand={() => {}}
                      onCheckOut={handleCheckOut}
                      onChangeCabin={handleChangeCabin}
                      onDelete={handleDeleteGuest}
                      onUpdate={handleUpdateGuest}
                      propertyType="Private Yacht"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-muted-foreground mb-2">No guest selected</div>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Select a guest from the list view to see detailed information.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {showCabinModal && (
        <SimplifiedChangeCabinModal
          isOpen={showCabinModal}
          guest={guests.find(g => g.id === cabinChangeGuestId) || null}
          onConfirm={handleCabinChangeConfirm}
          onClose={() => {
            setShowCabinModal(false)
            setCabinChangeGuestId(null)
          }}
        />
      )}
    </div>
  )
}