import { useState, useEffect, useCallback } from 'react'
import { useToast } from "@/components/ui/use-toast"
import GuestService, { Guest, UpdateGuestPayload, CreateGuestPayload } from '@/lib/services/guest-service'

interface UseGuestsOptions {
  autoFetch?: boolean
}

interface UseGuestsReturn {
  guests: Guest[]
  isLoading: boolean
  error: Error | null
  activeGuests: Guest[]
  upcomingGuests: Guest[]
  pastGuests: Guest[]
  fetchGuests: () => Promise<void>
  createGuest: (data: CreateGuestPayload) => Promise<Guest | null>
  updateGuest: (data: UpdateGuestPayload) => Promise<Guest | null>
  deleteGuest: (id: number) => Promise<boolean>
  checkOutGuest: (id: number) => Promise<Guest | null>
  changeGuestRoom: (id: number, newRoom: string) => Promise<Guest | null>
  uploadGuestImage: (imageData: string, guestId?: string | number) => Promise<{ imageUrl: string } | null>
}

/**
 * Hook for managing guest data and operations
 */
export function useGuests(options: UseGuestsOptions = {}): UseGuestsReturn {
  const { autoFetch = true } = options
  const { toast } = useToast()
  
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch all guests
  const fetchGuests = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const fetchedGuests = await GuestService.getAllGuests()
      setGuests(fetchedGuests)
      
      return fetchedGuests
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch guests')
      setError(error)
      
      toast({
        title: "Error",
        description: "Failed to load guest data",
        variant: "destructive",
      })
      
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Create a new guest
  const createGuest = async (data: CreateGuestPayload): Promise<Guest | null> => {
    try {
      setIsLoading(true)
      
      const createdGuest = await GuestService.createGuest(data)
      
      // Update local state
      setGuests(prevGuests => [...prevGuests, createdGuest])
      
      toast({
        title: "Success",
        description: "Guest created successfully",
      })
      
      return createdGuest
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create guest')
      setError(error)
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Update a guest
  const updateGuest = async (data: UpdateGuestPayload): Promise<Guest | null> => {
    try {
      setIsLoading(true)
      
      const updatedGuest = await GuestService.updateGuest(data)
      
      // Update local state
      setGuests(prevGuests => 
        prevGuests.map(guest => 
          guest.id === updatedGuest.id ? updatedGuest : guest
        )
      )
      
      toast({
        title: "Success",
        description: "Guest updated successfully",
      })
      
      return updatedGuest
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update guest')
      setError(error)
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a guest
  const deleteGuest = async (id: number): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      await GuestService.deleteGuest(id)
      
      // Update local state
      setGuests(prevGuests => prevGuests.filter(guest => guest.id !== id))
      
      toast({
        title: "Success",
        description: "Guest deleted successfully",
      })
      
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete guest')
      setError(error)
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Check out a guest
  const checkOutGuest = async (id: number): Promise<Guest | null> => {
    try {
      setIsLoading(true)
      
      const updatedGuest = await GuestService.checkOutGuest(id)
      
      // Update local state
      setGuests(prevGuests => 
        prevGuests.map(guest => 
          guest.id === updatedGuest.id ? updatedGuest : guest
        )
      )
      
      toast({
        title: "Success",
        description: "Guest checked out successfully",
      })
      
      return updatedGuest
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to check out guest')
      setError(error)
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Change guest room
  const changeGuestRoom = async (id: number, newRoom: string): Promise<Guest | null> => {
    try {
      setIsLoading(true)
      
      const updatedGuest = await GuestService.changeGuestRoom(id, newRoom)
      
      // Update local state
      setGuests(prevGuests => 
        prevGuests.map(guest => 
          guest.id === updatedGuest.id ? updatedGuest : guest
        )
      )
      
      toast({
        title: "Success",
        description: "Guest room changed successfully",
      })
      
      return updatedGuest
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to change guest room')
      setError(error)
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Upload guest image
  const uploadGuestImage = async (imageData: string, guestId?: string | number): Promise<{ imageUrl: string } | null> => {
    try {
      const result = await GuestService.uploadGuestImage(imageData, guestId)
      
      if (guestId) {
        // If we have a guest ID, update that guest's image URL in state
        setGuests(prevGuests => 
          prevGuests.map(guest => 
            guest.id === Number(guestId) 
              ? { ...guest, imageUrl: result.imageUrl } 
              : guest
          )
        )
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload image')
      setError(error)
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      
      return null
    }
  }

  // Auto-fetch guests on initial load
  useEffect(() => {
    if (autoFetch) {
      fetchGuests()
    }
  }, [autoFetch, fetchGuests])

  // Computed properties
  const now = new Date()
  
  const activeGuests = guests.filter(guest => {
    const departureDate = new Date(guest.departureDate)
    return departureDate >= now && guest.status !== 'Checked-Out'
  });

  const upcomingGuests = guests.filter(guest => {
    const arrivalDate = new Date(guest.arrivalDate)
    return arrivalDate > now
  });

  const pastGuests = guests.filter(guest => {
    const departureDate = new Date(guest.departureDate)
    return departureDate < now || guest.status === 'Checked-Out'
  });

  return {
    guests,
    isLoading,
    error,
    activeGuests,
    upcomingGuests,
    pastGuests,
    fetchGuests,
    createGuest,
    updateGuest,
    deleteGuest,
    checkOutGuest,
    changeGuestRoom,
    uploadGuestImage
  }
}

export default useGuests