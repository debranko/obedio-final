import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useToast } from '@/components/ui/use-toast'

export interface Location {
  id: number
  name: string
  deck: string
  type: string
  description?: string
  capacity: number
  occupancy?: number
  devices?: any[]
  guests?: any[]
  createdAt: string
  updatedAt: string
}

interface UseLocationsOptions {
  includeDevices?: boolean
  includeGuests?: boolean
  deck?: string
  type?: string
}

export function useLocations(options: UseLocationsOptions = {}) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.includeDevices) params.append('includeDevices', 'true')
      if (options.includeGuests) params.append('includeGuests', 'true')
      if (options.deck) params.append('deck', options.deck)
      if (options.type) params.append('type', options.type)

      const response = await fetchWithAuth(`/api/locations?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }

      const data = await response.json()
      setLocations(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch locations'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [options.includeDevices, options.includeGuests, options.deck, options.type, toast])

  const createLocation = useCallback(async (locationData: Partial<Location>) => {
    try {
      const response = await fetchWithAuth('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create location')
      }

      const newLocation = await response.json()
      setLocations(prev => [...prev, newLocation])
      
      toast({
        title: 'Success',
        description: 'Location created successfully',
      })

      return newLocation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create location'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      throw err
    }
  }, [toast])

  const updateLocation = useCallback(async (id: number, updates: Partial<Location>) => {
    try {
      const response = await fetchWithAuth(`/api/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update location')
      }

      const updatedLocation = await response.json()
      setLocations(prev => prev.map(loc => loc.id === id ? updatedLocation : loc))
      
      toast({
        title: 'Success',
        description: 'Location updated successfully',
      })

      return updatedLocation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update location'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      throw err
    }
  }, [toast])

  const deleteLocation = useCallback(async (id: number) => {
    try {
      const response = await fetchWithAuth(`/api/locations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete location')
      }

      setLocations(prev => prev.filter(loc => loc.id !== id))
      
      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete location'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      throw err
    }
  }, [toast])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  }
}

// Hook for a single location
export function useLocation(id: number, options: { includeDevices?: boolean; includeGuests?: boolean } = {}) {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (options.includeDevices) params.append('includeDevices', 'true')
        if (options.includeGuests) params.append('includeGuests', 'true')

        const response = await fetchWithAuth(`/api/locations/${id}?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch location')
        }

        const data = await response.json()
        setLocation(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch location'
        setError(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchLocation()
    }
  }, [id, options.includeDevices, options.includeGuests, toast])

  return { location, loading, error }
}

// Hook for getting unique location types
export function useLocationTypes() {
  const types = [
    { value: 'cabin', label: 'Cabin' },
    { value: 'public', label: 'Public Area' },
    { value: 'service', label: 'Service Area' },
    { value: 'crew', label: 'Crew Area' },
    { value: 'technical', label: 'Technical Space' }
  ]
  return types
}

// Hook for getting unique decks
export function useDecks() {
  const { locations } = useLocations()
  const decks = Array.from(new Set(locations.map(loc => loc.deck))).sort()
  return decks
}