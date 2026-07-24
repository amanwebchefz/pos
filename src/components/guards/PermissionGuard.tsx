import { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders children only if user has the specified permission
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface AnyPermissionGuardProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders children if user has any of the specified permissions
 */
export function AnyPermissionGuard({ permissions, children, fallback = null }: AnyPermissionGuardProps) {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  if (hasAnyPermission(permissions)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface AllPermissionsGuardProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders children only if user has all of the specified permissions
 */
export function AllPermissionsGuard({ permissions, children, fallback = null }: AllPermissionsGuardProps) {
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions);

  if (hasAllPermissions(permissions)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface RoleGuardProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders children only if user has one of the specified roles
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const getRole = useAuthStore((state) => state.getRole);
  const userRole = getRole();

  if (userRole && roles.includes(userRole)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
