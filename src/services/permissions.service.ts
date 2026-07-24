import apiClient from '../lib/axios';

export interface Permission {
  id: number | string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermissionsResponse {
  permissions: string[];
  role: string;
}

export const permissionsService = {
  async getAllPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>('/permissions');
    return response;
  },

  async getMyPermissions(): Promise<UserPermissionsResponse> {
    const response = await apiClient.get<UserPermissionsResponse>('/permissions/my');
    return response;
  },
};
