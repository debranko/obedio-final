"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Home, ArrowRight, Crown } from "lucide-react"

interface Guest {
  id: number
  name: string
  room: string | null
  isVip: boolean
  [key: string]: any
}

interface ChangeCabinModalProps {
  isOpen: boolean
  onClose: () => void
  guest: Guest | null
  availableRooms: string[]
  allGuests: Guest[]
  onUpdateRoom: (guestId: number, oldRoom: string | null, newRoom: string) => void
}

export function ChangeCabinModal({
  isOpen,
  onClose,
  guest,
  availableRooms,
  allGuests,
  onUpdateRoom,
}: ChangeCabinModalProps) {
  const { toast } = useToast()
  const [selectedRoom, setSelectedRoom] = useState<string>("")
  const [occupiedRooms, setOccupiedRooms] = useState<Record<string, Guest>>({})

  useEffect(() => {
    // Resetuj izabrani room kada se modal zatvori ili otvori sa novim gostom
    if (isOpen && guest) {
      setSelectedRoom(guest.room || "")
    } else {
      setSelectedRoom("")
    }

    // Pronađi zauzete sobe
    const occupied: Record<string, Guest> = {}
    allGuests.forEach((g) => {
      if (g.room && g.id !== guest?.id) {
        occupied[g.room] = g
      }
    })
    setOccupiedRooms(occupied)
  }, [isOpen, guest, allGuests])

  if (!guest) {
    return null
  }

  const handleConfirm = () => {
    if (!selectedRoom || selectedRoom === guest.room) {
      onClose()
      return
    }

    // Ako je soba već zauzeta, obavesti korisnika
    if (occupiedRooms[selectedRoom]) {
      toast({
        title: "Room already occupied",
        description: `${occupiedRooms[selectedRoom].name} is already in this room. Please select another room or move them first.`,
        variant: "destructive",
      })
      return
    }

    onUpdateRoom(guest.id, guest.room, selectedRoom)
    onClose()

    toast({
      title: "Cabin changed",
      description: `${guest.name} has been moved to ${selectedRoom}.`,
    })
  }

  const allRoomOptions = Array.from(new Set([...availableRooms]))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Home className="mr-2 h-5 w-5" />
            Change Guest Cabin
          </DialogTitle>
          <DialogDescription>
            Select a new cabin for {guest.name}
            {guest.isVip && (
              <span className="inline-flex items-center ml-1">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                (VIP)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Current Room</div>
              <div className="text-sm text-muted-foreground">{guest.room || "Not assigned"}</div>
            </div>
            {selectedRoom && selectedRoom !== guest.room && (
              <div className="flex items-center">
                <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">New Room</div>
                  <div className="text-sm text-primary">{selectedRoom}</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label htmlFor="room-selection">Available Rooms</Label>
            <RadioGroup value={selectedRoom} onValueChange={setSelectedRoom} className="gap-2">
              {allRoomOptions.map((room) => {
                const isOccupied = occupiedRooms[room]
                return (
                  <Label
                    key={room}
                    htmlFor={`room-${room}`}
                    className={`flex items-center justify-between space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted ${
                      isOccupied && room !== guest.room ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value={room}
                        id={`room-${room}`}
                        disabled={isOccupied && room !== guest.room}
                      />
                      <div className="font-normal">
                        {room}
                        {isOccupied && room !== guest.room && (
                          <div className="text-xs text-muted-foreground">
                            Occupied by {occupiedRooms[room].name}
                          </div>
                        )}
                      </div>
                    </div>
                    {room === guest.room && <div className="text-xs text-muted-foreground">Current</div>}
                  </Label>
                )
              })}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedRoom || selectedRoom === guest.room}>
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
