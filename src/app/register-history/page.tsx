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
  X,
} from 'lucide-react';

export default function RegisterHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleRowClick = (register: CashRegister) => {
    setSelectedRegister(register);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRegister(null);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Register History</h1>
                <p className="text-gray-600">View all cash register records</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Filter by Date</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
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
            <div className="text-gray-900">Loading...</div>
          </div>
        ) : registers.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
            <p className="text-gray-500">No register records found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Register
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Opening Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Closing Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Opened At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Closed At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registers.map((register) => (
                    <tr
                      key={register.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(register)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{register.registerNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {register.user.firstName} {register.user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{register.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {register.status === 'open' ? (
                            <>
                              <Unlock className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600">Open</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-orange-600">Closed</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(register.openingAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(register.closingAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {register.difference && register.difference > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600">{formatCurrency(register.difference)}</span>
                            </>
                          ) : register.difference && register.difference < 0 ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-600">{formatCurrency(register.difference)}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(register.openedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {register.closedAt ? formatDate(register.closedAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Register Detail Modal */}
        {showModal && selectedRegister && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl border border-gray-200 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Register Details</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Register Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Register Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Register Number</p>
                      <p className="font-medium text-gray-900">{selectedRegister.registerNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div className="flex items-center gap-2">
                        {selectedRegister.status === 'open' ? (
                          <>
                            <Unlock className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-green-600">Open</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-orange-600">Closed</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">User</p>
                      <p className="font-medium text-gray-900">
                        {selectedRegister.user.firstName} {selectedRegister.user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">User Email</p>
                      <p className="font-medium text-gray-900">{selectedRegister.user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Financial Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Opening Amount</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedRegister.openingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Closing Amount</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedRegister.closingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Difference</p>
                      <div className="flex items-center gap-2">
                        {selectedRegister.difference && selectedRegister.difference > 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-green-600">{formatCurrency(selectedRegister.difference)}</span>
                          </>
                        ) : selectedRegister.difference && selectedRegister.difference < 0 ? (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            <span className="font-medium text-red-600">{formatCurrency(selectedRegister.difference)}</span>
                          </>
                        ) : (
                          <span className="font-medium text-gray-600">0</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sales</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedRegister.totalSales || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transaction Count</p>
                      <p className="font-medium text-gray-900">{selectedRegister.transactionCount || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Opening Notes */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Opening Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedRegister.openingNotes || selectedRegister.notes || 'No opening notes provided'}
                  </p>
                </div>

                {/* Closing Notes */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Closing Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedRegister.closingNotes || 'No closing notes provided'}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Timestamps</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Opened At</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedRegister.openedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Closed At</p>
                      <p className="font-medium text-gray-900">
                        {selectedRegister.closedAt ? formatDate(selectedRegister.closedAt) : 'Not closed yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">
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
