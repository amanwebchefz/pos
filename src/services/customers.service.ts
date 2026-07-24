import axios from '../lib/axios';

export interface Customer {
  id: string;
  code?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  dateOfBirth?: string;
  avatar?: string;
  businessId: string;
  loyaltyPoints: number;
  creditLimit: number;
  outstandingBalance: number;
  membershipType?: string;
  membershipExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const customersService = {
  async findAll(): Promise<Customer[]> {
    try {
      const response = await axios.get('/customers');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch customers';
      throw new Error(errorMessage);
    }
  },

  async findOne(id: string): Promise<Customer> {
    try {
      const response = await axios.get(`/customers/${id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch customer';
      throw new Error(errorMessage);
    }
  },

  async create(data: Partial<Customer>): Promise<Customer> {
    try {
      const response = await axios.post('/customers', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create customer';
      throw new Error(errorMessage);
    }
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    try {
      const response = await axios.patch(`/customers/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update customer';
      throw new Error(errorMessage);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await axios.delete(`/customers/${id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete customer';
      throw new Error(errorMessage);
    }
  },
};
