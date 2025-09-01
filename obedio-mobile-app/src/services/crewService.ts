import { apiService, handleApiCall, handlePaginatedApiCall } from './api';
import { User, CrewQuery } from '../types/api';

class CrewService {
  // Get all crew members
  async getCrew(query: CrewQuery = {}) {
    const params = new URLSearchParams();
    
    if (query.role) params.append('role', query.role);
    if (query.search) params.append('search', query.search);
    if (query.onDuty !== undefined) params.append('onDuty', query.onDuty.toString());

    return handleApiCall(async () => {
      const response = await apiService.get<{ crew: User[] }>(`/crew?${params.toString()}`);
      return response.crew;
    });
  }

  // Get single crew member by ID
  async getCrewMember(id: number) {
    return handleApiCall(async () => {
      return await apiService.get<User>(`/crew/${id}`);
    });
  }

  // Create new crew member
  async createCrewMember(data: {
    name: string;
    email?: string;
    password: string;
    role: string;
    department?: string;
    phone?: string;
    cabin?: string;
    languages?: string;
    certifications?: string;
    emergencyContact?: string;
    onLeave?: boolean;
  }) {
    return handleApiCall(async () => {
      return await apiService.post<User>('/crew', data);
    });
  }

  // Update crew member
  async updateCrewMember(id: number, data: Partial<User>) {
    return handleApiCall(async () => {
      return await apiService.put<User>(`/crew/${id}`, data);
    });
  }

  // Update crew member status
  async updateCrewStatus(id: number, status: string) {
    return handleApiCall(async () => {
      return await apiService.put(`/crew/${id}/status`, { status });
    });
  }

  // Upload crew member avatar
  async uploadAvatar(formData: FormData) {
    return handleApiCall(async () => {
      return await apiService.post('/crew/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    });
  }

  // Get crew members on duty
  async getOnDutyCrew() {
    return this.getCrew({ onDuty: true });
  }

  // Get crew members by role
  async getCrewByRole(role: string) {
    return this.getCrew({ role });
  }

  // Search crew members
  async searchCrew(searchTerm: string) {
    return this.getCrew({ search: searchTerm });
  }

  // Get crew member shifts
  async getCrewShifts(id: number) {
    return handleApiCall(async () => {
      return await apiService.get(`/crew/${id}/shifts`);
    });
  }

  // Assign shift to crew member
  async assignShift(crewId: number, shiftData: {
    startsAt: string;
    endsAt: string;
    position?: string;
  }) {
    return handleApiCall(async () => {
      return await apiService.post(`/shifts/assign`, {
        userId: crewId,
        ...shiftData
      });
    });
  }

  // Get crew statistics
  async getCrewStats() {
    return handleApiCall(async () => {
      return await apiService.get('/crew/stats');
    });
  }
}

export const crewService = new CrewService();