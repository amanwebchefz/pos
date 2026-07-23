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
    const response = await axios.get('/products');
    return response.data;
  },

  async findOne(id: string): Promise<Product> {
    const response = await axios.get(`/products/${id}`);
    return response?.data;
  },

  async create(data: Partial<Product>): Promise<Product> {
    const response = await axios.post('/products', data);
    return response.data;
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const response = await axios.patch(`/products/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/products/${id}`);
  },
};
