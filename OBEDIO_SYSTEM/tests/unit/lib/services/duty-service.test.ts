import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { DutyService } from '@/lib/services/duty-service'
import { emitter } from '@/lib/sseEmitter'

// Mock za emitter
vi.mock('@/lib/sseEmitter', () => ({
  emitter: {
    emit: vi.fn()
  },
  SSE_EVENTS: {
    SHIFT_UPDATE: 'shift.update'
  }
}))

// Mock za Prisma klijenta
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    shift: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    request: {
      findMany: vi.fn(),
      updateMany: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    $disconnect: vi.fn()
  }
  
  return {
    PrismaClient: vi.fn(() => mockPrismaClient)
  }
})

describe('DutyService', () => {
  let prisma: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    prisma = new PrismaClient()
  })
  
  describe('startShift', () => {
    it('should start a new shift for a user', async () => {
      const userId = 1
      const mockUser = { id: userId, name: 'Test User', email: 'test@example.com', role: 'CREW' }
      const mockShift = { 
        id: 1, 
        userId, 
        startTime: new Date(), 
        endTime: null, 
        status: 'ACTIVE' 
      }
      
      // Mock za proveru korisnika
      prisma.user.findUnique.mockResolvedValueOnce(mockUser)
      
      // Mock za proveru aktivnih smena korisnika
      prisma.shift.findMany.mockResolvedValueOnce([])
      
      // Mock za kreiranje smene
      prisma.shift.create.mockResolvedValueOnce(mockShift)
      
      const result = await DutyService.startShift(userId)
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      })
      expect(prisma.shift.findMany).toHaveBeenCalledWith({
        where: { userId, status: 'ACTIVE' }
      })
      expect(prisma.shift.create).toHaveBeenCalledWith({
        data: {
          userId,
          startTime: expect.any(Date),
          status: 'ACTIVE'
        },
        include: {
          user: true
        }
      })
      expect(emitter.emit).toHaveBeenCalled()
      expect(result).toEqual(mockShift)
    })
    
    it('should throw error if user already has active shift', async () => {
      const userId = 1
      const mockUser = { id: userId, name: 'Test User', email: 'test@example.com', role: 'CREW' }
      const activeShift = { id: 1, userId, startTime: new Date(), endTime: null, status: 'ACTIVE' }
      
      // Mock za proveru korisnika
      prisma.user.findUnique.mockResolvedValueOnce(mockUser)
      
      // Mock za proveru aktivnih smena (korisnik već ima aktivnu smenu)
      prisma.shift.findMany.mockResolvedValueOnce([activeShift])
      
      await expect(DutyService.startShift(userId)).rejects.toThrow('Korisnik već ima aktivnu smenu')
      
      expect(prisma.user.findUnique).toHaveBeenCalled()
      expect(prisma.shift.findMany).toHaveBeenCalled()
      expect(prisma.shift.create).not.toHaveBeenCalled()
      expect(emitter.emit).not.toHaveBeenCalled()
    })
  })
  
  describe('endShift', () => {
    it('should end an active shift', async () => {
      const shiftId = 1
      const userId = 1
      const mockShift = {
        id: shiftId,
        userId,
        startTime: new Date(Date.now() - 3600000), // 1 sat ranije
        endTime: null,
        status: 'ACTIVE',
        user: { id: userId, name: 'Test User', email: 'test@example.com', role: 'CREW' }
      }
      
      const mockEndedShift = {
        ...mockShift,
        endTime: expect.any(Date),
        status: 'COMPLETED'
      }
      
      // Mock za dohvatanje smene
      prisma.shift.findUnique.mockResolvedValueOnce(mockShift)
      
      // Mock za dohvatanje aktivnih zahteva
      prisma.request.findMany.mockResolvedValueOnce([])
      
      // Mock za ažuriranje smene
      prisma.shift.update.mockResolvedValueOnce(mockEndedShift)
      
      const result = await DutyService.endShift(shiftId)
      
      expect(prisma.shift.findUnique).toHaveBeenCalledWith({
        where: { id: shiftId },
        include: { user: true }
      })
      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: shiftId },
        data: {
          endTime: expect.any(Date),
          status: 'COMPLETED'
        },
        include: { user: true }
      })
      expect(emitter.emit).toHaveBeenCalled()
      expect(result).toEqual(mockEndedShift)
    })
    
    it('should transfer requests when transferUserId is provided', async () => {
      const shiftId = 1
      const userId = 1
      const transferUserId = 2
      const mockShift = {
        id: shiftId,
        userId,
        startTime: new Date(Date.now() - 3600000),
        endTime: null,
        status: 'ACTIVE',
        user: { id: userId, name: 'Test User', email: 'test@example.com', role: 'CREW' }
      }
      
      const mockActiveRequests = [
        { id: 101, deviceId: 1, assignedTo: userId, status: 'ACTIVE' },
        { id: 102, deviceId: 2, assignedTo: userId, status: 'ACTIVE' }
      ]
      
      // Mock za dohvatanje smene
      prisma.shift.findUnique.mockResolvedValueOnce(mockShift)
      
      // Mock za dohvatanje aktivnih zahteva
      prisma.request.findMany.mockResolvedValueOnce(mockActiveRequests)
      
      // Mock za ažuriranje zahteva
      prisma.request.updateMany.mockResolvedValueOnce({ count: mockActiveRequests.length })
      
      // Mock za ažuriranje smene
      prisma.shift.update.mockResolvedValueOnce({
        ...mockShift,
        endTime: expect.any(Date),
        status: 'COMPLETED'
      })
      
      await DutyService.endShift(shiftId, transferUserId, 'Prebacivanje zahteva')
      
      expect(prisma.request.findMany).toHaveBeenCalledWith({
        where: {
          assignedTo: userId,
          status: 'ACTIVE'
        }
      })
      expect(prisma.request.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: mockActiveRequests.map(req => req.id) }
        },
        data: {
          assignedTo: transferUserId,
          notes: expect.stringContaining('Prebacivanje zahteva')
        }
      })
    })
  })
  
  describe('getActiveUsers', () => {
    it('should return users with active shifts', async () => {
      const mockShifts = [
        {
          id: 1,
          userId: 1,
          status: 'ACTIVE',
          startTime: new Date(),
          endTime: null,
          user: {
            id: 1,
            name: 'User 1',
            email: 'user1@example.com',
            role: 'CREW'
          }
        },
        {
          id: 2,
          userId: 2,
          status: 'ACTIVE',
          startTime: new Date(),
          endTime: null,
          user: {
            id: 2,
            name: 'User 2',
            email: 'user2@example.com',
            role: 'CREW'
          }
        }
      ]
      
      // Mock za dohvatanje aktivnih smena
      prisma.shift.findMany.mockResolvedValueOnce(mockShifts)
      
      const result = await DutyService.getActiveUsers()
      
      expect(prisma.shift.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: { user: true }
      })
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('id', 1)
      expect(result[1]).toHaveProperty('id', 2)
    })
  })
})
