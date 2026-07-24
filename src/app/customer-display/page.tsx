'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { socketService } from '@/services/socket.service';
import { ShoppingCart, Receipt, Clock, Store } from 'lucide-react';

function CustomerDisplayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { items, subtotal, total, discount, tax, setCartFromSocket, setUserId } = useCartStore();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isCustomerView, setIsCustomerView] = useState(false);

  useEffect(() => {
    // Check authentication status
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Get userId from URL query parameter
    const userId = searchParams.get('userId');
    if (userId) {
      setUserId(userId);
      console.log('Customer Display - Connecting socket with userId:', userId);
      const socket = socketService.connect(userId);
      
      // Listen for cart updates
      const handleCartUpdate = (cartData: any) => {
        console.log('Customer Display - Received cart update:', cartData);
        setCartFromSocket(cartData);
      };

      socketService.onCartUpdate(handleCartUpdate);
      
      return () => {
        socketService.offCartUpdate(handleCartUpdate);
        socketService.disconnect();
      };
    }
    
    // Check if user has customer role or if this is a customer-only view
    // For now, we'll allow access to anyone for demonstration
    // In production, you would check for specific customer role
    setIsCustomerView(true);
  }, [searchParams, setUserId, isAuthenticated, _hasHydrated, router, setCartFromSocket]);

  // Listen for logout event to close the window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage' && e.newValue === null) {
        // Auth storage was cleared (user logged out)
        window.close();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // Set current time only on client to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Order Summary */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="w-8 h-8 text-orange-500" />
            <h2 className="text-3xl font-bold text-white">Your Order</h2>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-24 h-24 mx-auto mb-4 text-gray-600" />
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-700 rounded-lg p-4 flex justify-between items-center transition-all hover:bg-gray-600"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-white">{item.productName}</h3>
                      <p className="text-gray-400">Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${Number(item.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-600 pt-6 space-y-3">
                <div className="flex justify-between text-xl text-gray-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xl text-green-400">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-xl text-gray-400">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-4xl font-bold text-white pt-4 border-t border-gray-600">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Receipt className="w-5 h-5" />
          </div>
          <p className="text-gray-600 text-sm mt-2">Real-time order display</p>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="text-white text-xl">Loading...</div>
    </div>}>
      <CustomerDisplayContent />
    </Suspense>
  );
}
