import axios from '../lib/axios';

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer?: {
    id: string;
    firstName: string;
    lastName?: string;
    name?: string;
  };
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  tableId?: string;
  table?: {
    id: string;
    name: string;
  };
  status: string;
  type: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod?: string;
  notes?: string;
  orderDate: string;
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  product?: {
    id: string;
    name: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentNumber: string;
  reference?: string;
  status: string;
}

export const ordersService = {
  async findAll(): Promise<Order[]> {
    const response = await axios.get('/orders');
    return response.data;
  },

  async findOne(id: string): Promise<Order> {
    const response = await axios.get(`/orders/${id}`);
    return response.data;
  },

  async create(data: Partial<Order>): Promise<Order> {
    const response = await axios.post('/orders', data);
    return response.data;
  },

  async update(id: string, data: Partial<Order>): Promise<Order> {
    const response = await axios.patch(`/orders/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/orders/${id}`);
  },

  async getOrdersByUserAndDateRange(userId: string, startDate: Date, endDate?: Date): Promise<Order[]> {
    const params: any = {
      userId,
      startDate: startDate.toISOString(),
    };
    if (endDate) {
      params.endDate = endDate.toISOString();
    }
    const response = await axios.get('/orders', { params });
    return response.data;
  },
};
