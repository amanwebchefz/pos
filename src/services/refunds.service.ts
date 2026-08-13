import axios from '../lib/axios';

export interface Refund {
  id: number;
  refundNumber: string;
  orderId: number;
  order?: {
    id: number;
    orderNumber: string;
  };
  paymentId?: number;
  payment?: {
    id: number;
    amount: number;
    paymentMethod: string;
  };
  amount: number;
  reason?: string;
  refundDate: string;
  refundedBy?: string;
  refundedById?: number;
  refundedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  status: string;
  notes?: string;
  items: RefundItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RefundItem {
  id: number;
  refundId: number;
  orderItemId: number;
  orderItem?: {
    id: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  };
  quantity: number;
  amount: number;
  reason?: string;
  createdAt: string;
}

export interface RefundableItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  refundedQuantity: number;
  refundableQuantity: number;
  refundableAmount: number;
}

export interface RefundableOrder {
  orderId: number;
  orderNumber: string;
  totalPaidAmount: number;
  totalRefundedAmount: number;
  totalRefundableAmount: number;
  items: RefundableItem[];
}

export interface CreateRefundDto {
  orderId: number;
  paymentId?: number;
  items: {
    orderItemId: number;
    quantity: number;
    reason?: string;
  }[];
  reason?: string;
  notes?: string;
}

export const refundsService = {
  async findAll(): Promise<Refund[]> {
    try {
      const response = await axios.get('/refunds');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch refunds';
      throw new Error(errorMessage);
    }
  },

  async findOne(id: number): Promise<Refund> {
    try {
      const response = await axios.get(`/refunds/${id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch refund';
      throw new Error(errorMessage);
    }
  },

  async create(data: CreateRefundDto): Promise<Refund> {
    try {
      const response = await axios.post('/refunds', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create refund';
      throw new Error(errorMessage);
    }
  },

  async getOrderRefundableItems(orderId: number): Promise<RefundableOrder> {
    try {
      const response = await axios.get(`/refunds/order/${orderId}/refundable`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch refundable items';
      throw new Error(errorMessage);
    }
  },
};
