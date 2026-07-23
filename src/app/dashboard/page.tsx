'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { dashboardService, DashboardStats } from '../../services/dashboard.service';
import { cashRegisterService, CashRegister } from '../../services/cash-register.service';
import OpenRegisterModal from '../../components/OpenRegisterModal';
import CloseRegisterModal from '../../components/CloseRegisterModal';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  LogOut,
  Lock,
  Unlock,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, _hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  console.log('activeRegisteractiveRegister',activeRegister)
  const [isRegisterLoading, setIsRegisterLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Helper function to get role name safely (role can be string or object)
  const getRoleName = (role: string | any): string => {
    if (typeof role === 'string') return role;
    return role?.name || '';
  };

  // Check if user is owner (ADMIN or SUPER_ADMIN)
  const isOwner = getRoleName(user?.role) === 'ADMIN' || getRoleName(user?.role) === 'SUPER_ADMIN';
  console.log('user',user)
console.log('isOwner>>>>>>>>',isOwner)

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for Zustand persist to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadStats();
    loadActiveRegister();
  }, [isAuthenticated, router, _hasHydrated]);

  const loadStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveRegister = async () => {
    try {
      const register = await cashRegisterService.getActiveRegister();
      if(register){
        setActiveRegister(register);
      }else{
        setActiveRegister(null)
      }
    } catch (error) {
      console.error('Failed to load active register:', error);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleLogout = async () => {
    if (activeRegister) {
      alert('Please close your cash register before logging out.');
      return;
    }
    try {
      logout();
      router.push('/login');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to logout');
    }
  };

  const handleOpenRegisterSuccess = () => {
    loadActiveRegister();
  };

  const handleCloseRegisterSuccess = () => {
    loadActiveRegister();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-400">Welcome back, {user?.firstName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cash Register Status Card */}
        {!isRegisterLoading && (
          <div className="mb-8">
            {activeRegister ? (
              <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-xl p-6 border border-green-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500 p-3 rounded-lg">
                      <Unlock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Cash Register Open</h3>
                      <p className="text-green-200 text-sm">
                        Register: {activeRegister.registerNumber} | Opened: {new Date(activeRegister.openedAt).toLocaleString()}
                      </p>
                      <p className="text-green-200 text-sm mt-1">
                        Opening Amount: ${Number(activeRegister.openingAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
                  >
                    Close Register
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-orange-900 to-orange-800 rounded-xl p-6 border border-orange-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-500 p-3 rounded-lg">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Cash Register Closed</h3>
                      <p className="text-orange-200 text-sm">
                        Open your register to start taking orders
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOpenModal(true)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors font-medium"
                  >
                    Open Register
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sales"
            value={stats?.totalSales || 0}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-green-500"
          />
          <AlertCard
            title="Total Orders"
            count={stats?.totalOrders || 0}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="bg-blue-500"
          />
          {/* {isOwner && (
            <AlertCard
              title="Total Customers"
              count={stats?.totalCustomers || 0}
              icon={<Users className="w-6 h-6" />}
              color="bg-purple-500"
            />
          )} */}
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={<Package className="w-6 h-6" />}
            color="bg-orange-500"
          />
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Today's Sales"
            value={stats?.todaySales || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-emerald-500"
          />
          <AlertCard
            title="Today's Orders"
            count={stats?.todayOrders || 0}
            icon={<Clock className="w-6 h-6" />}
            color="bg-cyan-500"
          />
        </div>

        {/* Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AlertCard
            title="Low Stock Products"
            count={stats?.lowStockProducts || 0}
            icon={<AlertCircle className="w-6 h-6" />}
            color="bg-yellow-500"
          />
          <AlertCard
            title="Pending Orders"
            count={stats?.pendingOrders || 0}
            icon={<Clock className="w-6 h-6" />}
            color="bg-red-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              title="New Order"
              icon={<ShoppingCart className="w-6 h-6" />}
              onClick={() => router.push('/pos')}
            />
            <QuickActionButton
              title="Products"
              icon={<Package className="w-6 h-6" />}
              onClick={() => router.push('/products')}
            />
            {isOwner && (
              <QuickActionButton
                title="Employees"
                icon={<Users className="w-6 h-6" />}
                onClick={() => router.push('/customers')}
              />
            )}
            <QuickActionButton
              title="Orders"
              icon={<ShoppingCart className="w-6 h-6" />}
              onClick={() => router.push('/orders')}
            />
          </div>
        </div>

        {/* Admin Actions */}
        {isOwner && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Admin Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickActionButton
                title="Register History"
                icon={<DollarSign className="w-6 h-6" />}
                onClick={() => router.push('/register-history')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <OpenRegisterModal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onSuccess={handleOpenRegisterSuccess}
      />
      <CloseRegisterModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onSuccess={handleCloseRegisterSuccess}
        register={activeRegister!}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">${value.toLocaleString()}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}

function AlertCard({
  title,
  count,
  icon,
  color,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{count}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickActionButton({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 flex flex-col items-center gap-3 transition-colors"
    >
      <div className="text-orange-500">{icon}</div>
      <span className="font-medium">{title}</span>
    </button>
  );
}
