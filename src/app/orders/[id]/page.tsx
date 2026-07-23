'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Package, DollarSign, Calendar, User, ShoppingBag, Printer } from 'lucide-react';
import { ordersService, Order } from '@/services/orders.service';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = use(params);

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for Zustand persist to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadOrder();
  }, [id, isAuthenticated, router, _hasHydrated]);

  const loadOrder = async () => {
    try {
      const data = await ordersService.findOne(id);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">Order not found</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .min-h-screen {
            background: white !important;
          }
          .bg-gray-100, .dark\\:bg-gray-900 {
            background: white !important;
          }
          .bg-white, .dark\\:bg-gray-800 {
            background: white !important;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          .text-gray-900, .dark\\:text-white {
            color: #111827 !important;
          }
          .text-gray-600, .dark\\:text-gray-400 {
            color: #4b5563 !important;
          }
          .text-gray-500, .dark\\:text-gray-400 {
            color: #6b7280 !important;
          }
          .text-green-500 {
            color: #059669 !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/orders')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 no-print"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Orders
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Order #{order.orderNumber}
              </h1>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors no-print"
            >
              <Printer className="w-5 h-5" />
              Print Invoice
            </button>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Order Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="text-gray-900 dark:text-white">
                      {order.customer?.name || 'Guest'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <ShoppingBag className="w-5 h-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Items</p>
                    <p className="text-gray-900 dark:text-white">{order.items?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${Number(item.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Discount</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax</span>
                  <span>${Number(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {order.payments && order.payments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Information
                </h2>
                <div className="space-y-3">
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {payment.paymentMethod}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.paymentNumber}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-500">
                        ${Number(payment.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
