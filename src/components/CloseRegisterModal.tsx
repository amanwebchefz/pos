'use client';

import { useState, useEffect } from 'react';
import { DollarSign, X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { cashRegisterService, CloseRegisterData, CashRegister } from '../services/cash-register.service';
import { ordersService, Order } from '../services/orders.service';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface CloseRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  register: CashRegister;
}

export default function CloseRegisterModal({ isOpen, onClose, onSuccess, register }: CloseRegisterModalProps) {
  const { user } = useAuthStore();
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [expectedAmount, setExpectedAmount] = useState(0);

  // Calculate total sales when modal opens
  useEffect(() => {
    const calculateTotalSales = async () => {
      if (!isOpen || !user || !register) return;

      setIsCalculating(true);
      try {
        const openedDate = new Date(register.openedAt);
        const now = new Date();

        // Get all orders for this user from when register was opened
        const allOrders = await ordersService.findAll();
        const userOrders = allOrders.filter((order: Order) => {
          const orderDate = new Date(order.createdAt);
          return (
            order.userId === user.id &&
            orderDate >= openedDate &&
            orderDate <= now
          );
        });

        // Calculate total sales
        const sales = userOrders.reduce((sum, order) => sum + order.total, 0);
        setTotalSales(sales);

        // Expected amount = opening amount + total sales
        // Handle opening amount as number (it should be a number from API)
        const openingAmount = Number(register.openingAmount) || 0;
        const expected = Number(openingAmount) + Number(sales);
        setExpectedAmount(expected);

        // Auto-fill closing amount with expected amount
        setClosingAmount(expected.toString());
      } catch (error) {
        console.error('Failed to calculate total sales:', error);
        // Fallback to opening amount if calculation fails
        const fallbackAmount = Number(register.openingAmount) || 0;
        setExpectedAmount(fallbackAmount);
        setClosingAmount(fallbackAmount.toString());
      } finally {
        setIsCalculating(false);
      }
    };

    calculateTotalSales();
  }, [isOpen, user, register]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!closingAmount || parseFloat(closingAmount) < 0) {
      toast.error('Please enter a valid closing amount');
      return;
    }

    setIsLoading(true);
    try {
      const data: CloseRegisterData = {
        closingAmount: parseFloat(closingAmount),
        notes: notes || undefined,
      };

      await cashRegisterService.closeRegister(register.id, data);
      toast.success('Cash register closed successfully');
      onSuccess();
      onClose();
      setClosingAmount('');
      setNotes('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to close cash register');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Close Cash Register</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Register Summary */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Register Number</span>
            <span className="text-white font-medium">{register.registerNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Opened At</span>
            <span className="text-white font-medium">
              {new Date(register.openedAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Opening Amount</span>
            <span className="text-white font-medium">{formatCurrency(Number(register.openingAmount))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Sales</span>
            <span className="text-white font-medium">
              {isCalculating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                formatCurrency(totalSales)
              )}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-600 pt-3">
            <span className="text-gray-300 font-medium">Expected Amount</span>
            <span className="text-white font-bold">
              {isCalculating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                formatCurrency(expectedAmount)
              )}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Closing Amount ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          {/* Difference Calculation */}
          {closingAmount && !isCalculating && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Expected Amount</span>
                <span className="text-white font-medium">
                  {formatCurrency(expectedAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400">Difference</span>
                <div className="flex items-center gap-2">
                  {parseFloat(closingAmount) >= expectedAmount ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`font-medium ${
                      parseFloat(closingAmount) >= expectedAmount
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {formatCurrency(parseFloat(closingAmount) - expectedAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="End of shift notes..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Closing...' : 'Close Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
