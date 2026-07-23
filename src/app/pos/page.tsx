'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { socketService } from '@/services/socket.service';
import { Search, ShoppingCart, Plus, Minus, Trash2, User, CreditCard, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { productsService, Product } from '@/services/products.service';

export default function POSPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { items, subtotal, total, discount, tax, addItem, removeItem, updateQuantity, clearCartAndStorage, setUserId } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for Zustand persist to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProducts();
    
    // Connect to Socket.io and join user-specific room
    if (user?.id) {
      setUserId(user.id);
      socketService.connect(user.id);
      
      // Auto-open customer display in new tab (only once per session)
      const hasOpenedDisplay = sessionStorage.getItem(`customer-display-opened-${user.id}`);
      if (!hasOpenedDisplay) {
        const customerDisplayUrl = `/customer-display?userId=${user.id}`;
        window.open(customerDisplayUrl, '_blank');
        sessionStorage.setItem(`customer-display-opened-${user.id}`, 'true');
      }
    }
  }, [isAuthenticated, router, _hasHydrated, user?.id, setUserId]);

  useEffect(() => {
    return () => {
      // Disconnect from Socket.io when component unmounts
      socketService.disconnect();
    };
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsService.findAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.barcode && product.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)))];

  const handleAddToCart = (product: any) => {
    addItem({
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.sellingPrice,
      discount: 0,
      tax: 0,
      // total: product?.sellingPrice,
    });
  };

  const handleCheckout = async () => {
    const orderPayload = {
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      subtotal,
      total,
      discount,
      tax,
      paymentMethod: 'cash',
      userId: user?.id,
      businessId: user?.businessId,
      branchId: user?.branchId,
    };

    try {
      const { accessToken } = useAuthStore.getState();
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const response = await axios.post('http://localhost:3001/api/orders', orderPayload, { headers });
      debugger
      console.log('Order created response:', response.data);
      console.log('Response keys:', Object.keys(response.data));
      console.log('Order ID:', response.data?.id);
      
      const orderId = response.data?.data?.id;
      if (orderId) {
        clearCartAndStorage();
        router.push(`/orders/${orderId}`);
      } else {
        console.error('Order ID not found in response', response.data);
        alert('Order created but could not redirect to order details. Please check your orders list.');
        clearCartAndStorage();
        router.push('/orders');
      }
    } catch (error) {
      console.error('Checkout error', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Product Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.slice(1).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-10 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center text-gray-500 py-12">Loading products...</div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow text-left"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-4xl">☕</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.category?.name}</p>
                  <p className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">${Number(product.sellingPrice).toFixed(2)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white dark:bg-gray-800 shadow-xl flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Current Order
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.productName}</h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        ${(item.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
