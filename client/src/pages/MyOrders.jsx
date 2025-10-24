import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaShoppingBag, 
  FaCalendar, 
  FaMapMarkerAlt, 
  FaCreditCard, 
  FaTruck, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaEye,
  FaStar,
  FaShoppingCart,
  FaRedo,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { apiCall } from '../utils/api';

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  // Load user orders
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const response = await apiCall('/store/orders/my');
        if (response.success) {
          // API may return either { data: ordersArray } or { data: { orders: [] } }
          const data = response.data;
          const normalized = Array.isArray(data) ? data : (data?.orders || data?.data || []);
          setOrders(normalized || []);
        } else {
          setError('Failed to load orders');
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  // Separate orders into upcoming and previous
  const upcomingOrders = orders.filter(order => 
    ['pending', 'processing', 'shipped'].includes(order.status)
  );
  
  const previousOrders = orders.filter(order => 
    ['delivered', 'cancelled', 'returned'].includes(order.status)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-600" />;
      case 'processing':
        return <FaTruck className="text-blue-600" />;
      case 'shipped':
        return <FaTruck className="text-purple-600" />;
      case 'delivered':
        return <FaCheckCircle className="text-green-600" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-600" />;
      case 'returned':
        return <FaTimesCircle className="text-gray-600" />;
      default:
        return <FaClock className="text-gray-600" />;
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  // Handle review submission
  const handleReviewSubmit = async () => {
    if (!selectedOrderItem) return;
    
    try {
      const response = await apiCall('/store/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrderItem.orderId,
          productId: selectedOrderItem.productId,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });
      
      if (response.success) {
        alert('Review submitted successfully!');
        setShowReviewModal(false);
        setSelectedOrderItem(null);
        setReviewData({ rating: 5, comment: '' });
        // Reload orders to show updated review status
        const ordersResponse = await apiCall('/store/orders/my');
        if (ordersResponse.success) {
          const data = ordersResponse.data;
          const normalized = Array.isArray(data) ? data : (data?.orders || data?.data || []);
          setOrders(normalized || []);
        }
      } else {
        alert(`Failed to submit review: ${response.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(`Failed to submit review: ${error.message || 'Please try again.'}`);
    }
  };

  // Handle buy again functionality
  const handleBuyAgain = async (order) => {
    try {
      // Add all items from the order to cart
      for (const item of order.items) {
        await apiCall('/store/cart/add', {
          method: 'POST',
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity
          })
        });
      }
      
      // Show success message
      alert(`Added ${order.items.length} item(s) to cart! Redirecting to checkout...`);
      
      // Navigate to store with cart modal
      navigate('/store?checkout=true');
    } catch (error) {
      console.error('Error adding items to cart:', error);
      alert('Failed to add items to cart. Please try again.');
    }
  };

  // Handle buy single item again
  const handleBuyItemAgain = async (item) => {
    try {
      await apiCall('/store/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          productId: item.productId,
          quantity: 1
        })
      });
      
      // Show success message
      alert(`Added "${item.name}" to cart! Redirecting to checkout...`);
      
      // Navigate to store with cart modal
      navigate('/store?checkout=true');
    } catch (error) {
      console.error('Error adding item to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  // Open review modal
  const openReviewModal = (orderItem, orderId) => {
    setSelectedOrderItem({
      ...orderItem,
      orderId
    });
    setShowReviewModal(true);
  };

  // Render star rating input
  const renderStarRating = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          >
            <FaStar
              className={`text-lg ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div className="flex items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                  <p className="text-gray-600">Track your order history and status</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl text-gray-300 mx-auto mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here!
            </p>
            <button
              onClick={() => navigate('/store')}
              className="bg-forest-green-700 text-white px-6 py-3 rounded-lg hover:bg-forest-green-800 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'upcoming'
                      ? 'text-forest-green-600 border-b-2 border-forest-green-600 bg-forest-green-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FaTruck />
                    <span>Upcoming Orders ({upcomingOrders.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('previous')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'previous'
                      ? 'text-forest-green-600 border-b-2 border-forest-green-600 bg-forest-green-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FaCheckCircle />
                    <span>Previous Orders ({previousOrders.length})</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'upcoming' && (
              <div className="space-y-6">
                {upcomingOrders.length === 0 ? (
                  <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
                    <div className="text-4xl text-gray-300 mx-auto mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming orders</h3>
                    <p className="text-gray-600">You don't have any orders in progress right now.</p>
                  </div>
                ) : (
                  upcomingOrders.map((order) => (
                    <div key={order._id} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-white/20">
                      {/* Order Header */}
                      <div className="bg-gradient-to-r from-forest-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <FaShoppingBag className="text-forest-green-600" />
                              <span className="font-semibold text-gray-900">Order #{order.orderNumber}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <FaCalendar className="mr-1" />
                              {formatDate(order.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="px-6 py-4">
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-4 py-2 border-b border-gray-100 last:border-b-0">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyIiB5PSIzMiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">{formatPrice(item.price)}</div>
                                <div className="text-sm text-gray-500">Total: {formatPrice(item.price * item.quantity)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Footer */}
                      <div className="bg-gray-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="mr-2" />
                              <span>{order.shippingAddress?.city}, {order.shippingAddress?.country}</span>
                            </div>
                            <div className="flex items-center">
                              <FaCreditCard className="mr-2" />
                              <span>{order.paymentMethod}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/order/${order._id}`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 transition-colors"
                          >
                            <FaEye />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'previous' && (
              <div className="space-y-6">
                {previousOrders.length === 0 ? (
                  <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20">
                    <div className="text-4xl text-gray-300 mx-auto mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No previous orders</h3>
                    <p className="text-gray-600">You don't have any completed orders yet.</p>
                  </div>
                ) : (
                  previousOrders.map((order) => (
                    <div key={order._id} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-white/20">
                      {/* Order Header */}
                      <div className="bg-gradient-to-r from-forest-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <FaShoppingBag className="text-forest-green-600" />
                              <span className="font-semibold text-gray-900">Order #{order.orderNumber}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <FaCalendar className="mr-1" />
                              {formatDate(order.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="px-6 py-4">
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyIiB5PSIzMiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                {order.status === 'delivered' && (
                                  <div className="mt-2 flex items-center space-x-4">
                                    <button
                                      onClick={() => openReviewModal(item, order._id)}
                                      className="flex items-center space-x-1 text-sm text-forest-green-600 hover:text-forest-green-700 transition-colors"
                                    >
                                      <FaStar />
                                      <span>Write Review</span>
                                    </button>
                                    <button
                                      onClick={() => handleBuyItemAgain(item)}
                                      className="flex items-center space-x-1 text-sm bg-forest-green-600 text-white px-3 py-1 rounded-md hover:bg-forest-green-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                                    >
                                      <FaRedo />
                                      <span>Buy Again</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">{formatPrice(item.price)}</div>
                                <div className="text-sm text-gray-500">Total: {formatPrice(item.price * item.quantity)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Footer */}
                      <div className="bg-gray-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="mr-2" />
                              <span>{order.shippingAddress?.city}, {order.shippingAddress?.country}</span>
                            </div>
                            <div className="flex items-center">
                              <FaCreditCard className="mr-2" />
                              <span>{order.paymentMethod}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {order.status === 'delivered' && (
                              <button
                                onClick={() => handleBuyAgain(order)}
                                className="flex items-center space-x-2 px-4 py-2 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                <FaShoppingCart />
                                <span>Buy Again</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedOrderItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimesCircle className="text-xl" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {selectedOrderItem.image ? (
                      <img 
                        src={selectedOrderItem.image} 
                        alt={selectedOrderItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedOrderItem.name}</h4>
                    <p className="text-sm text-gray-500">Quantity: {selectedOrderItem.quantity}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                {renderStarRating(reviewData.rating, true, (rating) => 
                  setReviewData(prev => ({ ...prev, rating }))
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Comment
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience with this product..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  className="flex-1 px-4 py-2 bg-forest-green-600 text-white rounded-md hover:bg-forest-green-700 transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;

