const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const VendorProduct = require('../models/VendorProduct');
const VendorOrder = require('../models/VendorOrder');
const Order = require('../models/Order');
const Review = require('../models/Review');
const VendorUser = require('../models/VendorUser');
const Discount = require('../models/Discount');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const razorpayX = require('../utils/razorpayX');
const upiEncrypt = require('../utils/upiEncrypt');
const QRCode = require('qrcode');

if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
}

// Ensure the current request user is a vendor
const requireVendor = (req) => {
  if (!req.user || req.user.role !== 'vendor') {
    throw new AppError('Vendor access only', 403);
  }
};

// @desc    Upload product image to Cloudinary, return URL
// @route   POST /api/vendor/upload
// @access  Private (Vendor)
const uploadProductImage = asyncHandler(async (req, res) => {
  requireVendor(req);
  if (!req.file || !req.file.buffer) {
    throw new AppError('No image file provided', 400);
  }
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(req.file.mimetype)) {
    throw new AppError('Invalid file type. Use JPEG, PNG or WebP.', 400);
  }
  if (!process.env.CLOUDINARY_URL) {
    throw new AppError('Image upload is not configured', 503);
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'urbansprout/vendor-products' },
      (err, result) => {
        if (err) {
          reject(new AppError(err.message || 'Upload failed', 500));
          return;
        }
        if (!result || !result.secure_url) {
          reject(new AppError('Upload failed', 500));
          return;
        }
        res.status(200).json({ success: true, url: result.secure_url });
        resolve();
      }
    );
    const stream = Readable.from(req.file.buffer);
    stream.pipe(uploadStream);
  });
});

// @desc    Update storefront header image URL (image is uploaded via same endpoint as product images: POST /api/vendor/upload)
// @route   PATCH /api/vendor/storefront-header
// @access  Private (Vendor)
const updateStorefrontHeader = asyncHandler(async (req, res) => {
  requireVendor(req);
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new AppError('Image URL is required', 400);
  }
  await VendorUser.findByIdAndUpdate(req.user._id, {
    storefrontHeaderImage: url.trim()
  });
  res.status(200).json({ success: true, url: url.trim() });
});

// Helper: compute vendor rating from their products' ratings
const computeVendorRatingFromProducts = (products) => {
  if (!products || products.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0
    };
  }

  let weightedSum = 0;
  let reviewCount = 0;

  for (const product of products) {
    const rating = product.rating || 0;
    const count = product.reviews || 0;
    weightedSum += rating * count;
    reviewCount += count;
  }

  if (reviewCount === 0) {
    return {
      averageRating: 0,
      totalReviews: 0
    };
  }

  return {
    averageRating: Number((weightedSum / reviewCount).toFixed(1)),
    totalReviews: reviewCount
  };
};

// @desc    Get current vendor's storefront (profile + products)
// @route   GET /api/vendor/store/me
// @access  Private (Vendor)
const getMyStorefront = asyncHandler(async (req, res) => {
  requireVendor(req);

  const vendorId = req.user._id;

  // Basic vendor profile info
  const vendorProfile = {
    id: vendorId,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar || null,
    storefrontHeaderImage: req.user.storefrontHeaderImage || null,
    description: req.user.bio || '',
    location: req.user.location || '',
    createdAt: req.user.createdAt
  };

  const { page = 1, limit = 20, skip = 0 } = req.pagination || {
    page: 1,
    limit: 20,
    skip: 0
  };

  const baseQuery = { vendor: vendorId, archived: false };

  const [products, total] = await Promise.all([
    VendorProduct.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VendorProduct.countDocuments(baseQuery)
  ]);

  const ratingSummary = computeVendorRatingFromProducts(products);

  res.json({
    success: true,
    data: {
      vendor: {
        ...vendorProfile,
        rating: ratingSummary.averageRating,
        reviewCount: ratingSummary.totalReviews
      },
      products,
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

// @desc    Get public storefront for a vendor
// @route   GET /api/vendor/store/:vendorId
// @access  Public
const getVendorStorefront = asyncHandler(async (req, res, next) => {
  const { vendorId } = req.params;

  const vendor = await VendorUser.findById(vendorId)
    .select('name email avatar storefrontHeaderImage status createdAt');

  if (!vendor || vendor.status !== 'active') {
    return next(new AppError('Vendor not found', 404));
  }

  const products = await VendorProduct.find({
    vendor: vendor._id,
    archived: false,
    published: true
  })
    .sort({ createdAt: -1 })
    .lean();

  const ratingSummary = computeVendorRatingFromProducts(products);

  res.json({
    success: true,
    data: {
      vendor: {
        id: vendor._id,
        name: vendor.name,
        avatar: vendor.avatar || null,
        storefrontHeaderImage: vendor.storefrontHeaderImage || null,
        rating: ratingSummary.averageRating,
        reviewCount: ratingSummary.totalReviews,
        createdAt: vendor.createdAt
      },
      products
    }
  });
});

// @desc    List all vendors with published products (public, for store directory)
// @route   GET /api/vendor/list
// @access  Public
const listVendors = asyncHandler(async (req, res) => {
  const stats = await VendorProduct.aggregate([
    { $match: { published: true, archived: false } },
    {
      $group: {
        _id: '$vendor',
        productCount: { $sum: 1 },
        totalWeightedRating: { $sum: { $multiply: ['$rating', { $ifNull: ['$reviews', 0] }] } },
        totalReviews: { $sum: { $ifNull: ['$reviews', 0] } }
      }
    },
    { $match: { productCount: { $gt: 0 } } }
  ]);

  const vendorIds = stats.map((s) => s._id);
  if (vendorIds.length === 0) {
    return res.json({ success: true, data: { vendors: [] } });
  }

  const vendors = await VendorUser.find({ _id: { $in: vendorIds }, status: 'active' })
    .select('_id name avatar')
    .lean();

  const statsMap = new Map(stats.map((s) => [s._id.toString(), s]));

  const list = vendors.map((v) => {
    const s = statsMap.get(v._id.toString());
    const totalReviews = (s && s.totalReviews) || 0;
    const rating = totalReviews > 0 && s
      ? Number((s.totalWeightedRating / totalReviews).toFixed(1))
      : 0;
    return {
      id: v._id,
      name: v.name || 'Vendor',
      avatar: v.avatar || null,
      productCount: (s && s.productCount) || 0,
      rating,
      reviewCount: totalReviews
    };
  });

  res.json({ success: true, data: { vendors: list } });
});

// @desc    Get vendor's products
// @route   GET /api/vendor/products
// @access  Private (Vendor)
const getMyProducts = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendorId = req.user._id;

  const { page, limit, skip } = req.pagination || {
    page: 1,
    limit: 20,
    skip: 0
  };

  const baseQuery = { vendor: vendorId, archived: false };

  const [products, total] = await Promise.all([
    VendorProduct.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VendorProduct.countDocuments(baseQuery)
  ]);

  res.json({
    success: true,
    data: {
      products,
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

// Helper: normalize category input from vendor
const normalizeCategory = (category) => {
  if (!category) return null;
  const value = String(category).toLowerCase();
  switch (value) {
    case 'fruit':
    case 'fruits':
      return 'fruit';
    case 'vegetable':
    case 'vegetables':
      return 'vegetable';
    case 'fertilizer':
    case 'fertilisers':
      return 'fertilizer';
    case 'plant':
    case 'plants':
      return 'plant';
    case 'hamper':
    case 'hampers':
      return 'hamper';
    default:
      return value;
  }
};

// Helper: generate a simple SKU for vendor products
const generateVendorSku = (vendorId) => {
  const suffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `VND-${String(vendorId).slice(-4).toUpperCase()}-${suffix}`;
};

// @desc    Create a new product for current vendor
// @route   POST /api/vendor/products
// @access  Private (Vendor)
const createProduct = asyncHandler(async (req, res, next) => {
  requireVendor(req);
  const vendorId = req.user._id;

  const {
    title,
    name,
    description,
    price,
    stock,
    category,
    images
  } = req.body;

  const productName = (title || name || '').trim();

  if (!productName) {
    return next(new AppError('Product title is required', 400));
  }

  if (description && String(description).length > 2000) {
    return next(new AppError('Description is too long (max 2000 characters)', 400));
  }

  if (price == null || isNaN(Number(price)) || Number(price) < 0) {
    return next(new AppError('Valid price is required', 400));
  }

  if (stock == null || isNaN(Number(stock)) || Number(stock) < 0) {
    return next(new AppError('Valid stock quantity is required', 400));
  }

  const normalizedCategory = normalizeCategory(category);
  if (!normalizedCategory) {
    return next(new AppError('Category is required', 400));
  }

  const imageArray = Array.isArray(images) ? images : (images ? [images] : []);
  if (imageArray.length === 0) {
    return next(new AppError('At least one product image is required', 400));
  }

  const sku = generateVendorSku(vendorId);

  const product = await VendorProduct.create({
    name: productName,
    description: description || '',
    regularPrice: Number(price),
    stock: Number(stock),
    category: normalizedCategory,
    images: imageArray,
    sku,
    vendor: vendorId,
    published: true,
    archived: false
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

// @desc    Update a vendor product
// @route   PUT /api/vendor/products/:id
// @access  Private (Vendor)
const updateProduct = asyncHandler(async (req, res, next) => {
  requireVendor(req);
  const vendorId = req.user._id;
  const productId = req.params.id;

  const product = await VendorProduct.findOne({ _id: productId, vendor: vendorId, archived: false });
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const {
    title,
    name,
    description,
    price,
    stock,
    category,
    images,
    published
  } = req.body;

  if (title || name) {
    const productName = (title || name || '').trim();
    if (!productName) {
      return next(new AppError('Product title cannot be empty', 400));
    }
    product.name = productName;
  }

  if (description !== undefined) {
    if (description && String(description).length > 2000) {
      return next(new AppError('Description is too long (max 2000 characters)', 400));
    }
    product.description = description || '';
  }

  if (price !== undefined) {
    if (price == null || isNaN(Number(price)) || Number(price) < 0) {
      return next(new AppError('Valid price is required', 400));
    }
    product.regularPrice = Number(price);
  }

  if (stock !== undefined) {
    if (stock == null || isNaN(Number(stock)) || Number(stock) < 0) {
      return next(new AppError('Valid stock quantity is required', 400));
    }
    product.stock = Number(stock);
  }

  if (category !== undefined) {
    const normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) {
      return next(new AppError('Category is required', 400));
    }
    product.category = normalizedCategory;
  }

  if (images !== undefined) {
    const imageArray = Array.isArray(images) ? images : (images ? [images] : []);
    if (imageArray.length === 0) {
      return next(new AppError('At least one product image is required', 400));
    }
    product.images = imageArray;
  }

  if (published !== undefined) {
    product.published = Boolean(published);
  }

  await product.save();

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
});

// @desc    Toggle product availability (published)
// @route   PATCH /api/vendor/products/:id/toggle
// @access  Private (Vendor)
const toggleProductAvailability = asyncHandler(async (req, res, next) => {
  requireVendor(req);
  const vendorId = req.user._id;
  const productId = req.params.id;

  const product = await VendorProduct.findOne({ _id: productId, vendor: vendorId, archived: false });
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  product.published = !product.published;
  await product.save();

  res.json({
    success: true,
    message: `Product is now ${product.published ? 'available' : 'unavailable'}`,
    data: { product }
  });
});

// @desc    Delete a vendor product
// @route   DELETE /api/vendor/products/:id
// @access  Private (Vendor)
const deleteProduct = asyncHandler(async (req, res, next) => {
  requireVendor(req);
  const vendorId = req.user._id;
  const productId = req.params.id;

  const product = await VendorProduct.findOneAndDelete({ _id: productId, vendor: vendorId });
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Get vendor dashboard stats (from vendororders + vendorproducts)
// @route   GET /api/vendor/dashboard-stats
// @access  Private (Vendor)
const getDashboardStats = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendorId = req.user._id;

  const vendorProducts = await VendorProduct.find({ vendor: vendorId, archived: false })
    .select('_id name images regularPrice')
    .lean();
  const productMap = new Map(vendorProducts.map(p => [String(p._id), p]));
  const productsListed = vendorProducts.length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const vendorOrdersThisMonth = await VendorOrder.find({
    vendor: vendorId,
    createdAt: { $gte: startOfMonth },
    status: { $nin: ['cancelled'] }
  }).lean();

  let monthlyRevenue = vendorOrdersThisMonth.reduce((sum, vo) => sum + (vo.subtotal || 0), 0);
  const ordersThisMonth = vendorOrdersThisMonth.length;

  const productQuantitySold = new Map();
  for (const vo of vendorOrdersThisMonth) {
    for (const item of vo.items || []) {
      const pid = String(item.product);
      const qty = item.quantity || 0;
      const price = item.price || 0;
      const rev = price * qty;
      const prev = productQuantitySold.get(pid) || { quantity: 0, revenue: 0 };
      productQuantitySold.set(pid, {
        quantity: prev.quantity + qty,
        revenue: prev.revenue + rev
      });
    }
  }

  const topSellingProducts = Array.from(productQuantitySold.entries())
    .map(([productIdStr, data]) => {
      const p = productMap.get(productIdStr);
      return {
        productId: productIdStr,
        name: p?.name || 'Product',
        image: p?.images?.[0] || null,
        quantitySold: data.quantity,
        revenue: data.revenue,
        regularPrice: p?.regularPrice
      };
    })
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  const recentVendorOrders = await VendorOrder.find({ vendor: vendorId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentOrders = recentVendorOrders.map(vo => ({
    id: vo._id,
    orderNumber: vo.orderNumber,
    orderDate: vo.createdAt,
    status: vo.status,
    buyerName: vo.buyerName || vo.shippingAddress?.fullName || 'Customer',
    itemsSummary: (vo.items || []).map(i => `${i.name} × ${i.quantity}`).join(', '),
    total: vo.subtotal || 0
  }));

  res.json({
    success: true,
    data: {
      monthlyRevenue,
      ordersThisMonth,
      productsListed,
      topSellingProducts,
      recentOrders
    }
  });
});

// @desc    Get vendor orders from vendororders collection
// @route   GET /api/vendor/orders
// @access  Private (Vendor)
const getVendorOrders = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendorId = req.user._id;

  const { statusGroup = 'new' } = req.query;

  let statuses;
  if (statusGroup === 'completed') {
    statuses = ['delivered', 'cancelled', 'returned'];
  } else {
    statuses = ['pending', 'processing', 'shipped'];
  }

  const vendorOrders = await VendorOrder.find({ vendor: vendorId, status: { $in: statuses } })
    .sort({ createdAt: -1 })
    .lean();

  const orders = vendorOrders.map(vo => {
    const addr = vo.shippingAddress || {};
    const deliveryAddress = addr.address && addr.city && addr.postalCode && addr.country
      ? `${addr.address}, ${addr.city}, ${addr.postalCode}, ${addr.country}`
      : '';
    return {
      id: vo._id,
      orderId: vo.order,
      orderNumber: vo.orderNumber,
      orderDate: vo.createdAt,
      status: vo.status,
      paymentMethod: vo.paymentMethod,
      paymentStatus: vo.paymentMethod === 'Cash on Delivery'
        ? 'Pending - Pay on Delivery'
        : 'Paid',
      buyerName: vo.buyerName || addr.fullName || 'Customer',
      deliveryAddress,
      items: (vo.items || []).map(item => ({
        productId: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || null
      }))
    };
  });

  res.json({
    success: true,
    data: {
      orders
    }
  });
});

// @desc    Update vendor order status (e.g. mark as completed = delivered)
// @route   PATCH /api/vendor/orders/:id/status
// @access  Private (Vendor)
const updateVendorOrderStatus = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendorId = req.user._id;
  const { id: vendorOrderId } = req.params;
  const { status } = req.body;

  if (status !== 'delivered') {
    return res.status(400).json({ success: false, message: 'Vendors can only set status to completed (delivered).' });
  }

  const vendorOrder = await VendorOrder.findOne({ _id: vendorOrderId, vendor: vendorId });
  if (!vendorOrder) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (['delivered', 'cancelled', 'returned'].includes(vendorOrder.status)) {
    return res.status(400).json({ success: false, message: `Order is already ${vendorOrder.status}.` });
  }

  vendorOrder.status = 'delivered';
  if (Array.isArray(vendorOrder.statusHistory)) {
    vendorOrder.statusHistory.push({ status: 'delivered', note: 'Marked as completed by vendor', updatedAt: new Date() });
  } else {
    vendorOrder.statusHistory = [{ status: 'delivered', note: 'Marked as completed by vendor', updatedAt: new Date() }];
  }
  await vendorOrder.save();

  // Sync main Order so customer sees "delivered"
  await Order.findByIdAndUpdate(vendorOrder.order, {
    $set: { status: 'delivered' },
    $push: {
      statusHistory: {
        status: 'delivered',
        note: 'Marked as completed by vendor',
        updatedBy: req.user._id,
        updatedAt: new Date()
      }
    }
  });

  // Sync all other VendorOrders for this order
  await VendorOrder.updateMany(
    { order: vendorOrder.order },
    { $set: { status: 'delivered' } }
  );

  res.json({
    success: true,
    message: 'Order marked as completed.',
    data: { order: { id: vendorOrder._id, status: vendorOrder.status } }
  });
});

// @desc    Get vendor reviews (for all their products)
// @route   GET /api/vendor/reviews
// @access  Private (Vendor)
const getVendorReviews = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendorId = req.user._id;

  // Find vendor products
  const vendorProducts = await VendorProduct.find({ vendor: vendorId }).select('_id name');
  const productIds = vendorProducts.map(p => String(p._id));
  const productNameMap = new Map(vendorProducts.map(p => [String(p._id), p.name]));

  if (productIds.length === 0) {
    return res.json({
      success: true,
      data: {
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          breakdown: {}
        }
      }
    });
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, totalReviews, agg] = await Promise.all([
    Review.find({
      productId: { $in: productIds },
      status: 'approved'
    })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({
      productId: { $in: productIds },
      status: 'approved'
    }),
    Review.aggregate([
      {
        $match: {
          productId: { $in: productIds },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const totalCount = totalReviews;
  let sum = 0;
  const breakdown = {};

  agg.forEach(row => {
    const rating = row._id;
    const count = row.count;
    breakdown[rating] = count;
    sum += rating * count;
  });

  const averageRating = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 0;

  res.json({
    success: true,
    data: {
      reviews: reviews.map(r => ({
        id: r._id,
        productId: r.productId,
        productName: productNameMap.get(r.productId) || r.productName,
        rating: r.rating,
        comment: r.comment,
        user: r.user,
        createdAt: r.createdAt
      })),
      summary: {
        averageRating,
        totalReviews: totalCount,
        breakdown
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    }
  });
});

// @desc    Simple vendor payouts summary
// @route   GET /api/vendor/payouts/summary
// @access  Private (Vendor)
const getPayoutSummary = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendorId = req.user._id;

  const vendorProducts = await VendorProduct.find({ vendor: vendorId }).select('_id');
  const productIds = vendorProducts.map(p => p._id);

  if (productIds.length === 0) {
    return res.json({
      success: true,
      data: {
        totalEarned: 0,
        thisMonth: 0
      }
    });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const orders = await Order.find({
    status: 'delivered',
    'items.product': { $in: productIds }
  }).lean();

  let totalEarned = 0;
  let thisMonth = 0;

  orders.forEach(order => {
    const deliveredAt = order.updatedAt || order.createdAt;
    const orderTotalForVendor = (order.items || [])
      .filter(item => productIds.some(id => String(id) === String(item.product)))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);

    totalEarned += orderTotalForVendor;
    if (deliveredAt >= startOfMonth) {
      thisMonth += orderTotalForVendor;
    }
  });

  res.json({
    success: true,
    data: {
      totalEarned,
      thisMonth
    }
  });
});

// @desc    Simple vendor payouts transactions list
// @route   GET /api/vendor/payouts/transactions
// @access  Private (Vendor)
const getPayoutTransactions = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendorId = req.user._id;

  const vendorProducts = await VendorProduct.find({ vendor: vendorId }).select('_id name');
  const productMap = new Map(vendorProducts.map(p => [String(p._id), p.name]));
  const productIds = vendorProducts.map(p => p._id);

  if (productIds.length === 0) {
    return res.json({
      success: true,
      data: { transactions: [] }
    });
  }

  const orders = await Order.find({
    status: 'delivered',
    'items.product': { $in: productIds }
  }).sort({ createdAt: -1 }).lean();

  const transactions = [];

  orders.forEach(order => {
    (order.items || []).forEach(item => {
      if (productIds.some(id => String(id) === String(item.product))) {
        transactions.push({
          id: `${order._id}-${item.product}`,
          orderId: order._id,
          orderNumber: order.orderNumber,
          date: order.createdAt,
          productId: item.product,
          productName: productMap.get(String(item.product)) || item.name,
          amount: item.price * item.quantity
        });
      }
    });
  });

  res.json({
    success: true,
    data: { transactions }
  });
});

// @desc    Create a simple promo code for vendor
// @route   POST /api/vendor/promos
// @access  Private (Vendor)
const createPromoCode = asyncHandler(async (req, res, next) => {
  requireVendor(req);
  const vendorId = req.user._id;

  const { code, discountPercent, expiryDate } = req.body;

  if (!code || typeof code !== 'string') {
    return next(new AppError('Promo code name is required', 400));
  }

  const value = Number(discountPercent);
  if (isNaN(value) || value <= 0 || value > 100) {
    return next(new AppError('Discount percentage must be between 1 and 100', 400));
  }

  const endDate = expiryDate ? new Date(expiryDate) : null;
  if (!endDate || isNaN(endDate.getTime())) {
    return next(new AppError('Valid expiry date is required', 400));
  }

  const startDate = new Date();

  const discount = await Discount.create({
    name: code.trim(),
    type: 'percentage',
    value,
    applicableTo: 'all',
    startDate,
    endDate,
    active: true,
    description: `Vendor promo code created by ${req.user.name}`,
    createdBy: vendorId
  });

  res.status(201).json({
    success: true,
    message: 'Promo code created successfully',
    data: { promo: discount }
  });
});

// @desc    List vendor promo codes
// @route   GET /api/vendor/promos
// @access  Private (Vendor)
const getPromoCodes = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendorId = req.user._id;

  const promos = await Discount.find({ createdBy: vendorId })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: { promos }
  });
});

// ——— Payout details (UPI via Razorpay X) ———

const UPI_VPA_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

// @desc    Get vendor payout details (masked UPI only; no raw data)
// @route   GET /api/vendor/payout-details
// @access  Private (Vendor)
const getPayoutDetails = asyncHandler(async (req, res) => {
  requireVendor(req);
  const vendor = await VendorUser.findById(req.user._id)
    .select('razorpayContactId razorpayFundAccountId upiMasked')
    .lean();
  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }
  res.json({
    success: true,
    data: {
      hasUpi: !!(vendor.razorpayFundAccountId && vendor.upiMasked),
      upiMasked: vendor.upiMasked || null
    }
  });
});

// @desc    Save vendor UPI via Razorpay X (Contact + Fund Account); store only tokens + masked
// @route   POST /api/vendor/payout-details
// @access  Private (Vendor)
const savePayoutDetails = asyncHandler(async (req, res) => {
  requireVendor(req);
  const { upi } = req.body || {};
  const vpa = typeof upi === 'string' ? upi.trim().toLowerCase() : '';
  if (!vpa) {
    throw new AppError('UPI ID is required', 400);
  }
  if (!UPI_VPA_REGEX.test(vpa)) {
    throw new AppError('Invalid UPI ID. Use format: name@bank (e.g. merchant@paytm)', 400);
  }
  if (!razorpayX.isConfigured()) {
    throw new AppError('Payout setup is not configured. Please try again later.', 503);
  }

  const vendorId = req.user._id;
  const vendor = await VendorUser.findById(vendorId).select('name email razorpayContactId razorpayFundAccountId');
  if (!vendor) throw new AppError('Vendor not found', 404);

  let contactId = vendor.razorpayContactId;
  if (!contactId) {
    let contact;
    try {
      contact = await razorpayX.createContact({
        name: vendor.name || 'Vendor',
        email: vendor.email,
        reference_id: String(vendorId)
      });
    } catch (err) {
      const msg = err.response?.data?.error?.description || err.message || 'Could not create payout contact.';
      throw new AppError(msg, 500);
    }
    if (!contact || !contact.id) {
      throw new AppError('Could not create payout contact. Please try again.', 500);
    }
    contactId = contact.id;
  }

  let fundAccount;
  try {
    fundAccount = await razorpayX.createFundAccountVpa({
      contact_id: contactId,
      vpa_address: vpa
    });
  } catch (err) {
    const msg = err.response?.data?.error?.description || err.message || 'Could not add UPI. Please check the UPI ID and try again.';
    throw new AppError(msg, 400);
  }
  if (!fundAccount || !fundAccount.id) {
    throw new AppError('Could not add UPI. Please check the UPI ID and try again.', 400);
  }

  const upiMasked = razorpayX.maskUpi(vpa);
  const upiEncrypted = upiEncrypt.encrypt(vpa) || null;

  await VendorUser.findByIdAndUpdate(vendorId, {
    razorpayContactId: contactId,
    razorpayFundAccountId: fundAccount.id,
    upiMasked,
    upiEncrypted
  });

  res.status(200).json({
    success: true,
    data: {
      upiMasked,
      message: 'UPI saved. Use a merchant/business UPI for higher receive limits.'
    }
  });
});

// @desc    Get vendor pay URI and QR for "Pay online" (amount in INR)
// @route   GET /api/vendor/store/:vendorId/pay-uri?amount=123.45
// @access  Public
const getVendorPayUri = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;
  const amount = Number(req.query.amount);
  if (!amount || amount <= 0 || !Number.isFinite(amount)) {
    throw new AppError('Valid amount is required (query: amount)', 400);
  }
  const vendor = await VendorUser.findById(vendorId)
    .select('name upiEncrypted')
    .lean();
  if (!vendor || !vendor.upiEncrypted) {
    throw new AppError('Vendor or payment details not found', 404);
  }
  const vpa = upiEncrypt.decrypt(vendor.upiEncrypted);
  if (!vpa) {
    throw new AppError('Payment details unavailable', 404);
  }
  const name = (vendor.name || 'Vendor').replace(/[^a-zA-Z0-9\s.-]/g, '').trim().slice(0, 50) || 'Vendor';
  const am = amount.toFixed(2);
  const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&am=${am}&cu=INR`;
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(upiUri, { width: 280, margin: 2 });
  } catch (e) {
    console.error('QR generation failed', e);
  }
  res.json({
    success: true,
    data: {
      upiUri,
      vendorName: vendor.name || 'Vendor',
      amount: Number(am),
      qrDataUrl
    }
  });
});

module.exports = {
  getMyStorefront,
  getVendorStorefront,
  getVendorPayUri,
  listVendors,
  getMyProducts,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
  uploadProductImage,
  updateStorefrontHeader,
  getDashboardStats,
  getPayoutDetails,
  savePayoutDetails,
  getVendorOrders,
  updateVendorOrderStatus,
  getVendorReviews,
  getPayoutSummary,
  getPayoutTransactions,
  createPromoCode,
  getPromoCodes
};

