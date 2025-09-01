import { NextRequest, NextResponse } from 'next/server';
import { VirtualDeviceManager } from '@/lib/virtual-devices/manager';
import { prisma } from '@/lib/prisma';
import { getSessionCookie } from '@/lib/auth';

// Create a singleton instance of the device manager
let deviceManager: VirtualDeviceManager | null = null;

function getDeviceManager() {
  if (!deviceManager) {
    deviceManager = new VirtualDeviceManager({
      prisma,
      mqttBrokerUrl: process.env.MQTT_BROKER_URL
    });
  }
  return deviceManager;
}

// GET /api/virtual-devices/[uid] - Get a specific virtual device
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = getDeviceManager();
    const device = manager.getDevice(params.uid);
    
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const config = (device as any).config;
    const status = device.getStatus();
    const events = manager.exportDeviceEvents(params.uid);

    return NextResponse.json({
      uid: config.uid,
      name: config.name,
      type: config.type,
      room: config.room,
      isVirtual: true,
      status,
      events: events.slice(-50), // Last 50 events
      statistics: {
        totalEvents: events.length
      }
    });
  } catch (error) {
    console.error('Error fetching virtual device:', error);
    return NextResponse.json(
      { error: 'Failed to fetch virtual device' },
      { status: 500 }
    );
  }
}

// DELETE /api/virtual-devices/[uid] - Delete a specific virtual device
export async function DELETE(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = getDeviceManager();
    const success = await manager.removeDevice(params.uid);
    
    if (!success) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Virtual device removed successfully' });
  } catch (error) {
    console.error('Error removing virtual device:', error);
    return NextResponse.json(
      { error: 'Failed to remove virtual device' },
      { status: 500 }
    );
  }
}

// PATCH /api/virtual-devices/[uid] - Update a virtual device
export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = getDeviceManager();
    const device = manager.getDevice(params.uid);
    
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const body = await request.json();
    const { battery, signalStrength, online, location } = body;

    // Update device properties using available methods
    if (battery !== undefined) {
      device.simulateBatteryDrain(true, battery);
    }
    
    if (online !== undefined) {
      if (online) {
        device.simulateOnline();
      } else {
        device.simulateOffline();
      }
    }
    
    // Update location for smartwatch devices
    if (location !== undefined && device.constructor.name === 'VirtualSmartWatch') {
      (device as any).location = location;
    }

    // Note: signalStrength cannot be directly set as it's protected
    // It fluctuates automatically via simulateSignalFluctuation()

    const config = (device as any).config;
    const status = device.getStatus();

    return NextResponse.json({
      uid: config.uid,
      name: config.name,
      type: config.type,
      room: config.room,
      isVirtual: true,
      status
    });
  } catch (error) {
    console.error('Error updating virtual device:', error);
    return NextResponse.json(
      { error: 'Failed to update virtual device' },
      { status: 500 }
    );
  }
}