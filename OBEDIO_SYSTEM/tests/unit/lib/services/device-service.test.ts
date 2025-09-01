import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { DeviceService } from '@/lib/services/device-service'

// Mock za Prisma klijenta
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    device: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    $disconnect: vi.fn()
  }
  
  return {
    PrismaClient: vi.fn(() => mockPrismaClient)
  }
})

describe('DeviceService', () => {
  let prisma: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    prisma = new PrismaClient()
  })
  
  describe('getAllDevices', () => {
    it('should return all devices', async () => {
      const mockDevices = [
        { id: 1, name: 'Device 1', room: 'Living Room', type: 'BUTTON', status: 'ACTIVE', batteryLevel: 90 },
        { id: 2, name: 'Device 2', room: 'Kitchen', type: 'BUTTON', status: 'ACTIVE', batteryLevel: 80 }
      ]
      
      prisma.device.findMany.mockResolvedValueOnce(mockDevices)
      
      const result = await DeviceService.getAllDevices()
      
      expect(prisma.device.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' }
      })
      expect(result).toEqual(mockDevices)
    })
    
    it('should handle errors and rethrow them', async () => {
      const error = new Error('Database error')
      prisma.device.findMany.mockRejectedValueOnce(error)
      
      await expect(DeviceService.getAllDevices()).rejects.toThrow('Database error')
      expect(prisma.device.findMany).toHaveBeenCalled()
    })
  })
  
  describe('getDeviceById', () => {
    it('should return device by ID', async () => {
      const mockDevice = { id: 1, name: 'Device 1', room: 'Living Room', type: 'BUTTON', status: 'ACTIVE', batteryLevel: 90 }
      
      prisma.device.findUnique.mockResolvedValueOnce(mockDevice)
      
      const result = await DeviceService.getDeviceById(1)
      
      expect(prisma.device.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      })
      expect(result).toEqual(mockDevice)
    })
    
    it('should return null when device does not exist', async () => {
      prisma.device.findUnique.mockResolvedValueOnce(null)
      
      const result = await DeviceService.getDeviceById(999)
      
      expect(prisma.device.findUnique).toHaveBeenCalledWith({
        where: { id: 999 }
      })
      expect(result).toBeNull()
    })
    
    it('should handle errors and rethrow them', async () => {
      const error = new Error('Database error')
      prisma.device.findUnique.mockRejectedValueOnce(error)
      
      await expect(DeviceService.getDeviceById(1)).rejects.toThrow('Database error')
      expect(prisma.device.findUnique).toHaveBeenCalled()
    })
  })
  
  describe('updateDeviceBattery', () => {
    it('should update battery level for a device', async () => {
      const mockUpdatedDevice = {
        id: 1,
        name: 'Device 1',
        batteryLevel: 75,
        lastBatteryUpdate: new Date()
      }
      
      prisma.device.update.mockResolvedValueOnce(mockUpdatedDevice)
      
      const result = await DeviceService.updateDeviceBattery(1, 75)
      
      expect(prisma.device.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          batteryLevel: 75,
          lastBatteryUpdate: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUpdatedDevice)
    })
    
    it('should handle errors and rethrow them', async () => {
      const error = new Error('Database error')
      prisma.device.update.mockRejectedValueOnce(error)
      
      await expect(DeviceService.updateDeviceBattery(1, 75)).rejects.toThrow('Database error')
      expect(prisma.device.update).toHaveBeenCalled()
    })
  })
  
  describe('updateDeviceStatus', () => {
    it('should update status for multiple devices', async () => {
      const deviceIds = [1, 2, 3]
      const newStatus = 'INACTIVE'
      
      prisma.device.updateMany.mockResolvedValueOnce({ count: deviceIds.length })
      
      await DeviceService.updateDeviceStatus(deviceIds, newStatus)
      
      expect(prisma.device.updateMany).toHaveBeenCalledWith({
        where: { id: { in: deviceIds } },
        data: { status: newStatus }
      })
    })
    
    it('should handle errors and rethrow them', async () => {
      const error = new Error('Database error')
      prisma.device.updateMany.mockRejectedValueOnce(error)
      
      await expect(DeviceService.updateDeviceStatus([1, 2], 'INACTIVE')).rejects.toThrow('Database error')
      expect(prisma.device.updateMany).toHaveBeenCalled()
    })
  })
})
