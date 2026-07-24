import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: InternalAxiosRequestConfig;
}

interface ApiRequestData {
  [key: string]: any;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get token from Zustand store
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // return response;
        return response.data;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('Axios - 401 error detected, attempting token refresh...');
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const refreshToken = useAuthStore.getState().refreshToken;
            console.log('Axios - Refresh token available:', !!refreshToken);
            
            if (refreshToken) {
              console.log('Axios - Calling refresh endpoint...');
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              console.log('Axios - Refresh response received');
              const { accessToken, refreshToken: newRefreshToken } = response.data;

              // Update Zustand store state
              const user = useAuthStore.getState().user;
              if (user) {
                console.log('Axios - Updating auth store with new tokens');
                useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);
              }

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }

              console.log('Axios - Retrying original request with new token');
              return this.client(originalRequest);
            } else {
              // No refresh token available, logout user
              console.error('Axios - No refresh token available, logging out');
              useAuthStore.getState().logout();
              window.location.href = '/login';
            }
          } catch (refreshError) {
            // Refresh failed - logout user and redirect to login
            console.error('Axios - Token refresh failed, logging out:', refreshError);
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T>(url, config) as Promise<T>;
  }

  public post<T = any>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<T>(url, data, config) as Promise<T>;
  }

  public put<T = any>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put<T>(url, data, config) as Promise<T>;
  }

  public patch<T = any>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch<T>(url, data, config) as Promise<T>;
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T>(url, config) as Promise<T>;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
