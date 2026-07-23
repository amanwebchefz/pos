'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { cashRegisterService, CashRegister } from '../../services/cash-register.service';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowLeft,
  Lock,
  Unlock,
} from 'lucide-react';

export default function RegisterHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Helper function to get role name safely (role can be string or object)
  const getRoleName = (role: string | any): string => {
    if (typeof role === 'string') return role;
    return role?.name || '';
  };

  // Check if user is admin or owner
  const isAdmin = getRoleName(user?.role) === 'ADMIN' || getRoleName(user?.role) === 'SUPER_ADMIN' || getRoleName(user?.role) === 'OWNER';

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for Zustand persist to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    loadRegisters();
  }, [isAuthenticated, isAdmin, router, _hasHydrated]);

  const loadRegisters = async () => {
    setIsLoading(true);
    try {
      const data = await cashRegisterService.getAllRegistersForAdmin(startDate, endDate);
      setRegisters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load register history:', error);
      setRegisters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    loadRegisters();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    loadRegisters();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Register History</h1>
                <p className="text-gray-400">View all cash register records</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Filter by Date</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleFilter}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                Apply Filter
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Registers"
            value={registers.length}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Opening Amount"
            value={registers.reduce((sum, r) => sum + Number(r.openingAmount), 0)}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-green-500"
          />
          <StatCard
            title="Total Closing Amount"
            value={registers.reduce((sum, r) => sum + (r.closingAmount ? Number(r.closingAmount) : 0), 0)}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-purple-500"
          />
          <StatCard
            title="Net Difference"
            value={registers.reduce((sum, r) => sum + (r.difference ? Number(r.difference) : 0), 0)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-orange-500"
          />
        </div>

        {/* Register List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-white">Loading...</div>
          </div>
        ) : registers.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <p className="text-gray-400">No register records found</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Register
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Opening Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Closing Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Opened At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Closed At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {registers.map((register) => (
                    <tr key={register.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{register.registerNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {register.user.firstName} {register.user.lastName}
                        </div>
                        <div className="text-xs text-gray-400">{register.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {register.status === 'open' ? (
                            <>
                              <Unlock className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-500">Open</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-orange-500">Closed</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatCurrency(register.openingAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatCurrency(register.closingAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {register.difference && register.difference > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-500">{formatCurrency(register.difference)}</span>
                            </>
                          ) : register.difference && register.difference < 0 ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-500">{formatCurrency(register.difference)}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(register.openedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {register.closedAt ? formatDate(register.closedAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
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
          <p className="text-2xl font-bold mt-2">
            {title.includes('Amount') || title.includes('Difference')
              ? `$${value.toLocaleString()}`
              : value}
          </p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}
