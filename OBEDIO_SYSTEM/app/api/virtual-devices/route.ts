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

// GET /api/virtual-devices - Get all virtual devices
export async function GET(request: NextRequest) {
  try {
    const session = getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = getDeviceManager();
    const devices = manager.getAllDevices();
    const statistics = manager.getStatistics();

    // Get device details
    const deviceDetails = devices.map(device => {
      const config = (device as any).config;
      const status = device.getStatus();
      
      return {
        uid: config.uid,
        name: config.name,
        type: config.type,
        room: config.room,
        isVirtual: true,
        status: status,
        events: manager.exportDeviceEvents(config.uid).slice(-10) // Last 10 events
      };
    });

    return NextResponse.json({
      devices: deviceDetails,
      statistics,
      activeFailures: manager.getActiveFailures()
    });
  } catch (error) {
    console.error('Error fetching virtual devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch virtual devices' },
      { status: 500 }
    );
  }
}

// POST /api/virtual-devices - Create a new virtual device
export async function POST(request: NextRequest) {
  try {
    const session = getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      name,
      room,
      uid,
      initialBattery,
      initialSignal,
      additionalConfig,
      saveToDatabase = true
    } = body;

    // Validate required fields
    if (!type || !name || !room) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, room' },
        { status: 400 }
      );
    }

    // Validate device type
    if (!['BUTTON', 'SMART_WATCH', 'REPEATER'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid device type' },
        { status: 400 }
      );
    }

    const manager = getDeviceManager();
    const device = await manager.createDevice({
      type,
      name,
      room,
      uid,
      initialBattery,
      initialSignal,
      additionalConfig,
      saveToDatabase
    });

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
    console.error('Error creating virtual device:', error);
    return NextResponse.json(
      { error: 'Failed to create virtual device' },
      { status: 500 }
    );
  }
}

// DELETE /api/virtual-devices - Delete all virtual devices
export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = getDeviceManager();
    await manager.removeAllDevices();

    return NextResponse.json({ message: 'All virtual devices removed' });
  } catch (error) {
    console.error('Error removing virtual devices:', error);
    return NextResponse.json(
      { error: 'Failed to remove virtual devices' },
      { status: 500 }
    );
  }
}