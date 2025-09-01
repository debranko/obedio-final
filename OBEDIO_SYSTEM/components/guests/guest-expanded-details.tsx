"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Edit, Save, BellOff, Bell, Clock, Thermometer,
  Coffee, Wine, Home, Calendar, User, Crown, 
  History, Trash2, LogOut, Globe, AlertCircle, Tag
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { EnhancedImageCapture } from "./enhanced-image-capture"
import { GuestPreferences } from "./guest-card"
import { useMediaQuery } from "@/hooks/use-media-query"

export interface ServiceRequest {
  id: number
  type: string
  room: string
  status: "completed" | "pending" | "in-progress"
  timestamp: string
  description?: string
}

export interface GuestExpandedDetailsProps {
  id: number
  name: string  
  room: string | null
  status: string
  isVip: boolean
  guestType: "Owner" | "Guest" | "Family" | "Staff" | "Charter"
  imageUrl: string | null
  partySize: number
  arrivalDate: string | Date
  departureDate: string | Date
  notes: string | null
  assignedCrew: string | null
  nationality?: string | null
  languagesSpoken?: string[]
  tags?: string[]
  preferences: GuestPreferences
  serviceRequests?: ServiceRequest[]
  broker?: string | null
  onUpdate: (id: number, data: any) => Promise<void>
  onCheckOut: (id: number) => Promise<void>
  onChangeCabin: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
  propertyType?: string
}

/**
 * Expanded details view for a guest, shown when a guest card is clicked
 */
export function GuestExpandedDetails({
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
  propertyType = "Private Yacht",
}: GuestExpandedDetailsProps) {
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("details")
  
  // Local state for edited values
  const [editedNotes, setEditedNotes] = useState(notes || "")
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(imageUrl)
  const [editedNationality, setEditedNationality] = useState(nationality || "")
  const [editedLanguages, setEditedLanguages] = useState<string[]>(languagesSpoken || [])
  const [editedTags, setEditedTags] = useState<string[]>(tags || [])
  
  // Ensure all required fields exist with default values if missing
  const [editedPreferences, setEditedPreferences] = useState<GuestPreferences>({
    food: preferences?.food || [],
    drinks: preferences?.drinks || [],
    allergies: preferences?.allergies || [],
    roomTemperature: preferences?.roomTemperature || 22,
    cleaningTime: preferences?.cleaningTime || "Morning",
    dndActive: preferences?.dndActive || false,
    dndLocations: preferences?.dndLocations || []
  })

  // Format dates
  const arrivalDateObj = arrivalDate instanceof Date ? arrivalDate : new Date(arrivalDate)
  const departureDateObj = departureDate instanceof Date ? departureDate : new Date(departureDate)
  
  // Handle image update
  const handleImageUpdate = (imageUrl: string | null) => {
    setEditedImageUrl(imageUrl)
    
    // If not in edit mode, update immediately
    if (!isEditing && imageUrl) {
      handleSaveChanges({ imageUrl })
    }
  }
  
  // Helper function for drink and food emojis
  const getFoodEmoji = (food: string): string => {
    const lowerFood = food.toLowerCase()
    
    if (lowerFood.includes("allergy") || lowerFood.includes("allergen")) return "⚠️"
    if (lowerFood.includes("fish") || lowerFood.includes("seafood")) return "🐟"
    if (lowerFood.includes("meat")) return "🥩"
    if (lowerFood.includes("vegetarian")) return "🥗"
    if (lowerFood.includes("fruit")) return "🍎"
    if (lowerFood.includes("dessert") || lowerFood.includes("sweet")) return "🍰"
    if (lowerFood.includes("egg")) return "🥚"
    if (lowerFood.includes("pasta")) return "🍝"
    
    return "🍴" // Default
  }
  
  const getDrinkEmoji = (drink: string): string => {
    const lowerDrink = drink.toLowerCase()
    
    if (lowerDrink.includes("coffee")) return "☕"
    if (lowerDrink.includes("tea")) return "🍵"
    if (lowerDrink.includes("wine")) return "🍷"
    if (lowerDrink.includes("beer")) return "🍺"
    if (lowerDrink.includes("water")) return "💧"
    if (lowerDrink.includes("juice")) return "🧃"
    if (lowerDrink.includes("cocktail")) return "🍸"
    
    return "🥤" // Default
  }

  // Handle save changes
  const handleSaveChanges = async (singleFieldUpdate?: Record<string, any>) => {
    try {
      const updateData = singleFieldUpdate || {
        notes: editedNotes,
        imageUrl: editedImageUrl,
        preferences: editedPreferences,
        nationality: editedNationality,
        languagesSpoken: editedLanguages,
        tags: editedTags,
      }
      
      await onUpdate(id, updateData)
      
      if (!singleFieldUpdate) {
        setIsEditing(false)
      }
      
      toast({
        title: "Changes Saved",
        description: "Guest details have been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update guest details",
        variant: "destructive"
      })
    }
  }

  // Handle adding/removing food, drinks and allergies
  const handleFoodChange = (foodString: string) => {
    const foodArray = foodString.split(',').map(item => item.trim()).filter(Boolean)
    setEditedPreferences({ ...editedPreferences, food: foodArray })
  }
  
  const handleDrinksChange = (drinksString: string) => {
    const drinksArray = drinksString.split(',').map(item => item.trim()).filter(Boolean)
    setEditedPreferences({ ...editedPreferences, drinks: drinksArray })
  }
  
  const handleAllergiesChange = (allergiesString: string) => {
    const allergiesArray = allergiesString.split(',').map(item => item.trim()).filter(Boolean)
    setEditedPreferences({ ...editedPreferences, allergies: allergiesArray })
  }

  // Toggle selection of languages and tags
  const toggleLanguage = (language: string) => {
    if (editedLanguages.includes(language)) {
      setEditedLanguages(editedLanguages.filter(lang => lang !== language))
    } else {
      setEditedLanguages([...editedLanguages, language])
    }
  }
  
  const toggleTag = (tag: string) => {
    if (editedTags.includes(tag)) {
      setEditedTags(editedTags.filter(t => t !== tag))
    } else {
      setEditedTags([...editedTags, tag])
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

  return (
    <div className="p-4 border border-border rounded-md mt-1 overflow-hidden bg-background">
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Guest Details
        </div>
        <div>
          {isEditing ? (
            <Button onClick={() => handleSaveChanges()} size="sm" className="h-8">
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="h-8"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Details
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="text-center">
                <Label className="text-sm text-muted-foreground">Profile Image</Label>
                <div className="mt-2">
                  <EnhancedImageCapture
                    onImageCapture={handleImageUpdate}
                    initialImage={imageUrl}
                    guestId={String(id)}
                  />
                </div>
              </div>
            </div>
            
            {/* Guest Details */}
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium text-lg mb-2">Basic Information</h3>
                
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
                        value={editedNationality || ''}
                        onChange={(e) => setEditedNationality(e.target.value)}
                        placeholder="Enter nationality"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="languages" className="text-xs text-muted-foreground">Languages Spoken</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['English', 'German', 'French', 'Italian', 'Spanish', 'Russian', 'Chinese', 'Arabic'].map(lang => {
                          const isSelected = editedLanguages.includes(lang)
                          return (
                            <Badge 
                              key={lang}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
                              onClick={() => toggleLanguage(lang)}
                            >
                              {lang}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="tags" className="text-xs text-muted-foreground">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['Celebrity', 'Returning', 'Special Diet', 'Birthday', 'Anniversary', 'Allergies', 'VIP', 'Special Needs'].map(tag => {
                          const isSelected = editedTags.includes(tag)
                          return (
                            <Badge 
                              key={tag}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{name}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Room</p>
                        <p className="font-medium flex items-center">
                          <Home className="h-3.5 w-3.5 mr-1.5" />
                          {room || "No room assigned"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        {(() => {
                          // Map guest status to StatusBadge status
                          const lowerStatus = status.toLowerCase();
                          if (lowerStatus.includes('check') && lowerStatus.includes('in')) {
                            return <StatusBadge status="completed" />;
                          } else if (lowerStatus.includes('check') && lowerStatus.includes('out')) {
                            return <StatusBadge status="pending" />;
                          } else if (lowerStatus.includes('confirm')) {
                            return <StatusBadge status="in-progress" />;
                          } else if (lowerStatus.includes('cancel')) {
                            return <StatusBadge status="failed" />;
                          }
                          return <StatusBadge status="pending" />;
                        })()}
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Guest Type</p>
                        <p className="flex items-center">
                          {guestType}
                          {isVip && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 ml-2">
                              <Crown className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Party Size</p>
                        <p className="font-medium">{partySize}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Nationality</p>
                        <p className="font-medium flex items-center">
                          {nationality ? (
                            <>
                              <Globe className="h-3.5 w-3.5 mr-1.5" />
                              {nationality}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">Not specified</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Arrival Date</p>
                        <p className="font-medium flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {format(arrivalDateObj, "MMM dd, yyyy")}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Departure Date</p>
                        <p className="font-medium flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {format(departureDateObj, "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-1.5">Languages Spoken</p>
                      <div className="flex flex-wrap gap-1.5">
                        {languagesSpoken && languagesSpoken.length > 0 ? (
                          languagesSpoken.map(lang => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              {lang}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic text-sm">No languages specified</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-1.5">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags && tags.length > 0 ? (
                          tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic text-sm">No tags</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </Card>
              
              {/* Notes Section */}
              <Card className="p-4">
                <h3 className="font-medium text-lg mb-2">Notes</h3>
                {isEditing ? (
                  <Textarea
                    value={editedNotes || ''}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Enter notes about the guest..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="p-3 min-h-[100px] bg-muted/20 rounded-md">
                    {notes ? notes : <span className="text-muted-foreground italic">No notes</span>}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Food Preferences */}
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-2">Food Preferences</h3>
              
              {isEditing ? (
                <div>
                  <Label htmlFor="food-prefs" className="text-xs text-muted-foreground">
                    Enter food preferences (comma-separated)
                  </Label>
                  <Input
                    id="food-prefs"
                    value={editedPreferences.food.join(", ")}
                    onChange={(e) => handleFoodChange(e.target.value)}
                    className="mt-1"
                    placeholder="E.g. Seafood, Pasta, Vegetarian cuisine"
                  />
                </div>
              ) : (
                <div>
                  {editedPreferences.food && editedPreferences.food.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {editedPreferences.food.map((food, index) => (
                        <Badge key={index} variant="outline">
                          {getFoodEmoji(food)} {food}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No food preferences specified</p>
                  )}
                </div>
              )}
              
              <Separator className="my-4" />
              
              {/* Allergies */}
              <h3 className="font-medium text-base mb-2">Allergies & Dietary Restrictions</h3>
              {isEditing ? (
                <div>
                  <Label htmlFor="allergies" className="text-xs text-muted-foreground">
                    Enter allergies (comma-separated)
                  </Label>
                  <Input
                    id="allergies"
                    value={editedPreferences.allergies?.join(", ") || ""}
                    onChange={(e) => handleAllergiesChange(e.target.value)}
                    className="mt-1"
                    placeholder="E.g. Nuts, Shellfish, Lactose"
                  />
                </div>
              ) : (
                <div>
                  {editedPreferences.allergies && editedPreferences.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {editedPreferences.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-600 border-red-200">
                          <AlertCircle className="h-3 w-3 mr-1" /> {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No allergies specified</p>
                  )}
                </div>
              )}
            </Card>
            
            {/* Drink Preferences */}
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-2">Drink Preferences</h3>
              
              {isEditing ? (
                <div>
                  <Label htmlFor="drink-prefs" className="text-xs text-muted-foreground">
                    Enter drink preferences (comma-separated)
                  </Label>
                  <Input
                    id="drink-prefs"
                    value={editedPreferences.drinks.join(", ")}
                    onChange={(e) => handleDrinksChange(e.target.value)}
                    className="mt-1"
                    placeholder="E.g. Coffee, Red Wine, Sparkling Water"
                  />
                </div>
              ) : (
                <div>
                  {editedPreferences.drinks && editedPreferences.drinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {editedPreferences.drinks.map((drink, index) => (
                        <Badge key={index} variant="outline">
                          {getDrinkEmoji(drink)} {drink}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No drink preferences specified</p>
                  )}
                </div>
              )}
            </Card>
            
            {/* Room Temperature */}
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-2">Room Temperature</h3>
              
              {isEditing ? (
                <div className="mt-2 pr-2">
                  <Slider
                    value={[editedPreferences.roomTemperature]}
                    min={18}
                    max={28}
                    step={0.5}
                    onValueChange={(value) =>
                      setEditedPreferences({
                        ...editedPreferences,
                        roomTemperature: value[0],
                      })
                    }
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>18°C</span>
                    <span>{editedPreferences.roomTemperature}°C</span>
                    <span>28°C</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm mt-1">
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                    <Thermometer className="h-3.5 w-3.5 mr-1" />
                    {editedPreferences.roomTemperature}°C
                  </Badge>
                </div>
              )}
            </Card>
            
            {/* Cleaning Time */}
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-2">Cleaning Time Preference</h3>
              
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select cleaning time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm mt-1">
                  <Badge variant="outline" className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {editedPreferences.cleaningTime}
                  </Badge>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Do Not Disturb</h4>
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
                  <Badge variant="outline" className={editedPreferences.dndActive ? "bg-red-100 text-red-600 border-red-200" : ""}>
                    {editedPreferences.dndActive ? (
                      <>
                        <BellOff className="h-3.5 w-3.5 mr-1" />
                        Do Not Disturb Active
                      </>
                    ) : (
                      <>
                        <Bell className="h-3.5 w-3.5 mr-1" />
                        Available for Services
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium text-lg mb-2">Service Request History</h3>
            
            {serviceRequests && serviceRequests.length > 0 ? (
              <div className="space-y-2">
                {serviceRequests.map((service) => (
                  <div
                    key={service.id}
                    className="p-2 border rounded-md flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{service.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(service.timestamp), "MMM dd, yyyy HH:mm")} • {service.room}
                      </p>
                      {service.description && (
                        <p className="text-sm mt-1">{service.description}</p>
                      )}
                    </div>
                    <div>{getServiceStatusBadge(service.status)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No service requests history</p>
            )}
          </Card>
          
          <Card className="p-4">
            <h3 className="font-medium text-lg mb-2">Guest Information</h3>
            
            <div className="space-y-2">
              {broker && (
                <div>
                  <p className="text-sm text-muted-foreground">Broker</p>
                  <p>{broker}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Guest Since</p>
                <p>{format(arrivalDateObj, "MMMM dd, yyyy")}</p>
              </div>
              
              {assignedCrew && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Crew Member</p>
                  <p>{assignedCrew}</p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 justify-end">
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit Details
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={() => onChangeCabin(id)}>
              <Home className="h-4 w-4 mr-1" />
              Change Room
            </Button>
            
            {!propertyType.includes("Private") && (
              <Button variant="outline" size="sm" onClick={() => onCheckOut(id)}>
                <LogOut className="h-4 w-4 mr-1" />
                Check-Out
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onDelete(id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Guest
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GuestExpandedDetails