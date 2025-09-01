import { useState, useEffect, useCallback } from 'react';
import { useEventSource } from './useEventSource';
import { toast } from '@/components/ui/use-toast';

// Define device types
export type DeviceType = 'BUTTON' | 'SMART_WATCH' | 'REPEATER';

// Base device interface
export interface BaseDevice {
  id: number;
  uid: string;
  name: string;
  type: DeviceType;
  isActive: boolean;
  battery: number;
  signal: number;
  lastSeen: string;
  room?: string;
  location: string;
}

// Type-specific device interfaces
export interface RepeaterDevice extends BaseDevice {
  type: 'REPEATER';
  signalStrength: number; // This is already correctly mapped to match component expectations
  firmwareVersion: string;
  connectionType: 'Ethernet' | 'Wi-Fi';
  operatingFrequency: string;
  isEmergencyMode: boolean;
  connectedDevices: number;
  coverageArea: string;
  meshRole: 'primary' | 'secondary' | 'standalone';
  ipAddress: string;
  macAddress: string;
}

export interface SmartWatchDevice extends BaseDevice {
  type: 'SMART_WATCH';
  assignedToUserId?: number | null;
  assignedToName?: string;
  screenSize?: string;
  model?: string;
  osVersion?: string;
}

export interface ButtonDevice extends BaseDevice {
  type: 'BUTTON';
  buttonType?: string;
  pressCount?: number;
  lastPressTime?: string;
}

// Union type for all devices
export type Device = RepeaterDevice | SmartWatchDevice | ButtonDevice;

// Filter parameters types
export type StatusFilter = 'all' | 'active' | 'inactive' | 'emergency';
export type BatteryFilter = 'all' | 'critical' | 'low' | 'good';
export type AssignmentFilter = 'all' | 'assigned' | 'unassigned';
export type ConnectionFilter = 'all' | 'Ethernet' | 'Wi-Fi';

// Sorting options
export type SortOption = 'name' | 'status' | 'battery' | 'signal' | 'connectedDevices';

// Filter parameters interface
export interface DeviceFilters<T extends BaseDevice> {
  searchTerm?: string;
  statusFilter?: StatusFilter;
  batteryFilter?: BatteryFilter;
  assignmentFilter?: AssignmentFilter; 
  connectionTypeFilter?: ConnectionFilter;
  locationFilter?: string;
  sortBy?: SortOption;
  customFilter?: (device: T) => boolean;
}

// API response type
interface ApiResponse<T> {
  devices: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// Make BaseDevice and RepeaterDevice interfaces compatible by mapping signal to signalStrength
function mapDeviceData<T extends BaseDevice>(device: any): T {
  try {
    console.log(`DEBUG: mapDeviceData for ${device.type} device:`, device);
    
    if (device.type === 'REPEATER') {
      // Ensure the repeater device has signalStrength property based on signal
      const mappedDevice = {
        ...device,
        signalStrength: device.signalStrength ?? device.signal ?? 0
      };
      console.log(`DEBUG: Mapped REPEATER device:`, mappedDevice);
      return mappedDevice as T;
    }
    return device as T;
  } catch (error) {
    console.error('DEBUG: Error in mapDeviceData:', error);
    console.error('DEBUG: Problem device data:', JSON.stringify(device, null, 2));
    return device as T; // Return original to avoid breaking the UI
  }
}

console.log('use-devices.ts module loaded');

export function useDevices<T extends BaseDevice>(deviceType: DeviceType, initialFilters?: DeviceFilters<T>) {
  console.log(`useDevices hook initialized with deviceType: ${deviceType}`);
  const [devices, setDevices] = useState<T[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<DeviceFilters<T>>(initialFilters || {});
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  
  // Subscribe to device update events
  const { connected: sseConnected } = useEventSource(`/api/events/stream`, (data) => {
    if (data.event === 'device_update' && data.deviceType === deviceType) {
      setDevices(prev =>
        prev.map(device => {
          if (device.id === data.deviceId) {
            const updatedDevice = { ...device, ...data.updateData };
            return mapDeviceData<T>(updatedDevice);
          }
          return device;
        }) as T[]
      );
    }
  });
  
  // Build API query parameters from filters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams({
      page: '1',
      limit: '50',
      type: deviceType,
    });
    
    if (filters.searchTerm) {
      params.append('search', filters.searchTerm);
    }
    
    if (filters.statusFilter === 'active') {
      params.append('isActive', 'true');
    } else if (filters.statusFilter === 'inactive') {
      params.append('isActive', 'false');
    } else if (filters.statusFilter === 'emergency') {
      params.append('isEmergencyMode', 'true');
    }
    
    if (filters.batteryFilter === 'critical') {
      params.append('battery', 'lt:20');
    } else if (filters.batteryFilter === 'low') {
      params.append('battery', 'range:20:50');
    } else if (filters.batteryFilter === 'good') {
      params.append('battery', 'gt:50');
    }
    
    if (filters.assignmentFilter === 'assigned') {
      params.append('hasAssignee', 'true');
    } else if (filters.assignmentFilter === 'unassigned') {
      params.append('hasAssignee', 'false');
    }
    
    if (filters.connectionTypeFilter && filters.connectionTypeFilter !== 'all') {
      params.append('connectionType', filters.connectionTypeFilter);
    }
    
    if (filters.locationFilter && filters.locationFilter !== 'all') {
      params.append('location', filters.locationFilter);
    }
    
    return params;
  }, [deviceType, filters]);
  
  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = buildQueryParams();
      console.log(`DEBUG: Fetching ${deviceType} devices with params:`, params.toString());
      
      const response = await fetch(`/api/devices?${params}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: ApiResponse<T> = await response.json();
      console.log(`DEBUG: Received ${data.devices?.length || 0} ${deviceType} devices`);
      console.log(`DEBUG: Raw devices data for ${deviceType}:`, JSON.stringify(data.devices, null, 2));
      
      // Map the devices to ensure signal/signalStrength compatibility
      const mappedDevices = Array.isArray(data.devices)
        ? data.devices.map(device => {
            try {
              console.log(`DEBUG: Processing device ${device.id} (${device.type})`);
              const mappedDevice = mapDeviceData<T>(device);
              
              // Verify key properties exist
              if (device.type === 'REPEATER') {
                console.log(`DEBUG: REPEATER device properties -
                  signal: ${device.signal},
                  signalStrength: ${device.signalStrength},
                  mapped signalStrength: ${mappedDevice.signalStrength}`
                );
              }
              
              return mappedDevice;
            } catch (mapError) {
              console.error(`DEBUG: Error mapping device ${device?.id || 'unknown'}:`, mapError);
              console.error(`DEBUG: Problem device:`, JSON.stringify(device, null, 2));
              // Return a safe default to avoid breaking the UI
              return device as T;
            }
          })
        : [];
      
      console.log(`DEBUG: First device after mapping:`, mappedDevices.length > 0 ? JSON.stringify(mappedDevices[0], null, 2) : 'No devices');
      
      
      // Extract unique locations for filtering
      const locations = new Set<string>();
      if (Array.isArray(mappedDevices)) {
        mappedDevices.forEach(device => {
          if (device.location) locations.add(device.location);
          else if (device.room) locations.add(device.room);
        });
      }
      
      setDevices(mappedDevices);
      setAvailableLocations(Array.from(locations));
    } catch (err) {
      console.error(`DEBUG: Error fetching ${deviceType} devices:`, err);
      // Extract more details from the error
      if (err instanceof Error) {
        console.error(`DEBUG: Error details - Name: ${err.name}, Message: ${err.message}, Stack: ${err.stack}`);
      }
      console.error(`DEBUG: Full error object:`, JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: `Error loading ${deviceType} devices`,
        description: `Failed to load ${deviceType.toLowerCase()} devices: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [deviceType, buildQueryParams]);
  
  // Apply sorting and filtering
  const applyFiltersAndSort = useCallback(() => {
    if (!devices.length) {
      setFilteredDevices([]);
      return;
    }
    
    let result = [...devices];
    
    // Apply custom filter if provided
    if (filters.customFilter) {
      result = result.filter(filters.customFilter);
    }
    
    // Apply sorting
    if (filters.sortBy) {
      result.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'status':
            if ('isActive' in a && 'isActive' in b) {
              if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
              
              // For repeaters, also check emergency mode
              const aEmergency = (a as any).isEmergencyMode ?? false;
              const bEmergency = (b as any).isEmergencyMode ?? false;
              if (aEmergency !== bEmergency) return aEmergency ? -1 : 1;
            }
            return (a.name || '').localeCompare(b.name || '');
          case 'battery':
            return ((b.battery ?? 0) - (a.battery ?? 0));
          case 'signal':
            return ((b.signal ?? 0) - (a.signal ?? 0));
          case 'connectedDevices':
            const aDevices = (a as any).connectedDevices ?? 0;
            const bDevices = (b as any).connectedDevices ?? 0;
            return bDevices - aDevices;
          default:
            return 0;
        }
      });
    }
    
    setFilteredDevices(result);
  }, [devices, filters]);
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<DeviceFilters<T>>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      batteryFilter: 'all',
      assignmentFilter: 'all',
      connectionTypeFilter: 'all',
      locationFilter: 'all',
      sortBy: 'name',
    });
  }, []);
  
  // Initial fetch and set up polling if SSE isn't available
  useEffect(() => {
    fetchDevices();
    
    // Set up polling as fallback if needed
    if (!sseConnected) {
      console.log(`SSE not connected for ${deviceType} devices, using polling fallback`);
      const intervalId = setInterval(fetchDevices, 30000); // Every 30 seconds
      return () => clearInterval(intervalId);
    }
  }, [deviceType, fetchDevices, sseConnected]);
  
  // Apply filters whenever devices or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [devices, filters, applyFiltersAndSort]);
  
  return {
    devices,
    filteredDevices,
    loading,
    error,
    filters,
    availableLocations,
    fetchDevices,
    updateFilters,
    resetFilters,
  };
}