import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

// Kreiranje Prisma klijenta
const prisma = new PrismaClient()

/**
 * Servisna klasa za upravljanje procesom provisioninga uređaja
 */
export class ProvisionService {
  /**
   * Kreira token za provisioning novog uređaja
   * @param room - Soba u kojoj će uređaj biti postavljen
   * @param createdById - ID korisnika koji kreira token (opciono)
   * @param expiresInMinutes - Koliko dugo token važi u minutama (default: 60min)
   * @returns Kreiran ProvisionToken sa QR kodom
   */
  static async createProvisionToken(
    room: string, 
    createdById?: number, 
    expiresInMinutes: number = 60
  ) {
    try {
      // Generisanje jedinstvenog tokena
      const token = randomBytes(16).toString('hex')
      
      // Izračunavanje vremena isteka
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes)
      
      // Kreiranje QR payload-a
      const qrPayload = JSON.stringify({
        type: 'OBEDIO_PROVISION',
        token,
        room,
        expiresAt: expiresAt.toISOString(),
        timestamp: new Date().toISOString()
      })
      
      // Kreiranje tokena u bazi
      const provisionToken = await prisma.provisionToken.create({
        data: {
          token,
          qrPayload,
          room,
          status: 'ACTIVE',
          expiresAt,
          createdBy: createdById || null,
        }
      })
      
      // Kreiranje loga za ovaj događaj
      await prisma.provisionLog.create({
        data: {
          tokenId: provisionToken.id,
          action: 'CREATE',
          message: `Provision token created for room ${room}`,
          metadata: JSON.stringify({ expiresInMinutes, createdById })
        }
      })
      
      return provisionToken
    } catch (error) {
      console.error('Error creating provision token:', error)
      throw error
    }
  }
  
  /**
   * Dohvata aktivan token prema njegovom ID-u
   * @param tokenId - ID tokena
   * @returns Token ako je nađen i aktivan, inače null
   */
  static async getActiveTokenById(tokenId: number) {
    try {
      const token = await prisma.provisionToken.findFirst({
        where: {
          id: tokenId,
          status: 'ACTIVE',
          expiresAt: {
            gt: new Date() // Token nije istekao
          }
        }
      })
      
      return token
    } catch (error) {
      console.error('Error fetching token:', error)
      throw error
    }
  }
  
  /**
   * Poništava token (npr. korisnik je poništio proces provisioninga)
   * @param tokenId - ID tokena koji se poništava
   * @returns Ažuriran token
   */
  static async cancelToken(tokenId: number) {
    try {
      // Pronađi token i proveri da li je aktivan
      const token = await prisma.provisionToken.findUnique({
        where: { id: tokenId }
      })
      
      if (!token) {
        throw new Error('Token not found')
      }
      
      if (token.status !== 'ACTIVE') {
        throw new Error(`Cannot cancel token with status: ${token.status}`)
      }
      
      // Ažuriraj status tokena
      const updatedToken = await prisma.provisionToken.update({
        where: { id: tokenId },
        data: { status: 'CANCELLED' }
      })
      
      // Kreiraj log za ovu akciju
      await prisma.provisionLog.create({
        data: {
          tokenId,
          action: 'CANCEL',
          message: 'Token manually cancelled',
        }
      })
      
      return updatedToken
    } catch (error) {
      console.error('Error cancelling token:', error)
      throw error
    }
  }
  
  /**
   * Verifikuje token prilikom procesa provisioninga
   * @param tokenString - String vrednost tokena
   * @returns Token ako je validan, inače null
   */
  static async verifyToken(tokenString: string) {
    try {
      // Pronađi token po string vrednosti
      const token = await prisma.provisionToken.findUnique({
        where: { token: tokenString }
      })
      
      if (!token) {
        return null
      }
      
      // Proveri da li je token aktivan i nije istekao
      if (token.status !== 'ACTIVE') {
        return null
      }
      
      if (new Date(token.expiresAt) < new Date()) {
        // Token je istekao, ažuriraj ga
        await prisma.provisionToken.update({
          where: { id: token.id },
          data: { status: 'EXPIRED' }
        })
        
        // Kreiraj log za istek
        await prisma.provisionLog.create({
          data: {
            tokenId: token.id,
            action: 'EXPIRE',
            message: 'Token expired during verification'
          }
        })
        
        return null
      }
      
      return token
    } catch (error) {
      console.error('Error verifying token:', error)
      throw error
    }
  }
  
  /**
   * Markira token kao iskorišćen nakon uspešnog provisioninga
   * @param tokenId - ID tokena
   * @param deviceId - ID kreiranog uređaja
   * @returns Ažuriran token
   */
  static async markTokenAsUsed(tokenId: number, deviceId: number) {
    try {
      const updatedToken = await prisma.provisionToken.update({
        where: { id: tokenId },
        data: {
          status: 'USED',
          usedAt: new Date(),
          deviceId
        }
      })
      
      // Kreiraj log za uspešan provisioning
      await prisma.provisionLog.create({
        data: {
          tokenId,
          action: 'SUCCESS',
          message: `Device provisioned with ID: ${deviceId}`,
          metadata: JSON.stringify({ deviceId })
        }
      })
      
      return updatedToken
    } catch (error) {
      console.error('Error marking token as used:', error)
      throw error
    }
  }
}
