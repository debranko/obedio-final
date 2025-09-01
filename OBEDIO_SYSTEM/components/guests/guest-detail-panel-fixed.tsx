"use client"

// DEBUG LOG: This file is never imported!
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, differenceInDays } from "date-fns"
import {
  Edit,
  Save,
  BellOff,
  Bell,
  Clock,
  Thermometer,
  Coffee,
  Wine,
  Home,
  Calendar,
  User,
  Users,
  Crown,
  History,
  ChevronDown,
  ChevronUp,
  Trash2,
  LogOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EnhancedImageCapture } from "./enhanced-image-capture"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { StatusBadge } from "@/components/ui-patterns/status-badge"

export interface GuestPreferences {
  food: string[]
  drinks: string[]
  roomTemperature: number
  cleaningTime: "Morning" | "Afternoon" | "Evening"
  dndActive: boolean
  dndLocations: string[]
}

export interface ServiceRequest {
  id: number
  type: string
  room: string
  status: "completed" | "pending" | "in-progress"
  timestamp: string
  description?: string
}

export interface GuestDetailProps {
  id: number
  name: string
  isVip: boolean
  imageUrl?: string
  room: string | null
  guestType: "Owner" | "Guest" | "Family" | "Staff" | "Charter"
  partySize?: number
  guestTag?: string
  nationality?: string
  languagesSpoken?: string[]
  tags?: string[]
  arrivalDate: string | Date
  departureDate: string | Date
  preferences: GuestPreferences
  notes: string | null
  broker?: string | null
  serviceHistory?: ServiceRequest[]
  isExpanded: boolean
  onToggleExpand: () => void
  onCheckOut: (id: number) => void
  onChangeCabin: (id: number) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, data: any) => void
  propertyType: "Private Yacht" | "Charter Yacht" | "Villa" | "Hotel"
}

export function GuestDetailPanel({
  id,
  name,
  isVip,
  imageUrl,
  room,
  guestType,
  partySize,
  guestTag,
  nationality,
  languagesSpoken = [],
  tags = [],
  arrivalDate,
  departureDate,
  preferences,
  notes,
  broker,
  serviceHistory = [],
  isExpanded,
  onToggleExpand,
  onCheckOut,
  onChangeCabin,
  onDelete,
  onUpdate,
  propertyType,
}: GuestDetailProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(notes || "")
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(imageUrl || "")
  const [editedNationality, setEditedNationality] = useState(nationality || "")
  const [editedLanguages, setEditedLanguages] = useState<string[]>(languagesSpoken || [])
  const [editedTags, setEditedTags] = useState<string[]>(tags || [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Ensure all required fields exist with default values if missing
  const [editedPreferences, setEditedPreferences] = useState<GuestPreferences>({
    food: preferences?.food || [],
    drinks: preferences?.drinks || [],
    roomTemperature: preferences?.roomTemperature || 22,
    cleaningTime: preferences?.cleaningTime || "Morning",
    dndActive: preferences?.dndActive || false,
    dndLocations: preferences?.dndLocations || []
  })

  // Handler for image from EnhancedImageCapture component
  const handleImageUpdate = async (imageDataUrl: string | null) => {
    if (!imageDataUrl) {
      setEditedImageUrl(null)
      
      // Automatically save changes if we're not in edit mode
      if (!isEditing) {
        onUpdate(id, { imageUrl: null })
        toast({
          title: "Image removed",
          description: "Guest image has been successfully removed."
        })
      }
      return
    }
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-bypass': 'true'
        },
        body: JSON.stringify({ image: imageDataUrl })
      })
      
      if (!response.ok) {
        throw new Error('Image upload failed')
      }
      
      const data = await response.json()
      setEditedImageUrl(data.imageUrl)
      
      // Automatically save changes if we're not in edit mode
      if (!isEditing) {
        onUpdate(id, { imageUrl: data.imageUrl })
        toast({
          title: "Image updated",
          description: "Guest image has been successfully updated."
        })
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      toast({
        title: "Error",
        description: "There was an error uploading the image.",
        variant: "destructive"
      })
    }
  }

  // Calculate days remaining
  const arrivalDateObj = arrivalDate instanceof Date ? arrivalDate : new Date(arrivalDate)
  const departureDateObj = departureDate instanceof Date ? departureDate : new Date(departureDate)
  const daysRemaining = differenceInDays(departureDateObj, new Date())

  // Helper function for food emojis
  const getFoodEmoji = (food: string): string => {
    const lowerFood = food.toLowerCase();
    if (lowerFood.includes("fish")) return "🐟";
    if (lowerFood.includes("meat")) return "🥩";
    if (lowerFood.includes("vegetarian")) return "🥗";
    if (lowerFood.includes("fruit")) return "🍎";
    if (lowerFood.includes("dessert")) return "🍰";
    if (lowerFood.includes("eggs")) return "🥚";
    if (lowerFood.includes("pasta")) return "🍝";
    return "🍴"; // Default
  }

  // Helper function for drink emojis
  const getDrinkEmoji = (drink: string): string => {
    const lowerDrink = drink.toLowerCase();
    if (lowerDrink.includes("coffee")) return "☕";
    if (lowerDrink.includes("tea")) return "🍵";
    if (lowerDrink.includes("wine")) return "🍷";
    if (lowerDrink.includes("beer")) return "🍺";
    if (lowerDrink.includes("water")) return "💧";
    if (lowerDrink.includes("juice")) return "🧃";
    if (lowerDrink.includes("cocktail")) return "🍸";
    return "🥤"; // Default
  }

  // Handle save changes
  const handleSaveChanges = () => {
    try {
      // Create a single object with all edited fields
      const updatedData = {
        notes: editedNotes,
        imageUrl: editedImageUrl,
        preferences: editedPreferences,
        nationality: editedNationality,
        languagesSpoken: editedLanguages,
        tags: editedTags,
      }

      onUpdate(id, updatedData)
      setIsEditing(false)
      toast({
        title: "Changes Saved",
        description: "Guest details have been updated successfully."
      })
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Get guest type badge color
  const getGuestTypeBadgeColor = () => {
    switch (guestType) {
      case "Owner":
        return "bg-purple-100 text-purple-800"
      case "Family":
        return "bg-green-100 text-green-800"
      case "Guest":
        return "bg-blue-100 text-blue-800"
      case "Staff":
        return "bg-gray-100 text-gray-800"
      case "Charter":
        return "bg-amber-100 text-amber-800"
      default:
        return ""
    }
  }

  // Get cleaning time icon
  const getCleaningTimeIcon = () => {
    switch (editedPreferences.cleaningTime) {
      case "Morning":
        return <Clock className="h-3.5 w-3.5 mr-1" />
      case "Afternoon":
        return <Clock className="h-3.5 w-3.5 mr-1" />
      case "Evening":
        return <Clock className="h-3.5 w-3.5 mr-1" />
      default:
        return <Clock className="h-3.5 w-3.5 mr-1" />
    }
  }

  // Get service status badge
  const getServiceStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <StatusBadge status="completed" className="text-xs" />
      case "in-progress":
        return <StatusBadge status="in-progress" className="text-xs" />
      case "pending":
        return <StatusBadge status="pending" className="text-xs" />
      default:
        return <StatusBadge status="pending" className="text-xs" />
    }
  }

  // Helper function to check if the URL is valid
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    // Check if it's a valid URL or a path starting with /
    return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
  }

  return (
    <div className="overflow-hidden">
      <Card
        className={`transition-shadow hover:shadow-md cursor-pointer ${
          isExpanded ? "border-primary" : ""
        }`}
        onClick={onToggleExpand}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <Avatar className="h-10 w-10 border cursor-pointer">
                  {editedImageUrl && isValidImageUrl(editedImageUrl) ? (
                    <AvatarImage src={editedImageUrl} alt={name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true); // Enable edit mode to show image capture component
                  }}
                >
                  <Edit className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-medium flex items-center gap-1.5">
                  {name}
                  {isVip && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 ml-1">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </h3>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={getGuestTypeBadgeColor()}>
                    {guestType}
                  </Badge>
                  {partySize && partySize > 1 && (
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {partySize}
                    </Badge>
                  )}
                  {room ? (
                    <span className="text-xs">
                      <Home className="h-3 w-3 inline mr-1" />
                      {room}
                    </span>
                  ) : (
                    <span className="text-xs italic">No room assigned</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-right mr-2">
                <div className="text-sm font-medium">
                  {daysRemaining > 0 ? `${daysRemaining} days left` : "Departing today"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(departureDateObj, "MMM dd, yyyy")}
                </div>
              </div>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border border-border rounded-md mt-1 p-4"
          >
            <div className="flex justify-between">
              <div className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Guest Details
              </div>
              <div>
                {/* Save button moved to action buttons section at the bottom */}
              </div>
            </div>
            
            {isEditing && (
              <div className="mt-4 mb-4 p-2 bg-muted/30 rounded-md">
                <div className="text-center">
                  <Label className="text-xs text-muted-foreground">Profile Image</Label>
                  <div className="mt-2">
                    <EnhancedImageCapture
                      onImageCapture={handleImageUpdate}
                      initialImage={editedImageUrl}
                      guestId={String(id)}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div>
                {/* Basic Guest Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-medium">Basic Guest Info</Label>
                    <div className="mt-2 bg-muted/10 rounded-md p-3 border">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="full-name" className="text-xs text-muted-foreground">Full Name</Label>
                            <Input
                              id="full-name"
                              defaultValue={name}
                              className="mt-1"
                              disabled
                            />
                          </div>
                          <div>
                            <Label htmlFor="nationality" className="text-xs text-muted-foreground">Nationality</Label>
                            <Input
                              id="nationality"
                              value={editedNationality}
                              onChange={(e) => setEditedNationality(e.target.value)}
                              placeholder="Enter nationality"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="languages" className="text-xs text-muted-foreground">Languages Spoken</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {['English', 'German', 'Serbian', 'French', 'Italian', 'Spanish'].map(lang => {
                                const isSelected = editedLanguages.includes(lang);
                                return (
                                  <Badge 
                                    key={lang}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditedLanguages(editedLanguages.filter(l => l !== lang));
                                      } else {
                                        setEditedLanguages([...editedLanguages, lang]);
                                      }
                                    }}
                                  >
                                    {lang === 'English' && '🇬🇧'}
                                    {lang === 'German' && '🇩🇪'}
                                    {lang === 'Serbian' && '🇷🇸'}
                                    {lang === 'French' && '🇫🇷'}
                                    {lang === 'Italian' && '🇮🇹'}
                                    {lang === 'Spanish' && '🇪🇸'}
                                    <span className="ml-1">{lang}</span>
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="custom-tags" className="text-xs text-muted-foreground">Custom Tags</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {['Celebrity', 'Returning', 'Special Diet', 'Birthday', 'Anniversary'].map(tag => {
                                const isSelected = editedTags.includes(tag);
                                return (
                                  <Badge 
                                    key={tag}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`cursor-pointer ${isSelected ? 'bg-secondary' : ''}`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditedTags(editedTags.filter(t => t !== tag));
                                      } else {
                                        setEditedTags([...editedTags, tag]);
                                      }
                                    }}
                                  >
                                    {tag}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Full Name</Label>
                              <div className="font-medium">{name}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Nationality</Label>
                              <div className="font-medium">{nationality || <span className="text-muted-foreground italic">Not specified</span>}</div>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Languages Spoken</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {languagesSpoken && languagesSpoken.length > 0 ? languagesSpoken.map(lang => (
                                <Badge key={lang} variant="outline" className="text-xs" title={lang}>
                                  {lang === 'English' && '🇬🇧'}
                                  {lang === 'German' && '🇩🇪'}
                                  {lang === 'Serbian' && '🇷🇸'}
                                  {lang === 'French' && '🇫🇷'}
                                  {lang === 'Italian' && '🇮🇹'}
                                  {lang === 'Spanish' && '🇪🇸'}
                                  <span className="ml-1">{lang}</span>
                                </Badge>
                              )) : (
                                <span className="text-xs text-muted-foreground italic">No languages specified</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Tags</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tags && tags.length > 0 ? tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              )) : (
                                <span className="text-xs text-muted-foreground italic">No tags specified</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Special Status</Label>
                            <div className="mt-1">
                              {isVip && (
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                  <Crown className="h-3 w-3 mr-1" />
                                  VIP Guest
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Service History if available */}
                {serviceHistory && serviceHistory.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-lg font-medium">Service History</Label>
                    <div className="mt-2 bg-muted/10 rounded-md p-3 border">
                      <div className="space-y-2">
                        {serviceHistory.map((service) => (
                          <div key={service.id} className="flex justify-between items-center text-sm p-1.5 hover:bg-muted/30 rounded-md">
                            <div className="flex items-center space-x-3">
                              <History className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{service.type}</div>
                                <div className="text-xs text-muted-foreground">
                                  {service.room} • {new Date(service.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div>{getServiceStatusBadge(service.status)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right column */}
              <div>
                {/* Food Preferences */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-medium">Preferences</Label>
                    <div className="mt-2 space-y-4">
                      <div className="bg-muted/10 rounded-md p-3 border">
                        <h3 className="font-medium text-sm mb-2">Food Preferences</h3>
                        {!isEditing ? (
                          <div className="flex flex-wrap gap-1">
                            {editedPreferences.food && editedPreferences.food.length > 0 ? (
                              editedPreferences.food.map((food, index) => (
                                <Badge key={index} variant="outline" className="text-xs flex items-center">
                                  <span className="mr-1">{getFoodEmoji(food)}</span> {food}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No food preferences</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Input
                              placeholder="Enter food preferences separated by commas"
                              value={editedPreferences.food.join(", ")}
                              onChange={(e) =>
                                setEditedPreferences({
                                  ...editedPreferences,
                                  food: e.target.value.split(",").map(item => item.trim()).filter(item => item)
                                })
                              }
                              className="text-sm"
                            />
                            <div className="mt-2 flex flex-wrap gap-1">
                                {editedPreferences.food.map((food, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    <span className="mr-1">{getFoodEmoji(food)}</span> {food}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-muted/10 rounded-md p-3 border">
                        <h3 className="font-medium text-sm mb-2">Drink Preferences</h3>
                        {!isEditing ? (
                          <div className="flex flex-wrap gap-1">
                            {editedPreferences.drinks && editedPreferences.drinks.length > 0 ? (
                              editedPreferences.drinks.map((drink, index) => (
                                <Badge key={index} variant="outline" className="text-xs flex items-center">
                                  <span className="mr-1">{getDrinkEmoji(drink)}</span> {drink}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No drink preferences</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Input
                              placeholder="Enter drink preferences separated by commas"
                              value={editedPreferences.drinks.join(", ")}
                              onChange={(e) =>
                                setEditedPreferences({
                                  ...editedPreferences,
                                  drinks: e.target.value.split(",").map(item => item.trim()).filter(item => item)
                                })
                              }
                              className="text-sm"
                            />
                            <div className="mt-2 flex flex-wrap gap-1">
                                {editedPreferences.drinks.map((drink, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    <span className="mr-1">{getDrinkEmoji(drink)}</span> {drink}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-muted/10 rounded-md p-3 border">
                        <h3 className="font-medium text-sm mb-2">Room Temperature</h3>
                        {isEditing ? (
                          <div className="mt-2 pr-2">
                            <Slider
                              value={[editedPreferences.roomTemperature]}
                              min={16}
                              max={30}
                              step={1}
                              onValueChange={(value) =>
                                setEditedPreferences({
                                  ...editedPreferences,
                                  roomTemperature: value[0],
                                })
                              }
                            />
                            <div className="text-right text-sm mt-1 font-medium">
                              {editedPreferences.roomTemperature}°C
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm mt-1">
                            <Badge variant="outline" className="flex items-center">
                              <Thermometer className="h-3.5 w-3.5 mr-1" />
                              {editedPreferences.roomTemperature}°C
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-muted/10 rounded-md p-3 border">
                        <h3 className="font-medium text-sm mb-2">Cleaning Time</h3>
                        {isEditing ? (
                          <Select
                            value={editedPreferences.cleaningTime}
                            onValueChange={(value: "Morning" | "Afternoon" | "Evening") =>
                              setEditedPreferences({
                                ...editedPreferences,
                                cleaningTime: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Morning">Morning (8am - 11am)</SelectItem>
                              <SelectItem value="Afternoon">Afternoon (1pm - 4pm)</SelectItem>
                              <SelectItem value="Evening">Evening (6pm - 8pm)</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm mt-1">
                            <Badge className="flex items-center">
                              {getCleaningTimeIcon()}
                              {editedPreferences.cleaningTime}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-muted/10 rounded-md p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">Do Not Disturb</h3>
                          {isEditing ? (
                            <Switch
                              checked={editedPreferences.dndActive}
                              onCheckedChange={(checked) =>
                                setEditedPreferences({
                                  ...editedPreferences,
                                  dndActive: checked,
                                })
                              }
                            />
                          ) : (
                            <Badge variant="outline" className={editedPreferences.dndActive ? "bg-red-100" : ""}>
                              {editedPreferences.dndActive ? (
                                <BellOff className="h-3.5 w-3.5 mr-1 text-red-600" />
                              ) : (
                                <Bell className="h-3.5 w-3.5 mr-1" />
                              )}
                              {editedPreferences.dndActive ? "Active" : "Not Active"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <Label className="text-lg font-medium">Notes</Label>
              <div className="mt-2">
                {!isEditing ? (
                  <div className="p-3 bg-muted/10 rounded-md border">
                    {editedNotes ? editedNotes : <span className="italic text-muted-foreground">No notes available</span>}
                  </div>
                ) : (
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Enter notes about this guest"
                    className="min-h-[120px]"
                  />
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-end gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      setIsEditing(true);
                      console.log("Edit button clicked, isEditing set to true");
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Details
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      handleSaveChanges();
                    }}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onChangeCabin(id)}>
                  <Home className="h-4 w-4 mr-1" />
                  Change Room
                </Button>
                {!propertyType.includes("Private") && (
                  <Button variant="outline" size="sm" onClick={() => onCheckOut(id)}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Check Out
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this guest? This action cannot be undone.")) {
                      onDelete(id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}