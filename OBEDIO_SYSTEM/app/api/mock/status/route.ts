import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Trenutni datum za timestamp
  const now = new Date();
  
  // Sistemski status mock podaci
  const systemStatus = {
    devices: {
      total: 12,
      online: 9,
      offline: 3,
      lowBattery: 2,
      lowSignal: 1,
      uptime: 75, // procenat online uređaja
    },
    requests: {
      active: 5,
      today: {
        new: 8,
        completed: 6
      },
      byStatus: {
        PENDING: 3,
        IN_PROGRESS: 2,
        COMPLETED: 12,
        CANCELLED: 1
      },
      statusCounts: [
        { status: 'PENDING', count: 3 },
        { status: 'IN_PROGRESS', count: 2 },
        { status: 'COMPLETED', count: 12 },
        { status: 'CANCELLED', count: 1 }
      ],
      averageResponseTime: 12, // u minutama
    },
    topDevices: [
      { id: 1, name: 'Master Cabin Button', room: 'Master Cabin', requestCount: 15 },
      { id: 2, name: 'Salon Call Button', room: 'Salon', requestCount: 12 },
      { id: 3, name: 'Kitchen Button', room: 'Kitchen', requestCount: 8 },
      { id: 4, name: 'Guest Cabin 1', room: 'Guest Cabin 1', requestCount: 5 },
      { id: 5, name: 'Deck Button', room: 'Upper Deck', requestCount: 3 }
    ],
    timestamp: now.toISOString()
  }
  
  // Namerno dodajemo malo kašnjenja da simuliramo mrežni zahtev
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return NextResponse.json(systemStatus);
}
