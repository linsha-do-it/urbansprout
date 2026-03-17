const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');
const Cart = require('../models/Cart');
const VendorProduct = require('../models/VendorProduct');
const { protect } = require('../middlewares/auth');
const { sendOrderConfirmationEmail, sendVendorNewOrderEmail } = require('../utils/emailService');
const notificationService = require('../utils/notificationService');
const VendorUser = require('../models/VendorUser');
const VendorOrder = require('../models/VendorOrder');
const { getHybridRecommendations } = require('../services/knnRecommendationService');
const {
  createRazorpayOrder,
  verifyPayment,
  getCart,
  saveCart,
  getWishlist,
  saveWishlist,
  removeFromWishlist,
  purchaseFromWishlist
} = require('../controllers/storeController');

// Simple in-memory cache for store filters (categories + price range)
let STORE_FILTER_CACHE = {
  categories: null,
  priceRange: null,
  lastUpdated: 0
};

const STORE_FILTER_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedStoreFilters() {
  const now = Date.now();
  if (
    STORE_FILTER_CACHE.categories &&
    STORE_FILTER_CACHE.priceRange &&
    now - STORE_FILTER_CACHE.lastUpdated < STORE_FILTER_TTL_MS
  ) {
    return {
      categories: STORE_FILTER_CACHE.categories,
      priceRange: STORE_FILTER_CACHE.priceRange
    };
  }

  const [categories, priceAgg] = await Promise.all([
    Product.distinct('category', {
      published: true,
      archived: false,
      name: { $not: /^Placeholder for/ }
    }),
    Product.aggregate([
      { $match: { published: true, archived: false } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$regularPrice' },
          maxPrice: { $max: '$regularPrice' }
        }
      }
    ])
  ]);

  const priceRange = priceAgg[0] || { minPrice: 0, maxPrice: 100 };

  STORE_FILTER_CACHE = {
    categories,
    priceRange,
    lastUpdated: now
  };

  return { categories, priceRange };
}

// GET /store - Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      sort = 'name', 
      order = 'asc', 
      minPrice, 
      maxPrice, 
      search,
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object - only show published, non-archived products, exclude placeholders
    const filter = {
      published: true,
      archived: false,
      name: { $not: /^Placeholder for/ }
    };
    
    if (category && category !== 'all') {
      // Handle URL decoding for emoji characters
      const decodedCategory = decodeURIComponent(category);
      filter.category = decodedCategory;
    }
    
    if (minPrice || maxPrice) {
      filter.$or = [
        { regularPrice: {} },
        { discountPrice: {} }
      ];
      
      if (minPrice) {
        filter.$or[0].regularPrice.$gte = parseFloat(minPrice);
        filter.$or[1].discountPrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        filter.$or[0].regularPrice.$lte = parseFloat(maxPrice);
        filter.$or[1].discountPrice.$lte = parseFloat(maxPrice);
      }
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'price') {
      sortObj.regularPrice = order === 'desc' ? -1 : 1;
    } else if (sort === 'name') {
      sortObj.name = order === 'desc' ? -1 : 1;
    } else if (sort === 'rating') {
      sortObj.rating = order === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1; // Default: newest first
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total, filters] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
      getCachedStoreFilters()
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        filters: {
          categories: filters.categories,
          priceRange: filters.priceRange
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Cart Routes (must come before /:id route)
router.get('/cart', protect, getCart);
router.post('/cart', protect, saveCart);

// POST /store/cart/add - Add item to cart
router.post('/cart/add', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity: quantity
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name images regularPrice discountPrice stock category');

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: { items: cart.items }
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
});

// Wishlist Routes (must come before /:id route)
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, saveWishlist);
router.delete('/wishlist', protect, removeFromWishlist);
router.post('/wishlist/purchase', protect, purchaseFromWishlist);

// GET /store/:id - Get single product details
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get kNN-based recommendations (You May Also Like)
    const relatedProducts = await getHybridRecommendations(req.params.id, 6);

    res.json({
      success: true,
      data: {
        product,
        relatedProducts
      }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// POST /store/orders - Create order with hardcoded products
router.post('/orders', protect, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod = 'Cash on Delivery',
      subtotal,
      shipping = 0,
      tax = 0,
      total,
      status = 'pending',
      notes
    } = req.body;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount'
      });
    }

    // Debug: Log items structure
    console.log('Order items received:', JSON.stringify(items, null, 2));

    // Create order with hardcoded products - SIMPLIFIED
    const order = new Order({
      user: req.user._id,
      items: items.map((item, index) => {
        // Simple, safe ID extraction
        const productId = String(item.id || item._id || item.productId || `temp_${Date.now()}_${index}`);
        
        console.log(`Item ${index}: ${item.name} -> productId: ${productId}`);
        
        return {
          productId: productId,
          name: String(item.name || 'Unknown Product'),
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image: String(item.image || '')
        };
      }),
      shippingAddress,
      paymentMethod,
      subtotal: subtotal || total,
      shipping,
      tax,
      total,
      status,
      notes
    });

    await order.save();

    // Reduce stock for all items in the order
    console.log('Reducing stock for order items...');
    for (const item of items) {
      try {
        const productId = item.id || item._id || item.productId;
        const product = await Product.findById(productId);
        
        if (product) {
          if (product.stock < item.quantity) {
            console.warn(`⚠️ Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
          } else {
            const oldStock = product.stock;
            product.stock -= item.quantity;
            await product.save();
            console.log(`✅ Stock reduced for ${product.name}: ${oldStock} -> ${product.stock} (quantity: ${item.quantity})`);
          }
        } else {
          console.warn(`⚠️ Product not found with ID: ${productId}`);
        }
      } catch (stockError) {
        console.error(`❌ Error reducing stock for item ${item.name}:`, stockError);
        // Continue with other items even if one fails
      }
    }

    // Send order confirmation email (only to non-admin users)
    try {
      const user = await User.findById(req.user._id);
      if (user && user.email && user.role !== 'admin') {
        const orderDetails = {
          orderId: order._id.toString().slice(-8),
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          totalAmount: order.total,
          items: order.items.map(item => ({
            name: item.name || 'Plant',
            quantity: item.quantity,
            price: item.price
          })),
          shippingAddress: `${order.shippingAddress.fullName}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state || order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`,
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          paymentMethod: order.paymentMethod || 'Cash on Delivery',
          paymentStatus: order.paymentMethod === 'Cash on Delivery' ? 'Pending - Pay on Delivery' : 'Paid'
        };

        // Send order confirmation email
        await sendOrderConfirmationEmail(user.email, user.name, orderDetails);
        console.log(`✅ Order confirmation email sent to ${user.email} (${user.role})`);
      } else if (user && user.role === 'admin') {
        console.log(`ℹ️ Skipping email for admin user: ${user.email} (${user.role})`);
      } else {
        console.log(`⚠️ Could not send email - user not found or no email: ${req.user._id}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation email:', emailError);
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

  } catch (error) {
    console.error('Order creation error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors}`,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// POST /store/order - Create order (dummy checkout)
router.post('/order', protect, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod = 'Credit Card',
      paymentDetails,
      notes
    } = req.body;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });
    }

    // Calculate shipping and tax (dummy values)
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over ₹50
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    // Create order
    const order = new Order({
      user: req.user._id,
      items: validatedItems,
      shippingAddress,
      paymentMethod,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      notes
    });

    await order.save();

    // Update product stock (in a real app, this would be in a transaction)
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Populate product details for response
    await order.populate('items.product', 'name image');

    res.status(201).json({
      success: true,
      data: {
        order,
        message: 'Order placed successfully!'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// POST /store/vendor-checkout - Create order from vendor storefront (vendor products)
router.post('/vendor-checkout', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'Cash on Delivery' } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      return res.status(400).json({ success: false, message: 'Valid shipping address is required' });
    }
    const vendorProducts = await VendorProduct.find({
      _id: { $in: items.map(i => i.vendorProductId) },
      published: true,
      archived: false
    }).lean();
    const vpMap = new Map(vendorProducts.map(p => [String(p._id), p]));
    const orderItems = [];
    let subtotal = 0;
    for (const it of items) {
      const vp = vpMap.get(String(it.vendorProductId));
      if (!vp) {
        return res.status(400).json({ success: false, message: `Product not found or not available: ${it.vendorProductId}` });
      }
      const qty = Math.max(1, Number(it.quantity) || 1);
      if (vp.stock < qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${vp.name}. Available: ${vp.stock}` });
      }
      orderItems.push({
        productId: String(vp._id),
        name: vp.name,
        price: vp.regularPrice,
        quantity: qty,
        image: Array.isArray(vp.images) && vp.images[0] ? vp.images[0] : ''
      });
      subtotal += vp.regularPrice * qty;
    }
    const shipping = 0;
    const tax = 0;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'India',
        phone: shippingAddress.phone || ''
      },
      paymentMethod: paymentMethod === 'UPI' ? 'UPI' : 'Cash on Delivery',
      subtotal,
      shipping,
      tax,
      total,
      status: 'pending'
    });
    await order.save();

    // Create VendorOrder document(s) – one per vendor that has items in this order
    const vendorToItems = new Map();
    for (const it of order.items) {
      const vp = vpMap.get(String(it.productId));
      if (!vp) continue;
      const vendorId = String(vp.vendor);
      if (!vendorToItems.has(vendorId)) vendorToItems.set(vendorId, []);
      vendorToItems.get(vendorId).push({
        product: vp._id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        image: it.image || ''
      });
    }
    const buyerName = req.user.name || (req.user.toJSON && req.user.toJSON().name) || 'Customer';
    const buyerEmail = req.user.email || (req.user.toJSON && req.user.toJSON().email) || '';
    for (const [vendorId, vendorItems] of vendorToItems) {
      const subtotal = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      await VendorOrder.create({
        order: order._id,
        orderNumber: order.orderNumber,
        vendor: vendorId,
        buyer: req.user._id,
        buyerName,
        buyerEmail,
        items: vendorItems,
        subtotal,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        status: order.status
      });
    }

    for (const it of items) {
      const vp = vpMap.get(String(it.vendorProductId));
      if (vp) {
        const qty = Math.max(1, Number(it.quantity) || 1);
        await VendorProduct.findByIdAndUpdate(it.vendorProductId, { $inc: { stock: -qty } });
      }
    }
    try {
      if (buyerEmail) {
        await sendOrderConfirmationEmail(buyerEmail, buyerName, {
          orderId: order._id.toString().slice(-8),
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          totalAmount: order.total,
          items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          shippingAddress: `${order.shippingAddress.fullName}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`,
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentMethod === 'Cash on Delivery' ? 'Pending - Pay on Delivery' : 'Paid'
        });
      }
    } catch (e) {
      console.error('Vendor order confirmation email failed:', e);
    }
    const vendorIds = [...new Set(vendorProducts.map(p => String(p.vendor)))];
    for (const vid of vendorIds) {
      try {
        const vendor = await VendorUser.findById(vid).select('email name').lean();
        if (vendor && vendor.email) {
          await sendVendorNewOrderEmail(vendor.email, vendor.name || 'Vendor', {
            orderNumber: order.orderNumber,
            items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
            shippingAddress: order.shippingAddress,
            totalAmount: order.total,
            paymentMethod: order.paymentMethod,
            buyerName
          });
        }
        await notificationService.sendNotification(vid, {
          userEmail: vendor?.email,
          type: 'vendor_order',
          title: '📦 New order received',
          message: `Order #${order.orderNumber} – ${order.items.length} item(s), ${order.shippingAddress?.fullName || 'Customer'}. Dispatch to: ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}.`,
          relatedId: order._id,
          relatedModel: 'Order'
        });
      } catch (e) {
        console.error('Vendor notification failed for', vid, e);
      }
    }
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Vendor checkout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error placing order'
    });
  }
});

// GET /store/orders/my - Get user's orders
router.get('/orders/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Razorpay Payment Routes
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);

// Review Routes
// POST /store/reviews - Create a new review
router.post('/reviews', protect, async (req, res) => {
  try {
    const { orderId, productId, rating, comment } = req.body;

    // Validate required fields
    if (!orderId || !productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, Product ID, and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Verify the order belongs to the user and is delivered
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: 'delivered'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not delivered'
      });
    }

    // Check if the product was in this order
    const orderItem = order.items.find(item => 
      item.productId === productId || item.product?.toString() === productId
    );

    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'Product was not part of this order'
      });
    }

    // Check if user already reviewed this product for this order
    const existingReview = await Review.findOne({
      user: req.user._id,
      order: orderId,
      productId: productId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      });
    }

    // Create the review
    const review = new Review({
      user: req.user._id,
      order: orderId,
      productId: productId,
      productName: orderItem.name,
      rating: rating,
      comment: comment || '',
      verifiedPurchase: true
    });

    await review.save();

    // Populate user details for response
    await review.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review }
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
});

// GET /store/reviews/:productId - Get reviews for a product
router.get('/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      productId: productId,
      status: 'approved'
    })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments({
      productId: productId,
      status: 'approved'
    });

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { productId: productId, status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    const reviewCount = avgRatingResult.length > 0 ? avgRatingResult[0].count : 0;

    const response = {
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalReviews / limit),
          total: totalReviews
        },
        summary: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviewCount
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// GET /store/reviews/user/my - Get user's reviews
router.get('/reviews/user/my', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('order', 'orderNumber createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { reviews }
    });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

module.exports = router;