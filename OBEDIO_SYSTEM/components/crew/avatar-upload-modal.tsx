'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { toast } from '@/components/ui/use-toast'
import { Upload, X } from 'lucide-react'

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number
  userName: string
  currentAvatar?: string | null
  onAvatarUpdated: (avatarUrl: string) => void
}

export function AvatarUploadModal({ 
  isOpen,
  onClose,
  userId,
  userName,
  currentAvatar,
  onAvatarUpdated
}: AvatarUploadModalProps) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image file less than 5MB",
        variant: "destructive"
      })
      return
    }

    setSelectedFile(file)

    // Create a preview URL
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleClearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(currentAvatar || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file to upload",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('userId', userId.toString())
      formData.append('file', selectedFile)

      const response = await fetchWithAuth('/api/crew/avatar', {
        method: 'POST',
        body: formData,
        // Important: Don't set Content-Type header, browser will set it with proper boundary
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload avatar')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Avatar uploaded successfully"
      })
      
      // Call back with the new avatar URL
      onAvatarUpdated(data.user.avatar)
      
      // Close the modal
      onClose()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Profile Image</DialogTitle>
          <DialogDescription>
            Upload a profile image for {userName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          <Avatar className="h-24 w-24 mb-4">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt={userName} />
            ) : (
              <AvatarFallback>
                {userName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            )}
          </Avatar>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={handleSelectFile}
              disabled={loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Select Image
            </Button>
            
            {selectedFile && (
              <Button 
                variant="outline" 
                onClick={handleClearSelection}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
          
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || loading}>
            {loading ? "Uploading..." : "Upload Avatar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
