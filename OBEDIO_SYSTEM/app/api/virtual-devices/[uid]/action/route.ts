import { NextRequest, NextResponse } from 'next/server';
import { VirtualDeviceManager } from '@/lib/virtual-devices/manager';
import { prisma } from '@/lib/prisma';
import { getSessionCookie } from '@/lib/auth';
import { VirtualSmartButton } from '@/lib/virtual-devices/button';
import { VirtualSmartwatch } from '@/lib/virtual-devices/smartwatch';
import { VirtualRepeater } from '@/lib/virtual-devices/repeater';

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

// POST /api/virtual-devices/[uid]/action - Perform an action on a virtual device
export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = getDeviceManager();
    const device = manager.getDevice(params.uid);
    
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let result: any = { success: true };

    // Handle device-specific actions
    if (device instanceof VirtualSmartButton) {
      switch (action) {
        case 'press':
          const voiceMessage = data?.voiceMessage || 'Service requested';
          device.press(voiceMessage);
          result.message = 'Button pressed';
          break;
        
        case 'emergencyPress':
          device.emergencyPress();
          result.message = 'Emergency button pressed';
          break;
        
        case 'rapidPress':
          const count = data?.count || 3;
          device.rapidPress(count);
          result.message = `Button pressed ${count} times rapidly`;
          break;
        
        case 'malfunction':
          const malfunctionType = data?.type || 'stuck_button';
          device.simulateMalfunction(malfunctionType);
          result.message = 'Button malfunction simulated';
          break;
        
        default:
          return NextResponse.json(
            { error: `Unknown action for button: ${action}` },
            { status: 400 }
          );
      }
    } else if (device instanceof VirtualSmartwatch) {
      switch (action) {
        case 'assignCrew':
          if (!data?.crewId) {
            return NextResponse.json(
              { error: 'crewId is required for assignCrew action' },
              { status: 400 }
            );
          }
          device.assignToCrew(data.crewId);
          result.message = 'Crew assigned to smartwatch';
          break;
        
        case 'updateLocation':
          if (!data?.location) {
            return NextResponse.json(
              { error: 'location is required for updateLocation action' },
              { status: 400 }
            );
          }
          device.updateLocation(data.location);
          result.message = 'Location updated';
          break;
        
        case 'acceptRequest':
          if (!data?.requestId) {
            return NextResponse.json(
              { error: 'requestId is required for acceptRequest action' },
              { status: 400 }
            );
          }
          device.acceptRequest(data.requestId);
          result.message = 'Request accepted';
          break;
        
        case 'declineRequest':
          if (!data?.requestId) {
            return NextResponse.json(
              { error: 'requestId is required for declineRequest action' },
              { status: 400 }
            );
          }
          device.declineRequest(data.requestId, data.reason);
          result.message = 'Request declined';
          break;
        
        case 'completeRequest':
          if (!data?.requestId) {
            return NextResponse.json(
              { error: 'requestId is required for completeRequest action' },
              { status: 400 }
            );
          }
          device.completeRequest(data.requestId, data.notes);
          result.message = 'Request completed';
          break;
        
        case 'sendSOS':
          device.sendSOS(data?.message);
          result.message = 'SOS signal sent';
          break;
        
        case 'simulateFall':
          device.simulateFall();
          result.message = 'Fall detection triggered';
          break;
        
        case 'simulateMovement':
          if (!data?.pattern || !data?.duration) {
            return NextResponse.json(
              { error: 'pattern and duration are required for simulateMovement action' },
              { status: 400 }
            );
          }
          device.simulateMovement(data.pattern, data.duration);
          result.message = `Movement simulation started: ${data.pattern} for ${data.duration}ms`;
          break;
        
        default:
          return NextResponse.json(
            { error: `Unknown action for smartwatch: ${action}` },
            { status: 400 }
          );
      }
    } else if (device instanceof VirtualRepeater) {
      switch (action) {
        case 'updateSignalStrength':
          if (data?.signalStrength === undefined) {
            return NextResponse.json(
              { error: 'signalStrength is required for updateSignalStrength action' },
              { status: 400 }
            );
          }
          device.updateSignalStrength(data.signalStrength);
          result.message = 'Signal strength updated';
          break;
        
        case 'relayMessage':
          if (!data?.fromDevice || !data?.toDevice || !data?.message) {
            return NextResponse.json(
              { error: 'fromDevice, toDevice, and message are required for relayMessage action' },
              { status: 400 }
            );
          }
          device.relayMessage(data.fromDevice, data.toDevice, data.message);
          result.message = 'Message relayed';
          break;
        
        case 'registerDevice':
          if (!data?.deviceUid || !data?.deviceType) {
            return NextResponse.json(
              { error: 'deviceUid and deviceType are required for registerDevice action' },
              { status: 400 }
            );
          }
          device.registerDevice(data.deviceUid, data.deviceType);
          result.message = 'Device registered';
          break;
        
        case 'unregisterDevice':
          if (!data?.deviceUid) {
            return NextResponse.json(
              { error: 'deviceUid is required for unregisterDevice action' },
              { status: 400 }
            );
          }
          device.unregisterDevice(data.deviceUid);
          result.message = 'Device unregistered';
          break;
        
        case 'simulateCongestion':
          const messageCount = data?.messageCount || 50;
          const congestionDuration = data?.duration || 10000;
          device.simulateCongestion(messageCount, congestionDuration);
          result.message = `Network congestion simulated: ${messageCount} messages over ${congestionDuration}ms`;
          break;
        
        case 'simulateFirmwareUpdate':
          if (!data?.version) {
            return NextResponse.json(
              { error: 'version is required for simulateFirmwareUpdate action' },
              { status: 400 }
            );
          }
          device.simulateFirmwareUpdate(data.version, data.duration);
          result.message = 'Firmware update started';
          break;
        
        case 'simulateMeshNetwork':
          device.simulateMeshNetwork(data?.otherRepeaters || []);
          result.message = 'Mesh network formed';
          break;
        
        case 'cleanupStaleConnections':
          device.cleanupStaleConnections(data?.maxAge);
          result.message = 'Stale connections cleaned up';
          break;
        
        default:
          return NextResponse.json(
            { error: `Unknown action for repeater: ${action}` },
            { status: 400 }
          );
      }
    } else {
      // Generic actions for all devices
      switch (action) {
        case 'batteryDrain':
          const targetLevel = data?.targetLevel || 0;
          device.simulateBatteryDrain(true, targetLevel);
          result.message = `Battery drained to ${targetLevel}%`;
          break;
        
        case 'goOffline':
          const duration = data?.duration;
          device.simulateOffline(duration);
          result.message = duration 
            ? `Device will go offline for ${duration}ms` 
            : 'Device is now offline';
          break;
        
        case 'goOnline':
          device.simulateOnline();
          result.message = 'Device is now online';
          break;
        
        case 'networkFailure':
          const failureType = data?.type || 'disconnect';
          device.simulateNetworkFailure(failureType);
          result.message = `Network failure simulated: ${failureType}`;
          break;
        
        default:
          return NextResponse.json(
            { error: `Unknown action: ${action}` },
            { status: 400 }
          );
      }
    }

    // Get updated status
    const status = device.getStatus();
    result.device = {
      uid: params.uid,
      status,
      lastAction: {
        action,
        data,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error performing device action:', error);
    return NextResponse.json(
      { error: 'Failed to perform device action' },
      { status: 500 }
    );
  }
}