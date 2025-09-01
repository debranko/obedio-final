import { PrismaClient } from '@prisma/client'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'
import { ProvisionService } from '@/lib/services/provision-service'

// Kreiranje Prisma klijenta
const prisma = new PrismaClient()

/**
 * Generiše jedinstveni ID uređaja
 * @param type Tip uređaja ('BUTTON', 'SENSOR', itd.)
 * @returns Formatirani jedinstveni ID
 */
function generateDeviceUid(type: string = 'BTN'): string {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const counter = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `OB-${year}-${type}-${random}${counter}`
}

/**
 * Obrađuje zahtev za provisioning od strane uređaja
 * @param payload Podaci poslati od strane uređaja
 * @returns Informacije o kreiranom uređaju ili null ako provisioning nije uspeo
 */
export async function handleProvisionRequest(payload: any): Promise<any> {
  console.log('Processing provision request:', payload)
  
  try {
    // Validacija payload-a
    if (!payload.token) {
      console.error('Token missing in provision request')
      return { error: 'Token is required' }
    }
    
    // Verifikacija tokena
    const token = await ProvisionService.verifyToken(payload.token)
    
    if (!token) {
      console.error('Invalid or expired token:', payload.token)
      return { error: 'Invalid or expired token' }
    }
    
    // Kreiranje novog uređaja
    const deviceType = payload.deviceType || 'BUTTON'
    const deviceUid = generateDeviceUid(deviceType.substring(0, 3))
    
    // Uzmi sobu iz tokena
    const room = token.room
    
    const newDevice = await prisma.device.create({
      data: {
        uid: deviceUid,
        name: `${room} ${deviceType}`, // Default ime
        room: room,
        battery: payload.battery || 100,
        signal: payload.signal || 100,
        lastSeen: new Date()
      }
    })
    
    // Označi token kao iskorišćen
    await ProvisionService.markTokenAsUsed(token.id, newDevice.id)
    
    // Kreiraj log za uspešan provisioning
    await prisma.provisionLog.create({
      data: {
        tokenId: token.id,
        action: 'SUCCESS',
        deviceUid: deviceUid,
        message: `Device successfully provisioned: ${deviceUid}`,
        metadata: JSON.stringify(payload),
        ipAddress: payload.ipAddress
      }
    })
    
    // Emituj SSE događaj za ažuriranje UI-ja
    emitter.emit(SSE_EVENTS.DEVICE_UPDATE, {
      action: 'ADDED',
      device: newDevice
    })
    
    // Vrati informacije o kreiranom uređaju
    return {
      success: true,
      deviceId: newDevice.id,
      deviceUid,
      room
    }
  } catch (error) {
    console.error('Error processing provision request:', error)
    
    // Ako je token validan, kreira log o neuspelom pokušaju
    if (payload.token) {
      try {
        const token = await prisma.provisionToken.findFirst({
          where: { token: payload.token }
        })
        
        if (token) {
          await prisma.provisionLog.create({
            data: {
              tokenId: token.id,
              action: 'FAILURE',
              deviceUid: payload.deviceUid || null,
              message: `Provision attempt failed: ${error}`,
              metadata: JSON.stringify(payload),
              ipAddress: payload.ipAddress
            }
          })
        }
      } catch (logError) {
        console.error('Error creating provision log:', logError)
      }
    }
    
    return { error: 'Provision request failed', details: String(error) }
  }
}
