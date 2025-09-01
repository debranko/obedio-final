"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { CalendarIcon, Camera, Save, ArrowLeft, Users } from "lucide-react"
import { EnhancedImageCapture } from "@/components/guests/enhanced-image-capture"

interface GuestFormData {
  name: string
  room: string
  status: string
  isVip: boolean
  guestType: string
  partySize: number
  nationality: string
  languagesSpoken: string[]
  tags: string[]
  arrivalDate: Date
  departureDate: Date
  notes: string
  assignedCrew: string
  location: string
  preferences: {
    food: string[]
    drinks: string[]
    allergies: string[]
    roomTemperature: number
    cleaningTime: string
  }
  broker: string
  imageUrl: string
}

export default function AddGuestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<GuestFormData>({
    name: "",
    room: "",
    status: "Checked-In",
    isVip: false,
    guestType: "Guest",
    partySize: 1,
    nationality: "",
    languagesSpoken: [],
    tags: [],
    arrivalDate: new Date(),
    departureDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7-day stay
    notes: "",
    assignedCrew: "",
    location: "",
    preferences: {
      food: [],
      drinks: [],
      allergies: [],
      roomTemperature: 22,
      cleaningTime: "Morning",
    },
    broker: "",
    imageUrl: "",
  })

  // Handle standard form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle image capture from the camera component
  const handleImageCapture = async (imageDataUrl: string | null) => {
    if (!imageDataUrl) {
      setFormData(prev => ({ ...prev, imageUrl: "" }))
      return
    }
    
    try {
      // Upload image to server
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
      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }))
    } catch (err) {
      console.error('Error uploading image:', err)
      toast({
        title: "Error",
        description: "There was an error uploading the image.",
        variant: "destructive"
      })
    }
  }

  // Handle preferences changes
  const handlePreferenceChange = (prefField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [prefField]: value }
    }))
  }

  // Toggle array values (for languages and tags)
  const toggleArrayItem = (field: 'languagesSpoken' | 'tags', value: string) => {
    setFormData(prev => {
      const currentArray = [...prev[field]]
      const index = currentArray.indexOf(value)
      
      if (index === -1) {
        // Add item
        return { ...prev, [field]: [...currentArray, value] }
      } else {
        // Remove item
        return { ...prev, [field]: currentArray.filter(item => item !== value) }
      }
    })
  }

  // Add food or drink preference
  const addPreference = (type: 'food' | 'drinks' | 'allergies', value: string) => {
    if (!value.trim()) return
    
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: [...prev.preferences[type], value.trim()]
      }
    }))
  }

  // Remove food or drink preference
  const removePreference = (type: 'food' | 'drinks' | 'allergies', index: number) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: prev.preferences[type].filter((_, i) => i !== index)
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Guest name is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.arrivalDate || !formData.departureDate) {
      toast({
        title: "Validation Error",
        description: "Arrival and departure dates are required",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetchWithAuth('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add guest')
      }

      toast({
        title: "Success",
        description: "Guest added successfully"
      })
      
      // Redirect to the guests page
      router.push('/guests')
    } catch (error) {
      console.error('Error adding guest:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add guest",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          className="mr-4" 
          onClick={() => router.push('/guests')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Add New Guest</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the guest's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name"
                    placeholder="Enter guest name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input 
                    id="nationality"
                    placeholder="Enter nationality"
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestType">Guest Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.guestType}
                    onValueChange={(value) => handleChange('guestType', value)}
                  >
                    <SelectTrigger id="guestType">
                      <SelectValue placeholder="Select guest type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Guest">Guest</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Charter">Charter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="room">Room/Cabin Number</Label>
                  <Input 
                    id="room"
                    placeholder="Enter room or cabin number"
                    value={formData.room}
                    onChange={(e) => handleChange('room', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-y-0 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="isVip">VIP Status</Label>
                    <p className="text-muted-foreground text-xs">Mark this guest as a VIP</p>
                  </div>
                  <Switch 
                    id="isVip"
                    checked={formData.isVip}
                    onCheckedChange={(checked) => handleChange('isVip', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Party Size</Label>
                  <div className="flex items-center space-x-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => handleChange('partySize', Math.max(1, formData.partySize - 1))}
                    >
                      -
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{formData.partySize}</span>
                    </div>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => handleChange('partySize', formData.partySize + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Languages Spoken</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['English', 'German', 'Serbian', 'French', 'Italian', 'Spanish'].map(lang => {
                    const isSelected = formData.languagesSpoken.includes(lang);
                    return (
                      <Badge
                        key={lang}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
                        onClick={() => toggleArrayItem('languagesSpoken', lang)}
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
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Celebrity', 'Returning', 'Special Diet', 'Birthday', 'Anniversary'].map(tag => {
                    const isSelected = formData.tags.includes(tag);
                    return (
                      <Badge
                        key={tag}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
                        onClick={() => toggleArrayItem('tags', tag)}
                      >
                        <span>{tag}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Image</CardTitle>
              <CardDescription>Add a photo of the guest</CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedImageCapture
                onImageCapture={handleImageCapture}
                initialImage={formData.imageUrl}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stay Details</CardTitle>
              <CardDescription>Enter stay duration and location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Arrival Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.arrivalDate ? format(formData.arrivalDate, "PPP") : "Select arrival date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.arrivalDate}
                        onSelect={(date: Date | undefined) => date && handleChange('arrivalDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Departure Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.departureDate ? format(formData.departureDate, "PPP") : "Select departure date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.departureDate}
                        onSelect={(date: Date | undefined) => date && handleChange('departureDate', date)}
                        initialFocus
                        disabled={(date: Date) => date < formData.arrivalDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    placeholder="Enter location (e.g., Marina, Port)"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="broker">Broker</Label>
                  <Input 
                    id="broker"
                    placeholder="Enter broker name"
                    value={formData.broker}
                    onChange={(e) => handleChange('broker', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assignedCrew">Assigned Crew Member</Label>
                <Input 
                  id="assignedCrew"
                  placeholder="Enter crew member name"
                  value={formData.assignedCrew}
                  onChange={(e) => handleChange('assignedCrew', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Guest Preferences</CardTitle>
              <CardDescription>Record the guest's preferences and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Food Preferences</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Add a food preference"
                    onKeyPress={(e) => {
                      if(e.key === 'Enter') {
                        e.preventDefault();
                        addPreference('food', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousSibling as HTMLInputElement;
                      addPreference('food', input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
                {formData.preferences.food.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferences.food.map((item, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        <span>{item}</span>
                        <button 
                          type="button" 
                          className="ml-1 rounded-full hover:bg-muted p-0.5" 
                          onClick={() => removePreference('food', index)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Drink Preferences</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Add a drink preference"
                    onKeyPress={(e) => {
                      if(e.key === 'Enter') {
                        e.preventDefault();
                        addPreference('drinks', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousSibling as HTMLInputElement;
                      addPreference('drinks', input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
                {formData.preferences.drinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferences.drinks.map((item, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        <span>{item}</span>
                        <button 
                          type="button" 
                          className="ml-1 rounded-full hover:bg-muted p-0.5" 
                          onClick={() => removePreference('drinks', index)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Allergies & Dietary Restrictions</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Add an allergy or restriction"
                    onKeyPress={(e) => {
                      if(e.key === 'Enter') {
                        e.preventDefault();
                        addPreference('allergies', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousSibling as HTMLInputElement;
                      addPreference('allergies', input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
                {formData.preferences.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferences.allergies.map((item, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        <span>{item}</span>
                        <button 
                          type="button" 
                          className="ml-1 rounded-full hover:bg-muted p-0.5" 
                          onClick={() => removePreference('allergies', index)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Room Temperature Preference</Label>
                  <span className="text-sm font-medium">{formData.preferences.roomTemperature}°C</span>
                </div>
                <Slider
                  min={16}
                  max={30}
                  step={1}
                  value={[formData.preferences.roomTemperature]}
                  onValueChange={(value) => handlePreferenceChange('roomTemperature', value[0])}
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Cleaning Time</Label>
                <RadioGroup 
                  value={formData.preferences.cleaningTime}
                  onValueChange={(value) => handlePreferenceChange('cleaningTime', value)}
                  className="flex flex-col sm:flex-row gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Morning" id="morning" />
                    <Label htmlFor="morning">Morning</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Afternoon" id="afternoon" />
                    <Label htmlFor="afternoon">Afternoon</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Evening" id="evening" />
                    <Label htmlFor="evening">Evening</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Add any other relevant information</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Enter any additional notes, special requirements, or information about the guest"
                className="min-h-[120px]"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/guests')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding Guest..." : "Add Guest"}
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  )
}