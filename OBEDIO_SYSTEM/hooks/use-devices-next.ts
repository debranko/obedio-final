import { useState, useEffect, useCallback } from 'react';
import { useEventSource } from './useEventSource';
import { toast } from '@/components/ui/use-toast';

// Define device types
export type DeviceType = 'BUTTON' | 'SMART_WATCH' | 'REPEATER';

// Base device interface with consistent field naming
export interface BaseDevice {
  id: number;
  uid: string;
  name: string;
  type: DeviceType;
  isActive: boolean;
  battery: number;
  signal: number; // We use signal consistently everywhere
  lastSeen: string;
  room?: string;
  location: string;
}

// Type-specific device interfaces
export interface RepeaterDevice extends BaseDevice {
  type: 'REPEATER';
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

/**
 * Normalizes device data to ensure consistency
 * This is simpler than the original since we use consistent field names
 */
function normalizeDeviceData<T extends BaseDevice>(device: any): T {
  // Make a copy to avoid mutating the original
  const normalized = { ...device };
  
  // Ensure signal is properly set
  if (normalized.signalStrength !== undefined && normalized.signal === undefined) {
    normalized.signal = normalized.signalStrength;
  }
  
  // Remove signalStrength if it exists to avoid confusion
  if ('signalStrength' in normalized) {
    delete normalized.signalStrength;
  }
  
  return normalized as T;
}

export function useDevicesNext<T extends BaseDevice>(deviceType: DeviceType, initialFilters?: DeviceFilters<T>) {
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
            return normalizeDeviceData<T>(updatedDevice);
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
      
      const response = await fetch(`/api/devices?${params}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: ApiResponse<T> = await response.json();
      
      // Normalize the devices to ensure signal consistency
      const normalizedDevices = Array.isArray(data.devices)
        ? data.devices.map(device => normalizeDeviceData<T>(device))
        : [];
      
      // Extract unique locations for filtering
      const locations = new Set<string>();
      normalizedDevices.forEach(device => {
        if (device.location) locations.add(device.location);
        else if (device.room) locations.add(device.room);
      });
      
      setDevices(normalizedDevices);
      setAvailableLocations(Array.from(locations));
    } catch (err) {
      console.error(`Error fetching ${deviceType} devices:`, err);
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
