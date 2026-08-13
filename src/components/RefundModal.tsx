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
  const [selectedItems, setSelectedItems] = useState<Map<number, { quantity: number; reason: string }>>(new Map());
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && orderId) {
      loadRefundableItems();
    }
  }, [isOpen, orderId]);

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

  const handleItemQuantityChange = (itemId: number, quantity: number, refundableItem: RefundableItem) => {
    const newSelectedItems = new Map(selectedItems);
    
    if (quantity <= 0) {
      newSelectedItems.delete(itemId);
    } else if (quantity <= refundableItem.refundableQuantity) {
      newSelectedItems.set(itemId, { quantity, reason: '' });
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
    selectedItems.forEach((value, itemId) => {
      const item = refundableOrder?.items.find(i => i.id === itemId);
      if (item) {
        const unitPrice = item.total / item.quantity;
        total += unitPrice * value.quantity;
      }
    });
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

    setIsSubmitting(true);
    setError(null);

    try {
      const items = Array.from(selectedItems.entries()).map(([orderItemId, data]) => ({
        orderItemId,
        quantity: data.quantity,
        reason: data.reason || reason,
      }));

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
                Order #{refundableOrder.orderNumber} • Refundable: ${refundableOrder.totalRefundableAmount.toFixed(2)}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Items to Refund</h3>
                
                {refundableOrder.items.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
                    No refundable items available for this order
                  </div>
                ) : (
                  <div className="space-y-4">
                    {refundableOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{item.productName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Original Qty: {item.quantity} • Refunded: {item.refundedQuantity} • Refundable: {item.refundableQuantity}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Unit Price: ${Number(item.unitPrice).toFixed(2)} • Item Total: ${Number(item.total).toFixed(2)}
                            </p>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Refundable: ${item.refundableAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {item.refundableQuantity > 0 && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-700 dark:text-gray-300">Refund Qty:</label>
                              <input
                                type="number"
                                min="1"
                                max={item.refundableQuantity}
                                value={selectedItems.get(item.id)?.quantity || 0}
                                onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0, item)}
                                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">/ {item.refundableQuantity}</span>
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Item-specific reason (optional)"
                                value={selectedItems.get(item.id)?.reason || ''}
                                onChange={(e) => handleItemReasonChange(item.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="mb-6">
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
              </div>

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
                ${calculateTotalRefund().toFixed(2)}
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
