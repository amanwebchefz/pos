import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import { permissionsService } from '../services/permissions.service';

interface Permission {
  id: number | string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Role {
  id: number | string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  permissions?: string[];
  businessId?: number | string;
  branchId?: number | string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  allPermissions: Permission[];
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  clearError: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  loadPermissions: () => Promise<void>;
  getPermissions: () => string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  getRole: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      allPermissions: [],
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }),
      logout: async () => {
        try {
          // Clear customer display session storage flag
          const { user } = get();
          if (user?.id) {
            sessionStorage.removeItem(`customer-display-opened-${user.id}`);
          }
          
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          // Load all permissions from backend
          await get().loadPermissions();
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },
      register: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          // Load all permissions from backend
          await get().loadPermissions();
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },
      clearError: () => set({ error: null }),
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
      loadPermissions: async () => {
        try {
          const allPerms = await permissionsService.getAllPermissions();
          set({ allPermissions: allPerms });
        } catch (error) {
          console.error('Failed to load permissions:', error);
        }
      },
      getPermissions: (): string[] => {
        const state = get();
        // First check if permissions are directly on user (from backend)
        if (state.user?.permissions && Array.isArray(state.user.permissions)) {
          return state.user.permissions;
        }
        // Fallback to role permissions
        if (typeof state.user?.role === 'string') {
          return [];
        }
        return state.user?.role?.permissions?.map((p: any) => p.name) || [];
      },
      hasPermission: (permission: string): boolean => {
        const permissions = get().getPermissions();
        return permissions.includes(permission);
      },
      hasAnyPermission: (permissions: string[]): boolean => {
        const userPermissions = get().getPermissions();
        return permissions.some((perm) => userPermissions.includes(perm));
      },
      hasAllPermissions: (permissions: string[]): boolean => {
        const userPermissions = get().getPermissions();
        return permissions.every((perm) => userPermissions.includes(perm));
      },
      getRole: (): string | null => {
        const state = get();
        if (typeof state.user?.role === 'string') {
          return state.user.role;
        }
        return state.user?.role?.name || null;
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
