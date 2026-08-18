import axios from '../lib/axios';

export interface TaxCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  taxRate: number;
  isActive: boolean;
  businessId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxCategoryDto {
  name: string;
  code: string;
  description?: string;
  taxRate: number;
}

export interface UpdateTaxCategoryDto {
  name?: string;
  code?: string;
  description?: string;
  taxRate?: number;
  isActive?: boolean;
}

export const taxCategoriesService = {
  async findAll(): Promise<TaxCategory[]> {
    try {
      const response = await axios.get('/tax-categories');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tax categories';
      throw new Error(errorMessage);
    }
  },

  async findOne(id: number): Promise<TaxCategory> {
    try {
      const response = await axios.get(`/tax-categories/${id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tax category';
      throw new Error(errorMessage);
    }
  },

  async create(data: CreateTaxCategoryDto): Promise<TaxCategory> {
    try {
      const response = await axios.post('/tax-categories', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create tax category';
      throw new Error(errorMessage);
    }
  },

  async update(id: number, data: UpdateTaxCategoryDto): Promise<TaxCategory> {
    try {
      const response = await axios.patch(`/tax-categories/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update tax category';
      throw new Error(errorMessage);
    }
  },

  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`/tax-categories/${id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete tax category';
      throw new Error(errorMessage);
    }
  },

  async initializeDefaultTaxCategories(): Promise<TaxCategory[]> {
    try {
      const response = await axios.get('/tax-categories/initialize');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initialize default tax categories';
      throw new Error(errorMessage);
    }
  },
};