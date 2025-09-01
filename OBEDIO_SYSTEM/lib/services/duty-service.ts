import { PrismaClient } from '@prisma/client'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'

// Definisanje tipova koje koristimo
type User = {
  id: number
  name: string
  email: string
  role: string
}

// Definisanje Prisma shift tipa za bolju interoperabilnost
type PrismaShift = {
  id: number
  userId: number
  startTime: Date
  endTime: Date | null
  status: string
  user?: {
    id: number
    name: string
    email: string
    role: string
    [key: string]: any
  }
  [key: string]: any
}

type Shift = {
  id: number
  userId: number
  startTime: Date
  endTime: Date | null
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  user?: User
}

type Request = {
  id: number
  deviceId: number
  status: string
  timestamp: Date
  assignedTo: number | null
  notes: string | null
  device?: {
    id: number
    name: string
    room: string
  }
  assignedUser?: User | null
}

// Kreiranje Prisma klijenta
const prisma = new PrismaClient()

/**
 * Klasa za upravljanje smenama i dužnostima članova posade
 */
export class DutyService {
  /**
   * Započinje novu smenu za korisnika
   */
  static async startShift(userId: number): Promise<Shift> {
    try {
      // Proveriti da li korisnik postoji
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        throw new Error(`Korisnik sa ID ${userId} nije pronađen`)
      }
      
      // Proveriti da li korisnik već ima aktivnu smenu
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      })
      
      if (activeShift) {
        throw new Error(`Korisnik ${user.name} već ima aktivnu smenu`)
      }
      
      // Kreirati novu smenu
      const newShift = await prisma.shift.create({
        data: {
          userId,
          startTime: new Date(),
          status: 'ACTIVE',
        },
        include: {
          user: true
        }
      })
      
      // Emitovati SSE događaj
      emitter.emitEvent(SSE_EVENTS.SHIFT_UPDATE, {
        shiftId: newShift.id,
        userId: newShift.userId,
        userName: newShift.user.name,
        status: newShift.status,
        startTime: newShift.startTime.toISOString(),
        endTime: null,
        action: 'STARTED'
      })
      
      return newShift
    } catch (error) {
      console.error('Greška pri započinjanju smene:', error)
      throw error
    }
  }
  
  /**
   * Završava aktivnu smenu korisnika
   */
  static async endShift(userId: number): Promise<Shift> {
    try {
      // Proveriti da li korisnik postoji
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        throw new Error(`Korisnik sa ID ${userId} nije pronađen`)
      }
      
      // Naći aktivnu smenu korisnika
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        },
        include: {
          user: true
        }
      })
      
      if (!activeShift) {
        throw new Error(`Korisnik ${user.name} nema aktivnu smenu`)
      }
      
      // Završiti smenu
      const endedShift = await prisma.shift.update({
        where: { id: activeShift.id },
        data: {
          endTime: new Date(),
          status: 'COMPLETED'
        },
        include: {
          user: true
        }
      })
      
      // Emitovati SSE događaj
      emitter.emitEvent(SSE_EVENTS.SHIFT_UPDATE, {
        shiftId: endedShift.id,
        userId: endedShift.userId,
        userName: endedShift.user.name,
        status: endedShift.status,
        startTime: endedShift.startTime.toISOString(),
        endTime: endedShift.endTime?.toISOString() || null,
        action: 'ENDED'
      })
      
      return endedShift
    } catch (error) {
      console.error('Greška pri završavanju smene:', error)
      throw error
    }
  }
  
  /**
   * Dobija trenutno aktivne korisnike (one sa aktivnim smenama)
   */
  static async getActiveUsers(): Promise<User[]> {
    try {
      // Naći sve aktivne smene
      const activeShifts = await prisma.shift.findMany({
        where: { status: 'ACTIVE' },
        include: { user: true }
      })
      
      // Izdvojiti korisnike iz aktivnih smena i filtrirati one sa undefined user
      return activeShifts
        .filter((shift: PrismaShift) => shift.user !== undefined && shift.user !== null)
        .map((shift: PrismaShift) => ({
          id: shift.user!.id,
          name: shift.user!.name,
          email: shift.user!.email,
          role: shift.user!.role
        }))
    } catch (error) {
      console.error('Greška pri dohvatanju aktivnih korisnika:', error)
      throw error
    }
  }
  
  /**
   * Vraća istoriju smena za korisnika
   */
  static async getUserShiftHistory(userId: number, limit: number = 10): Promise<Shift[]> {
    try {
      const shifts = await prisma.shift.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: limit,
        include: { user: true }
      })
      
      // Prilagoditi vraćene rezultate našem tipu Shift
      return shifts.map((shift: PrismaShift) => ({
        id: shift.id,
        userId: shift.userId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status as 'ACTIVE' | 'COMPLETED' | 'CANCELED',
        user: shift.user ? {
          id: shift.user.id,
          name: shift.user.name,
          email: shift.user.email,
          role: shift.user.role
        } : undefined
      }))
    } catch (error) {
      console.error('Greška pri dohvatanju istorije smena:', error)
      throw error
    }
  }
  
  /**
   * Prebacuje sve otvorene zahteve sa jednog korisnika na drugog
   * Korisno pri kraju smene
   */
  static async transferAllRequests(fromUserId: number, toUserId: number, notes: string = ''): Promise<number> {
    try {
      // Provera da li korisnici postoje
      const fromUser = await prisma.user.findUnique({
        where: { id: fromUserId }
      })
      
      const toUser = await prisma.user.findUnique({
        where: { id: toUserId }
      })
      
      if (!fromUser || !toUser) {
        throw new Error('Jedan ili oba korisnika nisu pronađena')
      }
      
      // Naći sve otvorene zahteve dodeljene izvornom korisniku
      const openRequests = await prisma.request.findMany({
        where: {
          assignedTo: fromUserId,
          status: 'IN_PROGRESS'
        },
        include: {
          device: true
        }
      })
      
      if (openRequests.length === 0) {
        return 0 // Nema zahteva za prebacivanje
      }
      
      const transferNote = `${new Date().toISOString()} - Mass transfer from ${fromUser.name} to ${toUser.name}${notes ? ': ' + notes : ''}`
      
      // Prebaciti svaki zahtev
      for (const request of openRequests) {
        const updatedNotes = request.notes
          ? `${request.notes}\n${transferNote}`
          : transferNote
        
        const updatedRequest = await prisma.request.update({
          where: { id: request.id },
          data: {
            assignedTo: toUserId,
            notes: updatedNotes
          },
          include: {
            device: true,
            assignedUser: true
          }
        })
        
        // Emitovati SSE događaj za svaki prebačeni zahtev
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
          transferredBy: fromUser.name,
          transferredTo: toUser.name,
          bulkTransfer: true
        })
      }
      
      return openRequests.length
    } catch (error) {
      console.error('Greška pri masovnom prebacivanju zahteva:', error)
      throw error
    }
  }
}
