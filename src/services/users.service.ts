import axios from '../lib/axios';

export interface User {
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

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  password?: string;
}

export const usersService = {
  async updateProfile(id: string, data: UpdateUserDto): Promise<User> {
    const response = await axios.patch(`/users/${id}`, data);
    return response.data;
  },

  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const response = await axios.patch(`/users/${id}/password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
