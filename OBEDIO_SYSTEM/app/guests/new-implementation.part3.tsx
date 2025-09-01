// Main Guests Page Component
export default function GuestsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()
  const router = useRouter()
  
  // State for guests data and UI controls
  const [guests, setGuests] = useState<Guest[]>([])
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showCabinModal, setShowCabinModal] = useState(false)
  const [cabinModalGuestId, setCabinModalGuestId] = useState<number | null>(null)

  // Fetch all guests on component mount
  useEffect(() => {
    fetchGuests()
  }, [])

  // Apply filters and search whenever dependencies change
  useEffect(() => {
    if (!guests.length) return
    
    let result = [...guests]
    
    // Apply type filter
    if (filterType !== "all") {
      result = result.filter(guest => 
        guest.guestType === filterType || 
        (filterType === "VIP" && guest.isVip)
      )
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(guest => 
        guest.name.toLowerCase().includes(query) || 
        (guest.room && guest.room.toLowerCase().includes(query)) ||
        (guest.nationality && guest.nationality.toLowerCase().includes(query))
      )
    }
    
    setFilteredGuests(result)
  }, [guests, searchQuery, filterType])

  // Fetch all guests from API
  const fetchGuests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/guests', {
        headers: {
          'x-auth-bypass': 'true'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch guests')
      }
      
      const data = await response.json()
      
      // Parse dates and sort by arrival date
      const guestsWithParsedDates = data.map((guest: any) => ({
        ...guest,
        arrivalDate: guest.arrivalDate,
        departureDate: guest.departureDate
      }))
      
      // Sort by latest arrival date first
      const sortedGuests = guestsWithParsedDates.sort((a: Guest, b: Guest) => {
        return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime()
      })
      
      setGuests(sortedGuests)
      setFilteredGuests(sortedGuests)
    } catch (err) {
      console.error('Error fetching guests:', err)
      setError('Failed to load guests data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Update guest information
  const handleUpdateGuest = async (id: number, data: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/guests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-bypass': 'true'
        },
        body: JSON.stringify({
          id,
          ...data
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update guest')
      }
      
      const updatedGuest = await response.json()
      
      // Update guests state with the updated guest
      setGuests(prevGuests => 
        prevGuests.map(guest => 
          guest.id === id ? { ...guest, ...updatedGuest } : guest
        )
      )
      
      // If currently selected, update selected guest too
      if (selectedGuest && selectedGuest.id === id) {
        setSelectedGuest({ ...selectedGuest, ...updatedGuest })
      }
      
      return true
    } catch (err) {
      console.error('Error updating guest:', err)
      toast({
        title: "Error",
        description: "Failed to update guest information",
        variant: "destructive"
      })
      return false
    }
  }

  // Handle guest checkout
  const handleCheckOut = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/guests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-bypass': 'true'
        },
        body: JSON.stringify({
          id,
          status: "Checked-Out"
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to check out guest')
      }
      
      // Update guests state to reflect status change
      setGuests(prevGuests => 
        prevGuests.map(guest => 
          guest.id === id ? { ...guest, status: "Checked-Out" } : guest
        )
      )
      
      toast({
        title: "Success",
        description: "Guest has been checked out."
      })
      
      // If this was the selected guest, close the detail panel
      if (selectedGuest && selectedGuest.id === id) {
        setSelectedGuest(null)
      }
      
      return true
    } catch (err) {
      console.error('Error checking out guest:', err)
      toast({
        title: "Error",
        description: "Failed to check out guest",
        variant: "destructive"
      })
      return false
    }
  }

  // Handle cabin/room change modal
  const handleChangeCabin = (id: number) => {
    setCabinModalGuestId(id)
    setShowCabinModal(true)
  }

  // Handle guest deletion
  const handleDeleteGuest = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/guests?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-bypass': 'true'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete guest')
      }
      
      // Remove guest from state
      setGuests(prevGuests => prevGuests.filter(guest => guest.id !== id))
      
      toast({
        title: "Success",
        description: "Guest has been deleted."
      })
      
      // If this was the selected guest, close the detail panel
      if (selectedGuest && selectedGuest.id === id) {
        setSelectedGuest(null)
      }
      
      return true
    } catch (err) {
      console.error('Error deleting guest:', err)
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive"
      })
      return false
    }
  }

  // Handle cabin change confirmation from modal
  const handleCabinChangeConfirm = async (room: string) => {
    if (!cabinModalGuestId) return
    
    const success = await handleUpdateGuest(cabinModalGuestId, { room })
    
    if (success) {
      toast({
        title: "Room Updated",
        description: "Guest has been assigned to a new room."
      })
    }
    
    setShowCabinModal(false)
    setCabinModalGuestId(null)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        {/* Header with title and actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Guests</h1>
          
          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row gap-3 md:w-auto w-full">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guests..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Guests</SelectItem>
                <SelectItem value="VIP">VIP Guests</SelectItem>
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
        
        {/* Loading and error states */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Display guest content based on view (list and detail) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Guests list - takes full width on mobile, 1/3 on desktop */}
              <div className={isMobile && selectedGuest ? "hidden" : "md:col-span-1"}>
                <div className="space-y-4">
                  {filteredGuests.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      No guests found matching your search
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground">
                        {filteredGuests.length} {filteredGuests.length === 1 ? 'guest' : 'guests'} found
                      </div>
                      <div className="space-y-3">
                        {filteredGuests.map(guest => (
                          <GuestCard
                            key={guest.id}
                            guest={guest}
                            onSelect={setSelectedGuest}
                            onUpdate={handleUpdateGuest}
                            onCheckOut={handleCheckOut}
                            onChangeCabin={handleChangeCabin}
                            onDelete={handleDeleteGuest}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Guest detail panel - hidden on mobile until a guest is selected */}
              {(selectedGuest || !isMobile) && (
                <div className="md:col-span-2 border rounded-lg overflow-hidden bg-card">
                  {selectedGuest ? (
                    <GuestDetailPanel
                      guest={selectedGuest}
                      onClose={() => setSelectedGuest(null)}
                      onUpdate={handleUpdateGuest}
                      onCheckOut={handleCheckOut}
                      onChangeCabin={handleChangeCabin}
                      onDelete={handleDeleteGuest}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 h-96 text-center">
                      <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Guest Selected</h3>
                      <p className="text-muted-foreground max-w-md">
                        Select a guest from the list to view their details, update their information,
                        or check them out.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Room change modal */}
      {showCabinModal && (
        <ChangeCabinModal
          isOpen={showCabinModal}
          onClose={() => {
            setShowCabinModal(false)
            setCabinModalGuestId(null)
          }}
          onConfirm={handleCabinChangeConfirm}
        />
      )}
    </div>
  )
}