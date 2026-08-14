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
    // Load order when hydration is complete
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadOrder();
  }, [id, isAuthenticated, router, _hasHydrated]);

  // Force load after 1 second if hydration is stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Forcing order load due to timeout');
        loadOrder();
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const loadOrder = async () => {
    try {
      console.log('Loading order with ID:', id);
      const data = await ordersService.findOne(id);
      console.log('Order loaded successfully:', data);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
          .bg-slate-50 {
            background: white !important;
          }
          .bg-white {
            background: white !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
          .text-slate-900 {
            color: #0f172a !important;
          }
          .text-slate-600 {
            color: #475569 !important;
          }
          .text-slate-500 {
            color: #64748b !important;
          }
          .text-emerald-600 {
            color: #059669 !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between no-print">
            <div>
              <button
                onClick={() => router.push('/orders')}
                className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {/* Back to Orders */}
              </button>
              <h1 className="text-3xl font-bold text-slate-900">
                Order #{order.orderNumber}
              </h1>
            </div>
            <div className="flex gap-3">
              {canProcessRefund() && (
                <button
                  onClick={() => setIsRefundModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  <RotateCcw className="w-5 h-5" />
                  Process Refund
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm"
              >
                <Printer className="w-5 h-5" />
                Print Invoice
              </button>
            </div>
          </div>

          {/* Invoice */}
          <div className="bg-white rounded-lg shadow-sm p-8 border border-slate-200">
            {/* Invoice Header */}
            <div className="border-b-2 border-slate-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">INVOICE</h1>
                  <p className="text-slate-600">
                    Invoice #: {order.orderNumber}
                  </p>
                  <p className="text-slate-600">
                    Date: {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
                {businessSettings && (
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                      {businessSettings.name}
                    </h2>
                    {businessSettings.address && (
                      <p className="text-slate-600 text-sm flex items-center justify-end gap-1">
                        <MapPin className="w-4 h-4" />
                        {businessSettings.address}
                      </p>
                    )}
                    {businessSettings.phone && (
                      <p className="text-slate-600 text-sm flex items-center justify-end gap-1">
                        <Phone className="w-4 h-4" />
                        {businessSettings.phone}
                      </p>
                    )}
                    {businessSettings.email && (
                      <p className="text-slate-600 text-sm flex items-center justify-end gap-1">
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Bill To:</h3>
              <p className="text-slate-600">
                {order.customer?.name || 'Guest Customer'}
              </p>
              {order.customer?.phone && (
                <p className="text-slate-600 text-sm">
                  Phone: {order.customer.phone}
                </p>
              )}
            </div>

            {/* Order Items Table */}
            <div className="mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 text-slate-900 font-semibold">Item</th>
                    <th className="text-center py-3 text-slate-900 font-semibold">Qty</th>
                    <th className="text-right py-3 text-slate-900 font-semibold">Price</th>
                    <th className="text-right py-3 text-slate-900 font-semibold">Tax</th>
                    <th className="text-right py-3 text-slate-900 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="py-3 text-slate-900">{item.productName}</td>
                      <td className="py-3 text-center text-slate-900">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-900">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-slate-900">
                        ${Number(item.tax || 0).toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-slate-900 font-semibold">
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
                <div className="flex justify-between py-2 text-slate-600">
                  <span>Subtotal</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                {/* <div className="flex justify-between py-2 text-slate-600">
                  <span>Discount</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div> */}
                <div className="flex justify-between py-2 text-slate-600">
                  <span>
                    {businessSettings?.taxType || 'Tax'}
                  </span>
                  <span>${Number(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-slate-200 text-xl font-bold text-slate-900">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {order.payments && order.payments.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Details</h3>
                <div className="space-y-2">
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-2 border-b border-slate-200"
                    >
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-emerald-500 mr-2" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {payment.paymentMethod}
                          </p>
                          <p className="text-sm text-slate-500">
                            {payment.paymentNumber}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-emerald-600">
                        ${Number(payment.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-slate-500 text-sm">
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
