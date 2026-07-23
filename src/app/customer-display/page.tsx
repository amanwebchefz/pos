'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { socketService } from '@/services/socket.service';
import { ShoppingCart, Receipt, Clock, Store } from 'lucide-react';

export default function CustomerDisplayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, total, discount, tax, setCartFromSocket, setUserId } = useCartStore();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isCustomerView, setIsCustomerView] = useState(false);

  useEffect(() => {
    // Get userId from URL query parameter
    const userId = searchParams.get('userId');
    if (userId) {
      setUserId(userId);
      socketService.connect(userId);
    }
    
    // Check if user has customer role or if this is a customer-only view
    // For now, we'll allow access to anyone for demonstration
    // In production, you would check for specific customer role
    setIsCustomerView(true);
  }, [searchParams, setUserId]);

  useEffect(() => {
    // Set current time only on client to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Connect to Socket.io and listen for cart updates
  useEffect(() => {
    const socket = socketService.connect();
    
    const handleCartUpdate = (cartData: any) => {
      // Update cart state from Socket.io data
      setCartFromSocket(cartData);
    };

    socketService.onCartUpdate(handleCartUpdate);
    
    return () => {
      socketService.offCartUpdate(handleCartUpdate);
      socketService.disconnect();
    };
  }, [setCartFromSocket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        {/* <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Store className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-bold text-white">Customer Display</h1>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/80">
            <Clock className="w-6 h-6" />
            <span className="text-2xl">{currentTime ?  currentTime.toLocaleTimeString("en-US", {hour: "2-digit", minute: "2-digit",second: "2-digit", hour12: true,}) : '--:--:--'}</span>
          </div>
        </div> */}

        {/* Order Summary */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="w-8 h-8 text-white" />
            <h2 className="text-3xl font-bold text-white">Your Order</h2>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-24 h-24 mx-auto mb-4 text-white/30" />
              {/* <p className="text-2xl text-white/60">Waiting for order...</p>
              <p className="text-lg text-white/40 mt-2">Please wait while we prepare your order</p> */}
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/20 backdrop-blur rounded-xl p-4 flex justify-between items-center transition-all hover:bg-white/30"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-white">{item.productName}</h3>
                      <p className="text-white/70">Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${Number(item.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-white/20 pt-6 space-y-3">
                <div className="flex justify-between text-xl text-white/80">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xl text-green-300">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-xl text-white/80">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-4xl font-bold text-white pt-4 border-t border-white/20">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Receipt className="w-5 h-5" />
            {/* <span className="text-lg">Thank you for your business!</span> */}
          </div>
          <p className="text-white/40 text-sm mt-2">Real-time order display</p>
        </div>
      </div>
    </div>
  );
}
