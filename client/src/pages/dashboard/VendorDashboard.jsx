import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { vendorAPI } from '../../utils/api';
import { FaBox, FaChartLine, FaDollarSign, FaShoppingCart } from 'react-icons/fa';
import { Store, Loader2, RefreshCw } from 'lucide-react';

const POLL_INTERVAL_MS = 45000; // Refetch stats every 45s so new orders show up

const VendorDashboard = () => {
  const { user } = useAuth();
  const vendorId = user?.id || user?._id;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    ordersThisMonth: 0,
    productsListed: 0,
    topSellingProducts: [],
    recentOrders: [],
  });

  const loadStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);
      const res = await vendorAPI.getDashboardStats();
      const d = res?.data || {};
      setStats({
        monthlyRevenue: d.monthlyRevenue ?? 0,
        ordersThisMonth: d.ordersThisMonth ?? 0,
        productsListed: d.productsListed ?? 0,
        topSellingProducts: Array.isArray(d.topSellingProducts) ? d.topSellingProducts : [],
        recentOrders: Array.isArray(d.recentOrders) ? d.recentOrders : [],
      });
    } catch (e) {
      console.error('Failed to load dashboard stats', e);
      setStats({
        monthlyRevenue: 0,
        ordersThisMonth: 0,
        productsListed: 0,
        topSellingProducts: [],
        recentOrders: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats(true);
  }, [loadStats]);

  // Poll so dashboard updates when customers place orders
  useEffect(() => {
    const interval = setInterval(() => loadStats(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Refetch when vendor switches back to this tab
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadStats(false);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [loadStats]);

  const formatStatus = (status) => {
    if (!status) return '—';
    const s = String(status).toLowerCase();
    if (s === 'pending') return 'New';
    if (s === 'processing') return 'Processing';
    if (s === 'shipped') return 'Shipped';
    if (s === 'delivered') return 'Delivered';
    if (s === 'cancelled') return 'Cancelled';
    if (s === 'returned') return 'Returned';
    return status;
  };

  const statusColor = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'pending') return 'bg-blue-100 text-blue-800';
    if (s === 'processing') return 'bg-yellow-100 text-yellow-800';
    if (s === 'shipped') return 'bg-indigo-100 text-indigo-800';
    if (s === 'delivered') return 'bg-forest-green-100 text-forest-green-800';
    if (s === 'cancelled' || s === 'returned') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-forest-green-500 to-teal-600 rounded-xl p-6 text-white mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Vendor Dashboard</h2>
            <p className="text-green-100">
              Manage your storefront and track your sales.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadStats(false)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold border border-white/40 transition-colors disabled:opacity-60"
              title="Refresh stats (updates when new orders are placed)"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {vendorId && (
              <Link
                to={`/vendors/${vendorId}`}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold border border-white/40 transition-colors"
              >
                <Store className="w-4 h-4 mr-2" />
                View my storefront
              </Link>
            )}
          </div>
        </div>

        {/* Stats: 3 cards only */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-forest-green-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="bg-forest-green-100 p-3 rounded-lg">
                    <FaDollarSign className="text-forest-green-600 text-xl" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      ₹{Number(stats.monthlyRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-gray-600 text-sm">Monthly Revenue</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FaShoppingCart className="text-blue-600 text-xl" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">{stats.ordersThisMonth}</h3>
                    <p className="text-gray-600 text-sm">Orders This Month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FaBox className="text-purple-600 text-xl" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">{stats.productsListed}</h3>
                    <p className="text-gray-600 text-sm">Products Listed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions: Manage Orders + View Analytics only, equal width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <Link
                to="/vendor/orders"
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-forest-green-200 transition-all text-left block"
              >
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FaShoppingCart className="text-blue-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-4">Manage Orders</h3>
                </div>
                <p className="text-gray-600 text-sm">Process and track customer orders.</p>
              </Link>
              <Link
                to="/vendor/analytics"
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-forest-green-200 transition-all text-left block"
              >
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FaChartLine className="text-purple-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-4">View Analytics</h3>
                </div>
                <p className="text-gray-600 text-sm">See detailed charts and metrics.</p>
              </Link>
            </div>

            {/* Content: Recent Orders + Top Selling (real data) */}
            <div id="dashboard-analytics" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                {stats.recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No orders yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 truncate">#{order.orderNumber}</h4>
                          <p className="text-gray-600 text-sm truncate">{order.itemsSummary}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ₹{Number(order.total).toFixed(2)} • {order.buyerName}
                          </p>
                        </div>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium flex-shrink-0 ${statusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                {stats.topSellingProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No sales this month yet.</p>
                ) : (
                  <div className="space-y-4">
                    {stats.topSellingProducts.map((item) => (
                      <div key={item.productId} className="flex items-center">
                        <div className="w-12 h-12 rounded-lg bg-forest-green-50 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-forest-green-500 text-xs font-medium">
                              —
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                          <p className="text-gray-600 text-sm">{item.quantitySold} sold this month</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-gray-900">₹{Number(item.revenue).toFixed(2)}</p>
                          {item.regularPrice != null && (
                            <p className="text-forest-green-600 text-xs">₹{Number(item.regularPrice).toFixed(2)} each</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;
