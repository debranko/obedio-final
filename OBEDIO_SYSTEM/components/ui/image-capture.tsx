"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Trash2, X, Check, RotateCw } from "lucide-react"

interface ImageCaptureProps {
  onImageCapture: (imageData: string | null) => void
  initialImage?: string | null
}

export function ImageCapture({ onImageCapture, initialImage = null }: ImageCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Check device capabilities
  const [hasCamera, setHasCamera] = useState(false)
  
  useEffect(() => {
    // Check if device has camera capabilities
    const checkCameraCapabilities = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setHasCamera(videoDevices.length > 0)
      } catch (err) {
        console.error("Error checking camera capabilities:", err)
        setHasCamera(false)
      }
    }
    
    checkCameraCapabilities()
  }, [])
  
  // Initialize or stop camera stream
  useEffect(() => {
    let stream: MediaStream | null = null
    
    const startCamera = async () => {
      try {
        if (!cameraActive) return
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        
        setHasCameraPermission(true)
        setCameraError(null)
      } catch (err) {
        console.error("Error accessing camera:", err)
        setCameraError("Could not access camera")
        setHasCameraPermission(false)
        setCameraActive(false)
      }
    }
    
    if (cameraActive) {
      startCamera()
    }
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraActive])
  
  // Capture image from camera
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Get image data as base64 string
    const imageData = canvas.toDataURL('image/jpeg')
    
    // Set captured image and stop camera
    setCapturedImage(imageData)
    setCameraActive(false)
    
    // Call the callback with image data
    onImageCapture(imageData)
  }
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    const reader = new FileReader()
    
    reader.onloadend = () => {
      const imageData = reader.result as string
      setCapturedImage(imageData)
      onImageCapture(imageData)
    }
    
    reader.readAsDataURL(file)
  }
  
  // Clear captured image
  const clearImage = () => {
    setCapturedImage(null)
    onImageCapture(null)
  }
  
  // Accept captured image
  const acceptImage = () => {
    onImageCapture(capturedImage)
  }
  
  return (
    <div className="flex flex-col items-center">
      {/* Camera or Image Preview */}
      <div className="relative w-full max-w-md aspect-[4/3] mb-4 overflow-hidden bg-muted rounded-lg">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4">
                <div className="text-destructive mb-2">Camera access error</div>
                <div className="text-sm text-muted-foreground text-center">{cameraError}</div>
              </div>
            )}
          </>
        ) : (
          capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-contain" 
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 p-4">
              <Camera className="h-12 w-12 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground text-center">
                No image captured
              </div>
            </div>
          )
        )}
      </div>
      
      {/* Controls */}
      <div className="flex gap-2 flex-wrap justify-center">
        {cameraActive ? (
          <>
            <Button onClick={captureImage} variant="default">
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </Button>
            <Button onClick={() => setCameraActive(false)} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </>
        ) : capturedImage ? (
          <>
            <Button onClick={acceptImage} variant="default">
              <Check className="h-4 w-4 mr-2" />
              Use This Photo
            </Button>
            <Button onClick={clearImage} variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            {hasCamera && (
              <Button onClick={() => setCameraActive(true)} variant="outline">
                <RotateCw className="h-4 w-4 mr-2" />
                Retake
              </Button>
            )}
          </>
        ) : (
          <>
            {hasCamera && (
              <Button onClick={() => setCameraActive(true)} variant="default">
                <Camera className="h-4 w-4 mr-2" />
                Open Camera
              </Button>
            )}
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant={hasCamera ? "outline" : "default"}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </>
        )}
      </div>
    </div>
  )
}
