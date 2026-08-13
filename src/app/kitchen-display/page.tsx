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
        return 'bg-amber-500';
      case 'preparing':
        return 'bg-blue-600';
      case 'ready':
        return 'bg-emerald-600';
      case 'served':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ChefHat className="w-10 h-10 text-slate-600" />
            <h1 className="text-4xl font-bold text-slate-900">Kitchen Display</h1>
          </div>
          <div className="text-2xl text-slate-500">
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${getStatusColor(order.status)} p-2 rounded-full text-white`}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h3>
                    <p className="text-sm text-slate-500">{order.timeAgo}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                    order.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : order.status === 'preparing'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-800'
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
                    className="bg-slate-50 rounded-lg p-3 text-lg text-slate-900 border border-slate-200"
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors shadow-sm"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-colors shadow-sm"
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'served')}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors shadow-sm"
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
            <ChefHat className="w-24 h-24 mx-auto mb-4 text-slate-300" />
            <p className="text-2xl text-slate-500">No pending orders</p>
          </div>
        )}
      </div>
    </div>
  );
}
