import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../constants/config';
import { ApiResponse, PaginatedResponse } from '../types/api';

class ApiService {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add bypass header for development
        if (__DEV__) {
          config.headers['x-auth-bypass'] = 'true';
        }

        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          this.clearAuthToken();
          // You might want to redirect to login screen here
        }

        // Handle network errors
        if (!error.response) {
          throw new Error('Network error - please check your connection');
        }

        // Handle server errors
        if (error.response.status >= 500) {
          throw new Error('Server error - please try again later');
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Retry mechanism for failed requests
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retrying request (attempt ${attempt + 1}/${maxRetries})`);
      }
    }

    throw lastError!;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Update base URL (useful for switching between local and production)
  updateBaseURL(baseURL: string) {
    this.client.defaults.baseURL = baseURL;
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Helper function to handle API responses with error handling
export async function handleApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return { data: null, error: errorMessage };
  }
}

// Helper function for paginated responses
export async function handlePaginatedApiCall<T>(
  apiCall: () => Promise<PaginatedResponse<T>>
): Promise<{ data: T[]; meta: any; error: string | null }> {
  try {
    const response = await apiCall();
    return { 
      data: response.data || [], 
      meta: response.meta,
      error: null 
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return { 
      data: [], 
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      error: errorMessage 
    };
  }
}