import { PrismaClient } from '@prisma/client'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'

// Kreiraj Prisma klijenta
const prisma = new PrismaClient()

/**
 * Ažurira status uređaja sa informacijama o bateriji i signalu
 */
export async function handleDeviceStatus(deviceId: string, payload: any) {
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

    // Ažurirati informacije o uređaju
    const updatedDevice = await prisma.device.update({
      where: { id: device.id },
      data: {
        battery: payload.battery || device.battery,
        signalStrength: payload.signal || device.signalStrength,
        lastSeen: new Date()
      }
    })

    // Emitovati SSE događaj
    emitter.emitEvent(SSE_EVENTS.DEVICE_UPDATE, {
      deviceId: updatedDevice.id,
      uid: updatedDevice.uid,
      battery: updatedDevice.battery,
      signal: updatedDevice.signalStrength,
      lastSeen: updatedDevice.lastSeen.toISOString()
    })

    console.log(`Ažuriran uređaj ${device.name} (ID: ${device.id})`)
    return updatedDevice
  } catch (error) {
    console.error('Greška pri ažuriranju uređaja:', error)
    throw error
  }
}

/**
 * Procesira heartbeat poruku od uređaja
 */
export async function handleDeviceHeartbeat(deviceId: string) {
  try {
    if (!deviceId) {
      console.error('Nedostaje deviceId u MQTT poruci')
      return
    }

    // Ažuriranje samo lastSeen vremena
    const device = await prisma.device.findUnique({
      where: { uid: deviceId }
    })

    if (!device) {
      console.warn(`Nepoznat uređaj sa ID-om ${deviceId} poslao heartbeat`)
      return
    }

    await prisma.device.update({
      where: { id: device.id },
      data: { lastSeen: new Date() }
    })

    console.log(`Primljen heartbeat od uređaja ${device.name} (ID: ${device.id})`)
  } catch (error) {
    console.error('Greška pri obradi device heartbeat-a:', error)
    throw error
  }
}

/**
 * Dodaje novi uređaj u sistem ako ne postoji
 */
export async function upsertDevice(uid: string, payload: any) {
  try {
    if (!uid) {
      console.error('Nedostaje uid za novi uređaj')
      return
    }

    // Provjera da li uređaj već postoji
    const existingDevice = await prisma.device.findUnique({
      where: { uid }
    })

    // Ako postoji, samo ažuriramo lastSeen
    if (existingDevice) {
      await prisma.device.update({
        where: { id: existingDevice.id },
        data: { lastSeen: new Date() }
      })
      return existingDevice
    }

    // Ako ne postoji, kreiramo novi uređaj
    const newDevice = await prisma.device.create({
      data: {
        uid,
        name: payload.name || `Novi uređaj ${uid.slice(-4)}`,
        room: payload.room || 'Nedefinisano',
        type: payload.type || 'BUTTON',
        isActive: true,
        battery: payload.battery || 100,
        signalStrength: payload.signal || 100,
        lastSeen: new Date()
      }
    })

    // Emitovati SSE događaj za novi uređaj
    emitter.emitEvent(SSE_EVENTS.DEVICE_ADDED, {
      deviceId: newDevice.id,
      uid: newDevice.uid,
      name: newDevice.name,
      room: newDevice.room
    })

    console.log(`Dodat novi uređaj ${newDevice.name} (ID: ${newDevice.id})`)
    return newDevice
  } catch (error) {
    console.error('Greška pri dodavanju novog uređaja:', error)
    throw error
  }
}
