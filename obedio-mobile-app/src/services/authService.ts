import { apiService, handleApiCall } from './api';
import { LoginRequest, LoginResponse, User } from '../types/api';

class AuthService {
  // Login
  async login(credentials: LoginRequest) {
    return handleApiCall(async () => {
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      
      // Store auth token if available
      if (response.user) {
        // In a real app, you'd extract the token from the response
        // For now, we'll simulate it since the API uses cookies
        apiService.setAuthToken('simulated-token');
      }
      
      return response;
    });
  }

  // Logout
  async logout() {
    return handleApiCall(async () => {
      const response = await apiService.post('/auth/logout');
      apiService.clearAuthToken();
      return response;
    });
  }

  // Get current user (if needed)
  async getCurrentUser() {
    return handleApiCall(async () => {
      return await apiService.get<User>('/auth/me');
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    // In a real app, you'd check for valid token
    return true; // For development, always return true
  }
}

export const authService = new AuthService();