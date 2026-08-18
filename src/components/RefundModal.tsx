'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { refundsService, RefundableOrder, RefundableItem, CreateRefundDto } from '@/services/refunds.service';

interface RefundModalProps {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundModal({ orderId, isOpen, onClose, onSuccess }: RefundModalProps) {
  const [refundableOrder, setRefundableOrder] = useState<RefundableOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<number, { reason: string }>>(new Map());
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'amount' | 'percent'>('full');
  const [refundValue, setRefundValue] = useState('');
  const [amountError, setAmountError] = useState('');
  const [percentError, setPercentError] = useState('');

  useEffect(() => {
    if (isOpen && orderId) {
      loadRefundableItems();
    }
  }, [isOpen, orderId]);

  // Auto-fill refund value when type changes to full or when selected items change
  useEffect(() => {
    if (refundType === 'full' && refundableOrder && selectedItems.size > 0) {
      const total = calculateTotalRefund();
      setRefundValue(total.toFixed(2));
    } else if (refundType !== 'full') {
      setRefundValue('');
    }
    setAmountError('');
    setPercentError('');
  }, [refundType, selectedItems, refundableOrder]);

  // Validate refund amount in real-time
  useEffect(() => {
    if (refundType === 'amount' && refundValue) {
      const amount = parseFloat(refundValue);
      let total = 0;
      selectedItems.forEach((_, itemId) => {
        const item = refundableOrder?.items.find(i => i.id === itemId);
        if (item) {
          total += Number(item.refundableAmount);
        }
      });
      if (amount > total) {
        setAmountError(`Please enter an amount up to $${total.toFixed(2)}`);
      } else {
        setAmountError('');
      }
    } else {
      setAmountError('');
    }

    // Validate percentage in real-time
    if (refundType === 'percent' && refundValue) {
      const percent = parseFloat(refundValue);
      if (percent > 100) {
        setPercentError('Percentage cannot exceed 100%');
      } else if (percent < 0) {
        setPercentError('Percentage cannot be negative');
      } else {
        setPercentError('');
      }
    } else {
      setPercentError('');
    }
  }, [refundValue, refundType, selectedItems, refundableOrder?.items]);

  const loadRefundableItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await refundsService.getOrderRefundableItems(orderId);
      setRefundableOrder(data);
      setSelectedItems(new Map());
    } catch (err: any) {
      setError(err.message || 'Failed to load refundable items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelection = (itemId: number, refundableItem: RefundableItem) => {
    const newSelectedItems = new Map(selectedItems);
    
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
    } else {
      newSelectedItems.set(itemId, { reason: '' });
    }
    
    setSelectedItems(newSelectedItems);
  };

  const handleItemReasonChange = (itemId: number, reason: string) => {
    const newSelectedItems = new Map(selectedItems);
    const existing = newSelectedItems.get(itemId);
    if (existing) {
      newSelectedItems.set(itemId, { ...existing, reason });
    }
    setSelectedItems(newSelectedItems);
  };

  const calculateTotalRefund = () => {
    let total = 0;
    selectedItems.forEach((_, itemId) => {
      const item = refundableOrder?.items.find(i => i.id === itemId);
      if (item) {
        total += Number(item.refundableAmount);
      }
    });

    // If no items selected, return 0
    if (total === 0) return 0;

    return total;
  };

  const calculateFinalRefund = () => {
    const total = calculateTotalRefund();
    
    // Apply refund type logic
    if (refundType === 'amount') {
      const amount = parseFloat(refundValue) || 0;
      return Math.min(amount, total);
    } else if (refundType === 'percent') {
      const percent = parseFloat(refundValue) || 0;
      return (total * percent) / 100;
    }

    return total;
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one item to refund');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the refund');
      return;
    }

    if (refundType === 'amount') {
      const amount = parseFloat(refundValue);
      if (!amount || amount <= 0) {
        setError('Please enter a valid refund amount');
        return;
      }
      const totalRefundable = calculateTotalRefund();
      if (amount > totalRefundable) {
        setError('Refund amount cannot exceed total refundable amount');
        return;
      }
    }

    if (refundType === 'percent') {
      const percent = parseFloat(refundValue);
      if (!percent || percent <= 0 || percent > 100) {
        setError('Please enter a valid percentage (1-100)');
        return;
      }
    }

    if (amountError) {
      setError(amountError);
      return;
    }

    if (percentError) {
      setError(percentError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const items = Array.from(selectedItems.entries()).map(([orderItemId, data]) => {
        const item = refundableOrder?.items.find(i => i.id === orderItemId);
        let refundQuantity = item?.refundableQuantity || 0;

        // Adjust quantity based on refund type
        if (refundType === 'amount') {
          const amount = parseFloat(refundValue) || 0;
          const totalRefundableAmount = calculateTotalRefund();
          const ratio = amount / totalRefundableAmount;
          refundQuantity = Math.floor(refundQuantity * ratio);
          if (refundQuantity < 1) refundQuantity = 1; // At least 1 item
        } else if (refundType === 'percent') {
          const percent = parseFloat(refundValue) || 0;
          refundQuantity = Math.floor(refundQuantity * (percent / 100));
          if (refundQuantity < 1) refundQuantity = 1; // At least 1 item
        }

        return {
          orderItemId,
          quantity: refundQuantity,
          reason: data.reason || reason,
        };
      });

      const refundDto: CreateRefundDto = {
        orderId,
        items,
        reason,
        notes: notes || undefined,
      };

      await refundsService.create(refundDto);
      onSuccess();
      onClose();
      setReason('');
      setNotes('');
      setSelectedItems(new Map());
      setRefundType('full');
      setRefundValue('');
      setAmountError('');
      setPercentError('');
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Process Refund</h2>
            {refundableOrder && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Order #{refundableOrder.orderNumber} • Maximum Refund: ${refundableOrder.totalRefundableAmount.toFixed(2)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Loading refundable items...</div>
            </div>
          ) : error && !refundableOrder ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            </div>
          ) : refundableOrder ? (
            <>
              {/* Refundable Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Select Items to Refund
                </h3>
                
                {refundableOrder.items.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
                    No refundable items available for this order
                  </div>
                ) : (
                  <div className="space-y-4">
                    {refundableOrder.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.refundStatus !== 'refunded' && handleItemSelection(item.id, item)}
                        className={`border rounded-lg p-4 transition-colors ${
                          item.refundStatus === 'refunded'
                            ? 'border-gray-300 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                            : selectedItems.has(item.id)
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 cursor-pointer'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{item.productName}</h4>
                              {/* {item.refundStatus === 'refunded' && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                                  Refunded
                                </span>
                              )} */}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Unit Price: ${Number(item.unitPrice).toFixed(2)} • Item Total: ${Number(item.total).toFixed(2)}
                            </p>
                          </div>
                          <div className="ml-4 text-right">
                            {item.refundStatus !== 'refunded' ? (
                              <>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  ${item.refundableAmount > 0 ? Number(item.refundableAmount).toFixed(2) : '0.00'}
                                </p>
                                {selectedItems.has(item.id) && (
                                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                                )}
                              </>
                            ) : (
                              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                Refunded
                              </p>
                            )}
                          </div>
                        </div>

                        {item.refundStatus !== 'refunded' && selectedItems.has(item.id) && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Item-specific reason (optional)"
                              value={selectedItems.get(item.id)?.reason || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleItemReasonChange(item.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Refund Type Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Refund Type</h3>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setRefundType('full')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      refundType === 'full'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Full Refund</div>
                  </button>
                  <button
                    onClick={() => setRefundType('amount')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      refundType === 'amount'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Amount ($)</div>
                  </button>
                  <button
                    onClick={() => setRefundType('percent')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      refundType === 'percent'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Percentage (%)</div>
                  </button>
                </div>

                {/* Unified Input Field */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {refundType === 'full' ? 'Refund Amount (Auto-filled)' : 
                     refundType === 'amount' ? 'Refund Amount ($)' : 
                     'Refund Percentage (%)'}
                  </label>
                  <div className="relative">
                    {refundType === 'amount' && (
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    )}
                    <input
                      type="number"
                      min="0"
                      max={refundType === 'amount' ? calculateTotalRefund() : 100}
                      step={refundType === 'percent' ? '1' : '0.01'}
                      value={refundValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (refundType === 'amount') {
                          const numValue = parseFloat(value);
                          let maxAmount = 0;
                          selectedItems.forEach((_, itemId) => {
                            const item = refundableOrder?.items.find(i => i.id === itemId);
                            if (item) {
                              maxAmount += Number(item.refundableAmount);
                            }
                          });
                          if (numValue > maxAmount) {
                            setRefundValue(maxAmount.toFixed(2));
                          } else {
                            setRefundValue(value);
                          }
                        } else if (refundType === 'percent') {
                          const numValue = parseFloat(value);
                          if (numValue > 100) {
                            setRefundValue('100');
                          } else if (numValue < 0) {
                            setRefundValue('0');
                          } else {
                            setRefundValue(value);
                          }
                        } else {
                          setRefundValue(value);
                        }
                      }}
                      disabled={refundType === 'full'}
                      className={`w-full py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        refundType === 'amount' ? 'pl-10' : 'px-4'
                      } ${refundType === 'full' ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                      placeholder={refundType === 'amount' ? 'Enter amount' : refundType === 'percent' ? 'Enter percentage (0-100)' : 'Auto-filled'}
                    />
                    {refundType === 'percent' && (
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                    )}
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    {refundType === 'amount' && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {refundValue && calculateTotalRefund() > 0 ? `${((parseFloat(refundValue) / calculateTotalRefund()) * 100).toFixed(1)}% of total` : 'Enter amount to see percentage'}
                      </span>
                    )}
                    {refundType === 'percent' && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {refundValue ? `$${calculateFinalRefund().toFixed(2)}` : 'Enter percentage to see amount'}
                      </span>
                    )}
                  </div>
                  {amountError && (
                    <div className="mt-2 text-sm text-red-500">
                      {amountError}
                    </div>
                  )}
                  {percentError && (
                    <div className="mt-2 text-sm text-red-500">
                      {percentError}
                    </div>
                  )}
                </div>
              </div>

              {/* Refund Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the reason for this refund..."
                />
              </div>

              {/* Notes */}
              {/* <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
              </div> */}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        {refundableOrder && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Refund Amount:
                </span>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${calculateFinalRefund().toFixed(2)}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
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
        )}
      </div>
    </div>
  );
}
