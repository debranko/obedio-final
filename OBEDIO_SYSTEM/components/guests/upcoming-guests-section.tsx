"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Crown, ChevronDown, ChevronUp, UserPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export interface UpcomingGuest {
  id: number
  name: string
  isVip: boolean
  plannedRoom: string | null
  guestType: "Owner" | "Guest" | "Family" | "Staff" | "Charter"
  arrivalDate: string | Date
  departureDate: string | Date
  notes?: string | null
  broker?: string | null
}

interface UpcomingGuestsSectionProps {
  guests: UpcomingGuest[]
  onConfirmArrival: (guest: UpcomingGuest) => void
}

export function UpcomingGuestsSection({ guests, onConfirmArrival }: UpcomingGuestsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (guests.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Guests
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent>
              <div className="space-y-3">
                {guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="p-3 border border-dashed rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 opacity-70">
                          <AvatarImage
                            src={`/abstract-geometric-shapes.png?key=${guest.id}&height=40&width=40&query=${guest.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}`}
                            className="object-cover object-center"
                          />
                          <AvatarFallback>
                            {guest.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{guest.name}</span>
                            {guest.isVip && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                <Crown className="h-3 w-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                            <Badge variant="outline">{guest.guestType}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Planned Room: {guest.plannedRoom || "Not assigned"}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="ml-2" onClick={() => onConfirmArrival(guest)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Confirm Arrival
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Arrival</div>
                        <div className="text-sm">
                          {format(
                            guest.arrivalDate instanceof Date ? guest.arrivalDate : new Date(guest.arrivalDate),
                            "MMM dd, yyyy"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Departure</div>
                        <div className="text-sm">
                          {format(
                            guest.departureDate instanceof Date ? guest.departureDate : new Date(guest.departureDate),
                            "MMM dd, yyyy"
                          )}
                        </div>
                      </div>
                    </div>
                    {guest.notes && <div className="mt-2 text-sm italic text-muted-foreground">"{guest.notes}"</div>}
                    {guest.broker && <div className="mt-1 text-xs text-muted-foreground">Broker: {guest.broker}</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
