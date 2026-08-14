import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface OpenRegisterData {
  openingAmount: number;
  registerNumber?: string;
  notes?: string;
}

export interface CloseRegisterData {
  closingAmount: number;
  notes?: string;
  totalSales?: number;
  transactionCount?: number;
}

export interface CashRegister {
  id: string;
  registerNumber: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  branchId: string | null;
  branch: any;
  businessId: string;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  openingNotes?: string | null;
  closingNotes?: string | null;
  totalSales?: number | null;
  transactionCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

const getAuthHeaders = () => {
  const authStore = useAuthStore.getState();
  const token = authStore.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const cashRegisterService = {
  async openRegister(data: OpenRegisterData): Promise<CashRegister> {
    const response = await axios.post(`${API_URL}/cash-registers/open`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async closeRegister(registerId: string, data: CloseRegisterData): Promise<CashRegister> {
    const response = await axios.post(`${API_URL}/cash-registers/${registerId}/close`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getActiveRegister(): Promise<CashRegister | null> {
    try {
      const response = await axios.get(`${API_URL}/cash-registers/active`, {
        headers: getAuthHeaders(),
      });
      return response?.data?.data || null;
      // return response?.data?.data || response?.data;
    } catch (error) {
      return null;
    }
  },

  async getRegisterHistory(startDate?: string, endDate?: string): Promise<CashRegister[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_URL}/cash-registers/history`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  async getAllRegistersForAdmin(startDate?: string, endDate?: string): Promise<CashRegister[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_URL}/cash-registers/admin/all`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data?.data;
  },

  async checkRegisterStatus(): Promise<{ hasOpenRegister: boolean }> {
    const response = await axios.get(`${API_URL}/cash-registers/check/status`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
