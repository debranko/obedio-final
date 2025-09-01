import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'

// GET - Dohvatanje statistike o uređajima
export async function GET(request: NextRequest) {
  // Provera autentikacije
  const session = getSessionCookie()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Definicija vremenskih intervala za "online" status (posljednjih 5 minuta)
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000)
    // Definicija niskog nivoa baterije (ispod 20%)
    const lowBatteryThreshold = 20

    // Paralelno dohvatanje svih statistika
    const [
      totalDevices,
      activeDevices,
      inactiveDevices,
      onlineDevices,
      offlineDevices,
      lowBatteryDevices,
      devicesByType,
      devicesByRoom,
      totalRequests,
      pendingRequests,
      completedRequests,
      requestsLastWeek
    ] = await Promise.all([
      // Ukupan broj uređaja
      prisma.device.count(),
      // Aktivni uređaji
      prisma.device.count({ where: { isActive: true } }),
      // Neaktivni uređaji
      prisma.device.count({ where: { isActive: false } }),
      // Online uređaji (viđeni u posljednjih 5 minuta)
      prisma.device.count({ 
        where: { 
          isActive: true,
          lastSeen: { gte: onlineThreshold } 
        } 
      }),
      // Offline uređaji (nisu viđeni duže od 5 minuta)
      prisma.device.count({ 
        where: { 
          isActive: true,
          lastSeen: { lt: onlineThreshold } 
        } 
      }),
      // Uređaji sa niskim nivoom baterije
      prisma.device.count({ 
        where: { 
          isActive: true,
          battery: { lte: lowBatteryThreshold } 
        } 
      }),
      // Grupisanje uređaja po tipu
      prisma.device.groupBy({
        by: ['type'],
        _count: true,
        where: { isActive: true }
      }),
      // Grupisanje uređaja po prostoriji
      prisma.device.groupBy({
        by: ['room'],
        _count: true,
        where: { isActive: true }
      }),
      // Ukupan broj zahteva
      prisma.request.count(),
      // Broj zahteva na čekanju
      prisma.request.count({ where: { status: 'PENDING' } }),
      // Broj završenih zahteva
      prisma.request.count({ where: { status: 'COMPLETED' } }),
      // Broj zahteva u posljednjih 7 dana
      prisma.request.count({
        where: {
          timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    // Definisanje tipova za rezultate upita
    type GroupByResult = {
      type: string;
      room: string;
      _count: number;
    }

    // Formatiranje rezultata za jednostavnije korištenje na frontend-u
    const formattedDevicesByType = devicesByType.reduce((acc: Record<string, number>, item: GroupByResult) => {
      acc[item.type] = item._count
      return acc
    }, {} as Record<string, number>)

    const formattedDevicesByRoom = devicesByRoom.reduce((acc: Record<string, number>, item: GroupByResult) => {
      acc[item.room] = item._count
      return acc
    }, {} as Record<string, number>)

    // Vraćanje kompletne statistike
    return NextResponse.json({
      devices: {
        total: totalDevices,
        active: activeDevices,
        inactive: inactiveDevices,
        online: onlineDevices,
        offline: offlineDevices,
        lowBattery: lowBatteryDevices,
        byType: formattedDevicesByType,
        byRoom: formattedDevicesByRoom
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        completed: completedRequests,
        lastWeek: requestsLastWeek
      }
    })
  } catch (error) {
    console.error('Error fetching device statistics:', error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom dohvatanja statistike" },
      { status: 500 }
    )
  }
}
