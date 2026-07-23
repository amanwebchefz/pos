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
    const response = await axios.get('/customers');
    return response.data;
  },

  async findOne(id: string): Promise<Customer> {
    const response = await axios.get(`/customers/${id}`);
    return response.data;
  },

  async create(data: Partial<Customer>): Promise<Customer> {
    const response = await axios.post('/customers', data);
    return response.data;
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const response = await axios.patch(`/customers/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/customers/${id}`);
  },
};
