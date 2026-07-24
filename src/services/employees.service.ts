import axios from '../lib/axios';

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
  businessId: string;
  branchId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface CreateEmployeeDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roleId: string;
}

export interface EmployeeStats {
  todaySales: number;
  todayOrders: number;
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
}

export const employeesService = {
  async findAll(): Promise<Employee[]> {
    const response = await axios.get('/users/employees');
    return response.data;
  },

  async findOne(id: string): Promise<Employee> {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  },

  async getStats(id: string): Promise<EmployeeStats> {
    const response = await axios.get(`/users/${id}/stats`);
    return response.data;
  },

  async create(data: CreateEmployeeDto): Promise<Employee> {
    const response = await axios.post('/users/employees', data);
    return response.data;
  },

  async update(id: string, data: CreateEmployeeDto): Promise<Employee> {
    const response = await axios.patch(`/users/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const response = await axios.delete(`/users/${id}`);
    return response.data;
  },

  async getRolesUser(): Promise<Role[]> {
    const response = await axios.get('/users/role/data');
    return response.data;
  },
  async getRoles(): Promise<Role[]> {
    const response = await axios.get('/users/roles');
    return response.data;
  },
};
