'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Search, DollarSign, Percent, ArrowLeft, CheckCircle, AlertCircle, Package, ChevronRight, History, X } from 'lucide-react';
import { ordersService, Order } from '@/services/orders.service';
import { refundsService, RefundableOrder, RefundableItem, CreateRefundDto } from '@/services/refunds.service';

export default function RefundsPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundableOrder, setRefundableOrder] = useState<RefundableOrder | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRefundable, setIsLoadingRefundable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Selected items for refund (checkboxes)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  
  // Modal state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  
  // Selected items with refund type (amount or percent) - for modal
  const [selectedItems, setSelectedItems] = useState<Map<number, { 
    refundType: 'amount' | 'percent' | 'full'; 
    value: number; 
    reason: string 
  }>>(new Map());

  const [globalReason, setGlobalReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has permission (only after user is loaded)
    if (user && user.role && typeof user.role === 'object') {
      if (user.role.name !== 'MANAGER' && user.role.name !== 'ADMIN' && user.role.name !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, router, _hasHydrated, user]);

  const handleSearchOrders = async (query: string) => {
    if (!query.trim()) {
      setOrders([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const allOrders = await ordersService.findAll();
      const filtered = allOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
        order.id.toString().includes(query)
      );
      setOrders(filtered);
      
      if (filtered.length === 0) {
        setError('No orders found matching your search');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search orders');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      handleSearchOrders(searchQuery);
    }, 500); // 500ms debounce delay

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchQuery]);

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setOrders([]);
    setSearchQuery('');
    setIsLoadingRefundable(true);
    setError(null);
    setSelectedItemIds(new Set());
    setSelectedItems(new Map());
    
    try {
      const data = await refundsService.getOrderRefundableItems(parseInt(order.id));
      setRefundableOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load refundable items');
      setRefundableOrder(null);
    } finally {
      setIsLoadingRefundable(false);
    }
  };

  const handleItemCheckboxChange = (itemId: number, refundableItem: RefundableItem) => {
    // Check if item has already been fully refunded
    if (refundableItem.refundableQuantity === 0) {
      setError('This item has already been fully refunded and cannot be refunded again');
      return;
    }
    
    const newSelectedIds = new Set(selectedItemIds);
    if (newSelectedIds.has(itemId)) {
      newSelectedIds.delete(itemId);
    } else {
      newSelectedIds.add(itemId);
    }
    setSelectedItemIds(newSelectedIds);
    setError(null);
  };

  const handleOpenRefundModal = () => {
    if (selectedItemIds.size === 0) {
      setError('Please select at least one item to refund');
      return;
    }
    
    // Initialize selected items map with default values
    const newSelectedItems = new Map<number, { refundType: 'amount' | 'percent' | 'full'; value: number; reason: string }>();
    selectedItemIds.forEach(itemId => {
      newSelectedItems.set(itemId, { refundType: 'amount', value: 0, reason: '' });
    });
    setSelectedItems(newSelectedItems);
    setIsRefundModalOpen(true);
    setError(null);
    setModalError(null);
  };

  const handleItemSelection = (itemId: number, refundType: 'amount' | 'percent' | 'full', value: number, refundableItem: RefundableItem) => {
    const newSelectedItems = new Map(selectedItems);
    const existing = newSelectedItems.get(itemId);
    
    // Handle full refund - set value to refundable amount
    if (refundType === 'full') {
      newSelectedItems.set(itemId, { refundType: 'full', value: refundableItem.refundableAmount, reason: existing?.reason || '' });
      setSelectedItems(newSelectedItems);
      setModalError(null);
      return;
    }
    
    // If switching from 'full' to another type, reset value to 0
    if (existing && existing.refundType === 'full') {
      newSelectedItems.set(itemId, { refundType, value: 0, reason: existing.reason || '' });
      setSelectedItems(newSelectedItems);
      setModalError(null);
      return;
    }
    
    // If value is 0 and we're just switching types (from radio button), preserve the item
    if (value === 0 && existing && existing.value === value) {
      // Just update the refund type, keep the existing value
      newSelectedItems.set(itemId, { ...existing, refundType });
      setSelectedItems(newSelectedItems);
      setModalError(null);
      return;
    }
    
    // Always keep the item in the map, even with 0 value (allows editing)
    // Validate based on refund type
    if (value > 0) {
      if (refundType === 'percent') {
        if (value > 100) {
          setModalError('Percentage cannot exceed 100%');
          return;
        }
      } else {
        if (value > refundableItem.refundableAmount) {
          setModalError(`Amount cannot exceed refundable amount of $${refundableItem.refundableAmount.toFixed(2)}`);
          return;
        }
      }
    }
    
    newSelectedItems.set(itemId, { refundType, value, reason: existing?.reason || '' });
    setSelectedItems(newSelectedItems);
    setModalError(null);
  };

  const handleItemReasonChange = (itemId: number, reason: string) => {
    const newSelectedItems = new Map(selectedItems);
    const existing = newSelectedItems.get(itemId);
    if (existing) {
      newSelectedItems.set(itemId, { ...existing, reason });
    }
    setSelectedItems(newSelectedItems);
  };

  const calculateRefundQuantity = (item: RefundableItem, refundType: 'amount' | 'percent' | 'full', value: number): number => {
    if (refundType === 'full') {
      return item.refundableQuantity;
    }
    if (refundType === 'percent') {
      return Math.floor((value / 100) * item.refundableQuantity);
    } else {
      const unitPrice = item.total / item.quantity;
      return Math.floor(value / unitPrice);
    }
  };

  const calculateItemRefundAmount = (item: RefundableItem, refundType: 'amount' | 'percent' | 'full', value: number): number => {
    if (refundType === 'full') {
      return item.refundableAmount;
    }
    if (refundType === 'percent') {
      return (value / 100) * item.refundableAmount;
    } else {
      return value;
    }
  };

  const calculateRefundPercentage = (item: RefundableItem, amount: number): number => {
    return (amount / item.refundableAmount) * 100;
  };

  const calculateTotalRefund = () => {
    let total = 0;
    selectedItems.forEach((data, itemId) => {
      const item = refundableOrder?.items.find(i => i.id === itemId);
      if (item) {
        total += calculateItemRefundAmount(item, data.refundType as 'amount' | 'percent' | 'full', data.value);
      }
    });
    return total;
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      setModalError('Please select at least one item to refund');
      return;
    }

    if (!globalReason.trim()) {
      setModalError('Please provide a reason for the refund');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setModalError(null);

    try {
      const items = Array.from(selectedItems.entries())
        .map(([orderItemId, data]) => {
          const item = refundableOrder?.items.find(i => i.id === orderItemId);
          if (!item) throw new Error('Item not found');
          
          const quantity = calculateRefundQuantity(item, data.refundType as 'amount' | 'percent' | 'full', data.value);
          const amount = calculateItemRefundAmount(item, data.refundType as 'amount' | 'percent' | 'full', data.value);
          
          return {
            orderItemId,
            quantity,
            reason: data.reason || globalReason,
          };
        })
        .filter(item => item.quantity > 0); // Filter out items with 0 quantity

      if (items.length === 0) {
        setModalError('Please enter a refund amount for at least one item');
        setIsSubmitting(false);
        return;
      }

      const refundDto: CreateRefundDto = {
        orderId: parseInt(selectedOrder!.id),
        items,
        reason: globalReason,
        notes: notes || undefined,
      };

      await refundsService.create(refundDto);
      setSuccess('Refund processed successfully!');
      setSelectedOrder(null);
      setRefundableOrder(null);
      setSelectedItems(new Map());
      setSelectedItemIds(new Set());
      setGlobalReason('');
      setNotes('');
      setIsRefundModalOpen(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setModalError(err.message || 'Failed to process refund');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsRefundModalOpen(false);
    setSelectedItems(new Map());
    setError(null);
    setModalError(null);
  };

  if (!_hasHydrated || !user || !user.role) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/refunds/history')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <History className="w-5 h-5" />
              View Refund History
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Process Refund</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Search for an order and select items to refund
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Order Search Section */}
        {!selectedOrder && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Search Order</h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter order number or ID..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {orders.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Search Results</h3>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Order #{order.orderNumber}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.orderDate).toLocaleDateString()} • {order.items?.length || 0} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ${Number(order.total).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Order & Refund Items Section */}
        {selectedOrder && refundableOrder && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setRefundableOrder(null);
                    setSelectedItems(new Map());
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Change Order
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${refundableOrder.totalPaidAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Already Refunded</p>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                    ${refundableOrder.totalRefundedAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Refundable Amount</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ${refundableOrder.totalRefundableAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Refundable Items */}
            {isLoadingRefundable ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading refundable items...
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Items to Refund</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedItemIds.size} selected
                  </span>
                </div>
                
                {refundableOrder.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No refundable items available for this order
                  </div>
                ) : (
                  <div className="space-y-3">
                    {refundableOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          selectedItemIds.has(item.id)
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.has(item.id)}
                            onChange={() => handleItemCheckboxChange(item.id, item)}
                            disabled={item.refundableQuantity === 0}
                            className="w-5 h-5 mt-1 text-green-600 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{item.productName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Original Qty: {item.quantity} • Refunded: {item.refundedQuantity} • Refundable: {item.refundableQuantity}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Unit Price: ${Number(item.unitPrice).toFixed(2)} • Refundable: ${item.refundableAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              ${item.refundableAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Process Refund Button */}
                {refundableOrder.items.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={handleOpenRefundModal}
                      disabled={selectedItemIds.size === 0}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ChevronRight className="w-5 h-5" />
                      Process Refund ({selectedItemIds.size} items)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Refund Modal */}
        {isRefundModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Process Refund</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Order #{selectedOrder?.orderNumber} • {selectedItemIds.size} items selected
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {refundableOrder?.items.filter(item => selectedItemIds.has(item.id)).map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <Package className="w-6 h-6 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.productName}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Refundable Qty: {item.refundableQuantity} • Refundable: ${item.refundableAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="ml-10 space-y-3">
                      {/* Refund Type Selection */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`modal-refund-type-${item.id}`}
                            checked={selectedItems.get(item.id)?.refundType === 'amount'}
                            onChange={() => handleItemSelection(item.id, 'amount', selectedItems.get(item.id)?.value || 0, item)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Amount</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`modal-refund-type-${item.id}`}
                            checked={selectedItems.get(item.id)?.refundType === 'percent'}
                            onChange={() => handleItemSelection(item.id, 'percent', selectedItems.get(item.id)?.value || 0, item)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Percentage</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`modal-refund-type-${item.id}`}
                            checked={selectedItems.get(item.id)?.refundType === 'full'}
                            onChange={() => handleItemSelection(item.id, 'full', item.refundableAmount, item)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Full Refund</span>
                        </label>
                      </div>

                      {/* Value Input */}
                      {selectedItems.get(item.id)?.refundType === 'amount' && (
                        <div className="flex items-center gap-2 flex-1">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            max={item.refundableAmount}
                            step="0.01"
                            value={selectedItems.get(item.id)?.value || ''}
                            onChange={(e) => handleItemSelection(item.id, 'amount', parseFloat(e.target.value) || 0, item)}
                            placeholder="Enter amount"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">/ ${item.refundableAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedItems.get(item.id)?.refundType === 'percent' && (
                        <div className="flex items-center gap-2 flex-1">
                          {/* <Percent className="w-5 h-5 text-gray-400" /> */}
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={selectedItems.get(item.id)?.value || ''}
                            onChange={(e) => handleItemSelection(item.id, 'percent', parseFloat(e.target.value) || 0, item)}
                            placeholder="Enter percentage"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                        </div>
                      )}
                      {selectedItems.get(item.id)?.refundType === 'full' && (
                        <div className="flex items-center gap-2 flex-1">
                          <DollarSign className="w-5 h-5 text-green-500" />
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            ${item.refundableAmount.toFixed(2)} (Full Refund)
                          </span>
                        </div>
                      )}

                      {/* Calculated Info */}
                      {selectedItems.has(item.id) && selectedItems.get(item.id)!.value > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          {selectedItems.get(item.id)!.refundType === 'percent' && (
                            <p>
                              Refund Amount: ${calculateItemRefundAmount(item, selectedItems.get(item.id)!.refundType as 'amount' | 'percent' | 'full', selectedItems.get(item.id)!.value).toFixed(2)}
                            </p>
                          )}
                          {selectedItems.get(item.id)!.refundType === 'amount' && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Refund Amount: {calculateRefundPercentage(item, selectedItems.get(item.id)!.value).toFixed(1)}%
                            </p>
                          )}
                          {selectedItems.get(item.id)!.refundType === 'full' && (
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Full Refund: ${item.refundableAmount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Item-specific Reason */}
                      <input
                        type="text"
                        value={selectedItems.get(item.id)?.reason || ''}
                        onChange={(e) => handleItemReasonChange(item.id, e.target.value)}
                        placeholder="Item-specific reason (optional)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}

                {/* Global Reason */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refund Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={globalReason}
                    onChange={(e) => setGlobalReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the reason for this refund..."
                  />
                </div>


                {/* Error Message */}
                {modalError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    {modalError}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      Total Refund Amount:
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${calculateTotalRefund().toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedItems.size === 0}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Process Refund
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
