import { PrismaClient } from '@prisma/client'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'

// Kreiraj Prisma klijenta
const prisma = new PrismaClient()

/**
 * Kreira novi zahtev za servis kada je pritisnuto dugme
 */
export async function handleButtonPress(deviceId: string, payload: any) {
  try {
    if (!deviceId) {
      console.error('Nedostaje deviceId u MQTT poruci')
      return
    }

    // Pronaći uređaj u bazi
    const device = await prisma.device.findUnique({
      where: { uid: deviceId }
    })

    if (!device) {
      console.warn(`Nepoznat uređaj sa ID-om ${deviceId}`)
      return
    }

    // Ako uređaj nije aktivan, ignorišemo pritisak dugmeta
    if (!device.isActive) {
      console.warn(`Ignorišem pritisak dugmeta za neaktivan uređaj ${device.name} (ID: ${device.id})`)
      return
    }

    // Ažuriramo lastSeen za uređaj
    await prisma.device.update({
      where: { id: device.id },
      data: { lastSeen: new Date() }
    })

    // Kreiramo novi zahtev
    const newRequest = await prisma.request.create({
      data: {
        deviceId: device.id,
        status: 'PENDING',
        timestamp: new Date(),
        notes: payload.notes || '',
      },
      include: {
        device: {
          select: {
            name: true,
            room: true,
          }
        }
      }
    })

    // Emitujemo SSE događaj za novi zahtev
    emitter.emitEvent(SSE_EVENTS.NEW_REQUEST, {
      requestId: newRequest.id,
      deviceId: device.id,
      deviceName: device.name,
      room: device.room,
      timestamp: newRequest.timestamp.toISOString(),
    })

    console.log(`Kreiran novi zahtev ID: ${newRequest.id} od uređaja ${device.name} u prostoriji ${device.room}`)
    return newRequest
  } catch (error) {
    console.error('Greška pri kreiranju zahteva:', error)
    throw error
  }
}

/**
 * Prihvata zahtev i dodeljuje ga korisniku
 */
export async function assignRequest(requestId: number, userId: number) {
  try {
    // Provera da li zahtev postoji
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        device: {
          select: {
            name: true,
            room: true,
          }
        }
      }
    })

    if (!request) {
      throw new Error(`Zahtev sa ID ${requestId} nije pronađen`)
    }

    // Provera da li korisnik postoji
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error(`Korisnik sa ID ${userId} nije pronađen`)
    }

    // Ažuriranje statusa zahteva
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'IN_PROGRESS',
        assignedTo: userId,
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            room: true,
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Emitujemo SSE događaj za ažuriranje zahteva
    emitter.emitEvent(SSE_EVENTS.REQUEST_UPDATE, {
      requestId: updatedRequest.id,
      deviceId: updatedRequest.deviceId,
      deviceName: updatedRequest.device.name,
      room: updatedRequest.device.room,
      status: updatedRequest.status,
      assignedTo: updatedRequest.assignedTo,
      assignedName: updatedRequest.assignedUser?.name || null,
      timestamp: updatedRequest.timestamp.toISOString(),
      updatedAt: new Date().toISOString(),
    })

    console.log(`Zahtev ${requestId} dodeljen korisniku ${user.name} (ID: ${userId})`)
    return updatedRequest
  } catch (error) {
    console.error('Greška pri dodeljivanju zahteva:', error)
    throw error
  }
}

/**
 * Završava zahtev
 */
export async function completeRequest(requestId: number) {
  try {
    // Provera da li zahtev postoji
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        device: {
          select: {
            name: true,
            room: true,
          }
        }
      }
    })

    if (!request) {
      throw new Error(`Zahtev sa ID ${requestId} nije pronađen`)
    }

    // Ažuriranje statusa zahteva
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            room: true,
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Emitujemo SSE događaj za ažuriranje zahteva
    emitter.emitEvent(SSE_EVENTS.REQUEST_UPDATE, {
      requestId: updatedRequest.id,
      deviceId: updatedRequest.deviceId,
      deviceName: updatedRequest.device.name,
      room: updatedRequest.device.room,
      status: updatedRequest.status,
      assignedTo: updatedRequest.assignedTo,
      assignedName: updatedRequest.assignedUser?.name || null,
      timestamp: updatedRequest.timestamp.toISOString(),
      updatedAt: new Date().toISOString(),
    })

    console.log(`Zahtev ${requestId} označen kao završen`)
    return updatedRequest
  } catch (error) {
    console.error('Greška pri završavanju zahteva:', error)
    throw error
  }
}
