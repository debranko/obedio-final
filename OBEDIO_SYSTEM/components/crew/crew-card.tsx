'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { CrewMember } from "@/app/crew/adapters"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { Globe, Phone, MapPin, CheckCircle } from "lucide-react"

interface CrewCardProps {
  crew: CrewMember
  onClick: () => void
}

export function CrewCard({ crew, onClick }: CrewCardProps) {
  const [status, setStatus] = useState<'on_duty' | 'off_duty'>(crew.status)
  const [loading, setLoading] = useState(false)
  
  // Koristimo useEffect za ažuriranje statusa kada se promijeni crew prop
  useEffect(() => {
    setStatus(crew.status)
  }, [crew.status])

  const handleStatusChange = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setLoading(true)
      const newStatus = status === 'on_duty' ? 'off_duty' : 'on_duty'
      
      // API poziv za promenu statusa člana posade
      const response = await fetchWithAuth(`/api/crew/${crew._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error(`Greška pri promeni statusa: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`Status changed for ${crew.name} to ${data.status}`)
      
      // Ažuriranje lokalnog stanja
      setStatus(data.status)
    } catch (error) {
      console.error('Greška pri promeni statusa:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors duration-200 shadow-sm h-full flex flex-col"
      onClick={onClick}
    >
      <CardContent className="p-2 flex flex-col h-full">
        {/* Status badge - manji i kompaktniji */}
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs font-medium text-muted-foreground">Status:</div>
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              status === 'on_duty' 
                ? "bg-green-100 text-green-700 border border-green-300" 
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {status === 'on_duty' ? "✓ On Duty" : "✗ Off Duty"}
          </div>
        </div>

        {/* Avatar and name - slično dizajnu sa slike */}
        <div className="flex justify-center my-1">
          <Avatar className="h-14 w-14 bg-muted">
            {crew.avatarUrl ? (
              <AvatarImage src={crew.avatarUrl} alt={crew.name} />
            ) : (
              <AvatarFallback className="text-base font-medium bg-muted">
                {crew.name.split(' ').map(n => n?.[0]).join('')}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="text-center mb-1.5">
          <h3 className="font-medium text-sm leading-tight">{crew.name}</h3>
          <p className="text-xs text-muted-foreground">{crew.position || 'Crew Member'}</p>
        </div>
        
        <div className="mb-1.5 text-xs">
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">Dept:</div>
            <div className="text-xs">{crew.team || 'N/A'}</div>
          </div>
        </div>
        
        <div className="mb-1.5 text-xs">
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">Zone:</div>
            <div className="text-xs">{crew.responsibility || 'No zone assigned'}</div>
          </div>
        </div>

        {/* Languages */}
        <div className="mb-1.5">
          <div className="flex items-center text-xs">
            <span className="text-muted-foreground">Languages:</span>
          </div>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {crew.languages && crew.languages.length > 0 ? (
              crew.languages.map(lang => (
                <span 
                  key={lang} 
                  className="px-1.5 text-[10px] rounded bg-primary-foreground"
                >
                  {lang}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
        </div>
        
        {/* Emergency contact */}
        <div className="mb-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Emergency:</span>
            <span className="text-xs">
              {crew.emergency_contact ? (
                crew.emergency_contact.name || crew.emergency_contact.phone || 'N/A'
              ) : 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Action button - kompaktniji */}
        <Button 
          variant="outline"
          size="sm"
          className={`w-full mt-auto h-7 text-[11px] font-normal rounded ${
            status === 'on_duty' 
              ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' 
              : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
          onClick={handleStatusChange}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-1 h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              {status === 'on_duty' ? (
                <>Check Out</>
              ) : (
                <>Check In</>
              )}
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
