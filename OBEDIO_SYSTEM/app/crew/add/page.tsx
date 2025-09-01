'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Save, 
  UserIcon,
  BuildingIcon,
  Camera,
  CalendarRange
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/use-toast'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { EnhancedImageCapture } from '@/components/guests/enhanced-image-capture'

export default function AddCrewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    team: '',
    languages: [] as string[],
    responsibilities: [] as string[],
    experience: '',
    imageUrl: '',
    onLeave: false
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handler za upravljanje slikom avatara
  const handleImageCapture = async (imageDataUrl: string | null) => {
    if (!imageDataUrl) {
      setFormData(prev => ({ ...prev, imageUrl: '' }))
      return
    }
    
    try {
      // Simulacija uploada slike na server
      // U realnoj implementaciji bi poslali sliku na backend
      setFormData(prev => ({ ...prev, imageUrl: imageDataUrl }))
    } catch (err) {
      console.error('Error uploading image:', err)
      toast({
        title: "Error",
        description: "There was an error uploading the image.",
        variant: "destructive"
      })
    }
  }

  // Toggle za jezike
  const toggleLanguage = (language: string) => {
    setFormData(prev => {
      const languages = [...prev.languages]
      const index = languages.indexOf(language)
      
      if (index === -1) {
        // Dodaj jezik
        return { ...prev, languages: [...languages, language] }
      } else {
        // Ukloni jezik
        return { ...prev, languages: languages.filter(l => l !== language) }
      }
    })
  }

  // Toggle za područja odgovornosti
  const toggleResponsibility = (responsibility: string) => {
    setFormData(prev => {
      const responsibilities = [...prev.responsibilities]
      const index = responsibilities.indexOf(responsibility)
      
      if (index === -1) {
        // Dodaj odgovornost
        return { ...prev, responsibilities: [...responsibilities, responsibility] }
      } else {
        // Ukloni odgovornost
        return { ...prev, responsibilities: responsibilities.filter(r => r !== responsibility) }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.password || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Password, and Position)",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetchWithAuth('/api/crew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-bypass': 'true'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          team: formData.team,
          languages: formData.languages,
          responsibilities: formData.responsibilities,
          experience: formData.experience,
          imageUrl: formData.imageUrl,
          onLeave: formData.onLeave
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('Server error details:', errorData)
        throw new Error(errorData.error || 'Failed to add crew member')
      }

      toast({
        title: "Success",
        description: "Crew member added successfully"
      })
      
      // Redirect back to crew list
      router.push('/crew')
    } catch (error) {
      console.error('Error adding crew member:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add crew member",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Crew List
        </Button>
        <h1 className="text-2xl font-bold">Add New Crew Member</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  Basic Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Position *</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    required
                  >
                    <option value="" disabled>Select position</option>
                    <option value="Captain">Captain</option>
                    <option value="First Officer">First Officer</option>
                    <option value="Chief Engineer">Chief Engineer</option>
                    <option value="Chef">Chef</option>
                    <option value="Chief Steward">Chief Steward</option>
                    <option value="Steward">Steward</option>
                    <option value="Deckhand">Deckhand</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Security Officer">Security Officer</option>
                  </select>
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <BuildingIcon className="mr-2 h-5 w-5" />
                  Additional Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="Deck">Deck</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Interior">Interior</option>
                    <option value="Galley">Galley</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Input 
                    id="team"
                    value={formData.team}
                    onChange={(e) => handleChange('team', e.target.value)}
                    placeholder="e.g. Bridge Team, Engine Team"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="languages">Languages (comma separated)</Label>
                  <Input 
                    id="languages"
                    value={formData.languages}
                    onChange={(e) => handleChange('languages', e.target.value)}
                    placeholder="e.g. English, French, Italian"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="onLeave" className="font-medium">On Leave</Label>
                    <Switch
                      id="onLeave"
                      checked={formData.onLeave}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, onLeave: checked }))}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mark crew member as currently on leave
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['English', 'German', 'French', 'Italian', 'Spanish', 'Serbian'].map(lang => {
                      const isSelected = formData.languages.includes(lang);
                      return (
                        <Badge
                          key={lang}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
                          onClick={() => toggleLanguage(lang)}
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
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="Add new language"
                      className="flex-grow"
                      id="newLanguage"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !formData.languages.includes(value)) {
                            toggleLanguage(value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        const input = document.getElementById('newLanguage') as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !formData.languages.includes(value)) {
                          toggleLanguage(value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label>Areas of Responsibility</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['Safety', 'Navigation', 'Engineering', 'Service', 'Maintenance', 'Housekeeping', 'Galley', 'Guest Relations'].map(resp => {
                      const isSelected = formData.responsibilities.includes(resp);
                      return (
                        <Badge
                          key={resp}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
                          onClick={() => toggleResponsibility(resp)}
                        >
                          <span>{resp}</span>
                        </Badge>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="Add new responsibility area"
                      className="flex-grow"
                      id="newResponsibility"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !formData.responsibilities.includes(value)) {
                            toggleResponsibility(value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        const input = document.getElementById('newResponsibility') as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !formData.responsibilities.includes(value)) {
                          toggleResponsibility(value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="experience">Work Experience</Label>
                  <Textarea
                    id="experience"
                    placeholder="Enter crew member's previous work experience, vessels, etc."
                    className="min-h-[100px]"
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Include previous vessels, positions, and notable experiences</p>
                </div>
              </div>
            </div>
          </div>
          
          <Card className="mt-6">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  Crew Avatar
                </h3>
                <p className="text-sm text-muted-foreground">Add a photo of the crew member</p>
              </div>
              
              <div>
                <EnhancedImageCapture
                  onImageCapture={handleImageCapture}
                  initialImage={formData.imageUrl}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/crew')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
