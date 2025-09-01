import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

export interface CrewMember {
  _id: string
  id: number
  name: string
  role: string
  position: string
  department: string
  team: string
  email: string | null
  phone: string | null
  cabin: string | null
  status: 'on_duty' | 'off_duty' | 'on_leave' | 'on_break'
  languages: string[]
  emergency_contact: {
    name: string
    phone: string
    relationship: string
  } | null
  certifications: string[]
  onDuty: boolean
  onLeave: boolean
  activeShift: {
    id: number
    startsAt: string
    endsAt: string
  } | null
  nextShift: any | null
  currentShift: {
    startTime: string
    endTime: string
    hoursLeft: number
  } | null
  assignedSmartwatchUid: string | null
  avatar: string | null
  updatedAt: string
  hoursThisWeek: number
  activeRequests: number
}

interface UseCrewOptions {
  role?: string
  search?: string
  onDuty?: boolean
}

export function useCrew(options: UseCrewOptions = {}) {
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCrew = async () => {
      try {
        setLoading(true)
        setError(null)

        // Build query params
        const params = new URLSearchParams()
        if (options.role && options.role !== 'all') {
          params.append('role', options.role)
        }
        if (options.search) {
          params.append('search', options.search)
        }
        if (options.onDuty !== undefined) {
          params.append('onDuty', options.onDuty.toString())
        }

        const queryString = params.toString()
        const url = `/api/crew${queryString ? `?${queryString}` : ''}`

        const response = await fetchWithAuth(url)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch crew: ${response.statusText}`)
        }

        const data = await response.json()
        setCrew(data.crew || [])
      } catch (err) {
        console.error('Error fetching crew:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch crew')
      } finally {
        setLoading(false)
      }
    }

    fetchCrew()
  }, [options.role, options.search, options.onDuty])

  const refetch = async () => {
    const params = new URLSearchParams()
    if (options.role && options.role !== 'all') {
      params.append('role', options.role)
    }
    if (options.search) {
      params.append('search', options.search)
    }
    if (options.onDuty !== undefined) {
      params.append('onDuty', options.onDuty.toString())
    }

    const queryString = params.toString()
    const url = `/api/crew${queryString ? `?${queryString}` : ''}`

    try {
      const response = await fetchWithAuth(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch crew: ${response.statusText}`)
      }
      const data = await response.json()
      setCrew(data.crew || [])
    } catch (err) {
      console.error('Error refetching crew:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch crew')
    }
  }

  return { crew, loading, error, refetch }
}