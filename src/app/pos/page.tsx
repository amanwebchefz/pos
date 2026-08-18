'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { socketService } from '@/services/socket.service';
import { Search, ShoppingCart, Plus, Minus, Trash2, User, CreditCard, ArrowLeft, LogOut, X, ShoppingBag, RotateCcw, History, Menu, Unlock } from 'lucide-react';
import axios from 'axios';
import { productsService, Product } from '@/services/products.service';
import { cashRegisterService, CashRegister } from '@/services/cash-register.service';
import BarcodeComponent from 'react-barcode';
import { toast } from 'react-toastify';
import OrderDetailModal from '@/components/OrderDetailModal';

export default function POSPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { items, subtotal, total, discount, tax, addItem, removeItem, updateQuantity, clearCartAndStorage, setUserId } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [isClosingRegister, setIsClosingRegister] = useState(false);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for Zustand persist to hydrate from localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProducts();
    loadActiveRegister();
    
    // Connect to Socket.io and join user-specific room
    if (user?.id) {
      setUserId(String(user.id));
      console.log('POS Page - Connecting socket with userId:', user.id);
      socketService.connect(String(user.id));
      
      // Auto-open customer display in new tab (only once per session)
      // const hasOpenedDisplay = sessionStorage.getItem(`customer-display-opened-${user.id}`);
      // if (!hasOpenedDisplay) {
      //   const customerDisplayUrl = `/customer-display?userId=${user.id}`;
      //   window.open(customerDisplayUrl, '_blank');
      //   sessionStorage.setItem(`customer-display-opened-${user.id}`, 'true');
      // }
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

  const loadActiveRegister = async () => {
    try {
      const data = await cashRegisterService.getActiveRegister();
      setActiveRegister(data);
    } catch (error) {
      console.error('Failed to load active register:', error);
    }
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push('/login');
  };

  const handleCloseRegister = () => {
    setIsCloseRegisterModalOpen(true);
    setIsMenuOpen(false);
    // Auto-fill closing cash with opening amount from active register
    if (activeRegister?.openingAmount) {
      setClosingCash(String(activeRegister.openingAmount));
    }
  };

  const handleOpenRegister = () => {
    router.push('/pos');
  };

  const handleCloseRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsClosingRegister(true);

    try {
      // Here you would typically send the closing data to your backend
      // For now, we'll just simulate the closing process
      console.log('Closing register with:', { closingNotes, closingCash, total });
      
      // Clear cart and storage
      clearCartAndStorage();
      
      // Close modal and navigate to dashboard
      setIsCloseRegisterModalOpen(false);
      setClosingNotes('');
      setClosingCash('');
      router.push('/dashboard');
      
      toast.success('Register closed successfully');
    } catch (error) {
      console.error('Failed to close register:', error);
      toast.error('Failed to close register. Please try again.');
    } finally {
      setIsClosingRegister(false);
    }
  };

  const handleViewOrders = () => {
    router.push('/orders?from=pos');
  };

  const handleCreateRefund = () => {
    router.push('/refunds?from=pos');
  };

  const handleViewRefunds = () => {
    router.push('/refunds/history?from=pos');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.barcode && product.barcode.includes(searchQuery));
    const matchesCategory = selectedCategories.includes('all') || 
                           (product.category?.name && selectedCategories.includes(product.category.name));
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)))];

  const handleAddToCart = (product: any) => {
    // Calculate total stock from inventory
    const totalStock = product.inventory && product.inventory.length > 0
      ? product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
      : 0;

    // Check if product is out of stock
    if (totalStock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    // Check if product already exists in cart
    const existingItem = items.find(item => item.productId === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    // Check if adding would exceed available stock
    if (currentQuantity >= totalStock) {
      toast.error(`Cannot add more. Only ${totalStock} available in stock`);
      return;
    }

    // Use category's tax category rate if available, otherwise fall back to product tax rate
    const taxRate = product.category?.taxCategory?.taxRate || product.taxRate || 0;
    const itemTax = (product.sellingPrice * taxRate) / 100;

    addItem({
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.sellingPrice,
      discount: 0,
      tax: itemTax,
      taxRate: taxRate,
      taxCategoryId: product.category?.taxCategory?.id || null,
      // total: product?.sellingPrice,
    });
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const product = products.find(p => p.barcode === barcodeInput.trim());
      if (product) {
        handleAddToCart(product);
        setBarcodeInput('');
        toast.success(`Added ${product.name} to cart`);
      } else {
        toast.error('Product not found for this barcode');
        setBarcodeInput('');
      }
    }
  };

  // const handleCategoryToggle = (category: string) => {
  //   if (category === 'all') {
  //     setSelectedCategories(['all']);
  //   } else {
  //     setSelectedCategories(prev => {
  //       const newCategories = prev.filter(c => c !== 'all');
  //       if (newCategories.includes(category)) {
  //         return newCategories.length > 0 ? newCategories.filter(c => c !== category) : ['all'];
  //       } else {
  //         return [...newCategories, category];
  //       }
  //     });
  //   }
  // };

  const handleCategoryToggle = (category: string) => {
    if (category === "all") {
      setSelectedCategories(["all"]);
      return;
    }

    setSelectedCategories((prev) => {
      // Remove "all" before processing
      let updated = prev.filter((c) => c !== "all");

      if (updated.includes(category)) {
          // Remove the category
          updated = updated.filter((c) => c !== category);
      } else {
          // Add the category
          updated.push(category);
      }

        // If no categories remain, default to "all"
        return updated.length === 0 ? ["all"] : updated;
    });
  };

  const handleQuantityUpdate = (itemId: string, newQuantity: number, productId: string) => {
    if (newQuantity < 1) {
      // Remove item if quantity would go below 1
      removeItem(itemId);
      return;
    }

    // Find the product to get stock information
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Calculate total stock from inventory
    const totalStock = product.inventory && product.inventory.length > 0
      ? product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
      : 0;

    // Check if new quantity exceeds available stock
    if (newQuantity > totalStock) {
      toast.error(`Cannot add more. Only ${totalStock} available in stock`);
      return;
    }

    updateQuantity(itemId, newQuantity);
  };

  const handleCheckout = async () => {
    const orderPayload = {
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tax: item.tax || 0,
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
      console.log('Order created response:', response.data);
      console.log('Response keys:', Object.keys(response.data));
      console.log('Order ID:', response.data?.id);
      
      const orderId = response.data?.data?.id;
      if (orderId) {
        clearCartAndStorage();
        setCreatedOrder(response.data?.data);
        setIsOrderDetailModalOpen(true);
        toast.success('Order created successfully!');
      } else {
        console.error('Order ID not found in response', response.data);
        alert('Order created but could not show order details. Please check your orders list.');
        clearCartAndStorage();
        router.push('/orders');
      }
    } catch (error) {
      console.error('Checkout error', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Product Grid */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto order-2 lg:order-1">
          <div className="mb-4 lg:mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 lg:gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl lg:text-3xl font-bold text-slate-900">Point of Sale</h1>
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm text-sm lg:text-base"
                >
                  <Menu className="w-4 h-4 lg:w-5 lg:h-5" />
                  {/* <span className="hidden sm:inline">Menu</span> */}
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={handleViewOrders}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        View Orders
                      </button>
                      <button
                        onClick={handleCreateRefund}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Create Refund
                      </button>
                      <button
                        onClick={handleViewRefunds}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <History className="w-5 h-5" />
                        View Refunds
                      </button>
                      <button
                        onClick={handleCloseRegister}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <X className="w-5 h-5" />
                        Close Register
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 lg:gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow text-sm lg:text-base"
                />
              </div>
              {/* <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div> */}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Category Sidebar */}
            <div className="w-full lg:w-48 flex-shrink-0 order-1 lg:order-1">
              <div className="bg-white rounded-lg shadow-sm p-3 lg:p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2 lg:mb-3 text-sm lg:text-base">Categories</h3>
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                  {categories.map((category) => (
                    category && (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-3 lg:px-4 py-2 rounded-lg border transition-colors text-left whitespace-nowrap text-sm lg:text-base ${
                          selectedCategories.includes(category)
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {category === 'all' ? 'All' : category}
                      </button>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 order-2 lg:order-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
            {isLoading ? (
              <div className="col-span-full text-center text-slate-500 py-12">Loading products...</div>
            ) : (
              filteredProducts.map((product) => {
                // Calculate total stock from inventory
                const totalStock = product.inventory && product.inventory.length > 0
                  ? product.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
                  : 0;
                const isOutOfStock = totalStock === 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`bg-white rounded-lg p-2 lg:p-4 shadow-sm hover:shadow-md transition-shadow text-left border border-slate-200 ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="aspect-square bg-slate-200 rounded-lg mb-2 lg:mb-3 flex items-center justify-center">
                      <span className="text-2xl lg:text-4xl">☕</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-xs lg:text-base truncate">{product.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{product.category?.name}</p>
                    <p className="mt-1 lg:mt-2 text-sm lg:text-lg font-bold text-slate-700">${Number(product.sellingPrice).toFixed(2)}</p>
                    <div className="mt-1 lg:mt-2">
                      {isOutOfStock ? (
                        <span className="text-xs font-semibold text-red-600">Not in stock</span>
                      ) : (
                        <span className="text-xs text-slate-600">Stock: {totalStock}</span>
                      )}
                    </div>
                    {/* {product.barcode && (
                      <div className="mt-2 flex flex-col items-center">
                        <BarcodeComponent 
                          value={product.barcode} 
                          width={1} 
                          height={30} 
                          fontSize={10}
                          displayValue={false}
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{product.barcode}</p>
                      </div>
                    )} */}
                  </button>
                );
              })
            )}
              </div>
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-full lg:w-96 bg-white shadow-xl flex flex-col border-t lg:border-t-0 lg:border-l border-slate-200 order-1 lg:order-2 h-auto lg:h-screen max-h-[40vh] lg:max-h-screen">
          <div className="p-4 lg:p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
              Current Order
            </h2>
            <span className="text-sm text-slate-600">{items.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {items.length === 0 ? (
              <div className="text-center text-slate-500 py-8 lg:py-12">
                <ShoppingCart className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm lg:text-base">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 rounded-lg p-3 lg:p-4 border border-slate-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-900 text-sm lg:text-base truncate flex-1">{item.productName}</h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 lg:gap-2">
                        <button
                          onClick={() => handleQuantityUpdate(item.id, item.quantity - 1, item.productId)}
                          className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
                        >
                          <Minus className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <span className="w-6 lg:w-8 text-center font-semibold text-slate-900 text-sm lg:text-base">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityUpdate(item.id, item.quantity + 1, item.productId)}
                          className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
                        >
                          <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                      <p className="font-bold text-slate-900 text-sm lg:text-base">
                        ${(item.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 lg:p-6 border-t border-slate-200 bg-slate-50">
            <div className="space-y-1 lg:space-y-2 mb-3 lg:mb-4">
              <div className="flex justify-between text-slate-600 text-sm lg:text-base">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-sm lg:text-base">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg lg:text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2 lg:py-3 rounded-lg font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm text-sm lg:text-base"
            >
              <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" />
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Close Register Modal */}
      {isCloseRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Close Register</h2>
            </div>
            <form onSubmit={handleCloseRegisterSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Closing Cash Count</label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="Enter cash count"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Expected Total</label>
                  <input
                    type="text"
                    value={`$${total.toFixed(2)}`}
                    disabled
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Add any notes about the register closing..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCloseRegisterModalOpen(false);
                    setClosingNotes('');
                    setClosingCash('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClosingRegister}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
                >
                  {isClosingRegister ? 'Closing...' : 'Close Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {isOrderDetailModalOpen && (
        <OrderDetailModal
          isOpen={isOrderDetailModalOpen}
          onClose={() => {
            setIsOrderDetailModalOpen(false);
            setCreatedOrder(null);
          }}
          order={createdOrder}
        />
      )}
    </div>
  );
}
