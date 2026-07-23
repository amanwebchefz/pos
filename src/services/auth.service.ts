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
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post('/auth/register', data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await axios.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async logout(): Promise<void> {
    await axios.post('/auth/logout');
  },

  async me(): Promise<any> {
    const response = await axios.get('/auth/me');
    return response.data;
  },
};
