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
    const response = await axios.get('/categories');
    return response.data;
  },

  async findOne(id: string): Promise<Category> {
    const response = await axios.get(`/categories/${id}`);
    return response.data;
  },
};
