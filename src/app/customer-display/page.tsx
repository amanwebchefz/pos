'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { socketService } from '@/services/socket.service';
import { ShoppingCart, Clock, Utensils, Heart, Award, Coffee, Store, Sparkles } from 'lucide-react';

function CustomerDisplayContent() {
  const searchParams = useSearchParams();
  const { items, subtotal, total, discount, tax, setCartFromSocket, setUserId, isPaid, orderCreated, orderNumber } = useCartStore();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);
  const [previousPaymentStatus, setPreviousPaymentStatus] = useState(false);
  const currentUserId = searchParams.get('userId');

  // Debug: Log current state
  useEffect(() => {
    console.log('Customer Display State:', {
      isPaid,
      orderCreated,
      orderNumber,
      itemsCount: items.length
    });
  }, [isPaid, orderCreated, orderNumber, items.length]);

  // Load data from localStorage on component mount
  useEffect(() => {
    if (!currentUserId) return;

    try {
      const savedData = localStorage.getItem(`customer-display-data-${currentUserId}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Check if data is not too old (5 minutes)
        const fiveMinutes = 5 * 60 * 1000;
        const dataAge = Date.now() - (parsedData.timestamp || 0);
        
        if (dataAge < fiveMinutes) {
          console.log('Loading saved data from localStorage for user:', currentUserId, parsedData);
          // Restore cart data
          setCartFromSocket(parsedData);
        } else {
          console.log('Saved data is too old, clearing for user:', currentUserId);
          localStorage.removeItem(`customer-display-data-${currentUserId}`);
        }
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  }, [currentUserId, setCartFromSocket]);

  // Save data to localStorage whenever cart data changes (including socket updates)
  useEffect(() => {
    if (!currentUserId) return;

    // Save all relevant data to localStorage
    const dataToSave = {
      items,
      subtotal,
      total,
      discount,
      tax,
      isPaid,
      orderCreated,
      orderNumber,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(`customer-display-data-${currentUserId}`, JSON.stringify(dataToSave));
      console.log('Saved data to localStorage for user:', currentUserId);
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [currentUserId, items, subtotal, total, discount, tax, isPaid, orderCreated, orderNumber]);

  // Show popup when payment is completed - relaxed conditions for better reliability
  useEffect(() => {
    console.log('Payment status check:', { isPaid, previousPaymentStatus, orderCreated, itemsCount: items.length });
    
    // Show popup when payment status changes to true
    if (isPaid && !previousPaymentStatus) {
      console.log('Triggering thank you popup');
      setShowThankYouPopup(true);
      
      // Auto-hide popup after 5 seconds
      const timer = setTimeout(() => {
        setShowThankYouPopup(false);
        console.log('Auto-hiding thank you popup');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    setPreviousPaymentStatus(isPaid);
  }, [isPaid, previousPaymentStatus, orderCreated, items.length, currentUserId]);

  useEffect(() => {
    // Customer display is a public-facing screen that doesn't require authentication
    // It only needs the userId to connect to the socket for real-time updates
    
    // Get userId from URL query parameter
    const userId = searchParams.get('userId');
    if (userId) {
      setUserId(userId);
      console.log('Customer Display - Connecting socket with userId:', userId);
      const socket = socketService.connect(userId);
      
      // Listen for cart updates
      const handleCartUpdate = (cartData: any) => {
        console.log('Customer Display - Received cart update:', cartData);
        console.log('Payment status in update:', cartData.isPaid);
        console.log('Order created in update:', cartData.orderCreated);
        console.log('Order number in update:', cartData.orderNumber);
        setCartFromSocket(cartData);
      };

      socketService.onCartUpdate(handleCartUpdate);
      
      return () => {
        socketService.offCartUpdate(handleCartUpdate);
        socketService.disconnect();
      };
    }
  }, [searchParams, setUserId, setCartFromSocket]);

  // Listen for logout event to close the window for this specific user
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId) return;

    console.log('Customer Display: Setting up close listener for user:', userId);
    const closeKey = `close-customer-display-${userId}`;

    const handleStorageChange = (e: StorageEvent) => {
      console.log('Customer Display: Storage event detected:', e.key, e.newValue);
      // Check if this is a close signal for this specific user
      if (e.key === closeKey && e.newValue) {
        console.log('Customer Display: Received close signal for user:', userId);
        window.close();
        
        // Fallback: if window.close() doesn't work (browser restriction), redirect to blank page
        setTimeout(() => {
          window.location.href = 'about:blank';
        }, 100);
      }
    };

    // Also check periodically as fallback (in case storage event doesn't fire)
    const checkCloseSignal = setInterval(() => {
      const closeSignal = localStorage.getItem(closeKey);
      if (closeSignal) {
        console.log('Customer Display: Detected close signal via polling for user:', userId);
        localStorage.removeItem(closeKey); // Clear the signal
        window.close();
        setTimeout(() => {
          window.location.href = 'about:blank';
        }, 100);
      }
    }, 1000);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkCloseSignal);
    };
  }, [searchParams]);

  useEffect(() => {
    // Set current time only on client to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Add test function to window for manual testing
  useEffect(() => {
    // @ts-ignore - Adding test function to window
    window.testCustomerDisplay = {
      setPaid: () => {
        const { setPaymentStatus } = useCartStore.getState();
        setPaymentStatus(true);
        console.log('Set payment status to true');
      },
      setOrderCreated: () => {
        const { setOrderCreated } = useCartStore.getState();
        setOrderCreated(true, 'TEST-' + Date.now().toString().slice(-4));
        console.log('Set order created with test number');
      },
      showThankYouPopup: () => {
        console.log('Manual trigger: Setting popup to true');
        setShowThankYouPopup(true);
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowThankYouPopup(false);
          console.log('Manual trigger: Auto-hiding thank you popup');
        }, 5000);
      },
      reset: () => {
        const { clearCart, setPaymentStatus, setOrderCreated } = useCartStore.getState();
        clearCart();
        setPaymentStatus(false);
        setOrderCreated(false);
        setShowThankYouPopup(false);
        
        // Clear localStorage for current user
        if (currentUserId) {
          localStorage.removeItem(`customer-display-data-${currentUserId}`);
        }
        
        console.log('Reset customer display state and localStorage for user:', currentUserId);
      },
      getState: () => {
        const state = useCartStore.getState();
        console.log('Current state:', {
          isPaid: state.isPaid,
          orderCreated: state.orderCreated,
          orderNumber: state.orderNumber,
          itemsCount: state.items.length
        });
        return state;
      },
      clearLocalStorage: () => {
        if (currentUserId) {
          localStorage.removeItem(`customer-display-data-${currentUserId}`);
          console.log('Cleared localStorage for user:', currentUserId);
        }
      }
    };
    
    console.log('Test functions available: window.testCustomerDisplay');
  }, [currentUserId, setShowThankYouPopup]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            {/* Left: Restaurant Name */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">POS CAFÉ</h1>
                <p className="text-xs text-slate-500">Fresh Food, Great Mood</p>
              </div>
            </div>

            {/* Center: Message based on order status */}
            <div className="text-center">
              {items.length === 0 ? (
                isPaid || orderCreated ? (
                  <>
                    <h2 className="text-2xl font-bold text-green-600">THANK YOU!</h2>
                    <p className="text-slate-600 text-sm">Hope you enjoyed your meal</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-orange-600">WELCOME!</h2>
                    <p className="text-slate-600 text-sm">Ready to order something delicious</p>
                  </>
                )
              ) : isPaid ? (
                <>
                  <h2 className="text-2xl font-bold text-orange-600">THANK YOU!</h2>
                  <p className="text-slate-600 text-sm">Here is your order summary</p>
                </>
              ) : orderCreated ? (
                <>
                  <h2 className="text-2xl font-bold text-orange-600">ORDER CONFIRMED!</h2>
                  <p className="text-slate-600 text-sm">Your order is being prepared</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-orange-600">YOUR ORDER</h2>
                  <p className="text-slate-600 text-sm">Review your items before payment</p>
                </>
              )}
            </div>

            {/* Right: Date & Time */}
            <div className="text-right">
              {currentTime && (
                <>
                  <p className="text-lg font-bold text-slate-800">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-140px)] overflow-y-auto">
          {/* Left Column: Order Details */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-4">
             {items.length !== 0 && <h3 className="text-lg font-bold text-slate-800 mb-3">Order Details</h3>}
            
            {items.length === 0 ? (
              <div className="text-center py-12">
                {isPaid || orderCreated ? (
                  // After order completion
                  <>
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4 animate-pulse">
                      <Heart className="w-12 h-12 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Thank You for Ordering!</h3>
                    <p className="text-slate-600 text-sm mb-4">We hope you enjoyed your meal</p>
                    <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                      <Coffee className="w-4 h-4 text-green-600" />
                      <p className="text-green-700 text-sm font-medium">Visit us again soon!</p>
                    </div>
                  </>
                ) : (
                  // Before any order
                  <>
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full mb-4">
                      <ShoppingCart className="w-12 h-12 text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Ready to Order?</h3>
                    {/* <p className="text-slate-600 text-sm mb-4">Browse our delicious menu and add items</p> */}
                    <div className="inline-flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full">
                      <Utensils className="w-4 h-4 text-orange-600" />
                      <p className="text-orange-700 text-sm font-medium">Fresh item awaits!</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-3 mb-3 pb-2 border-b-2 border-orange-200 text-xs font-bold text-slate-600">
                  <div className="col-span-1">#</div>
                  <div className="col-span-6">ITEM</div>
                  <div className="col-span-2 text-center">QTY</div>
                  <div className="col-span-3 text-right">PRICE</div>
                </div>

                {/* Table Body */}
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-3 p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="col-span-1">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                      </div>
                      <div className="col-span-6">
                        <h4 className="font-bold text-slate-800 text-sm">{item.productName}</h4>
                        <p className="text-xs text-slate-500">Fresh & Delicious</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-orange-600">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="font-bold text-slate-800 text-sm">
                          ${Number(item.total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Column: Order Summary */}
          {items.length !== 0 && 
          <div className="space-y-4">
            {/* Order Number - Show when order is created or paid */}
            {(orderCreated || isPaid) && (
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg p-4 text-white">
                <h3 className="text-sm font-bold mb-1">ORDER NUMBER</h3>
                <div className="text-3xl font-bold mb-2">
                  #{orderNumber || '1024'}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>
                    {isPaid 
                      ? 'Please collect your order at the counter' 
                      : 'Your order is being prepared'}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="text-base font-bold text-slate-800 mb-3">
                {isPaid ? 'Payment Summary' : 'Order Summary'}
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-sm">
                    <span>Discount</span>
                    <span className="font-bold">-${discount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* {tax > 0 && ( */}
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Tax (8.00%)</span>
                    <span className="font-semibold">${tax.toFixed(2)}</span>
                  </div>
                {/* )} */}
                
                <div className="border-t-2 border-orange-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-slate-800">TOTAL</span>
                    <span className="text-2xl font-bold text-orange-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advertisement - Show different messages based on status */}
            {isPaid ? (
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg p-4 text-white">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Coffee className="w-4 h-4" />
                    <Heart className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Good Food Good Mood!</h3>
                  <p className="text-xs opacity-90">Made with fresh ingredients just for you</p>
                </div>
              </div>
            ) : orderCreated ? (
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg p-4 text-white">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Order Confirmed!</h3>
                  <p className="text-xs opacity-90">Your order is being prepared</p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg p-4 text-white">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Order in Progress</h3>
                  <p className="text-xs opacity-90">Please review your items before payment</p>
                </div>
              </div>
            )}
          </div>
          }
        </div>

        {/* Footer */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white rounded-xl shadow-md p-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">FRESH INGREDIENTS</p>
              <p className="text-xs font-bold text-slate-800">EVERYDAY</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">HIGHEST QUALITY</p>
              <p className="text-xs font-bold text-slate-800">GUARANTEED</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">MADE WITH LOVE</p>
              <p className="text-xs font-bold text-slate-800">JUST FOR YOU</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Coffee className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">THANK YOU FOR</p>
              <p className="text-xs font-bold text-slate-800">SUPPORTING US!</p>
            </div>
          </div>
        </div> */}

        {/* Thank You Popup Modal */}
        {showThankYouPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 transform transition-all animate-pulse">
              <div className="text-center">
                {/* Animated Confetti Effect */}
                <div className="flex justify-center gap-2 mb-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div 
                      key={i}
                      className="w-3 h-3 rounded-full animate-bounce"
                      style={{
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][i],
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>

                {/* Main Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 animate-pulse">
                  <Heart className="w-10 h-10 text-white" />
                </div>

                {/* Thank You Message */}
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Thank You!</h2>
                <p className="text-slate-600 mb-4">Your order has been successfully placed and paid</p>

                {/* Order Details */}
                {orderNumber && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-500 mb-1">Order Number</p>
                    <p className="text-2xl font-bold text-orange-600">#{orderNumber}</p>
                  </div>
                )}

                {/* Total Amount */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-slate-500 mb-1">Total Paid</p>
                  <p className="text-3xl font-bold text-green-600">${total.toFixed(2)}</p>
                </div>

                {/* Sparkles Icon */}
                <div className="flex justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-yellow-500 animate-spin" />
                </div>

                {/* Additional Message */}
                <p className="text-slate-500 text-sm mb-4">We hope you enjoy your meal!</p>

                {/* Close Button */}
                <button
                  onClick={() => setShowThankYouPopup(false)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Status Indicator */}
        {/* <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200 text-xs z-40">
          <p className="font-bold mb-1">Debug Status:</p>
          <p>Paid: {isPaid ? '✅' : '❌'}</p>
          <p>Order Created: {orderCreated ? '✅' : '❌'}</p>
          <p>Items: {items.length}</p>
          <p>Popup: {showThankYouPopup ? '✅' : '❌'}</p>
          <p className="mt-2 text-slate-500">localStorage: {currentUserId ? '✅' : '❌'}</p>
          <p className="text-slate-500">Test: window.testCustomerDisplay.showThankYouPopup()</p>
        </div> */}
      </div>
    </div>
  );
}

export default function CustomerDisplayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl mb-4 shadow-lg animate-pulse">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div className="text-2xl font-semibold text-slate-600">Loading Customer Display...</div>
        </div>
      </div>
    }>
      <CustomerDisplayContent />
    </Suspense>
  );
}