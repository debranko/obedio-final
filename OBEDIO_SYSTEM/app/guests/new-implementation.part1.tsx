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
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import { ChangeCabinModal } from '@/components/guests/change-cabin-modal'
import { ImageCapture } from '@/components/ui/image-capture'

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
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              {guest.imageUrl ? (
                <AvatarImage src={guest.imageUrl} alt={guest.name} />
              ) : (
                <AvatarFallback>
                  {guest.name.charAt(0)}
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