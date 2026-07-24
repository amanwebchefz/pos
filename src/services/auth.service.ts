import axios from '../lib/axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  businessName?: string;
  businessId?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      description: string;
      permissions: Array<{
        id: string;
        name: string;
        description: string;
        resource: string;
        action: string;
      }>;
    };
    permissions?: string[];
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await axios.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Token refresh failed';
      throw new Error(errorMessage);
    }
  },

  async logout(): Promise<void> {
    try {
      await axios.post('/auth/logout');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Logout failed';
      throw new Error(errorMessage);
    }
  },

  async me(): Promise<any> {
    try {
      const response = await axios.get('/auth/me');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user data';
      throw new Error(errorMessage);
    }
  },
};
