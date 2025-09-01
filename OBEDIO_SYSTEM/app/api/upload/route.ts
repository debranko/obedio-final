import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check if the request is a FormData or a JSON request
    const contentType = request.headers.get('content-type') || ''
    
    let imageData: string | null = null
    let guestId: string | null = null

    // Handle FormData requests (from file input)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const imageFile = formData.get('image') as File
      guestId = formData.get('guestId') as string

      if (!imageFile) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 })
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer())
      imageData = buffer.toString('base64')
    } 
    // Handle JSON requests (from base64 string)
    else if (contentType.includes('application/json')) {
      const body = await request.json()
      imageData = body.image
      guestId = body.guestId || null
    }
    else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 })
    }

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    const uniqueId = guestId ? `guest_${guestId}_${Date.now()}` : `guest_${uuidv4().replace(/-/g, '')}${Date.now()}`
    
    // Check if we received base64 data
    let base64Data: string = imageData
    
    // If the data doesn't start with a data URI prefix, add it
    if (!base64Data.startsWith('data:image/')) {
      base64Data = `data:image/jpeg;base64,${base64Data}`
    }
    
    // Extract the actual base64 content
    const matches = base64Data.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/)
    
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: "Invalid image data format" }, { status: 400 })
    }
    
    const imageType = matches[1]
    const imageContent = matches[2]
    
    // Create filename based on image type
    const fileName = `${uniqueId}.${imageType === 'jpeg' || imageType === 'jpg' ? 'jpg' : imageType}`
    const imagePath = `/uploads/guests/${fileName}`
    const fullPath = join(process.cwd(), 'public', imagePath)
    
    // Ensure directory exists
    const uploadsDir = join(process.cwd(), 'public', '/uploads/guests')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (err) {
      console.error('Error creating directory:', err)
      // Continue even if the directory already exists
    }
    
    // Write the file
    await writeFile(fullPath, Buffer.from(imageContent, 'base64'))
    
    // Return the public URL of the uploaded image
    return NextResponse.json({ 
      success: true, 
      imageUrl: imagePath
    })
    
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
