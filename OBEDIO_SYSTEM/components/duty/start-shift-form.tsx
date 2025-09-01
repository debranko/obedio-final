'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { PlayCircle, Loader2 } from 'lucide-react'

interface User {
  id: number
  name: string
  role: string
}

interface StartShiftFormProps {
  users: User[]
  onSuccess: () => void
}

export function StartShiftForm({ users, onSuccess }: StartShiftFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleStartShift = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Izaberite korisnika',
        description: 'Morate izabrati korisnika za započinjanje smene.',
        variant: 'destructive',
        duration: 3000
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: parseInt(selectedUserId)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Nije moguće započeti smenu')
      }

      const data = await response.json()
      
      toast({
        title: 'Smena započeta',
        description: `Uspešno ste započeli smenu za korisnika.`,
        duration: 3000
      })

      setSelectedUserId('')
      onSuccess()
    } catch (error: any) {
      console.error('Greška pri započinjanju smene:', error)
      toast({
        title: 'Greška',
        description: error.message || 'Nije moguće započeti smenu. Pokušajte ponovo.',
        variant: 'destructive',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Započni novu smenu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Izaberite korisnika</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Izaberite korisnika" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleStartShift} disabled={loading || !selectedUserId}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Započinjanje...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Započni smenu
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
