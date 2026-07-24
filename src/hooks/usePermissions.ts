import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Custom hook to check user permissions
 */
export function usePermissions() {
  const { user, allPermissions, getPermissions, getRole, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthStore();

  const permissions = useMemo(() => getPermissions(), [getPermissions]);

  /**
   * Check if user has a specific permission
   */
  const can = (permission: string): boolean => {
    return hasPermission(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (perms: string[]): boolean => {
    return hasAnyPermission(perms);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (perms: string[]): boolean => {
    return hasAllPermissions(perms);
  };

  const role = useMemo(() => getRole(), [getRole]);

  return {
    permissions,
    allPermissions,
    can,
    canAny,
    canAll,
    getRole,
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isManager: role === 'MANAGER',
    isCashier: role === 'CASHIER',
  };
}
