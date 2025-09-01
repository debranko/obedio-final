import { apiService, handleApiCall, handlePaginatedApiCall } from './api';
import { Request, RequestsQuery, PaginatedResponse } from '../types/api';

class RequestsService {
  // Get all requests with filtering and pagination
  async getRequests(query: RequestsQuery = {}) {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.status) params.append('status', query.status);
    if (query.deviceId) params.append('deviceId', query.deviceId.toString());
    if (query.assignedTo) params.append('assignedTo', query.assignedTo.toString());

    return handlePaginatedApiCall(async () => {
      return await apiService.get<PaginatedResponse<Request>>(`/requests?${params.toString()}`);
    });
  }

  // Get single request by ID
  async getRequest(id: number) {
    return handleApiCall(async () => {
      return await apiService.get<Request>(`/requests/${id}`);
    });
  }

  // Create new request
  async createRequest(data: { deviceId: number; notes?: string }) {
    return handleApiCall(async () => {
      return await apiService.post<Request>('/requests', data);
    });
  }

  // Update request
  async updateRequest(id: number, data: { 
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    assignedTo?: number;
    notes?: string;
  }) {
    return handleApiCall(async () => {
      return await apiService.put<Request>(`/requests/${id}`, data);
    });
  }

  // Complete request
  async completeRequest(id: number) {
    return handleApiCall(async () => {
      return await apiService.post(`/requests/${id}/complete`);
    });
  }

  // Transfer request to another user
  async transferRequest(id: number, assignedTo: number) {
    return handleApiCall(async () => {
      return await apiService.post(`/requests/${id}/transfer`, { assignedTo });
    });
  }

  // Get active requests (PENDING or IN_PROGRESS)
  async getActiveRequests() {
    return this.getRequests({ 
      status: 'PENDING,IN_PROGRESS',
      limit: 50 
    });
  }

  // Get requests for specific device
  async getDeviceRequests(deviceId: number) {
    return this.getRequests({ deviceId, limit: 20 });
  }

  // Get requests assigned to specific user
  async getUserRequests(userId: number) {
    return this.getRequests({ assignedTo: userId, limit: 20 });
  }
}

export const requestsService = new RequestsService();