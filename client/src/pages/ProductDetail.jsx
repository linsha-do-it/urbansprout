import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Truck,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Share2,
  StarIcon,
  X,
  MapPin,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import ProductImageSlideshow from '../components/ProductImageSlideshow';
import Avatar from '../components/Avatar';
import { initializeRazorpayPayment } from '../config/razorpay';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '', // Changed from pincode to postalCode to match backend
    country: 'India',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await apiCall(`/store/${id}`);
        
        if (response.success) {
          setProduct(response.data.product);
          setRecommendedProducts(response.data.relatedProducts || []);
          await loadReviews(response.data.product._id);
          await checkWishlistStatus(response.data.product._id);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  // Load reviews for the product
  const loadReviews = async (productId) => {
    try {
      const response = await apiCall(`/store/reviews/${productId}`);
      if (response.success) {
        const reviews = response.data.reviews || [];
        setReviews(reviews);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };


  // Check if product is in wishlist
  const checkWishlistStatus = async (productId) => {
    if (!user) return;
    
    try {
      const response = await apiCall('/store/wishlist');
      if (response.success) {
        const inWishlist = response.data.some(item => 
          (item.product?._id || item.product) === productId
        );
        setIsInWishlist(inWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  // Add to cart functionality
  const handleAddToCart = async () => {
    if (!user) {
      alert('Please log in to add items to cart');
      navigate('/login');
      return;
    }

    setIsAddingToCart(true);
    try {
      // First, get the current cart
      const currentCartResponse = await apiCall('/store/cart');
      let currentCartItems = [];
      
      if (currentCartResponse.success && currentCartResponse.data) {
        currentCartItems = currentCartResponse.data;
      }

      // Check if the product is already in the cart
      const existingItemIndex = currentCartItems.findIndex(item => 
        (item.product?._id || item.product) === product._id
      );

      let updatedCartItems;
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedCartItems = [...currentCartItems];
        updatedCartItems[existingItemIndex] = {
          ...updatedCartItems[existingItemIndex],
          quantity: (updatedCartItems[existingItemIndex].quantity || 1) + quantity
        };
      } else {
        // Add new item to cart
        updatedCartItems = [
          ...currentCartItems,
          {
            product: product._id,
            quantity: quantity
          }
        ];
      }

      // Save the updated cart
      const response = await apiCall('/store/cart', {
        method: 'POST',
        body: JSON.stringify({
          items: updatedCartItems.map(item => ({
            id: item.product?._id || item.product,
            quantity: item.quantity
          }))
        })
      });

      if (!response.success) {
        alert('Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Buy now functionality
  const handleBuyNow = async () => {
    if (!user) {
      alert('Please log in to proceed with purchase');
      navigate('/login');
      return;
    }

    setIsBuyingNow(true);
    try {
      // For "Buy Now", create a temporary cart with only this product
      const buyNowItems = [{
        id: product._id,
        quantity: quantity
      }];

      // Save the temporary cart for checkout
      await apiCall('/store/cart', {
        method: 'POST',
        body: JSON.stringify({
          items: buyNowItems
        })
      });

      // Show checkout modal directly on product page
      setShowCheckout(true);
    } catch (error) {
      console.error('Error with buy now:', error);
      alert('Failed to proceed with purchase');
    } finally {
      setIsBuyingNow(false);
    }
  };

  // Toggle wishlist
  const toggleWishlist = async () => {
    if (!user) {
      alert('Please log in to manage wishlist');
      navigate('/login');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await apiCall('/store/wishlist', {
          method: 'DELETE',
          body: JSON.stringify({ productId: product._id })
        });
        setIsInWishlist(false);
      } else {
        // Add to wishlist
        await apiCall('/store/wishlist', {
          method: 'POST',
          body: JSON.stringify({
            items: [{ id: product._id }]
          })
        });
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Share product functionality
  const handleShare = async () => {
    setShareLoading(true);
    try {
      const productUrl = window.location.href;
      const shareText = `Check out this amazing ${product.name} on UrbanSprout! 🌱`;
      
      // Check if Web Share API is supported
      if (navigator.share) {
        try {
          await navigator.share({
            title: product.name,
            text: shareText,
            url: productUrl,
          });
          console.log('Product shared successfully');
        } catch (error) {
          // User cancelled sharing or error occurred
          if (error.name !== 'AbortError') {
            console.error('Error sharing:', error);
            fallbackShare(productUrl, shareText);
          }
        }
      } else {
        // Fallback for browsers that don't support Web Share API
        fallbackShare(productUrl, shareText);
      }
    } finally {
      setShareLoading(false);
    }
  };

  // Fallback share method
  const fallbackShare = (url, text) => {
    // Try to copy to clipboard first
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        // Show a more user-friendly notification
        const notification = document.createElement('div');
        notification.textContent = 'Product link copied to clipboard! 📋';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          font-size: 14px;
          font-weight: 500;
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      }).catch(() => {
        // If clipboard fails, show the URL in an alert
        alert(`Share this product: ${url}`);
      });
    } else {
      // For older browsers, show the URL
      alert(`Share this product: ${url}`);
    }
  };

  // Navigate reviews (showing 2 at a time)
  const nextReview = () => {
    setCurrentReviewIndex((prev) => {
      const nextIndex = prev + 2;
      return nextIndex >= reviews.length ? prev : nextIndex;
    });
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => {
      const prevIndex = prev - 2;
      return prevIndex < 0 ? 0 : prevIndex;
    });
  };

  // Render stars
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Validation functions
  const validatePhoneNumber = (value) => {
    return value.replace(/[^0-9\s\-\+]/g, '');
  };

  const validatePincode = (value) => {
    return value.replace(/[^0-9]/g, '');
  };

  const validateAlphabetOnly = (value) => {
    return value.replace(/[^a-zA-Z\s]/g, '');
  };

  const validateAlphaNumeric = (value) => {
    return value.replace(/[^a-zA-Z0-9\s\.,\-\#\/]/g, '');
  };

  // Get total for single product
  const getProductTotal = () => {
    return (product?.price || 0) * quantity;
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (isProcessingPayment) {
      return;
    }

    if (!user) {
      alert('Please log in to place an order.');
      return;
    }

    // Validate shipping address
    const requiredFields = ['fullName', 'address', 'city', 'state', 'postalCode', 'country', 'phone'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field].trim());
    
    if (missingFields.length > 0) {
      alert('Please fill in all required shipping address fields.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const orderData = {
        items: [{
          id: product._id,
          name: product.name,
          price: product.price,
          quantity: quantity
        }],
        shippingAddress,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        total: getProductTotal(),
        userId: user?.email || 'guest',
        customerName: shippingAddress.fullName,
        customerEmail: user?.email || '',
        customerPhone: shippingAddress.phone
      };

      if (paymentMethod === 'online') {
        await handleOnlinePayment(orderData);
      } else {
        setShowOrderSummary(true);
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Handle online payment
  const handleOnlinePayment = async (orderData) => {
    try {
      if (!window.Razorpay) {
        alert('Payment gateway is not available. Please refresh the page and try again.');
        setIsProcessingPayment(false);
        return;
      }

      const razorpayOrder = await apiCall('/store/create-razorpay-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: orderData.total,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            userId: orderData.userId,
            items: orderData.items,
            shippingAddress: orderData.shippingAddress
          }
        })
      });

      if (!razorpayOrder.success) {
        throw new Error(razorpayOrder.message || 'Failed to create payment order');
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.total,
        currency: 'INR',
        name: 'UrbanSprout',
        description: `Order for ${product.name}`,
        order_id: razorpayOrder.data.id,
        handler: async (response) => {
          try {
            const verifyResponse = await apiCall('/store/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData
              })
            });

            if (verifyResponse.success) {
              alert('Payment successful! Your order has been placed.');
              setShowCheckout(false);
              setShowOrderSummary(false);
              // Reset form
              setShippingAddress({
                fullName: '',
                address: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'India',
                phone: ''
              });
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: shippingAddress.fullName,
          email: user?.email || '',
          contact: shippingAddress.phone
        },
        theme: {
          color: '#059669'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Online payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle COD order confirmation
  const handleCODOrder = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        alert('Please log in to place an order.');
        navigate('/login');
        return;
      }

      // Check if token exists
      const token = localStorage.getItem('urbansprout_token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        navigate('/login');
        return;
      }

      const orderData = {
        items: [{
          id: product._id,
          name: product.name,
          price: product.price,
          quantity: quantity
        }],
        shippingAddress,
        paymentMethod: 'Cash on Delivery', // Changed from 'cod' to match backend expectation
        total: getProductTotal(),
        userId: user?.email || 'guest',
        customerName: shippingAddress.fullName,
        customerEmail: user?.email || '',
        customerPhone: shippingAddress.phone
      };

      console.log('Sending order data:', orderData); // Debug log
      console.log('User token:', token ? 'Token exists' : 'No token'); // Debug log

      const response = await apiCall('/store/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      console.log('Order response:', response); // Debug log

      if (response.success) {
        alert('Order placed successfully! You will receive a confirmation email shortly.');
        setShowCheckout(false);
        setShowOrderSummary(false);
        // Reset form
        setShippingAddress({
          fullName: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
          phone: ''
        });
      } else {
        alert(`Failed to place order: ${response.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('COD order error:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
      } else {
        alert(`Failed to place order: ${error.message || 'Please try again.'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-forest-green-600 mx-auto mb-4" />
          <p className="text-forest-green-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            to="/store"
            className="inline-flex items-center px-6 py-3 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = product.currentPrice || product.discountPrice || product.regularPrice;
  const hasDiscount = product.discountPrice && product.regularPrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/store"
            className="inline-flex items-center text-forest-green-600 hover:text-forest-green-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Link>
        </motion.div>

        {/* Product Details */}
        <div className="px-8 md:px-16 py-10">
          {/* Main Product Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:divide-x lg:divide-gray-200">
            {/* Product Images - Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 lg:pr-16"
            >
                  <ProductImageSlideshow 
                    images={product.images || [product.image]} 
                    productName={product.name}
                    className="h-96 w-full"
                  >
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col space-y-2">
                      {product.isNew && (
                        <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                          NEW
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                          {Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  </ProductImageSlideshow>
                </motion.div>

            {/* Product Info - Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6 lg:pl-16"
            >
              {/* Title and Rating */}
              <div>
                <h1 className="text-3xl font-bold text-forest-green-800 mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {renderStars(Math.floor(product.rating || 0))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.reviews || 0} reviews)
                  </span>
                </div>
                <p className="text-lg text-forest-green-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-forest-green-800">
                  ₹{currentPrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ₹{product.regularPrice.toLocaleString()}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded">
                      Save ₹{(product.regularPrice - product.discountPrice).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* Tags/Dimensions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-forest-green-800">Product Details</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags && product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-forest-green-100 text-forest-green-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {product.dimensions && (
                    <>
                      {product.dimensions.length && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          Length: {product.dimensions.length}cm
                        </span>
                      )}
                      {product.dimensions.width && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          Width: {product.dimensions.width}cm
                        </span>
                      )}
                      {product.dimensions.height && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          Height: {product.dimensions.height}cm
                        </span>
                      )}
                    </>
                  )}
                  {product.weight && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      Weight: {product.weight}g
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-forest-green-700">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-forest-green-200 rounded-lg hover:bg-forest-green-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border border-forest-green-200 rounded-lg min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 border border-forest-green-200 rounded-lg hover:bg-forest-green-50 transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {product.stock > 0 ? `${product.stock} items available` : 'Out of stock'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0 || isAddingToCart}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0 || isBuyingNow}
                    className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-forest-green-600 text-forest-green-600 rounded-lg hover:bg-forest-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBuyingNow ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4 mr-2" />
                    )}
                    Buy Now
                  </button>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg transition-colors ${
                      isInWishlist
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {wishlistLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className={`h-4 w-4 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                    )}
                    {isInWishlist ? 'Wishlisted' : 'Add to Wishlist'}
                  </button>
                  <button 
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {shareLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    Share
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Truck className="h-6 w-6 text-forest-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Free Shipping</p>
                    <p className="text-sm text-gray-600">On orders over ₹500</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-forest-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Secure Payment</p>
                    <p className="text-sm text-gray-600">100% secure</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-forest-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Quality Guarantee</p>
                    <p className="text-sm text-gray-600">Premium quality</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Customer Reviews Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-forest-green-800 mb-6">Customer Reviews</h2>
            
            {reviews.length > 0 ? (
              <div className="relative group">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {reviews.slice(currentReviewIndex, currentReviewIndex + 2).map((review, index) => (
                    <div
                      key={review._id || index}
                      className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-white/30 hover:border-white/50 p-6"
                    >
                      <div className="flex items-start space-x-4">
                        <Avatar 
                          user={{
                            name: review.user?.name || 'Anonymous User',
                            avatar: review.user?.avatar
                          }} 
                          size="lg" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {review.user?.name || 'Anonymous User'}
                            </h4>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {renderStars(review.rating || 0)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-gray-700 leading-relaxed">
                            {review.comment || 'No comment provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Controls - Only visible on hover */}
                {reviews.length > 2 && (
                  <>
                    <button
                      onClick={prevReview}
                      disabled={currentReviewIndex === 0}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={nextReview}
                      disabled={currentReviewIndex >= reviews.length - 2}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </>
                )}

                {/* Pagination Dots - Only visible on hover */}
                {reviews.length > 2 && (
                  <div className="flex justify-center mt-6 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {Array.from({ length: Math.ceil(reviews.length / 2) }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentReviewIndex(index * 2)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          Math.floor(currentReviewIndex / 2) === index
                            ? 'bg-forest-green-600 scale-110'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/30 p-12 text-center">
                <div className="text-6xl text-gray-300 mx-auto mb-4">⭐</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-600">
                  Be the first to share your experience with this product!
                </p>
              </div>
            )}
          </motion.div>

          {/* Related Products Section */}
          {recommendedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
                  <h2 className="text-2xl font-bold text-forest-green-800 mb-6">Related Products</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedProducts.map((recProduct) => (
                      <Link
                        key={recProduct._id}
                        to={`/product/${recProduct._id}`}
                        className="group bg-white/60 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-white/30 hover:border-white/50"
                      >
                        <div className="aspect-w-16 aspect-h-12">
                          <img
                            src={recProduct.images?.[0] || recProduct.image}
                            alt={recProduct.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 group-hover:text-forest-green-600 transition-colors mb-2">
                            {recProduct.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-forest-green-800">
                              ₹{(recProduct.currentPrice || recProduct.discountPrice || recProduct.regularPrice).toLocaleString()}
                            </span>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="ml-1 text-sm text-gray-600">
                                {recProduct.rating || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{product.name} x {quantity}</span>
                      <span>₹{getProductTotal().toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{getProductTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Shipping Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={shippingAddress.fullName}
                        onChange={(e) => {
                          const validatedName = validateAlphabetOnly(e.target.value);
                          setShippingAddress(prev => ({ ...prev, fullName: validatedName }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your full name (letters only)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => {
                          const validatedPhone = validatePhoneNumber(e.target.value);
                          setShippingAddress(prev => ({ ...prev, phone: validatedPhone }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your phone number (numbers only)"
                        maxLength="15"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={shippingAddress.address}
                        onChange={(e) => {
                          const validatedAddress = validateAlphaNumeric(e.target.value);
                          setShippingAddress(prev => ({ ...prev, address: validatedAddress }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={3}
                        placeholder="Enter your complete address (letters, numbers, and basic punctuation)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => {
                          const validatedCity = validateAlphabetOnly(e.target.value);
                          setShippingAddress(prev => ({ ...prev, city: validatedCity }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your city (letters only)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => {
                          const validatedState = validateAlphabetOnly(e.target.value);
                          setShippingAddress(prev => ({ ...prev, state: validatedState }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your state (letters only)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => {
                          const validatedPostalCode = validatePincode(e.target.value);
                          setShippingAddress(prev => ({ ...prev, postalCode: validatedPostalCode }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter postal code (numbers only)"
                        maxLength="10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => {
                          const validatedCountry = validateAlphabetOnly(e.target.value);
                          setShippingAddress(prev => ({ ...prev, country: validatedCountry }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter country (letters only)"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payment Method
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-gray-500">Pay when your order arrives</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Online Payment</div>
                        <div className="text-sm text-gray-500">Pay securely with card/UPI</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Place Order Button */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessingPayment}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary Modal for COD */}
      {showOrderSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-lg border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                <button
                  onClick={() => setShowOrderSummary(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{product.name} x {quantity}</span>
                      <span>₹{getProductTotal().toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{getProductTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                  <div className="text-sm text-gray-700">
                    <p>{shippingAddress.fullName}</p>
                    <p>{shippingAddress.address}</p>
                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                    <p>{shippingAddress.country}</p>
                    <p>Phone: {shippingAddress.phone}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                  <p className="text-sm text-gray-700">Cash on Delivery</p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowOrderSummary(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCODOrder}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    Confirm Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
