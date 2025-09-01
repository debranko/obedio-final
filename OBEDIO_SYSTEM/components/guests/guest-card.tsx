"use client"

import { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Pencil, Home, Calendar, ChevronDown, ChevronUp, 
  User, Tag, Globe, AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui-patterns/status-badge'
import GuestExpandedDetails from './guest-expanded-details'
import { useMediaQuery } from '@/hooks/use-media-query'

export interface GuestPreferences {
  food: string[]
  drinks: string[]
  allergies: string[]
  roomTemperature: number
  cleaningTime: "Morning" | "Afternoon" | "Evening"
  dndActive: boolean
  dndLocations?: string[]
}

export interface GuestCardProps {
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
  languagesSpoken?: string[]
  tags?: string[]
  preferences: GuestPreferences
  serviceRequests?: any[]
  broker?: string | null
  onUpdate: (id: number, data: any) => Promise<void>
  onCheckOut: (id: number) => Promise<void>
  onChangeCabin: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
  className?: string
}

export function GuestCard({
  id,
  name,
  room,
  status,
  isVip,
  guestType,
  imageUrl,
  partySize,
  arrivalDate,
  departureDate,
  notes,
  assignedCrew,
  location,
  nationality,
  languagesSpoken = [],
  tags = [],
  preferences,
  serviceRequests = [],
  broker,
  onUpdate,
  onCheckOut,
  onChangeCabin,
  onDelete,
  className,
}: GuestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Format dates for display
  const arrivalDateObj = new Date(arrivalDate)
  const departureDateObj = new Date(departureDate)
  const formattedArrival = format(arrivalDateObj, "MMM dd")
  const formattedDeparture = format(departureDateObj, "MMM dd")

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Match guest status to StatusBadge acceptable values
  const getStatusBadgeVariant = () => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('check') && lowerStatus.includes('in')) {
      return "completed"
    } else if (lowerStatus.includes('check') && lowerStatus.includes('out')) {
      return "pending"
    } else if (lowerStatus.includes('confirm')) {
      return "in-progress"
    } else if (lowerStatus.includes('cancel')) {
      return "failed"
    }
    return "pending"
  }

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn("border border-border rounded-md overflow-hidden", className)}
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="p-3 pb-2 relative">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              {/* Guest Avatar */}
              <Avatar className={cn("h-12 w-12", isVip && "ring-2 ring-amber-400")}>
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt={name} />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    {getInitials(name)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{name}</span>
                  {isVip && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 px-1.5 py-0 h-5 text-xs">
                      VIP
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5 mr-1" />
                  <span>{guestType}</span>
                  {partySize > 1 && (
                    <span className="ml-2">· Party of {partySize}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Room and status */}
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={getStatusBadgeVariant()} className="text-xs" />
              <div className="flex items-center text-sm">
                <Home className="h-3.5 w-3.5 mr-1.5" />
                <span>{room || "No Room"}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          {/* Key info always shown - the most important data */}
          <div className="mb-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span className="text-muted-foreground">
                  {formattedArrival} - {formattedDeparture}
                </span>
              </div>
              
              {nationality && (
                <div className="flex items-center">
                  <Globe className="h-3.5 w-3.5 mr-1" />
                  <span className="text-muted-foreground">{nationality}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Allergies (always shown - critical info) */}
          {preferences?.allergies && preferences.allergies.length > 0 && (
            <div className="mb-2">
              <div className="flex items-start mt-1 gap-1">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-600">Allergies/Restrictions:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {preferences.allergies.map((allergy, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="bg-red-50 text-red-600 border-red-200 text-xs"
                      >
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Key preferences in compact form */}
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences?.food && preferences.food.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Food: {preferences.food.slice(0, 2).join(", ")}
                {preferences.food.length > 2 && "..."}
              </Badge>
            )}
            
            {preferences?.drinks && preferences.drinks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Drinks: {preferences.drinks.slice(0, 2).join(", ")}
                {preferences.drinks.length > 2 && "..."}
              </Badge>
            )}
            
            {preferences?.cleaningTime && (
              <Badge variant="outline" className="text-xs">
                Cleaning: {preferences.cleaningTime}
              </Badge>
            )}
            
            {preferences?.dndActive && (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                Do Not Disturb
              </Badge>
            )}
            
            {languagesSpoken && languagesSpoken.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Languages: {languagesSpoken.slice(0, 2).join(", ")}
                {languagesSpoken.length > 2 && "..."}
              </Badge>
            )}
          </div>
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-0 h-5">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Expand/collapse trigger */}
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 h-6 text-xs"
            >
              {isExpanded ? (
                <div className="flex items-center">
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </div>
              ) : (
                <div className="flex items-center">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View Details
                </div>
              )}
            </Button>
          </CollapsibleTrigger>
        </CardContent>
      </Card>
      
      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <CollapsibleContent asChild forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GuestExpandedDetails
                id={id}
                name={name}
                room={room}
                status={status}
                isVip={isVip}
                guestType={guestType}
                imageUrl={imageUrl || null}
                partySize={partySize}
                arrivalDate={arrivalDateObj}
                departureDate={departureDateObj}
                notes={notes || null}
                assignedCrew={assignedCrew || null}
                nationality={nationality || null}
                languagesSpoken={languagesSpoken}
                tags={tags}
                preferences={preferences}
                serviceRequests={serviceRequests}
                broker={broker || null}
                onUpdate={onUpdate}
                onCheckOut={onCheckOut}
                onChangeCabin={onChangeCabin}
                onDelete={onDelete}
              />
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  )
}

export default GuestCard
