import axios from '../lib/axios';

export interface Product {
  id: string;
  name: string;
  code?: string;
  barcode?: string;
  sku?: string;
  description?: string;
  image?: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  discount: number;
  categoryId: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
  unitId: string;
  unit?: Unit;
  taxId?: string;
  tax?: Tax;
  businessId: string;
  isActive: boolean;
  isFeatured: boolean;
  lowStockAlert: number;
  trackInventory: boolean;
  hasExpiry: boolean;
  inventory?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

export const productsService = {
  async findAll(): Promise<Product[]> {
    try {
      const response = await axios.get('/products');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch products';
      throw new Error(errorMessage);
    }
  },

  async findOne(id: string): Promise<Product> {
    try {
      const response = await axios.get(`/products/${id}`);
      return response?.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch product';
      throw new Error(errorMessage);
    }
  },

  async create(data: Partial<Product>): Promise<Product> {
    try {
      const response = await axios.post('/products', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create product';
      throw new Error(errorMessage);
    }
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const response = await axios.patch(`/products/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update product';
      throw new Error(errorMessage);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await axios.delete(`/products/${id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete product';
      throw new Error(errorMessage);
    }
  },
};
