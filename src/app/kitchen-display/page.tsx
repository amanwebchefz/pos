'use client';

import { useEffect, useState } from 'react';
import { ChefHat, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  items: string[];
  status: 'pending' | 'preparing' | 'ready' | 'served';
  timeAgo: string;
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([
    {
      id: '1',
      orderNumber: '#001',
      items: ['2x Espresso', '1x Cappuccino', '1x Croissant'],
      status: 'pending',
      timeAgo: '2 min ago',
    },
    {
      id: '2',
      orderNumber: '#002',
      items: ['1x Latte', '2x Muffin'],
      status: 'preparing',
      timeAgo: '5 min ago',
    },
    {
      id: '3',
      orderNumber: '#003',
      items: ['1x Americano', '1x Bagel'],
      status: 'ready',
      timeAgo: '8 min ago',
    },
  ]);

  const updateOrderStatus = (orderId: string, newStatus: KitchenOrder['status']) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusColor = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'preparing':
        return 'bg-blue-500';
      case 'ready':
        return 'bg-green-500';
      case 'served':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-6 h-6" />;
      case 'preparing':
        return <Clock className="w-6 h-6 animate-spin" />;
      case 'ready':
        return <CheckCircle className="w-6 h-6" />;
      case 'served':
        return <CheckCircle className="w-6 h-6" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ChefHat className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl font-bold">Kitchen Display</h1>
          </div>
          <div className="text-2xl text-gray-400">
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${getStatusColor(order.status)} p-2 rounded-full`}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-400">{order.timeAgo}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                    order.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : order.status === 'preparing'
                      ? 'bg-blue-500/20 text-blue-500'
                      : order.status === 'ready'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-6">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-700/50 rounded-lg p-3 text-lg"
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'served')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Mark Served
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="text-center py-16">
            <ChefHat className="w-24 h-24 mx-auto mb-4 text-gray-600" />
            <p className="text-2xl text-gray-400">No pending orders</p>
          </div>
        )}
      </div>
    </div>
  );
}
