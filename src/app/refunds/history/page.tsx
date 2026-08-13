'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, DollarSign, Calendar, User, Package, CheckCircle, Clock, XCircle, Search, X, Receipt } from 'lucide-react';
import { refundsService, Refund } from '@/services/refunds.service';

export default function RefundHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has permission
    if (user?.role?.name !== 'MANAGER' && user?.role?.name !== 'ADMIN' && user?.role?.name !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }

    loadRefunds();
  }, [isAuthenticated, router, _hasHydrated, user]);

  const handleBack = () => {
    const fromPos = new URLSearchParams(window.location.search).get('from');
    if (fromPos === 'pos') {
      router.push('/pos');
    } else {
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = refunds.filter(refund =>
        refund.refundNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.order?.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.reason?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRefunds(filtered);
    } else {
      setFilteredRefunds(refunds);
    }
  }, [searchQuery, refunds]);

  const loadRefunds = async () => {
    try {
      setIsLoading(true);
      const data = await refundsService.findAll();
      setRefunds(data);
      setFilteredRefunds(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load refunds');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleViewDetails = async (refund: Refund) => {
    try {
      const detailedRefund = await refundsService.findOne(refund.id);
      setSelectedRefund(detailedRefund);
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load refund details');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRefund(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!_hasHydrated || !user || !user.role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Refund History</h1>
          <p className="text-slate-600 mt-1">View all processed refunds</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by refund number, order number, or reason..."
              className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 shadow-sm">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <div className="text-center py-8 text-slate-500">
              Loading refunds...
            </div>
          </div>
        ) : (
          /* Refunds List */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
            {filteredRefunds.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                {searchQuery ? 'No refunds found matching your search' : 'No refunds processed yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Refund #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Processed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRefunds.map((refund) => (
                      <tr 
                        key={refund.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(refund)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {refund.refundNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            #{refund.order?.orderNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-semibold text-slate-900">
                              ${Number(refund.amount).toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-900">
                              {refund.items.length} item{refund.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 max-w-xs truncate">
                            {refund.reason || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-900">
                              {refund.refundedByUser?.firstName} {refund.refundedByUser?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-900">
                              {new Date(refund.refundDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(refund.status)}`}>
                            {getStatusIcon(refund.status)}
                            {refund.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Refund Details Modal */}
        {isModalOpen && selectedRefund && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-slate-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Refund Details - {selectedRefund.refundNumber}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Refund Summary */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Order #</p>
                      <p className="text-sm font-semibold text-slate-900">
                        #{selectedRefund.order?.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Refund Amount</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        ${Number(selectedRefund.amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRefund.status)}`}>
                        {getStatusIcon(selectedRefund.status)}
                        {selectedRefund.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Refund Date</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(selectedRefund.refundDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Refund Reason */}
                {selectedRefund.reason && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Refund Reason</h3>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                      {selectedRefund.reason}
                    </p>
                  </div>
                )}

                {/* Processed By */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Processed By</h3>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-900">
                      {selectedRefund.refundedByUser?.firstName} {selectedRefund.refundedByUser?.lastName}
                    </span>
                  </div>
                </div>

                {/* Refund Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Refunded Items</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Refund Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Original Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Refund Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Original Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedRefund.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-slate-900">
                                {item.orderItem?.productName}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-900">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-600">
                                {item.orderItem?.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold text-emerald-600">
                                ${Number(item.amount).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-600">
                                ${Number(item.orderItem?.total).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Item-specific Reasons */}
                {selectedRefund.items.some(item => item.reason) && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Item-specific Reasons</h3>
                    <div className="space-y-2">
                      {selectedRefund.items.filter(item => item.reason).map((item) => (
                        <div key={item.id} className="bg-slate-50 p-3 rounded">
                          <p className="text-sm font-medium text-slate-900">
                            {item.orderItem?.productName}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {item.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedRefund.notes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                      {selectedRefund.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
