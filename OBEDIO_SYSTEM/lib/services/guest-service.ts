import { GuestPreferences } from "@/components/guests/guest-card"

export interface ServiceRequest {
  id: number
  type: string
  room: string
  status: "completed" | "pending" | "in-progress"
  timestamp: string
  description?: string
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
  notes: string | null
  assignedCrew: string | null
  location: string | null
  nationality?: string | null
  languagesSpoken?: string[]
  tags?: string[]
  preferences: GuestPreferences
  serviceRequests: ServiceRequest[]
  broker?: string | null
}

export interface UpcomingGuest {
  id: number
  name: string
  isVip: boolean
  plannedRoom: string | null
  guestType: "Owner" | "Guest" | "Family" | "Staff" | "Charter"
  arrivalDate: string
  departureDate: string
  notes: string | null
  broker: string | null
}

export interface CreateGuestPayload {
  name: string
  room?: string | null
  status?: string
  isVip?: boolean
  guestType: "Owner" | "Guest" | "Family" | "Staff" | "Charter"
  imageUrl?: string | null
  partySize?: number
  nationality?: string | null
  languagesSpoken?: string[]
  tags?: string[]
  arrivalDate: string | Date
  departureDate: string | Date
  notes?: string | null
  assignedCrew?: string | null
  location?: string | null
  preferences?: GuestPreferences
  broker?: string | null
}

export interface UpdateGuestPayload {
  id: number
  name?: string
  room?: string | null
  status?: string
  isVip?: boolean
  guestType?: "Owner" | "Guest" | "Family" | "Staff" | "Charter"
  imageUrl?: string | null
  partySize?: number
  nationality?: string | null
  languagesSpoken?: string[]
  tags?: string[]
  arrivalDate?: string | Date
  departureDate?: string | Date
  notes?: string | null
  assignedCrew?: string | null
  location?: string | null
  preferences?: Partial<GuestPreferences>
  broker?: string | null
}

/**
 * Service for handling guest-related API calls
 */
export const GuestService = {
  /**
   * Fetch all guests
   */
  async getAllGuests(): Promise<Guest[]> {
    try {
      const response = await fetch('/api/guests', {
        headers: {
          'x-auth-bypass': 'true'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch guests')
      }
      
      const guests = await response.json()
      return guests
    } catch (error) {
      console.error('Error fetching guests:', error)
      throw error
    }
  },
  
  /**
   * Create a new guest
   */
  async createGuest(guestData: CreateGuestPayload): Promise<Guest> {
    try {
      // Format dates if they are Date objects
      const formattedData = {
        ...guestData,
        arrivalDate: guestData.arrivalDate instanceof Date 
          ? guestData.arrivalDate.toISOString() 
          : guestData.arrivalDate,
        departureDate: guestData.departureDate instanceof Date 
          ? guestData.departureDate.toISOString() 
          : guestData.departureDate
      }
      
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-bypass': 'true'
        },
        body: JSON.stringify(formattedData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create guest')
      }
      
      const createdGuest = await response.json()
      return createdGuest
    } catch (error) {
      console.error('Error creating guest:', error)
      throw error
    }
  },
  
  /**
   * Update an existing guest
   */
  async updateGuest(guestData: UpdateGuestPayload): Promise<Guest> {
    try {
      // Format dates if they are Date objects
      const formattedData = {
        ...guestData
      }
      
      if (guestData.arrivalDate instanceof Date) {
        formattedData.arrivalDate = guestData.arrivalDate.toISOString()
      }
      
      if (guestData.departureDate instanceof Date) {
        formattedData.departureDate = guestData.departureDate.toISOString()
      }
      
      const response = await fetch('/api/guests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-bypass': 'true'
        },
        body: JSON.stringify(formattedData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update guest')
      }
      
      const updatedGuest = await response.json()
      return updatedGuest
    } catch (error) {
      console.error('Error updating guest:', error)
      throw error
    }
  },
  
  /**
   * Delete a guest
   */
  async deleteGuest(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/guests?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-bypass': 'true'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete guest')
      }
    } catch (error) {
      console.error('Error deleting guest:', error)
      throw error
    }
  },
  
  /**
   * Upload a guest image
   */
  async uploadGuestImage(imageData: string, guestId?: string | number): Promise<{ imageUrl: string }> {
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-bypass': 'true'
        },
        body: JSON.stringify({ 
          image: imageData,
          guestId: guestId ? String(guestId) : undefined
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload image')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  },
  
  /**
   * Check-out a guest (update status to 'Checked-Out')
   */
  async checkOutGuest(id: number): Promise<Guest> {
    return this.updateGuest({
      id,
      status: 'Checked-Out'
    })
  },
  
  /**
   * Check-in a guest (update status to 'Checked-In')
   */
  async checkInGuest(id: number): Promise<Guest> {
    return this.updateGuest({
      id,
      status: 'Checked-In'
    })
  },
  
  /**
   * Change a guest's room
   */
  async changeGuestRoom(id: number, newRoom: string): Promise<Guest> {
    return this.updateGuest({
      id,
      room: newRoom
    })
  },
  
  /**
   * Update guest preferences
   */
  async updateGuestPreferences(id: number, preferences: Partial<GuestPreferences>): Promise<Guest> {
    return this.updateGuest({
      id,
      preferences
    })
  }
}

export default GuestService