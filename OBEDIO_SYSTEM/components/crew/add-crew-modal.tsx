'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { toast } from '@/components/ui/use-toast'

interface AddCrewModalProps {
  isOpen: boolean
  onClose: () => void
  onCrewAdded: () => void
}

export function AddCrewModal({ isOpen, onClose, onCrewAdded }: AddCrewModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: ''
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      // Handle "none" department value
      const submitData = {
        ...formData,
        department: formData.department === 'none' ? undefined : formData.department
      }

      const response = await fetchWithAuth('/api/crew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add crew member')
      }

      toast({
        title: "Success",
        description: "Crew member added successfully"
      })
      setFormData({
        name: '',
        email: '',
        password: '',
        role: '',
        department: ''
      })
      onCrewAdded()
      onClose()
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
    <Dialog open={isOpen} onOpenChange={open => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Crew Member</DialogTitle>
          <DialogDescription>
            Create a new crew member account. They will receive login credentials to access the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Position *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Captain">Captain</SelectItem>
                  <SelectItem value="First Officer">First Officer</SelectItem>
                  <SelectItem value="Chief Engineer">Chief Engineer</SelectItem>
                  <SelectItem value="Chef">Chef</SelectItem>
                  <SelectItem value="Chief Steward">Chief Steward</SelectItem>
                  <SelectItem value="Steward">Steward</SelectItem>
                  <SelectItem value="Deckhand">Deckhand</SelectItem>
                  <SelectItem value="Engineer">Engineer</SelectItem>
                  <SelectItem value="Security Officer">Security Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleChange('department', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Deck">Deck</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Interior">Interior</SelectItem>
                  <SelectItem value="Galley">Galley</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Crew Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
