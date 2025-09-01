import { useState, useEffect, useCallback } from 'react';
import { useEventSource } from './useEventSource';
import { toast } from '@/components/ui/use-toast';

// Base device interface (matches the database schema)
export interface BaseDevice {
  id: number;
  uid: string;
  name?: string;
  room: string;
  battery: number;
  signal: number;
  isActive: boolean;
  lastSeen: string;
  location?: string;
  firmwareVersion?: string;
  
  // Smart Watch specific fields
  model?: string;
  assignedToUserId?: number | null;
  
  // Repeater specific fields
  connectionType?: string;
  operatingFrequency?: string;
  isEmergencyMode?: boolean;
  connectedDevices?: number;
  coverageArea?: string;
  meshRole?: string;
  ipAddress?: string;
  macAddress?: string;
}

// Generic device classifier function type
export type DeviceClassifierFn = (device: BaseDevice) => boolean;

// Filter parameters types
export type StatusFilter = 'all' | 'active' | 'inactive' | 'emergency';
export type BatteryFilter = 'all' | 'critical' | 'low' | 'good';
export type AssignmentFilter = 'all' | 'assigned' | 'unassigned';
export type ConnectionFilter = 'all' | 'Ethernet' | 'Wi-Fi';

// Sorting options
export type SortOption = 'name' | 'status' | 'battery' | 'signal' | 'connectedDevices';

// Filter parameters interface
export interface DeviceFilters {
  searchTerm?: string;
  statusFilter?: StatusFilter;
  batteryFilter?: BatteryFilter;
  assignmentFilter?: AssignmentFilter; 
  connectionTypeFilter?: ConnectionFilter;
  locationFilter?: string;
  sortBy?: SortOption;
  customFilter?: (device: BaseDevice) => boolean;
}

// API response type
interface ApiResponse {
  devices: BaseDevice[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// Default classifiers for different device types
export const deviceClassifiers = {
  // Determine if a device is likely a repeater based on its properties
  isRepeater: (device: BaseDevice): boolean => {
    return Boolean(
      // Repeaters typically have these specific properties
      (device.connectionType || device.meshRole || device.operatingFrequency) &&
      // Repeaters shouldn't have these properties typically found in other devices
      !device.model // model is typically for smart watches
    );
  },
  
  // Determine if a device is likely a smart watch based on its properties
  isSmartWatch: (device: BaseDevice): boolean => {
    return Boolean(
      device.model || // Smart watches usually have a model
      device.assignedToUserId !== undefined // Assigned to a user
    );
  },
  
  // Determine if a device is likely a button based on its properties
  isButton: (device: BaseDevice): boolean => {
    // Buttons typically don't have specific fields like repeaters and watches
    // So we check that it doesn't have those specific fields
    return Boolean(
      !deviceClassifiers.isRepeater(device) && 
      !deviceClassifiers.isSmartWatch(device)
    );
  }
};

export function useDevicesByProperties(
  classifierFn: DeviceClassifierFn,
  initialFilters?: DeviceFilters
) {
  const [allDevices, setAllDevices] = useState<BaseDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<BaseDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<DeviceFilters>(initialFilters || {});
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  
  // Subscribe to device update events
  const { connected: sseConnected } = useEventSource(`/api/events/stream`, (data) => {
    if (data.event === 'device_update') {
      setAllDevices(prev =>
        prev.map(device => {
          if (device.id === data.deviceId) {
            const updatedDevice = { ...device, ...data.updateData };
            return updatedDevice;
          }
          return device;
        })
      );
    }
  });
  
  // Build API query parameters from filters - NO type filtering
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams({
      page: '1',
      limit: '100', // Get more devices to ensure we capture all relevant ones
    });
    
    // Apply other filters that don't involve type
    if (filters.searchTerm) {
      params.append('search', filters.searchTerm);
    }
    
    if (filters.statusFilter === 'active') {
      params.append('isActive', 'true');
    } else if (filters.statusFilter === 'inactive') {
      params.append('isActive', 'false');
    }
    
    if (filters.batteryFilter === 'critical') {
      params.append('battery', 'lt:20');
    } else if (filters.batteryFilter === 'low') {
      params.append('battery', 'range:20:50');
    } else if (filters.batteryFilter === 'good') {
      params.append('battery', 'gt:50');
    }
    
    // Only apply repeater-specific filters if we're filtering for repeaters
    if (classifierFn === deviceClassifiers.isRepeater) {
      if (filters.statusFilter === 'emergency') {
        params.append('isEmergencyMode', 'true');
      }
      
      if (filters.connectionTypeFilter && filters.connectionTypeFilter !== 'all') {
        params.append('connectionType', filters.connectionTypeFilter);
      }
    }
    
    if (filters.locationFilter && filters.locationFilter !== 'all') {
      params.append('location', filters.locationFilter);
    }
    
    return params;
  }, [filters, classifierFn]);
  
  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = buildQueryParams();
      console.log(`DEBUG: Fetching devices with params:`, params.toString());
      
      const response = await fetch(`/api/devices?${params}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: ApiResponse = await response.json();
      console.log(`DEBUG: Received ${data.devices?.length || 0} total devices`);
      
      // Filter devices based on the classifier function
      const typedDevices = Array.isArray(data.devices) 
        ? data.devices.filter(classifierFn)
        : [];
        
      console.log(`DEBUG: Filtered to ${typedDevices.length} devices of the requested type`);
      
      // Extract unique locations for filtering
      const locations = new Set<string>();
      if (Array.isArray(typedDevices)) {
        typedDevices.forEach(device => {
          if (device.location) locations.add(device.location);
          else if (device.room) locations.add(device.room);
        });
      }
      
      setAllDevices(typedDevices);
      setAvailableLocations(Array.from(locations));
    } catch (err) {
      console.error(`DEBUG: Error fetching devices:`, err);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error(String(err)));
      }
      
      toast({
        title: `Error loading devices`,
        description: `Failed to load devices: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, classifierFn]);
  
  // Apply client-side filtering and sorting
  const applyFiltersAndSort = useCallback(() => {
    if (!allDevices.length) {
      setFilteredDevices([]);
      return;
    }
    
    let result = [...allDevices];
    
    // Apply search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      result = result.filter(device => 
        (device.name?.toLowerCase().includes(searchTerm)) || 
        device.uid.toLowerCase().includes(searchTerm) ||
        device.room.toLowerCase().includes(searchTerm) ||
        device.location?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (filters.statusFilter === 'active') {
      result = result.filter(device => device.isActive);
    } else if (filters.statusFilter === 'inactive') {
      result = result.filter(device => !device.isActive);
    } else if (filters.statusFilter === 'emergency' && classifierFn === deviceClassifiers.isRepeater) {
      result = result.filter(device => device.isEmergencyMode);
    }
    
    // Apply battery filter
    if (filters.batteryFilter === 'critical') {
      result = result.filter(device => device.battery < 20);
    } else if (filters.batteryFilter === 'low') {
      result = result.filter(device => device.battery >= 20 && device.battery <= 50);
    } else if (filters.batteryFilter === 'good') {
      result = result.filter(device => device.battery > 50);
    }
    
    // Apply connection type filter for repeaters
    if (classifierFn === deviceClassifiers.isRepeater && 
        filters.connectionTypeFilter && 
        filters.connectionTypeFilter !== 'all') {
      result = result.filter(device => device.connectionType === filters.connectionTypeFilter);
    }
    
    // Apply location filter
    if (filters.locationFilter && filters.locationFilter !== 'all') {
      result = result.filter(device => 
        device.location === filters.locationFilter || 
        device.room === filters.locationFilter
      );
    }
    
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
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            
            // For repeaters, also check emergency mode
            const aEmergency = a.isEmergencyMode ?? false;
            const bEmergency = b.isEmergencyMode ?? false;
            if (aEmergency !== bEmergency) return aEmergency ? -1 : 1;
            return (a.name || '').localeCompare(b.name || '');
          case 'battery':
            return ((b.battery ?? 0) - (a.battery ?? 0));
          case 'signal':
            return ((b.signal ?? 0) - (a.signal ?? 0));
          case 'connectedDevices':
            const aDevices = a.connectedDevices ?? 0;
            const bDevices = b.connectedDevices ?? 0;
            return bDevices - aDevices;
          default:
            return 0;
        }
      });
    }
    
    setFilteredDevices(result);
  }, [allDevices, filters, classifierFn]);
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<DeviceFilters>) => {
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
      console.log(`SSE not connected, using polling fallback`);
      const intervalId = setInterval(fetchDevices, 30000); // Every 30 seconds
      return () => clearInterval(intervalId);
    }
  }, [fetchDevices, sseConnected]);
  
  // Apply filters whenever devices or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [allDevices, filters, applyFiltersAndSort]);
  
  return {
    devices: allDevices,
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