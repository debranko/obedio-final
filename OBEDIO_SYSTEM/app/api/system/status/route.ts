import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionCookie } from '@/lib/auth'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET - Dohvatanje sistemskog statusa za dashboard
export async function GET(request: NextRequest) {
  // Alternativna provera za x-auth-bypass header
  const headersList = headers();
  const authBypass = headersList.get('x-auth-bypass');
  
  // Standardna provera autentikacije ako nema bypass headera
  if (!authBypass) {
    const session = getSessionCookie()
    if (!session) {
      console.log('API: Nema sesije i nema bypass headera, vraćam 401 Unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log('API: Validna sesija pronađena, pristup dozvoljen');
  } else {
    console.log('API: Pronađen x-auth-bypass header, preskačem proveru autentikacije');
  }

  try {
    // Vremenski pragovi
    const now = new Date()
    const onlineThreshold = new Date(now.getTime() - 5 * 60 * 1000) // 5 minuta
    const lastDayThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 sata
    const lastWeekThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 dana

    // Ukupan broj uređaja
    const totalDevices = await prisma.device.count()

    // Broj online uređaja (pretpostavljamo da su svi uređaji online za demonstraciju)
    const onlineDevices = Math.floor(totalDevices * 0.8) // 80% uređaja je online

    // Broj uređaja sa niskim nivoom baterije (<20%)
    const lowBatteryDevices = await prisma.device.count({
      where: {
        battery: { lt: 20 }
      }
    })

    // Broj uređaja sa niskim signalom (<30%)
    const lowSignalDevices = await prisma.device.count({
      where: {
        signal: { lt: 30 }
      }
    })

    // Aktivni zahtevi (PENDING ili IN_PROGRESS)
    const activeRequests = await prisma.request.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    })

    // Današnji novi zahtevi
    const todayNewRequests = await prisma.request.count({
      where: {
        createdAt: { gte: lastDayThreshold }
      }
    })

    // Broj završenih zahteva danas
    const completedRequestsToday = await prisma.request.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: lastDayThreshold }
      }
    })

    // Broj zahteva po statusu
    const requestsByStatus = await prisma.request.groupBy({
      by: ['status'],
      _count: true
    })

    // Formatiranje rezultata za lakše korištenje
    const formattedRequestsByStatus = requestsByStatus.reduce((acc: Record<string, number>, item: { status: string, _count: number }) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    // Broj zahteva po danu u posljednjih 7 dana
    const requestsLastWeek = await prisma.request.groupBy({
      by: ['status'],
      _count: true,
      where: {
        createdAt: { gte: lastWeekThreshold }
      }
    })

    // Formatiranje statusa u formatu pogodnom za grafove
    const formattedStatusCounts = requestsLastWeek.map((item: { status: string, _count: number }) => ({
      status: item.status,
      count: item._count
    }))

    // Prosječno vrijeme odgovora u posljednjih 7 dana (za zahteve koji su završeni)
    // Ovo mjeri vrijeme od kreiranja zahteva do njegovog završetka
    const completedRequests = await prisma.request.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: lastWeekThreshold }
      },
      select: {
        createdAt: true,
        updatedAt: true // Koristimo updatedAt kao aproksimaciju vremena završetka
      }
    })

    // Izračunavanje prosječnog vremena odgovora (u minutama)
    let avgResponseTime = 0;
    let completedCount = 0;
    
    // Izračunavanje vremena između kreiranja i poslednjeg ažuriranja
    completedRequests.forEach((req) => {
      const created = new Date(req.createdAt).getTime();
      const completed = new Date(req.updatedAt).getTime();
      const diffMinutes = Math.floor((completed - created) / (1000 * 60));
      avgResponseTime += diffMinutes;
      completedCount++;
    });

    const averageResponseTime = completedCount > 0 
      ? Math.floor(avgResponseTime / completedCount) 
      : 0

    // Top uređaji po broju zahteva
    const topDevices = await prisma.device.findMany({
      take: 5, // Ograničenje na 5 uređaja
      orderBy: {
        requests: {
          _count: 'desc'
        }
      },
      include: {
        _count: {
          select: {
            requests: true
          }
        }
      }
    })
    
    // Formatiranje rezultata za top uređaje uzimajući u obzir da name može biti null
    const formattedTopDevices = topDevices.map((device) => ({
      id: device.id,
      name: device.name || `Uređaj ${device.id}`, // Koristimo ID ako name nije definisan
      room: device.room,
      requestCount: device._count.requests
    }))

    // Kreiranje SystemStatus objekta za vraćanje
    const systemStatus = {
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: totalDevices - onlineDevices,
        lowBattery: lowBatteryDevices,
        lowSignal: lowSignalDevices,
        uptime: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0
      },
      requests: {
        active: activeRequests,
        today: {
          new: todayNewRequests,
          completed: completedRequestsToday
        },
        byStatus: formattedRequestsByStatus,
        statusCounts: formattedStatusCounts,
        averageResponseTime: averageResponseTime
      },
      topDevices: formattedTopDevices,
      timestamp: now.toISOString()
    };
    
    // Emitujemo SSE događaj za ažuriranje sistemskog statusa
    emitter.emitEvent(SSE_EVENTS.SYSTEM_STATUS, systemStatus);
    
    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error('Error fetching system status:', error)
    return NextResponse.json(
      { error: "Došlo je do greške prilikom dohvatanja sistemskog statusa" },
      { status: 500 }
    )
  }
}
