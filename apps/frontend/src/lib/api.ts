// API Client for DH Araria Hospital Frontend
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@dh-araria/shared/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          const accessToken = localStorage.getItem('accessToken');
          if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.location.href = '/login?expired=true';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data.data!;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      return accessToken;
    })();

    try {
      return await this.refreshTokenPromise;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private formatError(error: AxiosError<ApiResponse>): ApiError {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    if (error.code === 'ECONNABORTED') {
      return { code: 'TIMEOUT', message: 'Request timed out. Please try again.' };
    }

    if (!error.response) {
      return { code: 'NETWORK_ERROR', message: 'Network error. Please check your connection.' };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
    };
  }

  // Generic request methods
  async get<T>(url: string, params?: Record<string, unknown>) {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown) {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown) {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown) {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string) {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', { email, password });
  }

  async register(data: { name: string; email: string; password: string; phone?: string }) {
    return this.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', data);
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async getProfile() {
    return this.get<any>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post('/auth/change-password', { currentPassword, newPassword });
  }

  // Doctors
  async getDoctors(params?: Record<string, unknown>) {
    return this.get<any[]>('/doctors', params);
  }

  async getDoctor(id: string) {
    return this.get<any>(`/doctors/${id}`);
  }

  async getDoctorSlots(doctorId: string, date: string) {
    return this.get<any[]>(`/doctors/${doctorId}/slots`, { date });
  }

  // Departments
  async getDepartments() {
    return this.get<any[]>('/departments');
  }

  async getDepartment(id: string) {
    return this.get<any>(`/departments/${id}`);
  }

  // Appointments
  async bookAppointment(data: any) {
    return this.post<any>('/appointments', data);
  }

  async getMyAppointments(params?: Record<string, unknown>) {
    return this.get<any[]>('/appointments/my', params);
  }

  async getAppointment(id: string) {
    return this.get<any>(`/appointments/${id}`);
  }

  async cancelAppointment(id: string) {
    return this.delete(`/appointments/${id}`);
  }

  // Blood Bank
  async getBloodStock() {
    return this.get<any[]>('/blood-bank');
  }

  async getBloodStockSummary() {
    return this.get<Record<string, Record<string, number>>>('/blood-bank/summary');
  }

  // Grievances
  async submitGrievance(data: any) {
    return this.post<any>('/grievances', data);
  }

  async getMyGrievances(params?: Record<string, unknown>) {
    return this.get<any[]>('/grievances/my', params);
  }

  async getGrievance(id: string) {
    return this.get<any>(`/grievances/${id}`);
  }

  // Notices
  async getNotices(params?: Record<string, unknown>) {
    return this.get<any[]>('/notices/published', params);
  }

  async getNotice(id: string) {
    return this.get<any>(`/notices/${id}`);
  }

  // Health check
  async healthCheck() {
    return this.get<{ status: string; timestamp: string }>('/health/live');
  }
}

export const api = new ApiClient();

// Helper to handle API responses
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message || 'API request failed');
  }
  return response.data as T;
}

// Hook for SWR
export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url);
  return handleApiResponse(response);
};