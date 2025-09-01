import { apiService, handleApiCall, handlePaginatedApiCall } from './api';
import { Device, DevicesQuery, PaginatedResponse } from '../types/api';

class DevicesService {
  // Get all devices with filtering and pagination
  async getDevices(query: DevicesQuery = {}) {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.search) params.append('search', query.search);
    if (query.type) params.append('type', query.type);
    if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());
    if (query.battery) params.append('battery', query.battery);

    return handlePaginatedApiCall(async () => {
      return await apiService.get<PaginatedResponse<Device>>(`/devices?${params.toString()}`);
    });
  }

  // Get single device by ID
  async getDevice(id: number) {
    return handleApiCall(async () => {
      return await apiService.get<Device>(`/devices/${id}`);
    });
  }

  // Create new device
  async createDevice(data: {
    uid: string;
    name?: string;
    room: string;
    locationId?: number;
    type?: 'BUTTON' | 'SMART_WATCH' | 'REPEATER';
    battery?: number;
    signal?: number;
    isActive?: boolean;
  }) {
    return handleApiCall(async () => {
      return await apiService.post<Device>('/devices', data);
    });
  }

  // Update device
  async updateDevice(id: number, data: Partial<Device>) {
    return handleApiCall(async () => {
      return await apiService.put<Device>(`/devices/${id}`, data);
    });
  }

  // Delete device
  async deleteDevice(id: number) {
    return handleApiCall(async () => {
      return await apiService.delete(`/devices/${id}`);
    });
  }

  // Ping device
  async pingDevice(id: number) {
    return handleApiCall(async () => {
      return await apiService.post(`/devices/${id}/ping`);
    });
  }

  // Get device statistics
  async getDeviceStats() {
    return handleApiCall(async () => {
      return await apiService.get('/devices/stats');
    });
  }

  // Get devices with low battery
  async getLowBatteryDevices() {
    return this.getDevices({ battery: 'lt:20', limit: 50 });
  }

  // Get offline devices
  async getOfflineDevices() {
    return this.getDevices({ isActive: false, limit: 50 });
  }

  // Get devices by type
  async getDevicesByType(type: 'BUTTON' | 'SMART_WATCH' | 'REPEATER') {
    return this.getDevices({ type, limit: 100 });
  }

  // Search devices
  async searchDevices(searchTerm: string) {
    return this.getDevices({ search: searchTerm, limit: 50 });
  }
}

export const devicesService = new DevicesService();