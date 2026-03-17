import React, { useState, useEffect, useCallback } from 'react';
import { vendorAPI } from '../../utils/api';
import { Loader2, CheckCircle } from 'lucide-react';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusGroup, setStatusGroup] = useState('new');
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async (group) => {
    const g = group ?? statusGroup;
    try {
      setLoading(true);
      const res = await vendorAPI.getOrders(g);
      setOrders(res?.data?.orders || []);
    } catch (e) {
      console.error('Failed to load orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusGroup]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const markAsCompleted = async (orderId) => {
    try {
      setUpdatingId(orderId);
      await vendorAPI.updateOrderStatus(orderId, 'delivered');
      // Reload current tab; order moves to Completed so switch to Completed tab and reload
      setStatusGroup('completed');
      await loadOrders('completed');
    } catch (e) {
      console.error('Failed to mark as completed', e);
      alert(e?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatStatus = (s) => {
    if (!s) return '—';
    const x = String(s).toLowerCase();
    if (x === 'pending') return 'New';
    if (x === 'processing') return 'Processing';
    if (x === 'shipped') return 'Shipped';
    if (x === 'delivered') return 'Delivered';
    if (x === 'cancelled') return 'Cancelled';
    if (x === 'returned') return 'Returned';
    return s;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Orders</h1>
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setStatusGroup('new')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${statusGroup === 'new' ? 'bg-forest-green-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            New / Active
          </button>
          <button
            type="button"
            onClick={() => setStatusGroup('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${statusGroup === 'completed' ? 'bg-forest-green-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            Completed
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-forest-green-600 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
            No orders in this category.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                  <span className="text-sm text-gray-500">
                    {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'delivered' ? 'bg-forest-green-100 text-forest-green-800' :
                    order.status === 'cancelled' || order.status === 'returned' ? 'bg-red-100 text-red-800' :
                    order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Customer: {order.buyerName}</p>
                <div className="text-sm text-gray-600">
                  {order.items?.map((it, i) => (
                    <span key={i}>
                      {it.name} × {it.quantity} @ ₹{Number(it.price).toFixed(2)}
                      {i < order.items.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{order.deliveryAddress}</p>
                {(order.status === 'pending' || order.status === 'processing' || order.status === 'shipped') && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => markAsCompleted(order.id)}
                      disabled={updatingId === order.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-forest-green-600 text-white hover:bg-forest-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {updatingId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Mark as completed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorOrders;
