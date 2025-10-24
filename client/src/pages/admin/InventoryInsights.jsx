import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import io from 'socket.io-client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  Filter
} from 'lucide-react';

const InventoryInsights = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const socketRef = useRef(null);

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  useEffect(() => {
    loadInventoryInsights();
    
    // Setup real-time updates via Socket.IO
    setupRealtimeUpdates();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedPeriod]);

  const setupRealtimeUpdates = () => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // The backend Socket.IO server is initialized on the same port as the API (default 5001)
      const SOCKET_URL = 'http://localhost:5001';
      const token = localStorage.getItem('urbansprout_token');

      socketRef.current = io(SOCKET_URL, {
        auth: token ? { token } : undefined,
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to real-time updates');
      });

      socketRef.current.on('connect_error', (err) => {
        // Avoid noisy console spam when socket server is unavailable
        console.warn('Realtime updates unavailable:', err.message || err);
      });

      socketRef.current.on('orderCreated', () => {
        console.log('New order created, refreshing insights...');
        loadInventoryInsights();
      });

      socketRef.current.on('productUpdated', () => {
        console.log('Product updated, refreshing insights...');
        loadInventoryInsights();
      });

      socketRef.current.on('stockUpdated', () => {
        console.log('Stock updated, refreshing insights...');
        loadInventoryInsights();
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from real-time updates');
      });
    } catch (e) {
      console.warn('Realtime updates initialization failed:', e);
    }
  };

  const loadInventoryInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(`/admin/inventory-insights?period=${selectedPeriod}`);
      if (response.success) {
        setInsights(response.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading inventory insights:', error);
      setError('Failed to load inventory insights');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getStockStatusColor = (stock, threshold) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= threshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusText = (stock, threshold) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadInventoryInsights}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Insights</h1>
              <p className="text-gray-600 text-sm">Analyze product performance and sales trends</p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadInventoryInsights}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {periods.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(insights.summary.totalProducts)}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(insights.summary.totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Units Sold</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(insights.summary.totalUnitsSold)}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(insights.summary.avgOrderValue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Fast Moving Products */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fast-Moving Products (Most Purchased)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.fastMovingProducts.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="productName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  fontSize={12}
                />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name, props) => {
                    // Show units sold first (green bar)
                    if (name === 'totalSold') {
                      return [formatNumber(value), 'Units Sold'];
                    }
                    // Show revenue second (blue bar)
                    if (name === 'totalRevenue') {
                      return [formatCurrency(value), 'Revenue'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Product: ${label}`}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="totalSold" fill="#00C49F" name="Units Sold" />
                <Bar yAxisId="right" dataKey="totalRevenue" fill="#0088FE" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
            {insights.fastMovingProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No sales data available yet</p>
                <p className="text-sm">Products will appear here once customers start purchasing</p>
              </div>
            )}
            {insights.fastMovingProducts.length > 0 && insights.fastMovingProducts[0].totalSold === 0 && (
              <div className="text-center py-4 text-blue-600 bg-blue-50 rounded-lg">
                <p className="text-sm">Showing top products by stock (no sales data yet)</p>
              </div>
            )}
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            {insights.categoryPerformance && insights.categoryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={insights.categoryPerformance.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, totalSold }) => `${category}: ${formatNumber(totalSold)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalSold"
                  >
                    {insights.categoryPerformance.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${formatNumber(value)} units sold`,
                      props.payload.category
                    ]}
                    labelFormatter={() => ''}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No category data available</p>
                <p className="text-sm">Categories will appear here once products are categorized</p>
              </div>
            )}
          </div>
        </div>

        {/* Slow Moving Products */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Slow-Moving Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Velocity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insights.slowMovingProducts.slice(0, 10).map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatNumber(product.currentStock)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatNumber(product.totalSold)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.salesVelocity?.toFixed(2) || '0.00'} units/day
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product.currentStock, 10)}`}>
                        {getStockStatusText(product.currentStock, 10)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.stockAlerts.slice(0, 9).map((product, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product.stock, product.lowStockThreshold)}`}>
                    {getStockStatusText(product.stock, product.lowStockThreshold)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-1">Category: {product.category}</div>
                <div className="flex justify-between text-sm">
                  <span>Stock: {formatNumber(product.stock)}</span>
                  <span>Threshold: {formatNumber(product.lowStockThreshold)}</span>
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">
                  Value: {formatCurrency(product.stock * product.regularPrice)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryInsights;
