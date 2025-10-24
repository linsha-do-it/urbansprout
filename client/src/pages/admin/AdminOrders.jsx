import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Package,
  Truck,
  DollarSign,
  Edit,
  Mail,
  Download,
  MapPin,
  Phone,
  User,
  Calendar,
  CreditCard,
  CheckSquare,
  Square,
  Send,
  Printer,
  Tag,
  AlertCircle,
  Info,
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Copy,
  ExternalLink,
  X
} from 'lucide-react';

const AdminOrders = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [currentPage, searchTerm, filterStatus, filterPaymentType, dateRange]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterPaymentType && { paymentType: filterPaymentType }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end })
      });
      
      const response = await apiCall(`/admin/orders?${params}`);
      if (response.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.pages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setMessage('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.success) {
        setMessage(`Order status updated to ${newStatus} and email notification sent to customer`);
        loadOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage('Error updating order status');
    }
  };

  const bulkUpdateStatus = async (newStatus) => {
    if (selectedOrders.length === 0) {
      setMessage('Please select orders to update');
      return;
    }

    try {
      const response = await apiCall('/admin/orders/bulk-status', {
        method: 'PUT',
        body: JSON.stringify({ 
          orderIds: selectedOrders, 
          status: newStatus 
        })
      });
      
      if (response.success) {
        setMessage(`${selectedOrders.length} orders updated successfully`);
        setSelectedOrders([]);
        loadOrders();
      }
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      setMessage('Error updating orders');
    }
  };

  const sendStatusUpdateEmail = async (orderId, status) => {
    try {
      await apiCall('/admin/orders/send-notification', {
        method: 'POST',
        body: JSON.stringify({ 
          orderId, 
          type: 'status_update',
          status 
        })
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const sendCustomEmail = async () => {
    try {
      const response = await apiCall(`/admin/orders/${selectedOrder._id}/send-email`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: emailContent,
          subject: 'Order Update'
        })
      });
      
      if (response.success) {
        setMessage('Email sent successfully');
        setShowEmailModal(false);
        setEmailContent('');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage('Error sending email');
    }
  };

  const updateTrackingId = async (orderId) => {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/tracking`, {
        method: 'PUT',
        body: JSON.stringify({ trackingId })
      });
      
      if (response.success) {
        setMessage('Tracking ID updated successfully');
        setTrackingId('');
        loadOrders();
      }
    } catch (error) {
      console.error('Error updating tracking ID:', error);
      setMessage('Error updating tracking ID');
    }
  };


  const markPaymentConfirmed = async (orderId) => {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/payment`, {
        method: 'PUT',
        body: JSON.stringify({ paymentStatus: 'confirmed' })
      });
      
      if (response.success) {
        setMessage('Payment marked as confirmed');
        loadOrders();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      setMessage('Error updating payment status');
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing': return <Package className="h-4 w-4 text-blue-600" />;
      case 'shipped': return <Truck className="h-4 w-4 text-purple-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'returned': return <ArrowLeft className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentTypeIcon = (paymentType) => {
    switch (paymentType?.toLowerCase()) {
      case 'cod': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'upi': return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'card': return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'wallet': return <CreditCard className="h-4 w-4 text-orange-600" />;
      default: return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentTypeColor = (paymentType) => {
    switch (paymentType?.toLowerCase()) {
      case 'cod': return 'bg-green-100 text-green-800';
      case 'upi': return 'bg-blue-100 text-blue-800';
      case 'card': return 'bg-purple-100 text-purple-800';
      case 'wallet': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 text-sm">Manage and track customer orders</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button
                onClick={loadOrders}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by order ID, customer name, phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
            <select
              value={filterPaymentType}
              onChange={(e) => setFilterPaymentType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Payment Types</option>
              <option value="cod">Cash on Delivery</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-900">
                  {selectedOrders.length} order(s) selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  onChange={(e) => bulkUpdateStatus(e.target.value)}
                  className="text-sm border border-blue-300 rounded px-3 py-1 bg-white"
                >
                  <option value="">Bulk Update Status</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
            message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className={selectedOrders.includes(order._id) ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-300 flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">#{order.orderNumber || order._id.slice(-8)}</div>
                            <div className="text-sm text-gray-500">Order ID</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.user?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{order.user?.email || 'No email'}</div>
                          {order.shippingAddress?.phone && (
                            <div className="text-sm text-gray-500">{order.shippingAddress.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.total || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentTypeIcon(order.paymentMethod)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getPaymentTypeColor(order.paymentMethod)}`}>
                            {order.paymentMethod?.toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        {order.paymentStatus && (
                          <div className="text-xs text-gray-500 mt-1">
                            {order.paymentStatus}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        {order.trackingId && (
                          <div className="text-xs text-gray-500 mt-1">
                            Track: {order.trackingId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="text-blue-600 hover:text-blue-500 p-1"
                            title="View order details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-1 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="returned">Returned</option>
                          </select>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowEmailModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-500 p-1"
                            title="Send email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Information */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order ID:</span>
                          <span className="font-medium">#{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedOrder.status)}`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span>{formatDate(selectedOrder.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-medium">₹{selectedOrder.total || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{selectedOrder.user?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{selectedOrder.user?.email || 'No email'}</span>
                        </div>
                        {selectedOrder.shippingAddress?.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{selectedOrder.shippingAddress.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Method:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentTypeColor(selectedOrder.paymentMethod)}`}>
                            {selectedOrder.paymentMethod?.toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span>{selectedOrder.paymentStatus || 'Pending'}</span>
                        </div>
                        {selectedOrder.paymentStatus !== 'confirmed' && (
                          <button
                            onClick={() => markPaymentConfirmed(selectedOrder._id)}
                            className="w-full mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Mark as Confirmed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Items */}
                  <div className="space-y-4">
                    {/* Shipping Address */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                      <div className="text-sm text-gray-600">
                        {selectedOrder.shippingAddress ? (
                          <div>
                            <div>{selectedOrder.shippingAddress.street}</div>
                            <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</div>
                            <div>{selectedOrder.shippingAddress.zipCode}</div>
                            <div>{selectedOrder.shippingAddress.country}</div>
                          </div>
                        ) : (
                          <div>No shipping address provided</div>
                        )}
                      </div>
                    </div>

                    {/* Tracking Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Tracking Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Enter tracking ID"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => updateTrackingId(selectedOrder._id)}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Update
                          </button>
                        </div>
                        {selectedOrder.trackingId && (
                          <div className="text-sm text-gray-600">
                            Current: {selectedOrder.trackingId}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-gray-600">Qty: {item.quantity}</div>
                            </div>
                            <div className="text-right">
                              <div>₹{item.price}</div>
                              <div className="text-gray-600">Total: ₹{item.price * item.quantity}</div>
                            </div>
                          </div>
                        )) || <div className="text-gray-600">No items found</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowOrderDetails(false);
                      setShowEmailModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Send Email to Customer</h3>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Sending to: {selectedOrder.user?.name} ({selectedOrder.user?.email})
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Order: #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Content
                  </label>
                  <textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendCustomEmail}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;



