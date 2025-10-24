import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Filter, Heart, ShoppingCart, Star, Grid, List, X, MapPin, CreditCard, Package, Truck, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiCall } from '../utils/api'
import { initializeRazorpayPayment } from '../config/razorpay'
import ProductImageSlideshow from '../components/ProductImageSlideshow'
import Logo from '../components/Logo'

const Store = () => {
  try {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const highlightedProductId = searchParams.get('highlight')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [wishlist, setWishlist] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)
  const [buyNowLoading, setBuyNowLoading] = useState(false)
  const [buyAllLoading, setBuyAllLoading] = useState(false)
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: ''
  })
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreProducts, setHasMoreProducts] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showOrderSummary, setShowOrderSummary] = useState(false)

  // Ensure products are unique by ID
  const ensureUniqueProducts = (productList) => {
    const uniqueProducts = productList.filter((product, index, self) => 
      index === self.findIndex(p => p._id === product._id)
    )
    if (uniqueProducts.length !== productList.length) {
      console.log(`Removed ${productList.length - uniqueProducts.length} duplicate products`)
    }
    return uniqueProducts
  }

  // Clear any cached data
  const clearCache = () => {
    // Clear any potential localStorage cache
    localStorage.removeItem('store_products_cache')
    localStorage.removeItem('store_categories_cache')
  }

  // Load products from API with pagination
  const loadProducts = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setCurrentPage(1)
      } else {
        setLoadingMore(true)
      }
      
      const categoryParam = selectedCategory && selectedCategory !== 'all' ? `&category=${encodeURIComponent(selectedCategory)}` : ''
      const timestamp = Date.now() // Cache busting
      const apiUrl = `/store?page=${page}&limit=12${categoryParam}&_t=${timestamp}`
      const response = await apiCall(apiUrl)
      
      if (response.success && response.data && response.data.products) {
        const uniqueNewProducts = ensureUniqueProducts(response.data.products)
        
        if (reset) {
          setProducts(uniqueNewProducts)
        } else {
          setProducts(prev => {
            const combinedProducts = [...prev, ...uniqueNewProducts]
            const uniqueCombinedProducts = ensureUniqueProducts(combinedProducts)
            return uniqueCombinedProducts
          })
        }
        
        // Check if there are more products
        const totalPages = response.data.pagination?.pages || 1
        setHasMoreProducts(page < totalPages)
        setCurrentPage(page)
      } else {
        if (reset) {
          setProducts([])
        }
      }
    } catch (error) {
      console.error('Error loading products:', error)
      if (reset) {
        setProducts([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load more products for infinite scroll
  const loadMoreProducts = () => {
    if (!loadingMore && hasMoreProducts) {
      loadProducts(currentPage + 1, false)
    }
  }

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    // Reset all pagination state
    setCurrentPage(1)
    setHasMoreProducts(true)
    // Reset products and load first page of selected category
    loadProducts(1, true)
  }

  // Load categories from API
  const loadCategories = async () => {
    try {
      const timestamp = Date.now() // Cache busting
      const response = await apiCall(`/store/categories?_t=${timestamp}`)
      
      if (response.success && response.data && response.data.categories) {
        // Format categories for the store page
        const formattedCategories = response.data.categories.map(cat => ({
          id: cat._id,
          name: cat._id
        }))
        
        // Add "All Products" option at the beginning
        const allCategories = [
          { id: 'all', name: 'All Products' },
          ...formattedCategories
        ]
        
        setCategories(allCategories)
      } else {
        // Fallback: extract categories from products
        const uniqueCategories = [...new Set(products.map(product => product.category))].filter(cat => cat)
        const fallbackCategories = [
          { id: 'all', name: 'All Products' },
          ...uniqueCategories.map(cat => ({
            id: cat,
            name: cat
          }))
        ]
        setCategories(fallbackCategories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Fallback: extract categories from products
      const uniqueCategories = [...new Set(products.map(product => product.category))].filter(cat => cat)
      const fallbackCategories = [
        { id: 'all', name: 'All Products' },
        ...uniqueCategories.map(cat => ({
          id: cat,
          name: cat
        }))
      ]
      setCategories(fallbackCategories)
    }
  }

  // Load cart and wishlist from database on component mount
  useEffect(() => {
    const initializeData = async () => {
      clearCache() // Clear any cached data first
      await loadProducts(1, true)
      await loadCategories()
      
      if (user) {
        // Load from database
        loadCartFromDB()
        loadWishlistFromDB()
        
        // Sync guest data to user account
        syncGuestDataToUser()
      } else {
        // For guest users, use localStorage
        const savedCart = localStorage.getItem('cart_guest')
        const savedWishlist = localStorage.getItem('wishlist_guest')
        
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist))
        }
      }
    }
    
    initializeData()
  }, [user])

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreProducts()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMoreProducts, currentPage])

  // Handle checkout parameter from URL
  useEffect(() => {
    const checkoutParam = searchParams.get('checkout')
    const buyNowParam = searchParams.get('buynow')
    
    if (checkoutParam === 'true') {
      if (buyNowParam === 'true') {
        // Buy now mode - show checkout immediately
        setShowCheckout(true)
      } else {
        // Regular checkout - show cart first
        setShowCart(true)
      }
    }
  }, [searchParams])

  const syncGuestDataToUser = async () => {
    try {
      const guestCart = localStorage.getItem('cart_guest')
      const guestWishlist = localStorage.getItem('wishlist_guest')
      
      if (guestCart) {
        const cartData = JSON.parse(guestCart)
        if (cartData.length > 0) {
          // Merge guest cart with user cart
          const currentCart = cart || []
          const mergedCart = [...currentCart]
          
          cartData.forEach(guestItem => {
            const existingItem = mergedCart.find(item => item.id === guestItem.id)
            if (existingItem) {
              existingItem.quantity += guestItem.quantity
            } else {
              mergedCart.push(guestItem)
            }
          })
          
          setCart(mergedCart)
          await saveCartToDB(mergedCart)
        }
        
        // Clear guest cart
        localStorage.removeItem('cart_guest')
      }
      
      if (guestWishlist) {
        const wishlistData = JSON.parse(guestWishlist)
        if (wishlistData.length > 0) {
          // Merge guest wishlist with user wishlist
          const currentWishlist = wishlist || []
          const mergedWishlist = [...currentWishlist]
          
          wishlistData.forEach(guestItem => {
            if (!mergedWishlist.find(item => item.id === guestItem.id)) {
              mergedWishlist.push(guestItem)
            }
          })
          
          setWishlist(mergedWishlist)
          await saveWishlistToDB(mergedWishlist)
        }
        
        // Clear guest wishlist
        localStorage.removeItem('wishlist_guest')
      }
    } catch (error) {
      console.error('Error syncing guest data:', error)
    }
  }

  // Load cart from database
  const loadCartFromDB = async () => {
    try {
      const response = await apiCall('/store/cart')
      if (response.success && response.data) {
        // Handle populated format: items[].product populated by server
        const formattedCart = (response.data || []).map(item => {
          const prod = item.product || {}
          return {
            id: prod._id || item.product || item.productId || item.id,
            name: prod.name || item.name,
            price: (prod.currentPrice || prod.discountPrice || prod.regularPrice || item.price || 0),
            quantity: item.quantity || 1,
            image: (Array.isArray(prod.images) && prod.images[0]) || item.image,
            stock: prod.stock,
            category: prod.category,
            _id: prod._id || item.product
          }
        })
        setCart(formattedCart)
        return
      }
    } catch (error) {
      console.error('Error loading cart from database:', error)
    }
    
    // Fallback to localStorage if database fails or returns empty
    const savedCart = localStorage.getItem(`cart_${user.email}`)
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  // Load wishlist from database
  const loadWishlistFromDB = async () => {
    try {
      const response = await apiCall('/store/wishlist')
      if (response.success && response.data) {
        const formattedWishlist = (response.data || []).map(item => {
          const prod = item.product || {}
          return {
            id: prod._id || item.product || item.productId || item.id,
            _id: prod._id || item.product,
            name: prod.name || item.name,
            price: (prod.currentPrice || prod.discountPrice || prod.regularPrice || item.price || 0),
            currentPrice: prod.currentPrice || item.currentPrice,
            regularPrice: prod.regularPrice || item.regularPrice,
            discountPrice: prod.discountPrice || item.discountPrice,
            image: (Array.isArray(prod.images) && prod.images[0]) || item.image,
            images: prod.images || item.images,
            stock: prod.stock || item.stock || 0,
            category: prod.category || item.category,
            description: prod.description || item.description,
            sku: prod.sku || item.sku
          }
        })
        setWishlist(formattedWishlist)
        return
      }
    } catch (error) {
      console.error('Error loading wishlist from database:', error)
    }
    
    // Fallback to localStorage if database fails or returns empty
    const savedWishlist = localStorage.getItem(`wishlist_${user.email}`)
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }
  }

  // Save cart to database
  const saveCartToDB = async (cartData) => {
    // Always save to localStorage as backup
    if (!user) {
      localStorage.setItem('cart_guest', JSON.stringify(cartData))
      return
    }
    
    // Save to localStorage as backup for logged-in users too
    localStorage.setItem(`cart_${user.email}`, JSON.stringify(cartData))
    
    try {
      // Send minimal structure expected by backend
      const formattedCartData = cartData.map(item => ({
        id: String(item.id || item._id),
        quantity: item.quantity || 1
      }))

      await apiCall('/store/cart', {
        method: 'POST',
        body: JSON.stringify({ items: formattedCartData })
      })
    } catch (error) {
      console.error('Error saving cart to database:', error)
      // Data is already saved to localStorage as backup
    }
  }

  // Save wishlist to database
  const saveWishlistToDB = async (wishlistData) => {
    // Always save to localStorage as backup
    if (!user) {
      localStorage.setItem('wishlist_guest', JSON.stringify(wishlistData))
      return
    }
    
    // Save to localStorage as backup for logged-in users too
    localStorage.setItem(`wishlist_${user.email}`, JSON.stringify(wishlistData))
    
    try {
      const formattedWishlistData = wishlistData.map(item => ({
        id: String(item.id || item._id)
      }))

      await apiCall('/store/wishlist', {
        method: 'POST',
        body: JSON.stringify({ items: formattedWishlistData })
      })
    } catch (error) {
      console.error('Error saving wishlist to database:', error)
      // Data is already saved to localStorage as backup
    }
  }

  // Products are now loaded from API via loadProducts() function



  // Cart functions
  const addToCart = async (product) => {
    console.log('Adding product to cart:', product);
    
    const productId = product._id || product.id;
    const existingItem = (cart || []).find(item => item.id === productId)
    let newCart
    
    if (existingItem) {
      newCart = (cart || []).map(item => 
        item.id === productId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    } else {
      // Create a clean cart item with consistent structure
      const cartItem = {
        id: productId,
        _id: productId, // Keep both for compatibility
        name: product.name,
        price: product.currentPrice || product.discountPrice || product.regularPrice || product.price || 0,
        image: product.images?.[0] || product.image,
        category: product.category,
        stock: product.stock,
        inStock: product.stock > 0,
        quantity: 1
      };
      newCart = [...cart, cartItem]
    }
    
    console.log('New cart:', newCart);
    setCart(newCart)
    await saveCartToDB(newCart)
  }

  const removeFromCart = async (productId) => {
    const newCart = (cart || []).filter(item => item.id !== productId)
    setCart(newCart)
    await saveCartToDB(newCart)
  }

  const updateQuantity = async (productId, quantity) => {
    let newCart
    if (quantity <= 0) {
      newCart = (cart || []).filter(item => item.id !== productId)
    } else {
      newCart = (cart || []).map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      )
    }
    setCart(newCart)
    await saveCartToDB(newCart)
  }

  const getCartTotal = () => {
    return (cart || []).reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0)
  }

  // Handle place order
  const handlePlaceOrder = async () => {
    if (isProcessingPayment) {
      return; // Prevent multiple clicks
    }

    // Check if user is authenticated
    if (!user) {
      alert('Please log in to place an order.')
      return
    }

    // Validate shipping address
    const requiredFields = ['fullName', 'address', 'city', 'state', 'pincode', 'country', 'phone']
    const missingFields = requiredFields.filter(field => !shippingAddress[field].trim())
    
    if (missingFields.length > 0) {
      alert('Please fill in all required shipping address fields.')
      return
    }

    console.log('User:', user)
    console.log('Token:', localStorage.getItem('urbansprout_token'))

    setIsProcessingPayment(true);

    try {
      const orderData = {
        items: cart,
        shippingAddress,
        paymentMethod,
        total: getCartTotal(),
        userId: user?.email || 'guest',
        customerName: shippingAddress.fullName,
        customerEmail: user?.email || '',
        customerPhone: shippingAddress.phone
      }

      console.log('Order data being sent:', JSON.stringify(orderData, null, 2))

      if (paymentMethod === 'online') {
        // For online payment, create order and proceed to Razorpay
        await handleOnlinePayment(orderData)
      } else {
        // For COD, show order summary first
        setShowOrderSummary(true)
        setIsProcessingPayment(false) // Reset processing state for COD
      }
    } catch (error) {
      console.error('Error placing order:', error)
      if (error.message.includes('User not found') || error.message.includes('Token is not valid')) {
        alert('Your session has expired. Please log in again to place orders.')
        // Clear user state
        localStorage.removeItem('urbansprout_token');
        localStorage.removeItem('urbansprout_user');
        window.location.href = '/login';
      } else {
        alert('Error placing order. Please try again.')
      }
      setIsProcessingPayment(false);
    }
  }

  // Handle online payment with Razorpay
  const handleOnlinePayment = async (orderData) => {
    try {
      console.log('🚀 Starting online payment process...');
      console.log('Order data:', orderData);
      
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        console.error('❌ Razorpay script not loaded');
        alert('Payment gateway is not available. Please refresh the page and try again.');
        setIsProcessingPayment(false);
        return;
      }
      
      console.log('✅ Razorpay script is loaded');

      console.log('Creating Razorpay order with data:', {
        amount: orderData.total,
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          userId: orderData.userId,
          items: orderData.items,
          shippingAddress: orderData.shippingAddress
        }
      });

      // First, create order on backend to get Razorpay order ID
      console.log('Creating Razorpay order with data:', {
        amount: orderData.total,
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          userId: orderData.userId,
          items: orderData.items,
          shippingAddress: orderData.shippingAddress
        }
      });

      const response = await apiCall('/store/create-order', {
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

      console.log('Razorpay order creation response:', response);

      if (response.success && response.data) {
        const razorpayOrderData = {
          ...orderData,
          amount: orderData.total,
          razorpayOrderId: response.data.id,
          orderId: response.data.receipt
        };

        console.log('Opening Razorpay with data:', razorpayOrderData);
        console.log('Razorpay available:', !!window.Razorpay);

        // Initialize Razorpay payment
        initializeRazorpayPayment(
          razorpayOrderData,
          // Success callback
          async (paymentResponse) => {
            try {
              console.log('Payment successful:', paymentResponse);
              // Verify payment on backend
              const verifyResponse = await apiCall('/store/verify-payment', {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                  orderData: {
                    ...orderData,
                    razorpayOrderId: response.data.id,
                    receipt: response.data.receipt
                  }
                })
              });

              if (verifyResponse.success) {
                // Payment verified successfully - Order should be created by backend
                // Clear cart after successful order creation
                setCart([])
                try {
                  await saveCartToDB([])
                } catch (cartError) {
                  console.warn('Cart clearing failed, but order was successful:', cartError)
                  // Don't fail the entire flow for cart clearing issues
                }
                setShowCheckout(false)
                setIsProcessingPayment(false)
                alert('Payment successful! Order placed successfully.')
              } else {
                setIsProcessingPayment(false)
                console.error('Payment verification failed:', verifyResponse);
                alert(`Payment verification failed: ${verifyResponse.message || 'Please contact support'}`)
              }
            } catch (error) {
              console.error('❌ Payment verification error:', error);
              setIsProcessingPayment(false);
              
              // Provide more specific error messages
              let errorMessage = 'Payment verification failed. ';
              if (error.message) {
                errorMessage += error.message;
              } else if (error.response?.data?.message) {
                errorMessage += error.response.data.message;
              } else {
                errorMessage += 'Please contact support with your payment details.';
              }
              
              alert(errorMessage);
            }
          },
          // Error callback
          (error) => {
            console.error('Payment error:', error)
            setIsProcessingPayment(false)
            if (error.includes('cancelled')) {
              alert('Payment was cancelled. You can try again anytime.')
            } else if (error.includes('not available')) {
              alert('Payment gateway is temporarily unavailable. Please refresh the page and try again.')
            } else {
              alert(`Payment failed: ${error}`)
            }
          }
        )
      } else {
        console.error('Failed to create Razorpay order:', response);
        setIsProcessingPayment(false)
        alert(`Failed to create order: ${response.message || 'Please try again'}`)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      setIsProcessingPayment(false)
      if (error.message.includes('User not found') || error.message.includes('Token is not valid')) {
        alert('Your session has expired. Please log in again to place orders.')
        // Clear user state
        localStorage.removeItem('urbansprout_token');
        localStorage.removeItem('urbansprout_user');
        window.location.href = '/login';
      } else {
        alert(`Error creating order: ${error.message || 'Please try again'}`)
      }
    }
  }

  // Handle final order confirmation for COD
  const confirmOrder = async () => {
    setIsProcessingPayment(true);
    
    try {
      const orderData = {
        items: cart,
        shippingAddress,
        paymentMethod,
        total: getCartTotal(),
        userId: user?.email || 'guest',
        customerName: shippingAddress.fullName,
        customerEmail: user?.email || '',
        customerPhone: shippingAddress.phone
      };

      await placeOrderDirectly(orderData);
      setShowOrderSummary(false);
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Error confirming order. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle COD orders
  const placeOrderDirectly = async (orderData) => {
    try {
      // Format order data to match Order model
      const formattedOrderData = {
        items: orderData.items.map(item => ({
          productId: String(item.id || item._id || 'unknown'), // Safe string conversion
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image
        })),
        shippingAddress: {
          fullName: orderData.shippingAddress.fullName,
          address: orderData.shippingAddress.address,
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          postalCode: orderData.shippingAddress.pincode,
          country: orderData.shippingAddress.country || 'India',
          phone: orderData.shippingAddress.phone
        },
        paymentMethod: 'Cash on Delivery',
        subtotal: orderData.total,
        shipping: 0,
        tax: 0,
        total: orderData.total,
        status: 'pending',
        notes: 'Cash on Delivery order'
      };

      console.log('Sending order data:', formattedOrderData);

      const response = await apiCall('/store/orders', {
        method: 'POST',
        body: JSON.stringify(formattedOrderData)
      })

      if (response.success) {
        // Clear cart after successful order
        setCart([])
        try {
          await saveCartToDB([])
        } catch (cartError) {
          console.warn('Cart clearing failed, but order was successful:', cartError)
          // Don't fail the entire flow for cart clearing issues
        }
        
        // Close checkout modal
        setShowCheckout(false)
        setIsProcessingPayment(false)
        
        // Show success message
        alert('Order placed successfully! You will receive a confirmation email shortly.')
      } else {
        setIsProcessingPayment(false)
        console.error('Order creation failed:', response);
        alert(`Failed to place order: ${response.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setIsProcessingPayment(false)
      if (error.message.includes('User not found') || error.message.includes('Token is not valid')) {
        alert('Your session has expired. Please log in again to place orders.')
        // Clear user state
        localStorage.removeItem('urbansprout_token');
        localStorage.removeItem('urbansprout_user');
        window.location.href = '/login';
      } else {
        alert(`Error placing order: ${error.message || 'Please try again'}`)
      }
    }
  }

  // Input validation functions
  const validatePhoneNumber = (value) => {
    // Only allow numbers, spaces, hyphens, and plus sign
    return value.replace(/[^0-9\s\-\+]/g, '');
  };

  const validatePincode = (value) => {
    // Only allow numbers
    return value.replace(/[^0-9]/g, '');
  };

  const validateAlphabetOnly = (value) => {
    // Only allow letters and spaces
    return value.replace(/[^a-zA-Z\s]/g, '');
  };

  const validateAlphaNumeric = (value) => {
    // Allow letters, numbers, spaces, and common punctuation for addresses
    return value.replace(/[^a-zA-Z0-9\s\.,\-\#\/]/g, '');
  };

  // Enhanced validation with feedback
  const handleInputChange = (field, value, validator) => {
    const validatedValue = validator(value);
    setShippingAddress(prev => ({ ...prev, [field]: validatedValue }));
    
    // Show brief feedback if input was modified
    if (value !== validatedValue && value.length > validatedValue.length) {
      // Only show feedback if characters were removed
      console.log(`Invalid characters removed from ${field}`);
    }
  };

  // Wishlist functions
  const addToWishlist = async (product) => {
    const productId = product._id || product.id;
    if (!wishlist.find(item => (item.id || item._id) === productId)) {
      const newWishlist = [...wishlist, { ...product, id: productId }]
      setWishlist(newWishlist)
      await saveWishlistToDB(newWishlist)
    } else {
      // Product already in wishlist, show message
      alert('This item is already in your wishlist!')
    }
  }

  const removeFromWishlist = async (productId) => {
    const newWishlist = wishlist.filter(item => (item.id || item._id) !== productId)
    setWishlist(newWishlist)
    await saveWishlistToDB(newWishlist)
  }

  const clearWishlist = async () => {
    setWishlist([])
    await saveWishlistToDB([])
  }

  // Buy Now functionality
  const handleBuyNow = (product) => {
    if (!user) {
      alert('Please login to proceed with purchase')
      window.location.href = '/login'
      return
    }

    if (product.stock <= 0) {
      alert('This product is out of stock')
      return
    }

    // Add product to cart and proceed to checkout
    addToCart(product)
    setShowCheckout(true)
    setShowWishlist(false) // Close wishlist drawer
    
    // Remove from wishlist after adding to cart
    removeFromWishlist(product._id || product.id)
  }

  // Buy Now from Wishlist functionality
  const handleBuyNowFromWishlist = async (item) => {
    if (!user) {
      alert('Please login to proceed with purchase')
      window.location.href = '/login'
      return
    }

    if (item.stock <= 0) {
      alert('This product is out of stock')
      return
    }

    // Create properly formatted cart item with all necessary fields
    const cartItem = {
      id: item.id || item._id,
      _id: item._id || item.id,
      name: item.name,
      price: item.currentPrice || item.discountPrice || item.regularPrice || item.price || 0,
      image: item.image,
      category: item.category,
      stock: item.stock,
      inStock: item.stock > 0,
      quantity: 1
    }

    // Clear existing cart and add only this product
    setCart([cartItem])
    await saveCartToDB([cartItem])
    
    setShowCheckout(true)
    setShowWishlist(false) // Close wishlist drawer
    
    // Keep item in wishlist - don't remove it
  }

  // Buy All Wishlist functionality
  const handleBuyAllWishlist = async () => {
    if (!user) {
      alert('Please login to proceed with purchase')
      window.location.href = '/login'
      return
    }

    if (wishlist.length === 0) {
      alert('Your wishlist is empty')
      return
    }

    // Filter out-of-stock items
    const availableItems = wishlist.filter(item => item.stock > 0)
    
    if (availableItems.length === 0) {
      alert('All items in your wishlist are out of stock')
      return
    }

    if (availableItems.length < wishlist.length) {
      const outOfStockCount = wishlist.length - availableItems.length
      if (!confirm(`${outOfStockCount} item(s) are out of stock and will be skipped. Continue with ${availableItems.length} available items?`)) {
        return
      }
    }

    // Create properly formatted cart items with all necessary fields
    const cartItems = availableItems.map(item => ({
      id: item.id || item._id,
      _id: item._id || item.id,
      name: item.name,
      price: item.currentPrice || item.discountPrice || item.regularPrice || item.price || 0,
      image: item.image,
      category: item.category,
      stock: item.stock,
      inStock: item.stock > 0,
      quantity: 1
    }))

    // Clear existing cart and add only available wishlist items
    setCart(cartItems)
    await saveCartToDB(cartItems)
    
    setShowCheckout(true)
    setShowWishlist(false) // Close wishlist drawer
    
    // Keep wishlist as is - don't clear it
  }

  const isInWishlist = (productId) => {
    return wishlist.some(item => (item.id || item._id) === productId)
  }

  // Filter and sort products based on price, search, and sort criteria
  const filteredProducts = (products || []).filter(product => {
    // Use currentPrice if available, otherwise fallback to discountPrice/regularPrice
    const currentPrice = product.currentPrice || product.discountPrice || product.regularPrice || product.price || 0
    const priceMatch = (!minPrice || currentPrice >= parseInt(minPrice)) && 
                      (!maxPrice || currentPrice <= parseInt(maxPrice))
    
    const searchMatch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return priceMatch && searchMatch
  }).sort((a, b) => {
    const priceA = a.currentPrice || a.discountPrice || a.regularPrice || a.price || 0
    const priceB = b.currentPrice || b.discountPrice || b.regularPrice || b.price || 0
    
    switch (sortBy) {
      case 'price-low':
        return priceA - priceB
      case 'price-high':
        return priceB - priceA
      case 'rating':
        const ratingA = a.rating || 0
        const ratingB = b.rating || 0
        return ratingB - ratingA
      case 'newest':
        const dateA = new Date(a.createdAt || a.updatedAt || 0)
        const dateB = new Date(b.createdAt || b.updatedAt || 0)
        return dateB - dateA
      case 'popular':
      default:
        // For popular, we can use a combination of rating and some other factors
        // For now, let's use rating as primary factor, then price as secondary
        const ratingDiff = (b.rating || 0) - (a.rating || 0)
        if (ratingDiff !== 0) return ratingDiff
        return priceA - priceB // Lower price first if ratings are equal
    }
  })

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left side circles - spaced vertically */}
        <div className="absolute top-16 -left-32 w-72 h-72 bg-forest-green-200 rounded-full opacity-18 animate-pulse"></div>
        <div className="absolute top-1/3 -left-24 w-56 h-56 bg-forest-green-100 rounded-full opacity-15 animate-pulse delay-800"></div>
        <div className="absolute top-2/3 -left-40 w-64 h-64 bg-forest-green-300 rounded-full opacity-16 animate-pulse delay-1200"></div>
        <div className="absolute bottom-20 -left-28 w-48 h-48 bg-forest-green-200 rounded-full opacity-14 animate-pulse delay-400"></div>
        
        {/* Right side circles - spaced vertically */}
        <div className="absolute top-24 -right-36 w-68 h-68 bg-forest-green-100 rounded-full opacity-17 animate-pulse delay-600"></div>
        <div className="absolute top-1/4 -right-44 w-76 h-76 bg-forest-green-200 rounded-full opacity-19 animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 -right-32 w-52 h-52 bg-forest-green-300 rounded-full opacity-13 animate-pulse delay-1400"></div>
        <div className="absolute bottom-16 -right-48 w-60 h-60 bg-forest-green-100 rounded-full opacity-15 animate-pulse delay-200"></div>
        
        {/* Additional side circles - smaller sizes */}
        <div className="absolute top-1/2 -left-20 w-40 h-40 bg-forest-green-200 rounded-full opacity-12 animate-pulse delay-1600"></div>
        <div className="absolute top-1/6 -right-28 w-44 h-44 bg-forest-green-300 rounded-full opacity-11 animate-pulse delay-1800"></div>
        <div className="absolute bottom-1/3 -left-36 w-36 h-36 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 -right-20 w-32 h-32 bg-forest-green-200 rounded-full opacity-9 animate-pulse delay-1100"></div>
      </div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-forest-green-600 to-forest-green-700 text-cream-100 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Garden Store
            </h1>
            <p className="text-xl text-cream-200 max-w-2xl mx-auto mb-8">
              Discover our curated collection of gardening supplies, tools, fertilizers, 
              and accessories for your urban garden.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-cream-300" />
              </div>
              <input
                type="text"
                placeholder="Search gardening supplies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-300 bg-white/10 backdrop-blur-sm text-cream-100 placeholder-cream-300"
              />
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-cream-100"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart ({cart.length})</span>
              {cart.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  ₹{(getCartTotal() || 0).toLocaleString()}
                </span>
              )}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Highlighted Product Banner */}
      {highlightedProductId && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6 mx-4 sm:mx-6 lg:mx-8 rounded-r-lg"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🤖</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Recommended by our Plant Assistant
              </h3>
              <p className="text-sm text-blue-600">
                This item was suggested based on your plant preferences. Scroll down to see it highlighted!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar removed for cleaner layout */}

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="px-3 py-2 border border-forest-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green-500"
                >
                  {(categories || []).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>

                {/* Wishlist Button with Count Badge */}
                <button
                  onClick={() => { setShowCart(false); setShowCheckout(false); setShowWishlist(true); }}
                  className="px-4 py-2 border border-forest-green-200 rounded-lg hover:bg-forest-green-50 text-forest-green-700 flex items-center relative"
                  title="View Wishlist"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  <span>Wishlist</span>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                      {wishlist.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-forest-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-forest-green-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-forest-green-500 text-cream-100' : 'text-forest-green-600 hover:bg-forest-green-50'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-forest-green-500 text-cream-100' : 'text-forest-green-600 hover:bg-forest-green-50'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="ml-4">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col justify-center items-center py-20">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try refreshing the page or check your connection</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Refresh Page
                </button>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Debug info:</p>
                  <p>Products loaded: {products.length}</p>
                  <p>Categories: {categories.length}</p>
                  <p>Loading: {loading.toString()}</p>
                </div>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredProducts.map((product, index) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group relative border border-white/20 cursor-pointer ${
                      viewMode === 'list' ? 'flex' : 'flex flex-col h-[360px]'
                    } ${
                      highlightedProductId === product._id ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-2xl' : ''
                    }`}
                  >
                  {/* Wishlist Button - Positioned relative to main card */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      isInWishlist(product._id) ? removeFromWishlist(product._id) : addToWishlist(product);
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 z-50 opacity-0 group-hover:opacity-100 ${
                      isInWishlist(product._id) 
                        ? 'bg-red-500 text-white shadow-lg' 
                        : 'bg-white/90 hover:bg-white shadow-md'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist(product._id) ? 'fill-current' : 'text-forest-green-600'}`} />
                  </button>

                  {/* Product Image Slideshow */}
                  <ProductImageSlideshow 
                    images={product.images || [product.image]} 
                    productName={product.name}
                    className={`${viewMode === 'list' ? 'w-48 h-48' : 'h-60'}`}
                  >
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-1">
                      {product.isNew && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
                          NEW
                        </span>
                      )}
                      {product.isSale && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                          SALE
                        </span>
                      )}
                      {product.discountPrice && product.regularPrice && product.discountPrice < product.regularPrice && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                          {Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100)}% OFF
                        </span>
                      )}
                      {/* Display applied discount names */}
                      {product.appliedDiscounts && product.appliedDiscounts.length > 0 && (
                        <div className="flex flex-col space-y-1">
                          {product.appliedDiscounts.slice(0, 2).map((discount, idx) => {
                            const now = new Date();
                            const startDate = new Date(discount.discountId?.startDate || discount.startDate);
                            const endDate = new Date(discount.discountId?.endDate || discount.endDate);
                            const isActive = now >= startDate && now <= endDate;
                            const isUpcoming = now < startDate;
                            
                            return (
                              <span 
                                key={idx} 
                                className={`px-2 py-1 text-white text-xs font-semibold rounded ${
                                  isActive ? 'bg-green-500' : 
                                  isUpcoming ? 'bg-blue-500' : 'bg-gray-500'
                                }`}
                                title={
                                  isActive ? 'Active discount' : 
                                  isUpcoming ? `Starts ${startDate.toLocaleDateString()}` : 
                                  'Expired discount'
                                }
                              >
                                {discount.discountName || discount.discountId?.name}
                                {isUpcoming && ' (Upcoming)'}
                              </span>
                            );
                          })}
                          {product.appliedDiscounts.length > 2 && (
                            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded">
                              +{product.appliedDiscounts.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </ProductImageSlideshow>

                  {/* Product Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    {/* Header with title and rating */}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <h3 className="font-semibold text-forest-green-800 group-hover:text-forest-green-600 transition-colors text-base leading-tight">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex items-center ml-2">
                        {product.rating ? (
                          <>
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="ml-1 text-xs text-forest-green-600">{product.rating}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Description - Compact */}
                    <div className="mb-0.5 h-10 overflow-hidden">
                      {product.description && (
                        <p className="text-sm text-forest-green-500 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Features - Compact */}
                    <div className="flex flex-wrap gap-1 mb-0.5 h-6 overflow-hidden">
                      {(product.features || []).slice(0, 2).map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-forest-green-100 text-forest-green-700 text-xs rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Details - Compact */}
                    <div className="mb-0.5 h-4">
                      {product.size && (
                        <div className="text-xs text-forest-green-600">
                          <span className="font-medium">Size:</span> {product.size}
                        </div>
                      )}
                    </div>

                    {/* Price and Low Stock Warning */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-lg font-bold text-forest-green-800">
                          ₹{(product.currentPrice || product.discountPrice || product.regularPrice || product.price || 0).toLocaleString()}
                        </span>
                        {(product.currentPrice || product.discountPrice) && product.regularPrice && (product.currentPrice || product.discountPrice) < product.regularPrice ? (
                          <>
                            <span className="text-xs text-forest-green-400 line-through">
                              ₹{(product.regularPrice || 0).toLocaleString()}
                            </span>
                            <span className="text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">
                              {Math.round(((product.regularPrice - (product.currentPrice || product.discountPrice)) / product.regularPrice) * 100)}% OFF
                            </span>
                          </>
                        ) : null}
                      </div>
                      {/* Low Stock Warning - positioned next to price */}
                      {product.stock > 0 && product.lowStockThreshold && product.stock < product.lowStockThreshold && (
                        <span className="text-xs text-red-600 font-medium">{product.stock} left</span>
                      )}
                    </div>

                    {/* Spacer to push button to bottom */}
                    <div className="flex-grow"></div>

                    {/* Add to Cart Button */}
                    <div className="mt-auto">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        disabled={product.stock <= 0}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors w-full text-sm ${
                          product.stock > 0
                            ? 'bg-forest-green-500 text-cream-100 hover:bg-forest-green-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {product.stock > 0 ? (
                          <div className="flex items-center justify-center">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Add to Cart
                          </div>
                        ) : (
                          'Out of Stock'
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
                </Link>
              ))}
              </div>
            )}

            {/* Load More Button and Loading Indicator */}
            {hasMoreProducts && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-forest-green-500 text-cream-100 rounded-lg hover:bg-forest-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cream-100 mr-2"></div>
                      Loading more products...
                    </>
                  ) : (
                    <>
                      <span>Load More Products</span>
                      <span className="ml-2 text-sm opacity-75">({products.length} shown so far)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* End of products message */}
            {!hasMoreProducts && products.length > 0 && (
              <div className="text-center mt-12 py-8 bg-gradient-to-r from-forest-green-50 to-cream-50 rounded-2xl border border-forest-green-100">
                <div className="max-w-md mx-auto">
                  <div className="mb-4">
                    <Logo size="2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-forest-green-800 mb-2">Thank you for choosing us!</h3>
                  <p className="text-forest-green-600 mb-4">
                    We hope you found what you were looking for.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-forest-green-500">
                    <span>Happy Gardening!</span>
                    <span>🌿</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(cart || []).map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'block'
                        }}
                      />
                      <div className="text-4xl hidden">{item.name.charAt(0)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.size}</p>
                        <p className="text-lg font-bold text-green-600">₹{(item.price || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-gray-100 rounded">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">₹{(getCartTotal() || 0).toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (!user) {
                          alert('Please log in to proceed with checkout.')
                          window.location.href = '/login'
                          return
                        }
                        setShowCart(false)
                        setShowCheckout(true)
                      }}
                      className="w-full mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    {(cart || []).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span>₹{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{(getCartTotal() || 0).toLocaleString()}</span>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={shippingAddress.pincode}
                        onChange={(e) => {
                          const validatedPincode = validatePincode(e.target.value);
                          setShippingAddress(prev => ({ ...prev, pincode: validatedPincode }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter pincode (numbers only)"
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
                    Back to Cart
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
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
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

              <div className="space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {(cart || []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₹{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</p>
                          <p className="text-sm text-gray-500">₹{(item.price || 0).toLocaleString()} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Shipping Address
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{shippingAddress.fullName}</p>
                      <p className="text-gray-600">{shippingAddress.address}</p>
                      <p className="text-gray-600">
                        {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                      </p>
                      <p className="text-gray-600">{shippingAddress.country}</p>
                      <p className="text-gray-600">Phone: {shippingAddress.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="mr-2 h-5 w-5" />
                    Payment Method
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 font-bold text-sm">₹</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Cash on Delivery</p>
                        <p className="text-sm text-gray-500">Pay when your order arrives</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">₹{(getCartTotal() || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-gray-900">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">₹0</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">₹{(getCartTotal() || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowOrderSummary(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Checkout
                  </button>
                  <button
                    onClick={confirmOrder}
                    disabled={isProcessingPayment}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? 'Confirming Order...' : 'Confirm Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Slide-in Drawer */}
      <AnimatePresence>
        {showWishlist && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.2,
                ease: "easeInOut"
              }}
              onClick={() => setShowWishlist(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 300,
                mass: 0.8
              }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl z-50 overflow-hidden border-l border-white/20"
            >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-forest-green-50">
                <div className="flex items-center space-x-3">
                  <Heart className="h-6 w-6 text-forest-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">My Wishlist</h2>
                  {wishlist.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-semibold">
                      {wishlist.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {wishlist.length > 0 && (
                    <button
                      onClick={clearWishlist}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Clear All"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowWishlist(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                    <Heart className="h-20 w-20 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Your wishlist is empty</h3>
                    <p className="text-gray-500 mb-6">Start adding products you love to your wishlist!</p>
                    <button
                      onClick={() => setShowWishlist(false)}
                      className="px-6 py-3 bg-forest-green-500 text-white rounded-lg hover:bg-forest-green-600 transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                   <div className="p-6 space-y-4">
                     <AnimatePresence mode="popLayout">
                       {wishlist.map((item, index) => (
                         <motion.div
                           key={item.id || item._id}
                           initial={{ opacity: 0, y: 20, x: 20 }}
                           animate={{ opacity: 1, y: 0, x: 0 }}
                           exit={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
                           transition={{ 
                             delay: index * 0.1,
                             duration: 0.3,
                             ease: "easeOut"
                           }}
                           layout
                           className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                         >
                        <div className="flex space-x-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-forest-green-100 to-forest-green-200 rounded-lg overflow-hidden flex items-center justify-center">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'block'
                                  }}
                                />
                              ) : null}
                              <div className="text-2xl text-forest-green-400 font-semibold hidden">
                                {item.name?.charAt(0) || '?'}
                              </div>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                              {item.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {item.description || 'No description available'}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-forest-green-800">
                                  ₹{(item.currentPrice || item.discountPrice || item.regularPrice || item.price || 0).toLocaleString()}
                                </span>
                                {(item.currentPrice || item.discountPrice) && item.regularPrice && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{(item.regularPrice || 0).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                          {/* Buy Now Button */}
                          <button
                            onClick={() => handleBuyNowFromWishlist(item)}
                            disabled={item.stock <= 0}
                            className={`w-full px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center shadow-md hover:shadow-lg ${
                              item.stock <= 0
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-gradient-to-r from-forest-green-500 to-forest-green-600 text-white hover:from-forest-green-600 hover:to-forest-green-700'
                            }`}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {item.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
                          </button>
                          
                          {/* Secondary Actions */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => addToCart(item)}
                              className="flex-1 px-4 py-2 bg-forest-green-500 text-white rounded-lg hover:bg-forest-green-600 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </button>
                            <button
                              onClick={() => removeFromWishlist(item.id || item._id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {wishlist.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} in wishlist</span>
                    <button
                      onClick={clearWishlist}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Buy All Button */}
                    <button
                      onClick={() => handleBuyAllWishlist()}
                      disabled={wishlist.length === 0}
                      className={`w-full px-4 py-3 rounded-lg transition-all duration-200 font-medium flex items-center justify-center shadow-md hover:shadow-lg ${
                        wishlist.length === 0
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-forest-green-500 to-forest-green-600 text-white hover:from-forest-green-600 hover:to-forest-green-700'
                      }`}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Buy All ({wishlist.length} items)
                    </button>
                    
                    {/* Continue Shopping Button */}
                    <button
                      onClick={() => setShowWishlist(false)}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
  } catch (error) {
    console.error('Store component error:', error)
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Store Component Error</h1>
          <p className="text-red-500 mb-4">Error: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}

export default Store