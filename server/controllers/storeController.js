const Plant = require('../models/Plant');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const { sendOrderConfirmationEmail, sendPaymentConfirmationEmail, sendOrderStatusUpdateEmail } = require('../utils/emailService');
const notificationService = require('../utils/notificationService');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RH9Kx0Ibt9neI6',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'CjIJyaqKbJzhUNR9J0zu4KjI'
});

// Validate Razorpay configuration
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ Razorpay credentials not found in environment variables. Using fallback test credentials.');
} else {
  console.log('✅ Razorpay credentials loaded from environment variables');
}

// @desc    Get all plants
// @route   GET /api/store/plants
// @access  Public
const getAllPlants = asyncHandler(async (req, res) => {
  const { 
    category, 
    difficulty, 
    light, 
    features, 
    minPrice, 
    maxPrice, 
    search, 
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  const { page, limit, skip } = req.pagination;

  // Build query
  let query = { isActive: true };

  if (category) {
    query.category = category.toLowerCase();
  }

  if (difficulty) {
    query.difficulty = difficulty.toLowerCase();
  }

  if (light) {
    query['careInstructions.light'] = light.toLowerCase();
  }

  if (features) {
    const featureArray = Array.isArray(features) ? features : [features];
    query.features = { $in: featureArray.map(f => f.toLowerCase()) };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { scientificName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Get plants with pagination
  const plants = await Plant.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count for pagination
  const total = await Plant.countDocuments(query);

  res.json({
    success: true,
    data: {
      plants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get single plant
// @route   GET /api/store/plants/:id
// @access  Public
const getPlant = asyncHandler(async (req, res, next) => {
  const plant = await Plant.findById(req.params.id)
    .populate('reviews.user', 'name avatar');

  if (!plant || !plant.isActive) {
    return next(new AppError('Plant not found', 404));
  }

  res.json({
    success: true,
    data: { plant }
  });
});

// @desc    Get plant by slug
// @route   GET /api/store/plants/slug/:slug
// @access  Public
const getPlantBySlug = asyncHandler(async (req, res, next) => {
  const plant = await Plant.findOne({ 'seo.slug': req.params.slug, isActive: true })
    .populate('reviews.user', 'name avatar');

  if (!plant) {
    return next(new AppError('Plant not found', 404));
  }

  res.json({
    success: true,
    data: { plant }
  });
});

// @desc    Get featured plants
// @route   GET /api/store/plants/featured
// @access  Public
const getFeaturedPlants = asyncHandler(async (req, res) => {
  const plants = await Plant.find({ isActive: true, isFeatured: true })
    .sort({ 'rating.average': -1 })
    .limit(8)
    .lean();

  res.json({
    success: true,
    data: { plants }
  });
});

// @desc    Get plant recommendations based on user preferences
// @route   GET /api/store/recommendations
// @access  Private
const getRecommendations = asyncHandler(async (req, res) => {
  const user = req.user;
  const { lightLevel, wateringFrequency, spaceType, experience, petFriendly, airPurifying } = user.preferences;

  let query = { isActive: true };

  // Build query based on preferences
  if (lightLevel) {
    query['careInstructions.light'] = { $in: [lightLevel, 'low-medium', 'medium-high'] };
  }

  if (experience) {
    if (experience === 'beginner') {
      query.difficulty = { $in: ['beginner'] };
    } else if (experience === 'intermediate') {
      query.difficulty = { $in: ['beginner', 'intermediate'] };
    }
    // Advanced users can handle any difficulty
  }

  if (petFriendly) {
    query.features = { $in: ['pet-safe'] };
  }

  if (airPurifying) {
    query.features = { $in: ['air-purifying'] };
  }

  // Get recommended plants
  const plants = await Plant.find(query)
    .sort({ 'rating.average': -1, isFeatured: -1 })
    .limit(12)
    .lean();

  res.json({
    success: true,
    data: { 
      plants,
      basedOn: user.preferences
    }
  });
});

// @desc    Add plant review
// @route   POST /api/store/plants/:id/reviews
// @access  Private
const addReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError('Rating must be between 1 and 5', 400));
  }

  const plant = await Plant.findById(req.params.id);

  if (!plant || !plant.isActive) {
    return next(new AppError('Plant not found', 404));
  }

  // Check if user already reviewed this plant
  const existingReview = plant.reviews.find(
    review => review.user.toString() === req.user._id.toString()
  );

  if (existingReview) {
    return next(new AppError('You have already reviewed this plant', 400));
  }

  // Add review
  const review = {
    user: req.user._id,
    rating,
    comment: comment ? comment.trim() : ''
  };

  plant.reviews.push(review);
  plant.updateRating();
  await plant.save();

  await plant.populate('reviews.user', 'name avatar');

  const newReview = plant.reviews[plant.reviews.length - 1];

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: { review: newReview }
  });
});

// @desc    Get plant categories
// @route   GET /api/store/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Plant.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: { categories }
  });
});

// @desc    Create new order
// @route   POST /api/store/orders
// @access  Private
const createOrder = asyncHandler(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    payment,
    shipping,
    notes,
    coupon
  } = req.body;

  // Validate and calculate pricing
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const plant = await Plant.findById(item.plant);
    
    if (!plant || !plant.isActive) {
      return next(new AppError(`Plant with ID ${item.plant} not found or inactive`, 400));
    }

    if (plant.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for ${plant.name}. Available: ${plant.stock}`, 400));
    }

    const itemTotal = plant.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      plant: plant._id,
      quantity: item.quantity,
      price: plant.price,
      size: item.size || plant.size,
      potSize: item.potSize || plant.potSize
    });

    // Update plant stock
    plant.stock -= item.quantity;
    await plant.save();
  }

  // Calculate tax and shipping (simplified)
  const tax = subtotal * 0.08; // 8% tax
  const shippingCost = subtotal > 50 ? 0 : 9.99; // Free shipping over ₹50
  let discount = 0;

  // Apply coupon if provided
  if (coupon && coupon.code) {
    // Simple coupon validation (in real app, you'd have a Coupon model)
    if (coupon.code === 'WELCOME10') {
      discount = coupon.type === 'percentage' ? subtotal * 0.1 : 10;
    }
  }

  const total = subtotal + tax + shippingCost - discount;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    billingAddress,
    pricing: {
      subtotal,
      tax,
      shipping: shippingCost,
      discount,
      total
    },
    payment: {
      method: payment.method,
      status: 'pending'
    },
    shipping: {
      method: shipping.method || 'standard'
    },
    notes,
    coupon
  });

  await order.populate('items.product', 'name images');

  // Send order confirmation email for COD orders (only to non-admin users)
  try {
    const user = await User.findById(req.user._id);
    if (user && user.email && user.role !== 'admin') {
      const orderDetails = {
        orderId: order._id.toString().slice(-8),
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        totalAmount: order.total,
        items: order.items.map(item => ({
          name: item.name || item.product?.name || 'Plant',
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: `${order.shippingAddress.fullName}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state || order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 7 days from now
        paymentMethod: order.paymentMethod || 'Cash on Delivery',
        paymentStatus: 'Pending - Pay on Delivery'
      };

      // Send order confirmation email
      await sendOrderConfirmationEmail(user.email, user.name, orderDetails);
      console.log(`✅ COD order confirmation email sent to ${user.email} (${user.role})`);
    } else if (user && user.role === 'admin') {
      console.log(`ℹ️ Skipping email for admin user: ${user.email} (${user.role})`);
    } else {
      console.log(`⚠️ Could not send email - user not found or no email: ${req.user._id}`);
    }
  } catch (emailError) {
    console.error('❌ Failed to send COD order confirmation email:', emailError);
    // Don't fail the order creation if email fails
  }

  // Send order placement notification
  try {
    await notificationService.sendNotification(req.user._id, {
      userEmail: req.user.email,
      type: 'order_placed',
      title: '🛒 Order Placed Successfully!',
      message: `Your order #${order.orderNumber} has been placed successfully!`,
      relatedId: order._id,
      relatedModel: 'Order'
    });
    console.log(`✅ Order placement notification sent to ${req.user.email}`);
  } catch (notificationError) {
    console.error('❌ Failed to send order placement notification:', notificationError);
    // Don't fail the order creation if notification fails
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });

  // Emit real-time event for inventory insights
  const io = req.app.get('io');
  if (io) {
    io.emit('orderCreated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      itemsCount: order.items.length,
      timestamp: new Date()
    });
    console.log('📡 Emitted orderCreated event for real-time updates');
  }
});

// @desc    Get user orders
// @route   GET /api/store/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;

  const orders = await Order.find({ user: req.user._id })
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get single order
// @route   GET /api/store/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('items.product', 'name images scientificName');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.json({
    success: true,
    data: { order }
  });
});

// @desc    Cancel order
// @route   PUT /api/store/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }

  // Restore plant stock
  for (const item of order.items) {
    const plant = await Plant.findById(item.plant);
    if (plant) {
      plant.stock += item.quantity;
      await plant.save();
    }
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason || 'Cancelled by customer';
  
  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order }
  });
});

// @desc    Create Razorpay order
// @route   POST /api/store/create-order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;

  console.log('Creating Razorpay order with:', { amount, currency, receipt, notes });
  console.log('Razorpay config:', {
    key_id: razorpay.key_id,
    key_secret: razorpay.key_secret ? '***' + razorpay.key_secret.slice(-4) : 'undefined'
  });

  if (!amount || amount <= 0) {
    return next(new AppError('Invalid amount', 400));
  }

  if (!razorpay.key_id || !razorpay.key_secret) {
    console.error('Razorpay credentials not configured');
    return next(new AppError('Payment gateway not configured', 500));
  }

  try {
    // Clean notes to avoid 20KB limit - remove large image data
    const cleanNotes = {};
    if (notes) {
      Object.keys(notes).forEach(key => {
        if (typeof notes[key] === 'string' && notes[key].length > 1000) {
          // Skip large strings (like base64 images)
          cleanNotes[key] = 'large_data_removed';
        } else if (typeof notes[key] === 'object') {
          // Clean nested objects
          cleanNotes[key] = {};
          Object.keys(notes[key]).forEach(nestedKey => {
            if (typeof notes[key][nestedKey] === 'string' && notes[key][nestedKey].length > 1000) {
              cleanNotes[key][nestedKey] = 'large_data_removed';
            } else {
              cleanNotes[key][nestedKey] = notes[key][nestedKey];
            }
          });
        } else {
          cleanNotes[key] = notes[key];
        }
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: cleanNotes
    };

    console.log('Razorpay order options:', options);

    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created successfully:', order);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      response: error.response?.data
    });
    return next(new AppError(`Failed to create payment order: ${error.message}`, 500));
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/store/verify-payment
// @access  Private
const verifyPayment = asyncHandler(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderData
  } = req.body;

  console.log('🔍 Payment verification request:', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature: razorpay_signature ? '***' + razorpay_signature.slice(-4) : 'undefined',
    orderData: orderData ? 'present' : 'undefined'
  });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.error('❌ Missing payment verification data');
    return next(new AppError('Missing payment verification data', 400));
  }

  if (!orderData) {
    console.error('❌ Missing order data');
    return next(new AppError('Missing order data', 400));
  }

  try {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Invalid payment signature');
      console.error('Expected:', expectedSignature);
      console.error('Received:', razorpay_signature);
      return next(new AppError('Invalid payment signature', 400));
    }

    console.log('✅ Payment signature verified successfully');

    // Validate products and reduce stock before creating order
    const Product = require('../models/Product');
    const validatedItems = [];
    const stockReductions = []; // Track stock reductions for rollback if needed
    
    try {
      for (const item of orderData.items) {
        const productId = item.id || item._id || item.productId;
        const product = await Product.findById(productId);
        
        if (!product) {
          return next(new AppError(`Product not found: ${productId}`, 400));
        }
        
        if (product.stock < item.quantity) {
          return next(new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`, 400));
        }
        
        // Reduce stock immediately after payment confirmation
        const oldStock = product.stock;
        product.stock -= item.quantity;
        await product.save();
        
        // Track stock reduction for potential rollback
        stockReductions.push({
          productId: productId,
          productName: product.name,
          oldStock: oldStock,
          newStock: product.stock,
          quantity: item.quantity
        });
        
        console.log(`✅ Stock reduced for ${product.name}: ${oldStock} -> ${product.stock}`);
        
        validatedItems.push({
          productId: productId,
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          name: String(item.name || product.name),
          image: String(item.image || '')
        });
      }
    } catch (stockError) {
      // Rollback stock reductions if order creation fails
      console.error('❌ Error during stock reduction, rolling back...', stockError);
      for (const reduction of stockReductions) {
        try {
          await Product.findByIdAndUpdate(reduction.productId, { stock: reduction.oldStock });
          console.log(`🔄 Stock rolled back for ${reduction.productName}: ${reduction.newStock} -> ${reduction.oldStock}`);
        } catch (rollbackError) {
          console.error(`❌ Failed to rollback stock for ${reduction.productName}:`, rollbackError);
        }
      }
      return next(new AppError('Failed to update product stock', 500));
    }

    // Create order in database
    const order = await Order.create({
      user: req.user._id,
      items: validatedItems,
      shippingAddress: {
        fullName: orderData.shippingAddress.fullName,
        address: orderData.shippingAddress.address,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        postalCode: orderData.shippingAddress.pincode, // Map pincode to postalCode
        country: orderData.shippingAddress.country || 'India', // Default to India
        phone: orderData.shippingAddress.phone
      },
      paymentMethod: 'UPI', // Map online payment to UPI
      subtotal: orderData.total,
      shipping: 0,
      tax: 0,
      total: orderData.total,
      status: 'processing', // Payment confirmed, order is being processed
      notes: `Razorpay Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`,
      analyticsTracked: false // Will be set to true when delivered
    });

    // Get user details for email
    const user = await User.findById(req.user._id);

    // Send order confirmation email (only to non-admin users)
    try {
      if (user && user.email && user.role !== 'admin') {
        const orderDetails = {
          orderId: order._id.toString().slice(-8),
          orderDate: order.createdAt,
          totalAmount: order.total,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          shippingAddress: `${order.shippingAddress.fullName}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() // 7 days from now
        };

        // Send order confirmation email
        await sendOrderConfirmationEmail(user.email, user.name, orderDetails);
        console.log(`✅ Order confirmation email sent to ${user.email} (${user.role})`);
      } else if (user && user.role === 'admin') {
        console.log(`ℹ️ Skipping email for admin user: ${user.email} (${user.role})`);
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail payment if email fails
    }

    // Send order placement notification
    try {
      await notificationService.sendNotification(req.user._id, {
        userEmail: req.user.email,
        type: 'order_placed',
        title: '🛒 Order Placed Successfully!',
        message: `Your order #${order.orderNumber} has been placed successfully!`,
        relatedId: order._id,
        relatedModel: 'Order'
      });
      console.log(`✅ Order placement notification sent to ${req.user.email}`);
    } catch (notificationError) {
      console.error('❌ Failed to send order placement notification:', notificationError);
      // Don't fail the payment if notification fails
    }

    // Send payment confirmation email (only to non-admin users)
    try {
      if (user && user.email && user.role !== 'admin') {
        const paymentDetails = {
          transactionId: razorpay_payment_id,
          paymentDate: new Date(),
          paymentMethod: 'UPI',
          amount: order.total,
          orderId: order._id.toString().slice(-8)
        };

        // Send payment confirmation email
        await sendPaymentConfirmationEmail(user.email, user.name, paymentDetails);
        console.log(`✅ Payment confirmation email sent to ${user.email} (${user.role})`);
      } else if (user && user.role === 'admin') {
        console.log(`ℹ️ Skipping payment confirmation email for admin user: ${user.email} (${user.role})`);
      }
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
      // Don't fail payment if email fails
    }

    res.json({
      success: true,
      message: 'Payment verified and order created successfully',
      data: { order }
    });

    // Emit real-time event for inventory insights
    const io = req.app.get('io');
    if (io) {
      io.emit('orderCreated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        itemsCount: order.items.length,
        timestamp: new Date()
      });
      console.log('📡 Emitted orderCreated event for real-time updates');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return next(new AppError('Payment verification failed', 500));
  }
});

// @desc    Cancel order (for products)
// @route   PUT /api/store/orders/:id/cancel
// @access  Private
const cancelProductOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const Product = require('../models/Product');

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (!['pending', 'processing'].includes(order.status)) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }

  // Restore product stock
  for (const item of order.items) {
    const productId = item.productId || item.product;
    const product = await Product.findById(productId);
    if (product) {
      product.stock += item.quantity;
      await product.save();
      console.log(`🔄 Stock restored for ${product.name}: ${product.stock - item.quantity} -> ${product.stock}`);
    }
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason || 'Cancelled by customer';
  
  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully and stock restored',
    data: { order }
  });
});

// @desc    Get user cart
// @route   GET /api/store/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images regularPrice discountPrice stock category');
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    res.json({
      success: true,
      data: cart.items
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.json({
      success: true,
      data: [] // Return empty array on error
    });
  }
});

// @desc    Save user cart
// @route   POST /api/store/cart
// @access  Private
const saveCart = asyncHandler(async (req, res) => {
  try {
    const { items } = req.body;
    
    // Validate items
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }
    
    // Normalize to { product: ObjectId, quantity }
    const normalizedItems = items.map(item => ({
      product: (item.product || item.productId || item.id),
      quantity: item.quantity || 1
    }));

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          items: normalizedItems,
          updatedAt: new Date()
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    ).populate('items.product', 'name images regularPrice discountPrice stock category description sku');
    
    res.json({
      success: true,
      message: 'Cart saved successfully',
      data: { items: cart.items }
    });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving cart',
      error: error.message
    });
  }
});

// @desc    Get user wishlist
// @route   GET /api/store/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items.product', 'name images regularPrice discountPrice stock category description sku');
    
    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }
    
    res.json({
      success: true,
      data: wishlist.items
    });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.json({
      success: true,
      data: [] // Return empty array on error
    });
  }
});

// @desc    Save user wishlist
// @route   POST /api/store/wishlist
// @access  Private
const saveWishlist = asyncHandler(async (req, res) => {
  try {
    const { items } = req.body;
    
    // Validate items
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }
    
    // Normalize to { product: ObjectId }
    const normalizedItems = items.map(item => ({
      product: (item.product || item.productId || item.id)
    }));

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          items: normalizedItems,
          updatedAt: new Date()
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    ).populate('items.product', 'name images regularPrice discountPrice stock category description sku');
    
    res.json({
      success: true,
      message: 'Wishlist saved successfully',
      data: { items: wishlist.items }
    });
  } catch (error) {
    console.error('Error saving wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving wishlist',
      error: error.message
    });
  }
});

// @desc    Remove item from wishlist
// @route   DELETE /api/store/wishlist
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Remove the item from wishlist
    wishlist.items = wishlist.items.filter(item => 
      item.product.toString() !== productId.toString()
    );
    
    await wishlist.save();
    
    res.json({
      success: true,
      message: 'Item removed from wishlist successfully',
      data: { items: wishlist.items }
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist',
      error: error.message
    });
  }
});

// @desc    Purchase items from wishlist
// @route   POST /api/store/wishlist/purchase
// @access  Private
const purchaseFromWishlist = asyncHandler(async (req, res, next) => {
  const { items, shippingAddress, paymentMethod = 'Credit Card' } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('No items provided for purchase', 400));
  }

  if (!shippingAddress) {
    return next(new AppError('Shipping address is required', 400));
  }

  // Validate and calculate pricing
  let subtotal = 0;
  const orderItems = [];
  const stockReductions = []; // Track stock reductions for rollback if needed

  try {
    for (const item of items) {
      const productId = item.id || item._id || item.productId;
      const product = await Product.findById(productId);
      
      if (!product) {
        return next(new AppError(`Product not found: ${productId}`, 400));
      }
      
      if (!product.published || product.archived) {
        return next(new AppError(`Product ${product.name} is not available for purchase`, 400));
      }
      
      if (product.stock < item.quantity) {
        return next(new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`, 400));
      }
      
      // Calculate price (use discount price if available, otherwise regular price)
      const currentPrice = product.appliedDiscount?.calculatedPrice || product.discountPrice || product.regularPrice;
      const itemTotal = currentPrice * item.quantity;
      subtotal += itemTotal;
      
      // Track stock reduction for potential rollback
      const oldStock = product.stock;
      product.stock -= item.quantity;
      await product.save();
      
      stockReductions.push({
        productId: productId,
        productName: product.name,
        oldStock: oldStock,
        newStock: product.stock,
        quantity: item.quantity
      });
      
      console.log(`✅ Stock reduced for ${product.name}: ${oldStock} -> ${product.stock}`);
      
      orderItems.push({
        product: product._id,
        productId: productId,
        quantity: Number(item.quantity || 1),
        price: Number(currentPrice),
        name: String(product.name),
        image: String(product.images[0] || '')
      });
    }
  } catch (stockError) {
    // Rollback stock reductions if order creation fails
    console.error('❌ Error during stock reduction, rolling back...', stockError);
    for (const reduction of stockReductions) {
      try {
        await Product.findByIdAndUpdate(reduction.productId, { stock: reduction.oldStock });
        console.log(`🔄 Stock rolled back for ${reduction.productName}: ${reduction.newStock} -> ${reduction.oldStock}`);
      } catch (rollbackError) {
        console.error(`❌ Failed to rollback stock for ${reduction.productName}:`, rollbackError);
      }
    }
    return next(new AppError('Failed to update product stock', 500));
  }

  // Calculate tax and shipping
  const tax = subtotal * 0.08; // 8% tax
  const shippingCost = subtotal > 50 ? 0 : 9.99; // Free shipping over ₹50
  const total = subtotal + tax + shippingCost;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress: {
      fullName: shippingAddress.fullName,
      address: shippingAddress.address,
      city: shippingAddress.city,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      phone: shippingAddress.phone
    },
    paymentMethod: paymentMethod,
    subtotal: subtotal,
    shipping: shippingCost,
    tax: tax,
    total: total,
    status: 'pending',
    statusHistory: [{
      status: 'pending',
      note: 'Order created from wishlist',
      updatedBy: req.user._id,
      updatedAt: new Date()
    }]
  });

  // Keep items in wishlist - don't remove them after purchase
  console.log(`✅ Order created from wishlist - items remain in wishlist for future reference`);

  // Populate order with product details
  await order.populate('items.product', 'name images category');

  // Emit real-time events for admin dashboard
  const io = req.app.get('io');
  if (io) {
    io.emit('orderCreated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      itemsCount: order.items.length,
      timestamp: new Date(),
      source: 'wishlist'
    });
    
    // Emit stock update events for each product
    for (const item of orderItems) {
      io.emit('stockUpdated', {
        productId: item.productId,
        productName: item.name,
        oldStock: stockReductions.find(r => r.productId === item.productId)?.oldStock || 0,
        newStock: stockReductions.find(r => r.productId === item.productId)?.newStock || 0,
        quantitySold: item.quantity,
        timestamp: new Date()
      });
    }
    
    console.log('✅ Real-time events emitted for wishlist purchase');
  }

  // Send order confirmation email
  try {
    const user = await User.findById(req.user._id);
    if (user && user.email && user.role !== 'admin') {
      const orderDetails = {
        orderId: order._id.toString().slice(-8),
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        totalAmount: order.total,
        items: order.items.map(item => ({
          name: item.name || item.product?.name || 'Product',
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: `${order.shippingAddress.fullName}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        paymentMethod: order.paymentMethod,
        paymentStatus: 'Pending'
      };

      // Send email notification
      await emailService.sendOrderConfirmationEmail(user.email, orderDetails);
      console.log(`✅ Order confirmation email sent to ${user.email}`);
    }
  } catch (emailError) {
    console.error('❌ Error sending order confirmation email:', emailError);
    // Don't fail the order if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully from wishlist',
    data: {
      order: order,
      purchasedItems: items.length,
      itemsRemainInWishlist: true
    }
  });
});

module.exports = {
  getAllPlants,
  getPlant,
  getPlantBySlug,
  getFeaturedPlants,
  getRecommendations,
  addReview,
  getCategories,
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  cancelProductOrder,
  createRazorpayOrder,
  verifyPayment,
  getCart,
  saveCart,
  getWishlist,
  saveWishlist,
  removeFromWishlist,
  purchaseFromWishlist
};