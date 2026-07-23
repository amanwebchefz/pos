'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { employeesService, Employee, EmployeeStats } from '../../../services/employees.service';
import { ArrowLeft, Mail, Phone, Building2, Shield, Calendar, User, DollarSign, ShoppingCart, TrendingUp, Clock } from 'lucide-react';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for Zustand persist to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const id = window.location.pathname.split('/').pop();
    if (id) {
      loadEmployee(id);
      loadStats(id);
    }
  }, [isAuthenticated, router, _hasHydrated]);

  const loadEmployee = async (id: string) => {
    try {
      const data = await employeesService.findOne(id);
      setEmployee(data);
    } catch (error) {
      console.error('Failed to load employee:', error);
    }
  };

  const loadStats = async (id: string) => {
    try {
      const data = await employeesService.getStats(id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load employee stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Employee Details</h1>
              <p className="text-gray-400">View employee information and performance</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex flex-col items-center text-center mb-6">
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.firstName}
                    className="w-32 h-32 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <h2 className="text-2xl font-bold">
                  {employee.firstName} {employee.lastName}
                </h2>
                <span className={`inline-block px-3 py-1 text-sm rounded-full mt-2 ${
                  employee.isActive 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Role</p>
                    <p className="font-semibold">{employee.role.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <Building2 className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Business ID</p>
                    <p className="font-semibold text-sm">{employee.businessId}</p>
                  </div>
                </div>
                {employee.branchId && (
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <Building2 className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-400">Branch ID</p>
                      <p className="font-semibold text-sm">{employee.branchId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Statistics */}
            {stats && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-6">Sales Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <p className="text-sm text-gray-400">Today's Sales</p>
                    </div>
                    <p className="text-2xl font-bold">${stats.todaySales.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <ShoppingCart className="w-5 h-5 text-blue-500" />
                      <p className="text-sm text-gray-400">Today's Orders</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.todayOrders}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-5 h-5 text-orange-500" />
                      <p className="text-sm text-gray-400">Total Sales</p>
                    </div>
                    <p className="text-2xl font-bold">${stats.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <ShoppingCart className="w-5 h-5 text-purple-500" />
                      <p className="text-sm text-gray-400">Total Orders</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-red-500" />
                      <p className="text-sm text-gray-400">Pending Orders</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-semibold">{employee.email}</p>
                  </div>
                </div>
                {employee.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="font-semibold">{employee.phoneNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-6 mt-8">Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Last Login</p>
                    <p className="font-semibold">
                      {employee.lastLoginAt 
                        ? new Date(employee.lastLoginAt).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Joined</p>
                    <p className="font-semibold">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-6 mt-8">Role Details</h3>
              
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="font-semibold mb-2">{employee.role.name}</p>
                <p className="text-sm text-gray-400">{employee.role.description}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
