'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  CheckCircle,
  Edit,
  Save,
  X,
  Phone,
  User,
  MapPin,
  Briefcase,
  Globe,
  Check
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

import { CrewMember } from "@/app/crew/adapters";

interface CrewDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  crewMember?: CrewMember
  onUpdate?: (updated: CrewMember) => void
}

type EditableCrewMember = {
  _id: string
  team: string
  responsibility?: string
  languages: string[]
  emergency_contact: {
    name: string
    phone: string
  }
}

export function CrewDetailsDrawer({ isOpen, onClose, crewMember, onUpdate }: CrewDetailsDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()
  
  // Jednostavna inicijalizacija stanja bez useMemo
  const initialState: EditableCrewMember = {
    _id: '',
    team: '',
    responsibility: '',
    languages: [],
    emergency_contact: {
      name: '',
      phone: ''
    }
  }
  
  // Stanje za uređivanje podataka
  const [editableData, setEditableData] = useState<EditableCrewMember>(initialState)
  
  // Resetiranje na inicijalne vrijednosti kada se otvori drawer
  useEffect(() => {
    if (crewMember && isOpen) {
      setEditableData({
        _id: crewMember._id,
        team: crewMember.team || '',
        responsibility: crewMember.responsibility || '',
        languages: crewMember.languages || [],
        emergency_contact: {
          name: crewMember.emergency_contact?.name || '',
          phone: crewMember.emergency_contact?.phone || ''
        }
      })
      setIsEditing(false)
    }
  }, [crewMember, isOpen])
  
  const availableLanguages = [
    { id: "english", label: "English" },
    { id: "german", label: "German" },
    { id: "spanish", label: "Spanish" },
    { id: "serbian", label: "Serbian" },
    { id: "italian", label: "Italian" }
  ]
  
  const availableTeams = [
    { id: "deck", label: "Deck" },
    { id: "engineering", label: "Engineering" },
    { id: "interior", label: "Interior" },
    { id: "galley", label: "Galley" },
    { id: "security", label: "Security" }
  ]
  
  const availablePositions = [
    { id: "captain", label: "Captain" },
    { id: "first_officer", label: "First Officer" },
    { id: "chief_engineer", label: "Chief Engineer" },
    { id: "chef", label: "Chef" },
    { id: "chief_steward", label: "Chief Steward" },
    { id: "steward", label: "Steward" },
    { id: "deckhand", label: "Deckhand" },
    { id: "engineer", label: "Engineer" },
    { id: "security_officer", label: "Security Officer" }
  ]
  
  // Memorirana lista timova za select komponentu
  const teamSelectItems = useMemo(() => (
    <>
      {availableTeams.map(team => (
        <SelectItem key={team.id} value={team.label}>{team.label}</SelectItem>
      ))}
      <SelectItem value="">Not assigned</SelectItem>
    </>
  ), [availableTeams])
  
  // Promjena jezika - koristimo useCallback da izbjegnemo probleme kod renderiranja
  const toggleLanguage = useCallback((language: string) => {
    if (!isEditing) return
    
    setEditableData(prev => {
      const newLanguages = [...prev.languages]
      if (newLanguages.includes(language)) {
        return {
          ...prev,
          languages: newLanguages.filter(lang => lang !== language)
        }
      } else {
        return {
          ...prev,
          languages: [...newLanguages, language]
        }
      }
    })
  }, [isEditing])
  
  // Spremanje promjena
  const handleSave = async () => {
    if (!crewMember) return
    
    try {
      setLoading(true)
      
      // Provjera podataka koje šaljemo
      const requestData = {
        team: editableData.team,
        responsibility: editableData.responsibility,
        languages: editableData.languages,
        emergency_contact: editableData.emergency_contact
      };
      
      console.log('Sending data to API:', requestData);
      console.log('Crew member ID:', crewMember._id);
      
      // Pretvaranje string ID-a u broj (u adapteru se broj pretvara u string)
      // _id je string, a API očekuje broj, pa moramo pretvoriti natrag
      const numericId = parseInt(crewMember._id);
      
      // API poziv za ažuriranje člana posade
      const response = await fetchWithAuth(`/api/crew/${numericId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      // Pokušaj dohvatiti više informacija o grešci
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`Greška pri ažuriranju: ${response.status} - ${errorText || 'Nepoznata greška'}`)
      }
      
      // Obavijest o uspješnom spremanju
      toast({
        title: "Uspješno ažuriranje",
        description: "Detalji člana posade su uspješno ažurirani.",
        variant: "default"
      })
      
      // Izlaz iz edit moda
      setIsEditing(false)
      
      // Obavijest parent komponenti o ažuriranju
      if (onUpdate && crewMember) {
        onUpdate({
          ...crewMember,
          team: editableData.team,
          responsibility: editableData.responsibility,
          languages: editableData.languages,
          emergency_contact: editableData.emergency_contact
        })
      }
      
    } catch (error) {
      console.error('Greška pri ažuriranju:', error)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri ažuriranju podataka.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancel = () => {
    // Reset na originalne vrijednosti
    if (crewMember) {
      setEditableData({
        _id: crewMember._id,
        team: crewMember.team || '',
        responsibility: crewMember.responsibility || '',
        languages: crewMember.languages || [],
        emergency_contact: {
          name: crewMember.emergency_contact?.name || '',
          phone: crewMember.emergency_contact?.phone || ''
        }
      })
    }
    setIsEditing(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent 
        className="overflow-y-auto" 
        side="right"
      >
        {/* Header section with avatar and name */}
        <SheetHeader className="pb-6 relative pt-2">
          <SheetTitle className="text-xl font-bold">
            {crewMember?.name || 'Crew Member'}
          </SheetTitle>
          
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="relative">
              <Avatar className="h-28 w-28 border-2 border-primary/20 shadow-md">
                {crewMember?.avatarUrl ? (
                  <AvatarImage src={crewMember.avatarUrl} alt={crewMember.name} />
                ) : (
                  <AvatarFallback className="text-2xl font-semibold bg-primary/5">
                    {crewMember?.name?.split(' ').map(n => n?.[0]).join('') || 'CM'}
                  </AvatarFallback>
                )}
              </Avatar>
              {isEditing && (
                <div className="absolute -bottom-2 -right-2">
                  <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">{crewMember?.name}</h2>
              <p className="text-muted-foreground">{crewMember?.position}</p>
              <div 
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${
                  crewMember?.status === 'on_duty' 
                    ? "bg-green-100 text-green-700 border border-green-300" 
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {crewMember?.status === 'on_duty' ? "On Duty" : "Off Duty"}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />
        
        {/* Main content section */}
        <div className="space-y-6 py-4 overflow-y-auto">
          {/* Team Information */}
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Department
            </Label>
            {isEditing ? (
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editableData.team} 
                onChange={(e) => {
                  setEditableData({...editableData, team: e.target.value})
                }}
              >
                <option value="" className="text-muted-foreground">Select department (optional)</option>
                {availableTeams.map(team => (
                  <option key={team.id} value={team.label}>{team.label}</option>
                ))}
              </select>
            ) : (
              <div className="rounded-md border p-3 text-sm">
                {crewMember?.team || 'Not assigned'}
                {crewMember?.department && ` (${crewMember.department})`}
              </div>
            )}
          </div>
          
          {/* Languages */}
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Languages
            </Label>
            <div className="rounded-md border p-3 bg-background/50">
              <div className="grid grid-cols-2 gap-3">
                {availableLanguages.map((language) => (
                  <div 
                    key={language.id} 
                    className="flex items-center space-x-2"
                  >
                    <Checkbox 
                      id={`language-${language.id}`} 
                      checked={isEditing 
                        ? editableData.languages.includes(language.label)
                        : crewMember?.languages?.includes?.(language.label)}
                      disabled={!isEditing}
                      onCheckedChange={isEditing ? 
                        () => toggleLanguage(language.label) : undefined}
                    />
                    <label 
                      htmlFor={`language-${language.id}`}
                      className={`text-sm font-medium leading-none ${
                        isEditing ? 'cursor-pointer' : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      }`}
                    >
                      {language.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zone of Responsibility */}
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Zone of Responsibility
            </Label>
            {isEditing ? (
              <Input
                placeholder="Enter zone of responsibility"
                value={editableData.responsibility || ''}
                onChange={(e) => {
                  setEditableData({...editableData, responsibility: e.target.value})
                }}
              />
            ) : (
              <div className="rounded-md border p-3 text-sm">
                {crewMember?.responsibility || 'No specific zone assigned'}
              </div>
            )}
          </div>
          
          {/* Emergency Contact */}
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Emergency Contact
            </Label>
            <div className="space-y-2">
              <div className="rounded-md border p-3 text-sm flex items-center justify-between">
                <span>Name:</span>
                {isEditing ? (
                  <Input
                    className="max-w-[200px] ml-2"
                    placeholder="Contact name"
                    value={editableData.emergency_contact?.name || ''}
                    onChange={(e) => {
                      setEditableData({
                        ...editableData, 
                        emergency_contact: {
                          ...editableData.emergency_contact,
                          name: e.target.value
                        }
                      })
                    }}
                  />
                ) : (
                  <span className="font-medium">{crewMember?.emergency_contact?.name || 'Not provided'}</span>
                )}
              </div>
              <div className="rounded-md border p-3 text-sm flex items-center justify-between">
                <span>Phone:</span>
                {isEditing ? (
                  <Input
                    className="max-w-[200px] ml-2"
                    placeholder="Contact phone"
                    value={editableData.emergency_contact?.phone || ''}
                    onChange={(e) => {
                      setEditableData({
                        ...editableData, 
                        emergency_contact: {
                          ...editableData.emergency_contact,
                          phone: e.target.value
                        }
                      })
                    }}
                  />
                ) : (
                  <span className="font-medium">{crewMember?.emergency_contact?.phone || 'Not provided'}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Areas of Responsibility */}
          {crewMember?.responsibilities && crewMember.responsibilities.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2">
                Areas of Responsibility
              </Label>
              <div className="rounded-md border p-3 bg-background/50">
                <div className="flex flex-wrap gap-2">
                  {crewMember.responsibilities.map((resp, index) => (
                    <div key={index} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs">
                      {resp}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with edit/save buttons */}
        <SheetFooter className="mt-6">
          {isEditing ? (
            <div className="w-full grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
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
          ) : (
            <Button 
              className="w-full" 
              variant="default" 
              onClick={() => setIsEditing(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Member Details
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
