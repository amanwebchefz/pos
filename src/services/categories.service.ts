import axios from '../lib/axios';

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const categoriesService = {
  async findAll(): Promise<Category[]> {
    try {
      const response = await axios.get('/categories');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch categories';
      throw new Error(errorMessage);
    }
  },

  async findOne(id: string): Promise<Category> {
    try {
      const response = await axios.get(`/categories/${id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch category';
      throw new Error(errorMessage);
    }
  },

  async create(data: { name: string; description?: string }): Promise<Category> {
    try {
      const response = await axios.post('/categories', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create category';
      throw new Error(errorMessage);
    }
  },
};
