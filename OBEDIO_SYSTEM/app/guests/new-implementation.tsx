"use client"

import { useState, useEffect, useMemo } from 'react'
import { UserPlus, Search, Filter, AlertCircle, Camera, X, Info, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/use-toast'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/ui-patterns/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

import { ChangeCabinModal } from '@/components/guests/change-cabin-modal'
import { EnhancedImageCapture } from '@/components/guests/enhanced-image-capture'

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

// Guest List Item Component
const GuestListItem = ({ 
  guest, 
  isSelected,
  onSelect,
}: { 
  guest: Guest
  isSelected: boolean
  onSelect: (guest: Guest) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // Format dates for display
  const arrivalDate = new Date(guest.arrivalDate)
  const departureDate = new Date(guest.departureDate)
  const formattedArrival = format(arrivalDate, "MMM dd")
  const formattedDeparture = format(departureDate, "MMM dd")
  
  // Calculate days remaining
  const daysLeft = Math.ceil((departureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  // Check for important attributes
  const hasAllergies = guest.preferences?.allergies && guest.preferences.allergies.length > 0
  
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
    const lowerStatus = guest.status.toLowerCase()
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
    <Card 
      className={`border transition-all mb-3 cursor-pointer ${isSelected ? 'border-primary shadow-md' : 'border-border hover:border-muted-foreground/30'}`}
      onClick={() => onSelect(guest)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            {/* Guest Avatar */}
            <Avatar className={`h-12 w-12 ${guest.isVip ? 'ring-2 ring-amber-400' : ''}`}>
              {guest.imageUrl ? (
                <AvatarImage src={guest.imageUrl} alt={guest.name} />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  {getInitials(guest.name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{guest.name}</span>
                {guest.isVip && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 px-1.5 py-0 h-5 text-xs">
                    VIP
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <span>{guest.guestType}</span>
                {guest.room && (
                  <span>• Room {guest.room}</span>
                )}
                {guest.partySize > 1 && (
                  <span>• Party of {guest.partySize}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={getStatusBadgeVariant()} className="text-xs" />
            <div className="text-sm text-muted-foreground">
              {formattedArrival} - {formattedDeparture}
            </div>
          </div>
        </div>
        
        {/* Key information - always visible */}
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex flex-wrap gap-1.5">
            {/* Nationality */}
            {guest.nationality && (
              <Badge variant="outline" className="text-xs">
                {guest.nationality}
              </Badge>
            )}
            
            {/* Allergies - High visibility */}
            {hasAllergies && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs font-medium flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Allergies
              </Badge>
            )}
            
            {/* Languages */}
            {guest.languagesSpoken && guest.languagesSpoken.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {guest.languagesSpoken.slice(0, 2).join(", ")}
                {guest.languagesSpoken.length > 2 && "..."}
              </Badge>
            )}
            
            {/* Food Preferences */}
            {guest.preferences?.food && guest.preferences.food.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Food Preferences
              </Badge>
            )}
            
            {/* Do Not Disturb */}
            {guest.preferences?.dndActive && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                Do Not Disturb
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// Guest Detail Panel Component
const GuestDetailPanel = ({
  guest,
  onClose,
  onUpdate,
  onCheckOut,
  onChangeCabin,
  onDelete
}: {
  guest: Guest | null
  onClose: () => void
  onUpdate: (id: number, data: any) => Promise<void>
  onCheckOut: (id: number) => Promise<void>
  onChangeCabin: (id: number) => void
  onDelete: (id: number) => Promise<void>
}) => {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("details")
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // Local state for edited values
  const [editedNotes, setEditedNotes] = useState(guest?.notes || "")
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(guest?.imageUrl || null)
  const [editedNationality, setEditedNationality] = useState(guest?.nationality || "")
  const [editedLanguages, setEditedLanguages] = useState<string[]>(guest?.languagesSpoken || [])
  const [editedTags, setEditedTags] = useState<string[]>(guest?.tags || [])
  
  // Preferences state
  const [editedPreferences, setEditedPreferences] = useState<GuestPreferences>({
    food: guest?.preferences?.food || [],
    drinks: guest?.preferences?.drinks || [],
    allergies: guest?.preferences?.allergies || [],
    roomTemperature: guest?.preferences?.roomTemperature || 22,
    cleaningTime: guest?.preferences?.cleaningTime || "Morning",
    dndActive: guest?.preferences?.dndActive || false,
    dndLocations: guest?.preferences?.dndLocations || []
  })
  
  // Update edit data when guest changes
  useEffect(() => {
    if (guest) {
      setEditedNotes(guest.notes || "")
      setEditedImageUrl(guest.imageUrl || null)
      setEditedNationality(guest.nationality || "")
      setEditedLanguages(guest.languagesSpoken || [])
      setEditedTags(guest.tags || [])
      setEditedPreferences({
        food: guest.preferences?.food || [],
        drinks: guest.preferences?.drinks || [],
        allergies: guest.preferences?.allergies || [],
        roomTemperature: guest.preferences?.roomTemperature || 22,
        cleaningTime: guest.preferences?.cleaningTime || "Morning",
        dndActive: guest.preferences?.dndActive || false,
        dndLocations: guest.preferences?.dndLocations || []
      })
      setIsEditing(false)
    }
  }, [guest])
  
  if (!guest) return null
  
  // Handle image capture
  const handleImageUpdate = async (imageUrl: string | null) => {
    setIsImageUploading(true)
    try {
      if (imageUrl) {
        setEditedImageUrl(imageUrl)
        
        // If not in edit mode, update immediately
        if (!isEditing) {
          await onUpdate(guest.id, { imageUrl })
          toast({
            title: "Image Updated",
            description: "Guest profile image has been updated."
          })
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsImageUploading(false)
      setShowImageDialog(false)
    }
  }
  
  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      const updateData = {
        notes: editedNotes,
        imageUrl: editedImageUrl,
        preferences: editedPreferences,
        nationality: editedNationality,
        languagesSpoken: editedLanguages,
        tags: editedTags
      }
      
      await onUpdate(guest.id, updateData)
      setIsEditing(false)
      
      toast({
        title: "Changes Saved",
        description: "Guest details have been updated."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update guest details",
        variant: "destructive"
      })
    }
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
  
  // Handle changes to food, drinks, allergies
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
  
  // Format dates
  const arrivalDate = new Date(guest.arrivalDate)
  const departureDate = new Date(guest.departureDate)
  const stayDuration = Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.ceil((departureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {/* Profile Image */}
          <div className="relative">
            <div 
              className="relative group cursor-pointer"
              onClick={() => setShowImageDialog(true)}
            >
              <Avatar className="h-16 w-16 border shadow-sm">
                {editedImageUrl ? (
                  <AvatarImage src={editedImageUrl} alt={guest.name} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {guest.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Image overlay */}
              <div className="absolute inset-0 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 
                           flex items-center justify-center transition-opacity duration-200">
                <Camera className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {guest.name}
              {guest.isVip && (
                <Badge className="bg-amber-100 text-amber-800">VIP</Badge>
              )}
            </h2>
            <div className="flex flex-wrap gap-2 mt-1">
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
                <Badge variant="outline">Room {guest.room}</Badge>
              )}
              <Badge variant="outline">{guest.status}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Stay Information</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Arrival:</span> {format(arrivalDate, "MMM dd, yyyy")}
            </p>
            <p>
              <span className="text-muted-foreground">Departure:</span> {format(departureDate, "MMM dd, yyyy")}
            </p>
            <p>
              <span className="text-muted-foreground">Duration:</span> {stayDuration} days
            </p>
            <p className={`font-medium ${daysRemaining <= 1 ? 'text-red-500' : ''}`}>
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Departing today'}
            </p>
          </div>
        </div>
        
        {guest.preferences?.allergies && guest.preferences.allergies.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
            <h3 className="font-medium text-red-800 dark:text-red-300 flex items-center mb-2">
              <AlertCircle className="h-4 w-4 mr-1" />
              Allergies & Restrictions
            </h3>
            <div className="flex flex-wrap gap-1">
              {guest.preferences.allergies.map((allergy, index) => (
                <Badge key={index} variant="outline" className="bg-white text-red-700 border-red-200 mr-1 mb-1">
                  {allergy}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 border">
          <h3 className="font-medium mb-2">Languages</h3>
          <div className="flex flex-wrap gap-1">
            {guest.languagesSpoken && guest.languagesSpoken.length > 0 ? (
              guest.languagesSpoken.map((language, index) => (
                <Badge key={index} variant="outline" className="bg-white">
                  {language}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No languages specified</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          {isEditing ? (
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-4">Edit Details</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nationality" className="text-sm text-muted-foreground">Nationality</Label>
                  <Input
                    id="nationality"
                    value={editedNationality || ''}
                    onChange={(e) => setEditedNationality(e.target.value)}
                    placeholder="Enter nationality"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Languages Spoken</Label>
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
                  <Label className="text-sm text-muted-foreground">Tags</Label>
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
            </Card>
          ) : (
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{guest.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{guest.room || "No room assigned"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={
                    guest.status.toLowerCase().includes('check-in') ? "completed" :
                    guest.status.toLowerCase().includes('check-out') ? "pending" :
                    "in-progress"
                  } />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Guest Type</p>
                  <p className="flex items-center">
                    {guest.guestType}
                    {guest.isVip && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 ml-2">
                        VIP
                      </Badge>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Party Size</p>
                  <p className="font-medium">{guest.partySize}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Nationality</p>
                  <p className="font-medium">
                    {guest.nationality || <span className="text-muted-foreground italic">Not specified</span>}
                  </p>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-1.5">Languages Spoken</p>
                <div className="flex flex-wrap gap-1.5">
                  {guest.languagesSpoken && guest.languagesSpoken.length > 0 ? (
                    guest.languagesSpoken.map(lang => (
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
                  {guest.tags && guest.tags.length > 0 ? (
                    guest.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No tags</span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
        
        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Food Preferences */}
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-2">Food Preferences</h3>
              
              {isEditing ? (
                <div>
                  <Label htmlFor="food-prefs" className="text-xs text-muted-foreground">Enter food preferences (comma separated)</Label>
                  <Input
                    id="food-prefs"
                    value={editedPreferences.food?.join(', ') || ''}
                    onChange={(e) => handleFoodChange(e.target.value)}
                    placeholder="E.g. Vegetarian, Seafood, Italian"
                    className="mt-1"
                  />
                  
                  {editedPreferences.food && editedPreferences.food.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editedPreferences.food.map((food, index) => (
                        <Badge key={index} variant="outline">
                          {food}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-1">
                  {guest.preferences.food && guest.preferences.food.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {guest.preferences.food.map((food, index) => (
                        <Badge key={index} variant="outline" className="bg-green-50 text-green-800">
                          {food}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No food preferences specified</span>
                  )}
                </div>
              )}
            </Card>
            
            {/* Allergies */}
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-2">Allergies & Restrictions</h3>
              
              {isEditing ? (
                <div>
                  <Label htmlFor="allergies" className="text-xs text-muted-foreground">Enter allergies (comma separated)</Label>
                  <Input
                    id="allergies"
                    value={editedPreferences.allergies?.join(', ') || ''}
                    onChange={(e) => handleAllergiesChange(e.target.value)}
                    placeholder="E.g. Nuts, Shellfish, Gluten"
                    className="mt-1"
                  />
                  
                  {editedPreferences.allergies && editedPreferences.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editedPreferences.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-1">
                  {guest.preferences.allergies && guest.preferences.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {guest.preferences.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No allergies specified</span>
                  )}
                </div>
              )}
            </Card>
            
            {/* Drinks Preferences */}
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-2">Drink Preferences</h3>
              
              {isEditing ? (
                <div>
                  <Label htmlFor="drinks-prefs" className="text-xs text-muted-foreground">Enter drink preferences (comma separated)</Label>
                  <Input
                    id="drinks-prefs"
                    value={editedPreferences.drinks?.join(', ') || ''}
                    onChange={(e) => handleDrinksChange(e.target.value)}
                    placeholder="E.g. Coffee, Red Wine, Sparkling Water"
                    className="mt-1"
                  />
                  
                  {editedPreferences.drinks && editedPreferences.drinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editedPreferences.drinks.map((drink, index) => (
                        <Badge key={index} variant="outline">
                          {drink}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-1">
                  {guest.preferences.drinks && guest.preferences.drinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {guest.preferences.drinks.map((drink, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800">
                          {drink}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No drink preferences specified</span>
                  )}
                </div>
              )}
            </Card>
            
            {/* Room Preferences */}
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-2">Room Preferences</h3>
              
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cleaning-time" className="text-xs text-muted-foreground">Cleaning Time</Label>
                      <Select 
                        value={editedPreferences.cleaningTime} 
                        onValueChange={(value: "Morning" | "Afternoon" | "Evening") => 
                          setEditedPreferences({...editedPreferences, cleaningTime: value})
                        }
                      >
                        <SelectTrigger id="cleaning-time" className="mt-1">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Afternoon">Afternoon</SelectItem>
                          <SelectItem value="Evening">Evening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dnd" className="text-xs text-muted-foreground">Do Not Disturb</Label>
                      <div className="flex items-center space-x-2 mt-3">
                        <Switch 
                          id="dnd"
                          checked={editedPreferences.dndActive}
                          onCheckedChange={(checked) => 
                            setEditedPreferences({...editedPreferences, dndActive: checked})
                          }
                        />
                        <Label htmlFor="dnd">{editedPreferences.dndActive ? 'Enabled' : 'Disabled'}</Label>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cleaning Time:</span>
                    <Badge variant="outline">{guest.preferences.cleaningTime}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Do Not Disturb:</span>
                    <Badge variant="outline" className={guest.preferences.dndActive ? "bg-red-50 text-red-700 border-red-200" : ""}>
                      {guest.preferences.dndActive ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
        
        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4">
          <Card className="p-4">
            <h3 className="font-medium text-lg mb-2">Notes</h3>
            {isEditing ? (
              <Textarea
                value={editedNotes || ''}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Enter notes about the guest..."
                className="min-h-[200px]"
              />
            ) : (
              <div className="p-3 min-h-[200px] bg-muted/20 rounded-md whitespace-pre-wrap">
                {guest.notes ? guest.notes : <span className="text-muted-foreground italic">No notes</span>}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t justify-end">
        <Button variant="outline" size="sm" onClick={() => onChangeCabin(guest.id)}>
          Change Room
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => onCheckOut(guest.id)}>
          Check Out
        </Button>
        
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => {
            if (confirm("Are you sure you want to delete this guest? This action cannot be undone.")) {
              onDelete(guest.id)
            }
          }}
        >
          Delete
        </Button>
      </div>
      
      {/* Image Capture Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Guest Photo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <EnhancedImageCapture 
              onImageCapture={handleImageUpdate}
              initialImage={editedImageUrl}
              guestId={String(guest.id)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function GuestsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // State
  const [loading, setLoading] = useState(true)
  const [guests, setGuests] = useState<Guest[]>([])
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([])
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const [showCabinModal, setShowCabinModal] = useState(false)
  const [cabinGuestId, setCabinGuestId] = useState<number | null>(null)
  
  // Current vs upcoming guests tabs
  const [activeTab, setActiveTab] = useState<string>("current")
  const currentDate = new Date()
  
  // Apply filters
  useEffect(() => {
    let result = [...guests]
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(guest => {
        return (
          guest.name.toLowerCase().includes(lowerSearchTerm) ||
          (guest.room && guest.room.toLowerCase().includes(lowerSearchTerm)) ||
          (guest.nationality && guest.nationality.toLowerCase().includes(lowerSearchTerm)) ||
          (guest.preferences?.allergies && guest.preferences.allergies.some(allergy => 
            allergy.toLowerCase().includes(lowerSearchTerm)
          )) ||
          (guest.languagesSpoken && guest.languagesSpoken.some(language => 
            language.toLowerCase().includes(lowerSearchTerm)
          ))
        )
      })
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(guest => 
        guest.status.toLowerCase() === statusFilter.toLowerCase()
      )
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(guest => 
        guest.guestType.toLowerCase() === typeFilter.toLowerCase()
      )
    }
    
    setFilteredGuests(result)
  }, [guests, searchTerm, statusFilter, typeFilter])
  
  // Split guests into current and upcoming
  const currentGuests = useMemo(() => {
    return filteredGuests.filter(guest => {
      const arrivalDate = new Date(guest.arrivalDate)
      const departureDate = new Date(guest.departureDate)
      return arrivalDate <= currentDate && departureDate >= currentDate
    })
  }, [filteredGuests, currentDate])
  
  const upcomingGuests = useMemo(() => {
    return filteredGuests.filter(guest => {
      const arrivalDate = new Date(guest.arrivalDate)
      return arrivalDate > currentDate
    })
  }, [filteredGuests, currentDate])
  
  // Fetch guests data
  const fetchGuests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/guests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch guests')
      }
      
      const data = await response.json()
      
      // Ensure all guests have properly initialized arrays
      const processedData = data.map((guest: any) => ({
        ...guest,
        languagesSpoken: guest.languagesSpoken || [],
        tags: guest.tags || [],
        preferences: {
          food: guest.preferences?.food || [],
          drinks: guest.preferences?.drinks || [],
          allergies: guest.preferences?.allergies || [],
          roomTemperature: guest.preferences?.roomTemperature || 22,
          cleaningTime: guest.preferences?.cleaningTime || "Morning",
          dndActive: guest.preferences?.dndActive || false,
          dndLocations: guest.preferences?.dndLocations || []
        }
      }))
      
      setGuests(processedData)
      setError(null)
    } catch (err) {
      console.error("Error fetching guests:", err)
      setError("Failed to load guest data. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load guests data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Initial data load
  useEffect(() => {
    fetchGuests()
  }, [])
  
  // Guest operations
  const handleUpdateGuest = async (id: number, data: any) => {
    try {
      const response = await fetch('/api/guests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update guest')
      }
      
      const updatedGuest = await response.json()
      
      // Update local state
      setGuests(prev => 
        prev.map(guest => 
          guest.id === id ? { ...guest, ...updatedGuest } : guest
        )
      )
      
      // If this is the selected guest, update that too
      if (selectedGuest && selectedGuest.id === id) {
        setSelectedGuest({ ...selectedGuest, ...updatedGuest })
      }
      
      toast({
        title: "Success",
        description: "Guest updated successfully",
      })
    } catch (err) {
      console.error("Error updating guest:", err)
      toast({
        title: "Error",
        description: "Failed to update guest",
        variant: "destructive",
      })
    }
  }
  
  const handleCheckOut = async (id: number) => {
    try {
      await handleUpdateGuest(id, { status: "Checked-Out" })
      
      toast({
        title: "Success",
        description: "Guest checked out successfully",
      })
    } catch (err) {
      console.error("Error checking out guest:", err)
      toast({
        title: "Error",
        description: "Failed to check out guest",
        variant: "destructive",
      })
    }
  }
  
  const handleChangeCabin = (id: number) => {
    setCabinGuestId(id)
    setShowCabinModal(true)
  }
  
  const handleDeleteGuest = async (id: number) => {
    try {
      const response = await fetch(`/api/guests?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete guest')
      }
      
      // Update local state
      setGuests(prev => prev.filter(guest => guest.id !== id))
      
      // If this is the currently selected guest, deselect it
      if (selectedGuest && selectedGuest.id === id) {
        setSelectedGuest(null)
      }
      
      toast({
        title: "Success",
        description: "Guest deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting guest:", err)
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive",
      })
    }
  }
  
  const handleCabinChangeConfirm = async (guestId: number, newRoom: string) => {
    try {
      await handleUpdateGuest(guestId, { room: newRoom })
      
      setShowCabinModal(false)
      setCabinGuestId(null)
      
      toast({
        title: "Room Updated",
        description: `Guest has been moved to ${newRoom}`,
      })
    } catch (err) {
      console.error("Error changing cabin:", err)
      toast({
        title: "Error",
        description: "Failed to change guest's cabin",
        variant: "destructive",
      })
    }
  }
  
  // Statistics for dashboard
  const totalGuests = filteredGuests.length
  const vipCount = filteredGuests.filter(g => g.isVip).length
  const currentGuestCount = currentGuests.length
  const upcomingGuestCount = upcomingGuests.length
  const allergiesCount = filteredGuests.filter(g => 
    g.preferences?.allergies && g.preferences.allergies.length > 0
  ).length
  
  return (
    <div className="container max-w-[1200px] mx-auto px-4 py-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Guests</h1>
          <p className="text-muted-foreground">
            Manage guest profiles and preferences
          </p>
        </div>
        <Button 
          onClick={() => router.push('/guests/add')}
          className="flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </div>
      
      {/* Stats section - Quick overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <p className="text-muted-foreground text-sm">Total Guests</p>
          <h3 className="text-2xl font-bold">{totalGuests}</h3>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <p className="text-muted-foreground text-sm">Current Guests</p>
          <h3 className="text-2xl font-bold">{currentGuestCount}</h3>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <p className="text-muted-foreground text-sm">Upcoming</p>
          <h3 className="text-2xl font-bold">{upcomingGuestCount}</h3>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 shadow-sm border border-amber-200 dark:border-amber-800">
          <p className="text-amber-700 dark:text-amber-400 text-sm">VIP Guests</p>
          <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-400">{vipCount}</h3>
        </div>
      </div>
      
      {/* Alerts section - important information */}
      {allergiesCount > 0 && (
