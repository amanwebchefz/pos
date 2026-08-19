import axios from '../lib/axios';
import { getCurrencySymbol } from '../utils/currency';

export interface BusinessSettings {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  taxId?: string;
  taxType: string;
  currency: string;
  timezone: string;
}

export const settingsService = {
  async getBusinessSettings(): Promise<BusinessSettings> {
    try {
      const response = await axios.get('/settings/business');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch business settings';
      throw new Error(errorMessage);
    }
  },

  async updateBusinessSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    try {
      const response = await axios.put('/settings/business', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update business settings';
      throw new Error(errorMessage);
    }
  },

  getCurrencySymbol(currencyCode?: string): string {
    return getCurrencySymbol(currencyCode || 'USD');
  },

  formatCurrency(amount: number, currencyCode?: string): string {
    const symbol = this.getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toFixed(2)}`;
  },
};
