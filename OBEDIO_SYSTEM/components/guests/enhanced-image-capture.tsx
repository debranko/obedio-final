"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Upload, Trash2, RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface EnhancedImageCaptureProps {
  initialImage?: string | null
  onImageCapture: (imageDataUrl: string | null) => void
  guestId?: string
  className?: string
}

export function EnhancedImageCapture({
  initialImage,
  onImageCapture,
  guestId,
  className
}: EnhancedImageCaptureProps) {
  const { toast } = useToast()
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload' | 'none'>('none')
  const [imageData, setImageData] = useState<string | null>(initialImage || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Check if device is mobile (for better camera handling)
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      return /android|iPad|iPhone|iPod/i.test(userAgent)
    }
    setIsMobile(checkMobile())
  }, [])
  
  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [])
  
  // Start camera
  const startCamera = async () => {
    if (isCameraActive) return
    
    try {
      const constraints = {
        video: {
          facingMode: isMobile ? "environment" : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
      
      // Set capture mode first to ensure UI updates correctly
      setCaptureMode('camera')
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setHasCameraPermission(true)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setHasCameraPermission(false)
      // Reset capture mode if camera fails
      setCaptureMode('none')
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsCameraActive(false)
    setCaptureMode('none')
  }
  
  // Capture image from camera
  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) return
    
    const canvas = canvasRef.current
    const video = videoRef.current
    
    // Set canvas dimensions to match video
    const { videoWidth, videoHeight } = video
    canvas.width = videoWidth
    canvas.height = videoHeight
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d')
    if (!context) return
    
    // Flip horizontally for selfie mode if not mobile
    if (!isMobile) {
      context.scale(-1, 1)
      context.drawImage(video, -videoWidth, 0, videoWidth, videoHeight)
      context.scale(-1, 1) // Reset scale
    } else {
      context.drawImage(video, 0, 0, videoWidth, videoHeight)
    }
    
    // Get data URL and upload
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setImageData(dataUrl)
    
    // Stop camera after capture
    stopCamera()
    
    // Upload the captured image
    handleImageUpload(dataUrl)
  }
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select a valid image file",
        variant: "destructive",
      })
      return
    }
    
    // Read file as data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string
        setImageData(dataUrl)
        handleImageUpload(dataUrl)
      }
    }
    reader.readAsDataURL(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    setCaptureMode('none')
  }
  
  // Upload image to server
  const handleImageUpload = async (dataUrl: string) => {
    setIsUploading(true)
    
    try {
      // Call the parent's onImageCapture function to handle the upload
      onImageCapture(dataUrl)
      
      toast({
        title: "Image Saved",
        description: "The guest image has been updated.",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Trigger file upload via button
  const triggerFileUpload = () => {
    fileInputRef.current?.click()
    setCaptureMode('upload')
  }
  
  // Delete current image
  const deleteImage = () => {
    setImageData(null)
    onImageCapture(null)
    toast({
      title: "Image Removed",
      description: "The guest image has been removed.",
    })
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Main container */}
      <div className="relative">
        {/* Image preview or camera view */}
        <Card className="relative flex justify-center items-center w-full h-60 overflow-hidden">
          {captureMode === 'camera' && (
            <>
              <video
                ref={videoRef}
                className="absolute h-full w-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isCameraActive && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
                  <Button
                    onClick={captureImage}
                    size="icon"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-white shadow-md"
                  >
                    <div className="h-8 w-8 rounded-full border-2 border-primary" />
                  </Button>
                </div>
              )}
            </>
          )}
          
          {captureMode !== 'camera' && (
            <>
              {isUploading ? (
                <Skeleton className="w-full h-full" />
              ) : imageData ? (
                <>
                  <Image
                    src={imageData}
                    alt="Guest"
                    fill
                    className="object-cover rounded-md"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      onClick={deleteImage}
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                  <div className="rounded-full bg-muted p-6">
                    <Camera className="h-8 w-8" />
                  </div>
                  <p className="mt-2 text-sm">No Image Available</p>
                </div>
              )}
            </>
          )}
        </Card>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          tabIndex={-1}
        />
        
        {/* Camera controls */}
        {captureMode !== 'camera' && (
          <div className="mt-3 flex justify-center gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={startCamera}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={triggerFileUpload}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </div>
        )}
        
        {captureMode === 'camera' && (
          <div className="mt-3 flex justify-center">
            <Button 
              variant="outline" 
              onClick={stopCamera}
            >
              Cancel
            </Button>
          </div>
        )}
        
        {/* Upload status */}
        {isUploading && (
          <div className="mt-2 flex items-center justify-center text-sm">
            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            Uploading...
          </div>
        )}
        
        {imageData && !isUploading && !captureMode && (
          <div className="mt-2 flex items-center justify-center text-sm text-green-600">
            <CheckCircle className="h-3 w-3 mr-2" />
            Image saved
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedImageCapture