import axios from '../lib/axios';

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  todaySales: number;
  todayOrders: number;
  lowStockProducts: number;
  pendingOrders: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await axios.get('/dashboard/stats');
    return response.data;
  },
};
