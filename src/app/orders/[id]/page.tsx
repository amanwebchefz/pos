'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Package, DollarSign, Calendar, User, ShoppingBag, Printer, MapPin, Phone, Mail, RotateCcw } from 'lucide-react';
import { ordersService, Order } from '@/services/orders.service';
import { settingsService, BusinessSettings } from '@/services/settings.service';
import RefundModal from '@/components/RefundModal';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
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
      // Load business settings to get tax type
      try {
        const settings = await settingsService.getBusinessSettings();
        setBusinessSettings(settings);
      } catch (error) {
        console.error('Failed to load business settings:', error);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefundSuccess = () => {
    loadOrder();
  };

  const canProcessRefund = () => {
    return user?.role?.name === 'MANAGER' || user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPER_ADMIN';
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between no-print">
            <div>
              <button
                onClick={() => router.push('/orders')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {/* Back to Orders */}
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Order #{order.orderNumber}
              </h1>
            </div>
            <div className="flex gap-3">
              {canProcessRefund() && (
                <button
                  onClick={() => setIsRefundModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Process Refund
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Printer className="w-5 h-5" />
                Print Invoice
              </button>
            </div>
          </div>

          {/* Invoice */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
            {/* Invoice Header */}
            <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">INVOICE</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Invoice #: {order.orderNumber}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Date: {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
                {businessSettings && (
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {businessSettings.name}
                    </h2>
                    {businessSettings.address && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-end gap-1">
                        <MapPin className="w-4 h-4" />
                        {businessSettings.address}
                      </p>
                    )}
                    {businessSettings.phone && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-end gap-1">
                        <Phone className="w-4 h-4" />
                        {businessSettings.phone}
                      </p>
                    )}
                    {businessSettings.email && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-end gap-1">
                        <Mail className="w-4 h-4" />
                        {businessSettings.email}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bill To:</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {order.customer?.name || 'Guest Customer'}
              </p>
              {order.customer?.phone && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Phone: {order.customer.phone}
                </p>
              )}
            </div>

            {/* Order Items Table */}
            <div className="mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 text-gray-900 dark:text-white font-semibold">Item</th>
                    <th className="text-center py-3 text-gray-900 dark:text-white font-semibold">Qty</th>
                    <th className="text-right py-3 text-gray-900 dark:text-white font-semibold">Price</th>
                    <th className="text-right py-3 text-gray-900 dark:text-white font-semibold">Tax</th>
                    <th className="text-right py-3 text-gray-900 dark:text-white font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 text-gray-900 dark:text-white">{item.productName}</td>
                      <td className="py-3 text-center text-gray-900 dark:text-white">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-900 dark:text-white">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-gray-900 dark:text-white">
                        ${Number(item.tax || 0).toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-gray-900 dark:text-white font-semibold">
                        ${Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                {/* <div className="flex justify-between py-2 text-gray-600 dark:text-gray-400">
                  <span>Discount</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div> */}
                <div className="flex justify-between py-2 text-gray-600 dark:text-gray-400">
                  <span>
                    {businessSettings?.taxType || 'Tax'}
                  </span>
                  <span>${Number(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-200 dark:border-gray-700 text-xl font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {order.payments && order.payments.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Details</h3>
                <div className="space-y-2">
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

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm">
              <p>Thank you for your business!</p>
              {/* {businessSettings?.taxType && (
                <p className="mt-2">Tax Type: {businessSettings.taxType}</p>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      <RefundModal
        orderId={parseInt(id)}
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        onSuccess={handleRefundSuccess}
      />
    </>
  );
}
