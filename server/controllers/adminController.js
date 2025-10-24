const User = require('../models/User');
const Plant = require('../models/Plant');
const Blog = require('../models/Blog');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const Notification = require('../models/Notification');
const PlantSuggestion = require('../models/PlantSuggestion');
const AdminActivity = require('../models/AdminActivity');
const notificationService = require('../utils/notificationService');
const AdminActivityService = require('../utils/adminActivityService');
const { sendBlogApprovalEmail, sendBlogRejectionEmail, sendEmailNotification, sendAdminVerificationEmail, sendOrderStatusUpdateEmail } = require('../utils/emailService');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const crypto = require('crypto');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
  // Get current date and date 30 days ago
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Get basic counts
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    newUsersThisMonth,
    newOrdersThisMonth,
    revenueThisMonth,
    newUsersLastMonth,
    newOrdersLastMonth,
    revenueLastMonth,
    pendingBlogPosts,
    totalBlogPosts
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ archived: false }),
    Order.countDocuments(),
    // Use delivered-only for revenue to match dashboard label and insights
    Order.aggregate([
      { $match: { status: { $in: ['delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Order.aggregate([
      { 
        $match: { 
          status: { $in: ['delivered'] },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    User.countDocuments({ 
      createdAt: { $gte: lastMonth, $lt: thirtyDaysAgo }
    }),
    Order.countDocuments({ 
      createdAt: { $gte: lastMonth, $lt: thirtyDaysAgo }
    }),
    Order.aggregate([
      { 
        $match: { 
          status: { $in: ['delivered'] },
          createdAt: { $gte: lastMonth, $lt: thirtyDaysAgo }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Blog.countDocuments({ approvalStatus: 'pending' }),
    Blog.countDocuments()
  ]);

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const userGrowth = calculateGrowth(newUsersThisMonth, newUsersLastMonth);
  const orderGrowth = calculateGrowth(newOrdersThisMonth, newOrdersLastMonth);
  const revenueGrowthValue = calculateGrowth(
    revenueThisMonth[0]?.total || 0,
    revenueLastMonth[0]?.total || 0
  );

  // Get recent orders
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .populate('items.product', 'name')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get top selling products
  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    { 
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ]);

  // Get recent admin activities (prioritize admin actions over system events)
  const recentAdminActivities = await AdminActivityService.getRecentActivities(3);
  
  // If we have less than 3 admin activities, fill with system events
  const recentSystemActivity = [...recentAdminActivities];
  
  if (recentSystemActivity.length < 3) {
    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name email role createdAt')
      .lean();
    
    recentUsers.forEach(user => {
      recentSystemActivity.push({
        type: 'user_registered',
        title: 'New user registered',
        description: `${user.name} (${user.role})`,
        timestamp: user.createdAt,
        icon: 'users'
      });
    });

    // Get recent orders
    const recentOrderActivity = await Order.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .select('orderNumber user createdAt status')
      .lean();
    
    recentOrderActivity.forEach(order => {
      recentSystemActivity.push({
        type: 'order_placed',
        title: 'New order placed',
        description: `Order #${order.orderNumber} by ${order.user?.name || 'Customer'}`,
        timestamp: order.createdAt,
        icon: 'shopping-bag'
      });
    });

    // Get recent blog posts
    const recentBlogPosts = await Blog.find()
      .populate('authorId', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title authorId createdAt approvalStatus')
      .lean();
    
    recentBlogPosts.forEach(post => {
      if (post.approvalStatus === 'pending') {
        recentSystemActivity.push({
          type: 'blog_pending',
          title: 'Blog post pending approval',
          description: `"${post.title}" by ${post.authorId?.name || 'Unknown'}`,
          timestamp: post.createdAt,
          icon: 'file-text'
        });
      }
    });
  }

  // Sort by timestamp and take the 3 most recent
  recentSystemActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const topRecentActivity = recentSystemActivity.slice(0, 3);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        userGrowth: `${userGrowth}%`,
        orderGrowth: `${orderGrowth}%`,
        revenueGrowth: `${revenueGrowthValue}%`,
        pendingBlogPosts,
        totalBlogPosts
      },
      recentOrders,
      topProducts,
      recentSystemActivity: topRecentActivity
    }
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const { page, limit, skip } = req.pagination;

  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    query.role = role;
  }

  if (status) {
    query.status = status;
  }

  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const users = await User.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
    .lean();

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
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

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return next(new AppError('Invalid role. Must be user or admin', 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.role = role;
  await user.save();

  // Send verification email if role is upgraded to admin
  if (role === 'admin') {
    try {
      await sendAdminVerificationEmail(user.email, user.name, 'user', 'Your account has been upgraded to admin status');
      console.log(`Admin verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send admin verification email:', emailError);
    }
  }

  res.json({
    success: true,
    message: `User role updated to ${role}`,
    data: { user }
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  // Prevent deletion of admin users
  if (user.role === 'admin') {
    return next(new AppError('Cannot delete admin users', 400));
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});


// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin only)
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const { page, limit, skip } = req.pagination;

  let query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
    ];
  }

  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);

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

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin only)
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email role');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const previousStatus = order.status;
  const Product = require('../models/Product');

  // Handle stock rollback for cancellations and returns
  if ((status === 'cancelled' || status === 'returned') && 
      (previousStatus === 'processing' || previousStatus === 'shipped' || previousStatus === 'delivered')) {
    
    console.log(`🔄 Rolling back stock for order ${order._id} - Status: ${previousStatus} -> ${status}`);
    
    // Restore stock for all items in the order
    for (const item of order.items) {
      const productId = item.productId || item.product;
      if (productId) {
        try {
          const product = await Product.findById(productId);
          if (product) {
            const oldStock = product.stock;
            product.stock += item.quantity;
            await product.save();
            
            console.log(`✅ Stock restored for ${product.name}: ${oldStock} -> ${product.stock} (+${item.quantity})`);
          } else {
            console.warn(`⚠️ Product not found for ID: ${productId}`);
          }
        } catch (error) {
          console.error(`❌ Error restoring stock for product ${productId}:`, error);
        }
      }
    }
  }

  // Handle stock reduction for confirmed orders (if moving from pending to processing)
  if (status === 'processing' && previousStatus === 'pending') {
    console.log(`📦 Confirming stock reduction for order ${order._id}`);
    
    // Reduce stock for all items in the order
    for (const item of order.items) {
      const productId = item.productId || item.product;
      if (productId) {
        try {
          const product = await Product.findById(productId);
          if (product) {
            if (product.stock >= item.quantity) {
              const oldStock = product.stock;
              product.stock -= item.quantity;
              await product.save();
              
              console.log(`✅ Stock confirmed for ${product.name}: ${oldStock} -> ${product.stock} (-${item.quantity})`);
            } else {
              console.warn(`⚠️ Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
            }
          } else {
            console.warn(`⚠️ Product not found for ID: ${productId}`);
          }
        } catch (error) {
          console.error(`❌ Error confirming stock for product ${productId}:`, error);
        }
      }
    }
  }

  order.status = status;
  
  // Add to status history (if statusHistory exists)
  if (order.statusHistory) {
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user._id
    });
  }

  // Update analytics based on status change
  const analyticsService = require('../utils/analyticsService');
  await analyticsService.updateOrderAnalytics(order, previousStatus, status);

  // Set cancellation/return timestamps
  if (status === 'cancelled') {
    order.cancelledAt = new Date();
    order.cancellationReason = note || 'Cancelled by admin';
  } else if (status === 'returned') {
    order.returnedAt = new Date();
    order.returnReason = note || 'Returned by admin';
  }

  // Send notification to user about order status update
  try {
    let notificationType = 'order_status_update';
    let notificationTitle = 'Order Status Updated';
    let notificationMessage = `Your order #${order.orderNumber} status has been updated to: ${status.toUpperCase()}`;

    // Set specific notification types for important status changes
    if (status === 'shipped') {
      notificationType = 'order_shipped';
      notificationTitle = 'Order Shipped! 🚚';
      notificationMessage = `Great news! Your order #${order.orderNumber} has been shipped and is on its way to you.`;
    } else if (status === 'delivered') {
      notificationType = 'order_delivered';
      notificationTitle = 'Order Delivered! ✅';
      notificationMessage = `Your order #${order.orderNumber} has been delivered successfully. Thank you for shopping with UrbanSprout!`;
    } else if (status === 'cancelled') {
      notificationType = 'order_cancelled';
      notificationTitle = 'Order Cancelled';
      notificationMessage = `Your order #${order.orderNumber} has been cancelled. If you have any questions, please contact our support team.`;
    }

    await notificationService.sendNotification(order.user, {
      userEmail: order.user.email,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    console.log(`Order status notification sent to user ${order.user.email}`);

    // Send professional email notification for order status update (only to non-admin users)
    try {
      if (order.user && order.user.email && order.user.role !== 'admin') {
        const orderDetails = {
          orderId: order.orderNumber || order._id.toString().slice(-8),
          status: status,
          updatedAt: new Date(),
          trackingNumber: order.trackingNumber || null,
          carrier: order.shipping?.carrier || 'Standard Shipping',
          estimatedDelivery: order.shipping?.estimatedDelivery || '3-5 business days',
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: order.total
        };

        await sendOrderStatusUpdateEmail(order.user.email, order.user.name, orderDetails);
        console.log(`✅ Professional order status update email sent to ${order.user.email} (${order.user.role})`);
      } else if (order.user && order.user.role === 'admin') {
        console.log(`ℹ️ Skipping order status email for admin user: ${order.user.email} (${order.user.role})`);
      } else {
        console.log(`⚠️ Could not send order status email - user not found or no email`);
      }
    } catch (emailError) {
      console.error('Error sending order status update email:', emailError);
      // Fallback to basic email notification (only for non-admin users)
      try {
        if (order.user && order.user.email && order.user.role !== 'admin') {
          await sendEmailNotification(
            order.user.email,
            `Order Status Update - ${status.toUpperCase()}`,
            `Your order #${order.orderNumber || order._id.toString().slice(-8)} status has been updated to: ${status.toUpperCase()}`,
            order.user.name || 'Customer'
          );
          console.log(`✅ Fallback email notification sent to ${order.user.email} (${order.user.role})`);
        }
      } catch (fallbackError) {
        console.error('Error sending fallback email notification:', fallbackError);
      }
    }
  } catch (notificationError) {
    console.error('Error sending order status notification:', notificationError);
    // Don't fail the order update if notification fails
  }

  // Set specific timestamps
  if (status === 'shipped' && !order.shipping.shippedAt) {
    order.shipping.shippedAt = new Date();
  }
  
  if (status === 'delivered' && !order.shipping.deliveredAt) {
    order.shipping.deliveredAt = new Date();
  }

  if (status === 'cancelled' && !order.cancelledAt) {
    order.cancelledAt = new Date();
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order }
  });
});

// @desc    Get blog posts for admin
// @route   GET /api/admin/blog
// @access  Private (Admin only)
const getAllBlogPosts = asyncHandler(async (req, res) => {
  const { status, search, sortBy = 'createdAt', sortOrder = 'desc', approvalStatus } = req.query;
  const { page, limit, skip } = req.pagination;

  let query = {};

  if (status) {
    query.status = status;
  }

  if (approvalStatus) {
    query.approvalStatus = approvalStatus;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
  }

  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const posts = await Blog.find(query)
    .populate('authorId', 'name email')
    .populate('approvedBy', 'name')
    .populate('rejectedBy', 'name')
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  const total = await Blog.countDocuments(query);

  res.json({
    success: true,
    data: {
      posts,
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

// @desc    Approve blog post
// @route   PUT /api/admin/blog/:id/approve
// @access  Private (Admin only)
const approveBlogPost = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  post.approvalStatus = 'approved';
  post.status = 'published';
  post.approvedBy = req.user._id;
  post.approvedAt = new Date();
  post.rejectionReason = undefined;

  await post.save();

  // Send notification to the author
  try {
    await notificationService.sendNotification(post.authorId, {
      userEmail: post.authorEmail,
      type: 'blog_approved',
      title: '✅ Blog Post Approved!',
      message: `Your blog post "${post.title}" has been approved and is now live on the feed!`,
      relatedId: post._id,
      relatedModel: 'Blog'
    });
    console.log(`✅ Blog approval notification sent to ${post.authorEmail}`);
  } catch (notificationError) {
    console.error('❌ Failed to send blog approval notification:', notificationError);
    // Don't fail the approval if notification fails
  }

  // Send approval email to the author
  try {
    await sendBlogApprovalEmail(post.authorEmail, post.author, post.title);
    console.log(`📧 Blog approval email sent to ${post.authorEmail}`);
  } catch (emailError) {
    console.error('❌ Failed to send blog approval email:', emailError);
    // Don't fail approval if email fails
  }

  res.json({
    success: true,
    message: 'Blog post approved successfully',
    data: { post }
  });
});

// @desc    Reject blog post
// @route   PUT /api/admin/blog/:id/reject
// @access  Private (Admin only)
const rejectBlogPost = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return next(new AppError('Rejection reason is required', 400));
  }

  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  post.approvalStatus = 'rejected';
  post.status = 'rejected';
  post.rejectionReason = reason.trim();
  post.rejectedBy = req.user._id;
  post.rejectedAt = new Date();

  await post.save();

  // Send real-time notification to the author
  await notificationService.sendNotification(post.authorId, {
    userEmail: post.authorEmail,
    type: 'blog_rejected',
    title: 'Blog Post Feedback 📝',
    message: `Your blog post "${post.title}" needs some adjustments. Reason: ${reason.trim()}`,
    relatedId: post._id
  });

  // Send rejection email to the author
  try {
    console.log(`Attempting to send blog rejection email to: ${post.authorEmail}`);
    console.log(`Blog post details:`, {
      title: post.title,
      author: post.author,
      reason: reason.trim()
    });
    
    const emailResult = await sendBlogRejectionEmail(post.authorEmail, post.author, post.title, reason.trim());
    
    if (emailResult.success) {
      console.log(`✅ Blog rejection email sent successfully to ${post.authorEmail}. Message ID: ${emailResult.messageId}`);
    } else {
      console.error(`❌ Failed to send blog rejection email to ${post.authorEmail}:`, emailResult.error);
    }
  } catch (emailError) {
    console.error('❌ Exception while sending blog rejection email:', emailError);
    // Don't fail rejection if email fails
  }

  // Send notification to the author
  try {
    const author = await User.findOne({ email: post.authorEmail });
    if (author) {
      await notificationService.sendNotification(author._id, {
        userEmail: post.authorEmail,
        type: 'blog_rejected',
        title: 'Blog Post Needs Revision',
        message: `Your blog post "${post.title}" needs some revisions. Reason: ${reason.trim()}`,
        relatedId: post._id,
        relatedModel: 'Blog'
      });
      console.log(`Blog rejection notification sent to user ${post.authorEmail}`);
    }
  } catch (notificationError) {
    console.error('Error sending blog rejection notification:', notificationError);
    // Don't fail rejection if notification fails
  }

  res.json({
    success: true,
    message: 'Blog post rejected successfully',
    data: { post }
  });
});

// @desc    Delete blog post
// @route   DELETE /api/admin/blog/:id
// @access  Private (Admin only)
const deleteBlogPost = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  // Send notification to the author before deleting
  try {
    const author = await User.findOne({ email: post.authorEmail });
    if (author) {
      await notificationService.sendNotification(author._id, {
        userEmail: post.authorEmail,
        type: 'blog_deleted',
        title: 'Blog Post Deleted',
        message: `Your blog post "${post.title}" has been deleted from UrbanSprout.`,
        relatedId: post._id,
        relatedModel: 'Blog'
      });
      console.log(`Blog deletion notification sent to user ${post.authorEmail}`);
    }
  } catch (notificationError) {
    console.error('Error sending blog deletion notification:', notificationError);
    // Don't fail deletion if notification fails
  }

  // Send email notification to the author before deleting
  try {
    console.log(`🔍 Looking up author for blog post deletion: ${post._id}`);
    console.log(`📝 Post details:`, {
      title: post.title,
      author: post.author,
      authorEmail: post.authorEmail,
      authorId: post.authorId
    });

    // Determine recipient email and name with multiple fallback strategies
    let recipientEmail = post.authorEmail;
    let recipientName = post.author || 'Author';

    // Strategy 1: Try to find user by authorId first (most reliable)
    if (post.authorId) {
      try {
        const authorDoc = await User.findById(post.authorId).select('email name').lean();
        if (authorDoc && authorDoc.email) {
          recipientEmail = authorDoc.email;
          recipientName = authorDoc.name || recipientName;
          console.log(`✅ Found user by ID: ${authorDoc.email}`);
        }
      } catch (lookupErr) {
        console.error('Error looking up author by ID:', lookupErr);
      }
    }

    // Strategy 2: If still no email, try finding by authorEmail
    if (!recipientEmail && post.authorEmail) {
      try {
        const authorDoc = await User.findOne({ email: post.authorEmail }).select('email name').lean();
        if (authorDoc && authorDoc.email) {
          recipientEmail = authorDoc.email;
          recipientName = authorDoc.name || recipientName;
          console.log(`✅ Found user by email: ${authorDoc.email}`);
        }
      } catch (lookupErr) {
        console.error('Error looking up author by email:', lookupErr);
      }
    }

    // Strategy 3: If still no email, try finding by author name (last resort)
    if (!recipientEmail && post.author) {
      try {
        const authorDoc = await User.findOne({ name: post.author }).select('email name').lean();
        if (authorDoc && authorDoc.email) {
          recipientEmail = authorDoc.email;
          recipientName = authorDoc.name || recipientName;
          console.log(`✅ Found user by name: ${authorDoc.email}`);
        }
      } catch (lookupErr) {
        console.error('Error looking up author by name:', lookupErr);
      }
    }

    if (!recipientEmail) {
      console.warn(`❌ Skipping deletion email: no recipient email found for post ${post._id}`);
      console.warn(`📝 Post had: authorEmail=${post.authorEmail}, authorId=${post.authorId}, author=${post.author}`);
    } else {
      console.log(`📧 Sending deletion email to: ${recipientEmail}`);
      
      const subject = 'Blog Post Deleted - UrbanSprout';
      const message = `Hello ${recipientName}!

We wanted to inform you that your blog post "${post.title}" has been deleted from UrbanSprout by an administrator.

If you have any questions about this action or would like to discuss it further, please don't hesitate to contact our support team.

Thank you for your understanding.

Best regards,
The UrbanSprout Team`;

      const emailResult = await sendEmailNotification(
        recipientEmail,
        subject,
        message,
        recipientName
      );

      if (emailResult?.success) {
        console.log(`✅ Blog deletion email sent successfully to ${recipientEmail}`, emailResult.messageId ? `(id: ${emailResult.messageId})` : '');
      } else {
        console.error(`❌ Failed to send blog deletion email to ${recipientEmail}:`, emailResult?.error || 'Unknown error');
      }
    }
  } catch (emailError) {
    console.error('💥 Exception while sending blog deletion email:', emailError);
    // Don't fail deletion if email fails
  }

  await Blog.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Blog post deleted successfully'
  });
});

// @desc    Approve/Disapprove blog comment
// @route   PUT /api/admin/blog/:id/comments/:commentId/approve
// @access  Private (Admin only)
const toggleCommentApproval = asyncHandler(async (req, res, next) => {
  const { id, commentId } = req.params;
  const { isApproved } = req.body;

  const post = await Blog.findById(id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  const comment = post.comments.id(commentId);

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  comment.isApproved = isApproved;
  await post.save();

  res.json({
    success: true,
    message: `Comment ${isApproved ? 'approved' : 'disapproved'} successfully`
  });
});

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin only)
const blockUser = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role === 'admin') {
    return next(new AppError('Cannot block admin users', 400));
  }

  user.status = user.status === 'blocked' ? 'active' : 'blocked';
  user.blockReason = user.status === 'blocked' ? reason : null;

  await user.save();

  // TODO: Send email notification
  // await sendEmailNotification(user.email, 'Account Status Update', 
  //   `Your account has been ${user.status === 'blocked' ? 'blocked' : 'unblocked'}. ${reason ? `Reason: ${reason}` : ''}`);

  res.json({
    success: true,
    message: `User ${user.status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
    data: { user }
  });
});

// @desc    Suspend user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (Admin only)
const suspendUser = asyncHandler(async (req, res, next) => {
  const { reason, duration } = req.body; // duration in hours
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role === 'admin') {
    return next(new AppError('Cannot suspend admin users', 400));
  }

  const suspensionEnd = new Date();
  suspensionEnd.setHours(suspensionEnd.getHours() + duration);

  user.status = 'suspended';
  user.suspensionEnd = suspensionEnd;
  user.suspensionReason = reason;

  await user.save();

  // TODO: Send email notification
  // await sendEmailNotification(user.email, 'Account Suspended', 
  //   `Your account has been suspended until ${suspensionEnd.toLocaleString()}. Reason: ${reason}`);

  res.json({
    success: true,
    message: 'User suspended successfully',
    data: { user }
  });
});

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private (Admin only)
const resetUserPassword = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').hash(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // TODO: Send reset email
  // await sendEmailNotification(user.email, 'Password Reset', 
  //   `A password reset has been initiated for your account. Click here to reset: ${process.env.CLIENT_URL}/reset-password/${resetToken}`);

  res.json({
    success: true,
    message: 'Password reset email sent successfully'
  });
});

// @desc    Send email to user
// @route   POST /api/admin/users/:id/send-email
// @access  Private (Admin only)
const sendUserEmail = asyncHandler(async (req, res, next) => {
  const { subject, message } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // TODO: Send email
  // await sendEmailNotification(user.email, subject, message);

  res.json({
    success: true,
    message: 'Email sent successfully'
  });
});

// @desc    Update admin notes
// @route   PUT /api/admin/users/:id/notes
// @access  Private (Admin only)
const updateUserNotes = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.adminNotes = notes;
  await user.save();

  res.json({
    success: true,
    message: 'Admin notes updated successfully',
    data: { user }
  });
});

// @desc    Flag/Unflag user
// @route   PUT /api/admin/users/:id/flag
// @access  Private (Admin only)
const flagUser = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isFlagged = !user.isFlagged;
  user.flaggedReason = user.isFlagged ? reason : null;

  await user.save();

  res.json({
    success: true,
    message: `User ${user.isFlagged ? 'flagged' : 'unflagged'} successfully`,
    data: { user }
  });
});

// @desc    Bulk operations on users
// @route   POST /api/admin/users/bulk
// @access  Private (Admin only)
const bulkUserOperations = asyncHandler(async (req, res, next) => {
  const { userIds, operation, data } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return next(new AppError('User IDs are required', 400));
  }

  const users = await User.find({ _id: { $in: userIds } });
  const results = [];

  for (const user of users) {
    if (user.role === 'admin') {
      results.push({ userId: user._id, success: false, message: 'Cannot modify admin users' });
      continue;
    }

    try {
      switch (operation) {
        case 'block':
          user.status = 'blocked';
          user.blockReason = data.reason || 'Bulk block operation';
          break;
        case 'unblock':
          user.status = 'active';
          user.blockReason = null;
          break;
        case 'delete':
          if (user.role === 'admin') {
            results.push({ userId: user._id, success: false, message: 'Cannot delete admin users' });
            continue;
          }
          await User.findByIdAndDelete(user._id);
          results.push({ userId: user._id, success: true, message: 'User deleted' });
          continue;
        case 'changeRole':
          user.role = data.role;
          break;
        case 'suspend':
          const suspensionEnd = new Date();
          suspensionEnd.setHours(suspensionEnd.getHours() + (data.duration || 24));
          user.status = 'suspended';
          user.suspensionEnd = suspensionEnd;
          user.suspensionReason = data.reason || 'Bulk suspend operation';
          break;
        default:
          results.push({ userId: user._id, success: false, message: 'Invalid operation' });
          continue;
      }

      await user.save();
      results.push({ userId: user._id, success: true, message: `Operation ${operation} completed` });
    } catch (error) {
      results.push({ userId: user._id, success: false, message: error.message });
    }
  }

  res.json({
    success: true,
    message: 'Bulk operation completed',
    data: { results }
  });
});

// @desc    Get user details for quick view
// @route   GET /api/admin/users/:id/details
// @access  Private (Admin only)
const getUserDetails = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findById(userId)
    .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
    .lean();

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get additional user activity data
  const [blogPosts, orders] = await Promise.all([
    Blog.countDocuments({ authorId: userId }),
    Order.countDocuments({ userId: userId })
  ]);

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        activity: {
          blogPosts,
          orders
        }
      }
    }
  });
});

// ==================== PRODUCT MANAGEMENT ====================

// @desc    Get all products with pagination and filters
// @route   GET /api/admin/products
// @access  Private (Admin only)
const getAllProducts = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search, category, status, featured, stock, minPrice, maxPrice, sortBy, sortOrder } = req.query;
  const { skip } = req.pagination;

  let query = {};

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Status filter
  if (status === 'published') {
    query.published = true;
    query.archived = false;
  } else if (status === 'unpublished') {
    query.published = false;
    query.archived = false;
  } else if (status === 'archived') {
    query.archived = true;
  }

  // Featured filter
  if (featured !== undefined) {
    query.featured = featured === 'true';
  }

  // Stock filter
  if (stock) {
    if (stock === 'in-stock') {
      // In stock: stock > lowStockThreshold (excludes low stock and out of stock)
      query.$expr = { $gt: ['$stock', '$lowStockThreshold'] };
    } else if (stock === 'low-stock') {
      // Low stock: stock > 0 AND stock <= lowStockThreshold (excludes out of stock)
      query.$expr = { 
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', '$lowStockThreshold'] }
        ]
      };
    } else if (stock === 'out-of-stock') {
      // Out of stock: stock = 0
      query.stock = 0;
    }
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.regularPrice = {};
    if (minPrice) {
      query.regularPrice.$gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      query.regularPrice.$lte = parseFloat(maxPrice);
    }
  }

  // Build sort object
  let sortObj = { createdAt: -1 }; // default sort
  if (sortBy && sortOrder) {
    sortObj = {};
    const order = sortOrder === 'desc' ? -1 : 1;
    if (sortBy === 'name') {
      sortObj.name = order;
    } else if (sortBy === 'price') {
      sortObj.regularPrice = order;
    } else if (sortBy === 'stock') {
      sortObj.stock = order;
    } else if (sortBy === 'createdAt') {
      sortObj.createdAt = order;
    }
  }

  const products = await Product.find(query)
    .populate('vendor', 'name email')
    .populate('linkedDiscount', 'name type value startDate endDate active')
    .populate('appliedDiscounts.discountId', 'name type value startDate endDate active')
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(query);

  // Process products with discount information
  const now = new Date();
  const processedProducts = products.map(product => {
    // Calculate final price using the new discount system
    if (product.finalPrice !== null && product.finalPrice !== undefined) {
      // Use pre-calculated final price
      product.currentPrice = product.finalPrice;
      product.discountPercentage = product.regularPrice > 0 ? 
        Math.round(((product.regularPrice - product.finalPrice) / product.regularPrice) * 100) : 0;
    } else {
      // Fallback to legacy discount calculation
    if (product.linkedDiscount && product.linkedDiscount.active) {
      const discount = product.linkedDiscount;
      const isActive = now >= new Date(discount.startDate) && now <= new Date(discount.endDate);
      
      if (isActive) {
        let discountedPrice = product.regularPrice;
        if (discount.type === 'percentage') {
          discountedPrice = product.regularPrice * (1 - discount.value / 100);
        } else {
          discountedPrice = Math.max(0, product.regularPrice - discount.value);
        }
        
        product.currentPrice = discountedPrice;
        product.discountPercentage = Math.round(((product.regularPrice - discountedPrice) / product.regularPrice) * 100);
      } else {
        product.currentPrice = product.discountPrice || product.regularPrice;
        product.discountPercentage = product.discountPrice ? 
          Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100) : 0;
      }
    } else {
      product.currentPrice = product.discountPrice || product.regularPrice;
      product.discountPercentage = product.discountPrice ? 
        Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100) : 0;
      }
    }
    
    return product;
  });

  res.json({
    success: true,
    data: {
      products: processedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get single product
// @route   GET /api/admin/products/:id
// @access  Private (Admin only)
const getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('vendor', 'name email');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.json({
    success: true,
    data: { product }
  });
});

// @desc    Create new product
// @route   POST /api/admin/products
// @access  Private (Admin only)
const createProduct = asyncHandler(async (req, res, next) => {
  const {
    name,
    category,
    description,
    sku,
    regularPrice,
    discountPrice,
    stock,
    lowStockThreshold,
    images,
    featured,
    published,
    tags,
    weight,
    dimensions,
    specifications
  } = req.body;

  // Check if SKU already exists
  const existingProduct = await Product.findOne({ sku });
  if (existingProduct) {
    return next(new AppError('SKU already exists', 400));
  }

  const product = await Product.create({
    name,
    category,
    description,
    sku,
    regularPrice,
    discountPrice,
    stock,
    lowStockThreshold,
    images,
    featured: featured || false,
    published: published !== false,
    tags,
    weight,
    dimensions,
    specifications
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private (Admin only)
const updateProduct = asyncHandler(async (req, res, next) => {
  const {
    name,
    category,
    description,
    sku,
    regularPrice,
    discountPrice,
    stock,
    lowStockThreshold,
    images,
    featured,
    published,
    tags,
    weight,
    dimensions,
    specifications
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if SKU already exists (excluding current product)
  if (sku && sku !== product.sku) {
    const existingProduct = await Product.findOne({ sku, _id: { $ne: req.params.id } });
    if (existingProduct) {
      return next(new AppError('SKU already exists', 400));
    }
  }

  // Update fields
  if (name) product.name = name;
  if (category) product.category = category;
  if (description) product.description = description;
  if (sku) product.sku = sku;
  if (regularPrice !== undefined) product.regularPrice = regularPrice;
  if (discountPrice !== undefined) product.discountPrice = discountPrice;
  if (stock !== undefined) product.stock = stock;
  if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
  if (images) product.images = images;
  if (featured !== undefined) product.featured = featured;
  if (published !== undefined) product.published = published;
  if (tags) product.tags = tags;
  if (weight !== undefined) product.weight = weight;
  if (dimensions) product.dimensions = dimensions;
  if (specifications) product.specifications = specifications;

  await product.save();

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });

  // Emit real-time event for inventory insights
  const io = req.app.get('io');
  if (io) {
    io.emit('productUpdated', {
      productId: product._id,
      productName: product.name,
      stock: product.stock,
      category: product.category,
      timestamp: new Date()
    });
    console.log('📡 Emitted productUpdated event for real-time updates');
  }
});

// @desc    Archive product (soft delete)
// @route   PUT /api/admin/products/:id/archive
// @access  Private (Admin only)
const archiveProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  product.archived = true;
  product.published = false;
  await product.save();

  res.json({
    success: true,
    message: 'Product archived successfully',
    data: { product }
  });
});

// @desc    Restore archived product
// @route   PUT /api/admin/products/:id/restore
// @access  Private (Admin only)
const restoreProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  product.archived = false;
  product.published = true;
  await product.save();

  res.json({
    success: true,
    message: 'Product restored successfully',
    data: { product }
  });
});

// @desc    Delete product permanently
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin only)
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  await Product.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Product deleted permanently'
  });
});

// @desc    Get product categories
// @route   GET /api/admin/products/categories
// @access  Private (Admin only)
const getProductCategories = asyncHandler(async (req, res, next) => {
  const categories = await Product.aggregate([
    {
      $match: {
        name: { $not: /^Dummy Product for/ }
      }
    },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: { categories }
  });
});

// @desc    Get categories with products count
// @route   GET /api/admin/products/categories-with-products
// @access  Private (Admin only)
const getCategoriesWithProducts = asyncHandler(async (req, res, next) => {
  const categories = await Product.aggregate([
    {
      $match: {
        name: { $not: /^Dummy Product for/ }
      }
    },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $match: { count: { $gt: 0 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: { categories: categories.map(cat => cat._id) }
  });
});

// @desc    Delete category
// @route   DELETE /api/admin/products/categories/:categoryName
// @access  Private (Admin only)
const deleteCategory = asyncHandler(async (req, res, next) => {
  const { categoryName } = req.params;

  // Check if category has real products (excluding placeholder and dummy products)
  const productCount = await Product.countDocuments({ 
    category: categoryName,
    $and: [
      { published: { $ne: false } },
      { archived: { $ne: true } },
      { name: { $not: /^Dummy Product for/ } },
      { name: { $not: /^Placeholder for/ } }
    ]
  });
  
  if (productCount > 0) {
    return next(new AppError(`Cannot delete category "${categoryName}" - it has ${productCount} products`, 400));
  }

  // Check if category exists
  const categoryExists = await Product.findOne({ category: categoryName });
  if (!categoryExists) {
    return next(new AppError('Category not found', 404));
  }

  // Delete all placeholder products with this category (including the one created for the category)
  const deleteResult = await Product.deleteMany({ 
    category: categoryName,
    $or: [
      { published: false },
      { archived: true },
      { name: /^Dummy Product for/ },
      { name: /^Placeholder for/ }
    ]
  });

  res.json({
    success: true,
    message: `Category "${categoryName}" deleted successfully`,
    data: { deletedCount: deleteResult.deletedCount }
  });
});

// @desc    Create new category
// @route   POST /api/admin/products/categories
// @access  Private (Admin only)
const createCategory = asyncHandler(async (req, res, next) => {
  const { categoryName } = req.body;

  if (!categoryName || categoryName.trim() === '') {
    return next(new AppError('Category name is required', 400));
  }

  // Check if category already exists
  const categoryExists = await Product.findOne({ category: categoryName.trim() });
  if (categoryExists) {
    return next(new AppError('Category already exists', 400));
  }

  // Create a placeholder product with this category to make it "exist"
  // This product is published but marked as a placeholder so it doesn't show in the store
  const placeholderProduct = new Product({
    name: `Placeholder for ${categoryName.trim()}`,
    category: categoryName.trim(),
    description: 'This is a placeholder product to create the category',
    sku: `PLACEHOLDER-${Date.now()}`,
    regularPrice: 0,
    stock: 0,
    published: true, // Published so it appears in categories
    archived: false, // Not archived so it appears in categories
    tags: ['placeholder', 'category-creation'] // Tag to identify placeholder products
  });

  await placeholderProduct.save();

  res.json({
    success: true,
    message: `Category "${categoryName.trim()}" created successfully`,
    data: { category: categoryName.trim() }
  });
});

// @desc    Update category name
// @route   PUT /api/admin/products/categories/:oldCategoryName
// @access  Private (Admin only)
const updateCategory = asyncHandler(async (req, res, next) => {
  const { oldCategoryName } = req.params;
  const { newCategoryName } = req.body;

  if (!newCategoryName || newCategoryName.trim() === '') {
    return next(new AppError('New category name is required', 400));
  }

  // Check if old category exists
  const oldCategoryExists = await Product.findOne({ category: oldCategoryName });
  if (!oldCategoryExists) {
    return next(new AppError('Category not found', 404));
  }

  // Check if new category name already exists
  const newCategoryExists = await Product.findOne({ category: newCategoryName.trim() });
  if (newCategoryExists) {
    return next(new AppError('Category name already exists', 400));
  }

  // Update all products with the old category name (including dummy products)
  const result = await Product.updateMany(
    { category: oldCategoryName },
    { $set: { category: newCategoryName.trim() } }
  );

  res.json({
    success: true,
    message: `Category "${oldCategoryName}" updated to "${newCategoryName}" successfully`,
    data: { updatedCount: result.modifiedCount }
  });
});

// @desc    Bulk update products
// @route   PUT /api/admin/products/bulk
// @access  Private (Admin only)
const bulkUpdateProducts = asyncHandler(async (req, res, next) => {
  const { productIds, updates } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return next(new AppError('Product IDs are required', 400));
  }

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: updates }
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} products updated successfully`,
    data: { modifiedCount: result.modifiedCount }
  });

  // Emit real-time event for inventory insights
  const io = req.app.get('io');
  if (io) {
    io.emit('stockUpdated', {
      productIds: productIds,
      modifiedCount: result.modifiedCount,
      updates: updates,
      timestamp: new Date()
    });
    console.log('📡 Emitted stockUpdated event for real-time updates');
  }
});

// @desc    Get inventory statistics
// @route   GET /api/admin/products/inventory-stats
// @access  Private (Admin only)
const getInventoryStats = asyncHandler(async (req, res, next) => {
  const totalProducts = await Product.countDocuments({ archived: false });
  const lowStockProducts = await Product.find({ 
    $expr: { 
      $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', '$lowStockThreshold'] }
      ]
    },
    archived: false 
  });
  const outOfStockProducts = await Product.find({ 
    stock: 0, 
    archived: false 
  });
  
  // Calculate total inventory value
  const products = await Product.find({ archived: false });
  const totalValue = products.reduce((sum, product) => {
    return sum + (product.stock * product.regularPrice);
  }, 0);

  // Get top selling products (mock data for now)
  const topSellingProducts = await Product.find({ archived: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name salesCount totalSales');

  // Get slow moving products (mock data for now)
  const slowMovingProducts = await Product.find({ archived: false })
    .sort({ createdAt: 1 })
    .limit(5)
    .select('name salesCount totalSales');

  res.json({
    success: true,
    data: {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalValue,
      lowStockProducts,
      outOfStockProducts,
      topSellingProducts,
      slowMovingProducts
    }
  });
});

// @desc    Get inventory insights analytics (debug version)
// @route   GET /api/admin/inventory-insights-debug
// @access  Public (for debugging)
const getInventoryInsightsDebug = asyncHandler(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  // Calculate date range based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  console.log(`🔍 DEBUG: Fetching inventory insights for period: ${period}, from: ${startDate.toISOString()}`);

  // Get basic counts first
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments({ archived: false });
  
  console.log(`📊 DEBUG: Total orders in database: ${totalOrders}`);
  console.log(`📦 DEBUG: Total products in database: ${totalProducts}`);
  
  // Calculate total units from all orders directly
  const allOrdersDebug = await Order.find({}).select('items status');
  let totalUnitsFromAllOrders = 0;
  let totalUnitsFromDeliveredOrders = 0;
  
  allOrdersDebug.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      const orderUnits = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      totalUnitsFromAllOrders += orderUnits;
      
      if (order.status === 'delivered') {
        totalUnitsFromDeliveredOrders += orderUnits;
      }
    }
  });
  
  console.log(`🔍 DEBUG: Total units from ALL orders: ${totalUnitsFromAllOrders}`);
  console.log(`🔍 DEBUG: Total units from DELIVERED orders: ${totalUnitsFromDeliveredOrders}`);
  console.log(`🔍 DEBUG: Total orders in database: ${allOrdersDebug.length}`);

  // Get revenue from delivered orders
  const deliveredOrdersWithTotal = await Order.find({ status: 'delivered' }).select('total');
  const totalRevenue = deliveredOrdersWithTotal.reduce((sum, order) => sum + (order.total || 0), 0);

  res.json({
    success: true,
    data: {
      period,
      summary: {
        totalProducts: totalProducts,
        totalRevenue: totalRevenue,
        totalUnitsSold: totalUnitsFromAllOrders, // Always use direct calculation for units sold
        avgOrderValue: allOrdersDebug.length > 0 ? (totalRevenue / allOrdersDebug.length) : 0
      },
      debug: {
        totalOrders,
        totalProducts,
        totalUnitsFromAllOrders,
        totalUnitsFromDeliveredOrders,
        totalRevenue,
        deliveredOrdersCount: deliveredOrdersWithTotal.length
      }
    }
  });
});

// @desc    Get inventory insights analytics
// @route   GET /api/admin/inventory-insights
// @access  Private (Admin only)
const getInventoryInsights = asyncHandler(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  // Import analytics service
  const analyticsService = require('../utils/analyticsService');
  
  // Calculate date range based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  console.log(`🔍 Fetching inventory insights for period: ${period}, from: ${startDate.toISOString()}`);

  // Get basic counts first
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments({ archived: false });
  
  console.log(`📊 Total orders in database: ${totalOrders}`);
  console.log(`📦 Total products in database: ${totalProducts}`);
  
  // Debug: Check recent orders
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).select('orderNumber createdAt status total items');
  console.log(`🔍 Recent orders:`, recentOrders.map(o => ({
    orderNumber: o.orderNumber,
    date: o.createdAt,
    status: o.status,
    total: o.total,
    itemsCount: o.items?.length || 0
  })));
  
  // Debug: Check order items structure
  if (recentOrders.length > 0) {
    console.log(`🔍 Sample order items structure:`, recentOrders[0].items?.map(item => ({
      name: item.name,
      product: item.product,
      productId: item.productId,
      price: item.price,
      quantity: item.quantity
    })));
  }

  // Debug: Calculate total units from all orders directly
  const allOrdersDebug = await Order.find({}).select('items status');
  let totalUnitsFromAllOrders = 0;
  let totalUnitsFromDeliveredOrders = 0;
  
  allOrdersDebug.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      const orderUnits = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      totalUnitsFromAllOrders += orderUnits;
      
      if (order.status === 'delivered') {
        totalUnitsFromDeliveredOrders += orderUnits;
      }
    }
  });
  
  console.log(`🔍 DIRECT CALCULATION - Total units from ALL orders: ${totalUnitsFromAllOrders}`);
  console.log(`🔍 DIRECT CALCULATION - Total units from DELIVERED orders: ${totalUnitsFromDeliveredOrders}`);
  console.log(`🔍 Total orders in database: ${allOrdersDebug.length}`);

  // If no orders exist, let's create a test order to verify the calculation works
  if (allOrdersDebug.length === 0) {
    console.log(`⚠️ No orders found in database. Creating a test order to verify calculation...`);
    
    // Find a user to create the test order
    const testUser = await User.findOne();
    if (testUser) {
      const testOrder = new Order({
        user: testUser._id,
        items: [
          {
            name: 'Test Product 1',
            price: 100,
            quantity: 2,
            productId: 'test-product-1'
          },
          {
            name: 'Test Product 2', 
            price: 50,
            quantity: 3,
            productId: 'test-product-2'
          }
        ],
        shippingAddress: {
          fullName: 'Test User',
          address: 'Test Address',
          city: 'Test City',
          postalCode: '12345',
          country: 'Test Country'
        },
        subtotal: 350,
        total: 350,
        status: 'delivered'
      });
      
      await testOrder.save();
      console.log(`✅ Created test order with 5 total units (2 + 3)`);
      
      // Recalculate after creating test order
      const newAllOrdersDebug = await Order.find({}).select('items status');
      const newTotalUnits = newAllOrdersDebug.reduce((sum, order) => {
        if (order.items && Array.isArray(order.items)) {
          return sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
        }
        return sum;
      }, 0);
      
      console.log(`🔍 NEW CALCULATION after test order - Total units: ${newTotalUnits}`);
      totalUnitsFromAllOrders = newTotalUnits;
    }
  }

  // Get product sales data from orders - ONLY from current store products
  const productSalesData = await Order.aggregate([
    {
      $match: {
        // Include all orders regardless of date and status
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: { $ifNull: ['$items.product', '$items.productId'] }, // Handle both ObjectId and String product IDs
        productName: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 },
        avgPrice: { $avg: '$items.price' },
        productIdType: { $first: { $type: '$items.product' } } // Track if it's ObjectId or String
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productByStringId',
        let: { productId: { $toString: '$_id' } },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$productId'] } } }
        ]
      }
    },
    {
      $addFields: {
        product: {
          $cond: {
            if: { $gt: [{ $size: '$product' }, 0] },
            then: { $arrayElemAt: ['$product', 0] },
            else: { $arrayElemAt: ['$productByStringId', 0] }
          }
        }
      }
    },
    // STRICT FILTERING: Only include products that exist in current store catalog
    { $match: { product: { $exists: true, $ne: null } } },
    { $match: { 'product.archived': { $ne: true } } },
    // Additional validation: ensure product name matches store product
    {
      $lookup: {
        from: 'products',
        localField: 'productName',
        foreignField: 'name',
        as: 'nameMatch'
      }
    },
    { $match: { nameMatch: { $ne: [] } } },
    {
      $project: {
        productId: '$_id',
        productName: 1,
        category: '$product.category',
        currentStock: '$product.stock',
        totalSold: 1,
        totalRevenue: 1,
        orderCount: 1,
        avgPrice: 1,
        stockTurnover: { $divide: ['$totalSold', '$product.stock'] }
      }
    }
  ]);

  console.log(`📈 Product sales data found: ${productSalesData.length} products with sales`);
  if (productSalesData.length > 0) {
    console.log(`📈 Sample sales data:`, productSalesData.slice(0, 3).map(item => ({
      productName: item.productName,
      totalSold: item.totalSold,
      totalRevenue: item.totalRevenue,
      category: item.category,
      productId: item.productId
    })));
  } else {
    console.log(`⚠️ No product sales data found - this might be the issue!`);
    
    // Let's try a simpler aggregation to see what's happening
    console.log(`🔍 Trying simpler aggregation...`);
    const simpleAggregation = await Order.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
    console.log(`🔍 Simple aggregation result:`, simpleAggregation);
  }

  // Calculate slow-moving products (products with low sales relative to stock)
  let slowMovingProducts = [];
  
  if (productSalesData.length > 0) {
    // Use actual sales data
    slowMovingProducts = productSalesData
      .filter(item => item.currentStock > 0)
      .map(item => ({
        ...item,
        salesVelocity: item.totalSold / Math.max(1, 30), // sales per day (using 30 days as default)
        stockTurnover: item.stockTurnover || 0
      }))
      .sort((a, b) => a.salesVelocity - b.salesVelocity)
      .slice(0, 10);
  } else {
    // Fallback: Get products with low sales or no sales
    console.log(`⚠️ No sales data found - using fallback for slow-moving products`);
    
    // Get all products and calculate slow-moving based on stock vs sales
    const allProducts = await Product.find({ 
      archived: false, 
      published: true,
      stock: { $gt: 0 }
    }).select('name category stock regularPrice salesCount totalRevenue createdAt');
    
    // Get sales data from orders for these products
    const productSalesFromOrders = await Order.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 }
      }},
      { $sort: { totalSold: 1 } } // Sort by lowest sales first
    ]);
    
    // Match products with their sales data
    slowMovingProducts = allProducts.map(product => {
      const salesData = productSalesFromOrders.find(sale => 
        sale._id.toLowerCase().includes(product.name.toLowerCase()) ||
        product.name.toLowerCase().includes(sale._id.toLowerCase())
      );
      
      const totalSold = salesData ? salesData.totalSold : 0;
      const totalRevenue = salesData ? salesData.totalRevenue : 0;
      const daysSinceCreated = Math.max(1, (now - product.createdAt) / (1000 * 60 * 60 * 24));
      const salesVelocity = totalSold / daysSinceCreated;
      const stockTurnover = product.stock > 0 ? totalSold / product.stock : 0;
      
      return {
        productId: product._id,
        productName: product.name,
        category: product.category,
        currentStock: product.stock,
        totalSold,
        totalRevenue,
        salesVelocity,
        stockTurnover,
        avgPrice: product.regularPrice,
        daysSinceCreated: Math.round(daysSinceCreated)
      };
    })
    .filter(item => item.currentStock > 0) // Only products with stock
    .sort((a, b) => a.salesVelocity - b.salesVelocity) // Sort by lowest sales velocity
    .slice(0, 10);
    
    console.log(`🐌 Slow-moving products calculated: ${slowMovingProducts.length} products`);
    if (slowMovingProducts.length > 0) {
      console.log(`🐌 Sample slow-moving products:`, slowMovingProducts.slice(0, 3).map(item => ({
        productName: item.productName,
        totalSold: item.totalSold,
        currentStock: item.currentStock,
        salesVelocity: item.salesVelocity.toFixed(2),
        stockTurnover: item.stockTurnover.toFixed(2)
      })));
    }
  }

  // Get fast-moving products using analytics service
  const fastMovingProducts = await analyticsService.getFastMovingProducts(period, 10);
  
  console.log(`🚀 Fast-moving products:`, fastMovingProducts.map(p => ({
    name: p.productName,
    sold: p.totalSold,
    revenue: p.totalRevenue
  })));
  
  // If no sales data from analytics service, try simple aggregation
  let finalFastMovingProducts = fastMovingProducts;
  if (fastMovingProducts.length === 0) {
    console.log(`⚠️ No sales data from analytics service, trying simple approach...`);
    
    // Try simple aggregation without product lookup
    const simpleSalesData = await Order.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        productName: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        avgPrice: { $avg: '$items.price' }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 8 }
    ]);
    
    if (simpleSalesData.length > 0) {
      console.log(`✅ Found sales data using simple aggregation:`, simpleSalesData);
      finalFastMovingProducts = simpleSalesData.map(item => ({
        ...item,
        category: 'Unknown', // We don't have category from simple aggregation
        currentStock: 0 // We don't have stock info from simple aggregation
      }));
    } else {
      console.log(`⚠️ No sales data found - returning empty array instead of dummy data`);
      // Return empty array instead of dummy data
      finalFastMovingProducts = [];
    }
  }


  // Get category performance using analytics service
  let categoryPerformance = await analyticsService.getCategoryPerformance(period);
  
  // If no category data from analytics service, create from simple aggregation
  if (!categoryPerformance || categoryPerformance.length === 0) {
    console.log('🔄 Creating category performance from simple aggregation...');
    const simpleCategoryData = await Order.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { totalSold: -1 } }
    ]);
    
    // Group by category (simplified - using product name as category for now)
    const categoryMap = {};
    simpleCategoryData.forEach(item => {
      const category = item._id; // Using product name as category for now
      if (!categoryMap[category]) {
        categoryMap[category] = {
          category: category,
          totalSold: 0,
          totalRevenue: 0,
          uniqueProducts: 0
        };
      }
      categoryMap[category].totalSold += item.totalSold;
      categoryMap[category].totalRevenue += item.totalRevenue;
      categoryMap[category].uniqueProducts += 1;
    });
    
    categoryPerformance = Object.values(categoryMap).sort((a, b) => b.totalSold - a.totalSold);
    console.log('📊 Created category performance from simple data:', categoryPerformance.length, 'categories');
  }

  // Get stock alerts
  const stockAlerts = await Product.find({
    archived: false,
    $or: [
      { stock: 0 },
      { $expr: { $lte: ['$stock', '$lowStockThreshold'] } }
    ]
  })
  .select('name category stock lowStockThreshold regularPrice')
  .sort({ stock: 1 });

  // Calculate inventory turnover ratio
  const inventoryTurnover = productSalesData.map(item => ({
    productId: item.productId,
    productName: item.productName,
    category: item.category,
    totalSold: item.totalSold,
    currentStock: item.currentStock,
    turnoverRatio: item.currentStock > 0 ? (item.totalSold / item.currentStock) : 0,
    daysToSellOut: item.currentStock > 0 ? (item.currentStock / Math.max(1, item.totalSold / Math.max(1, 30))) : 0
  }));

  // Calculate summary with better handling
  // Inventory insights revenue should also be based on delivered orders only
  const totalRevenue = productSalesData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  const totalUnitsSold = productSalesData.reduce((sum, item) => sum + (item.totalSold || 0), 0);
  const totalOrderCount = productSalesData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
  const avgOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;
  
  // Use the direct calculation we already did above
  let fallbackRevenue = 0;
  let fallbackOrderCount = allOrdersDebug.length;
  let fallbackUnitsSold = totalUnitsFromAllOrders;
  
  // Get revenue from delivered orders
  const deliveredOrdersWithTotal = await Order.find({ status: 'delivered' }).select('total');
  fallbackRevenue = deliveredOrdersWithTotal.reduce((sum, order) => sum + (order.total || 0), 0);
  
  console.log(`🔄 Using DIRECT calculation - Total revenue: ${fallbackRevenue}, Order count: ${fallbackOrderCount}, Units sold: ${fallbackUnitsSold}`);
  console.log(`🔄 Delivered orders: ${deliveredOrdersWithTotal.length}, All orders: ${allOrdersDebug.length}`);

  console.log(`💰 Summary calculations:`);
  console.log(`   Total Revenue: ${totalRevenue}`);
  console.log(`   Total Units Sold: ${totalUnitsSold}`);
  console.log(`   Total Order Count: ${totalOrderCount}`);
  console.log(`   Avg Order Value: ${avgOrderValue}`);
  console.log(`   Fallback Units Sold: ${fallbackUnitsSold}`);
  console.log(`   Final Units Sold: ${fallbackUnitsSold > 0 ? fallbackUnitsSold : totalUnitsSold}`);
  console.log(`📊 Category Performance Data:`, categoryPerformance);

  res.json({
    success: true,
    data: {
      period,
      summary: {
        totalProducts: totalProducts, // Use actual product count, not just sold products
        totalRevenue: fallbackRevenue, // Always use direct calculation for revenue
        totalUnitsSold: fallbackUnitsSold, // Always use direct calculation for units sold
        avgOrderValue: fallbackOrderCount > 0 ? (fallbackRevenue / fallbackOrderCount) : 0
      },
      slowMovingProducts,
      fastMovingProducts: finalFastMovingProducts,
      categoryPerformance,
      stockAlerts,
      inventoryTurnover: inventoryTurnover.sort((a, b) => b.turnoverRatio - a.turnoverRatio)
    }
  });
});

// @desc    Recalculate analytics
// @route   POST /api/admin/analytics/recalculate
// @access  Private (Admin only)
const recalculateAnalytics = asyncHandler(async (req, res, next) => {
  try {
    const analyticsService = require('../utils/analyticsService');
    const result = await analyticsService.recalculateAllAnalytics();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Analytics recalculated successfully. Processed ${result.processedOrders} orders.`,
        data: result
      });
    } else {
      return next(new AppError(`Failed to recalculate analytics: ${result.error}`, 500));
    }
  } catch (error) {
    console.error('Error recalculating analytics:', error);
    return next(new AppError('Failed to recalculate analytics', 500));
  }
});

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
const getNotifications = asyncHandler(async (req, res, next) => {
  // Mock notifications for now
  const notifications = [
    {
      id: 1,
      type: 'low_stock',
      message: '5 products are running low on stock',
      timestamp: new Date(),
      read: false
    },
    {
      id: 2,
      type: 'out_of_stock',
      message: '2 products are out of stock',
      timestamp: new Date(),
      read: false
    }
  ];

  res.json({
    success: true,
    data: notifications
  });
});

// @desc    Get product reviews
// @route   GET /api/admin/products/reviews
// @access  Private (Admin only)
const getProductReviews = asyncHandler(async (req, res, next) => {
  // Mock reviews for now
  const reviews = [
    {
      _id: 1,
      productName: 'Garden Trowel',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      rating: 5,
      comment: 'Great quality tool!',
      status: 'pending',
      createdAt: new Date()
    },
    {
      _id: 2,
      productName: 'Plant Pot',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      rating: 4,
      comment: 'Good pot, fast delivery',
      status: 'approved',
      createdAt: new Date()
    }
  ];

  res.json({
    success: true,
    data: reviews
  });
});

// @desc    Approve or reject review
// @route   PUT /api/admin/products/reviews/:id/:action
// @access  Private (Admin only)
const handleReviewAction = asyncHandler(async (req, res, next) => {
  const { id, action } = req.params;
  
  // Mock implementation
  res.json({
    success: true,
    message: `Review ${action}ed successfully`
  });
});

// @desc    Bulk edit products
// @route   PUT /api/admin/products/bulk-edit
// @access  Private (Admin only)
const bulkEditProducts = asyncHandler(async (req, res, next) => {
  const { productIds, updates } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return next(new AppError('Product IDs are required', 400));
  }

  // Handle price adjustments
  if (updates.priceAdjustment) {
    const products = await Product.find({ _id: { $in: productIds } });
    
    for (const product of products) {
      if (updates.priceAdjustmentType === 'percentage') {
        product.regularPrice = product.regularPrice * (1 + updates.priceAdjustment / 100);
      } else {
        product.regularPrice = product.regularPrice + updates.priceAdjustment;
      }
      await product.save();
    }
  }

  // Handle stock adjustments
  if (updates.stockAdjustment) {
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $inc: { stock: updates.stockAdjustment } }
    );
  }

  res.json({
    success: true,
    message: `${productIds.length} products updated successfully`
  });
});

// @desc    Upload CSV file
// @route   POST /api/admin/products/upload-csv
// @access  Private (Admin only)
const uploadCSV = asyncHandler(async (req, res, next) => {
  console.log('CSV Upload Request:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    hasFile: !!req.file,
    fileInfo: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : null
  });
  
  if (!req.file) {
    console.log('No file uploaded');
    return next(new AppError('No file uploaded', 400));
  }

  console.log('File received:', req.file.path);

  const fs = require('fs');
  const path = require('path');
  const results = [];
  let processedCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    console.log('Starting file parsing...');
    
    // Check file extension to determine parsing method
    const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
    
    if (fileExtension === '.csv') {
      // Parse CSV file
      const csv = require('csv-parser');
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => {
            console.log('CSV row:', data);
            results.push(data);
          })
          .on('end', () => {
            console.log('CSV parsing completed, rows:', results.length);
            resolve();
          })
          .on('error', reject);
      });
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel file
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log('Excel parsing completed, rows:', jsonData.length);
      results.push(...jsonData);
    } else {
      throw new Error('Unsupported file format');
    }

    // Validate that we have data to process
    if (results.length === 0) {
      throw new Error('No data found in file');
    }

    // Process each row
    for (const row of results) {
      try {
        // Skip empty rows
        if (!row || Object.keys(row).length === 0) {
          continue;
        }

        // Validate required fields
        const requiredFields = ['name', 'category', 'description', 'sku', 'regularPrice', 'stock'];
        const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');
        
        if (missingFields.length > 0) {
          errors.push(`Row ${processedCount + errorCount + 1}: Missing required fields: ${missingFields.join(', ')}`);
          errorCount++;
          continue;
        }

        // Validate data types and ranges
        const regularPrice = parseFloat(row.regularPrice);
        const stock = parseInt(row.stock);
        
        if (isNaN(regularPrice) || regularPrice <= 0) {
          errors.push(`Row ${processedCount + errorCount + 1}: Invalid regularPrice (must be a positive number)`);
          errorCount++;
          continue;
        }

        if (isNaN(stock) || stock < 0) {
          errors.push(`Row ${processedCount + errorCount + 1}: Invalid stock (must be a non-negative number)`);
          errorCount++;
          continue;
        }

        // Validate SKU format (alphanumeric, 3-20 characters)
        const sku = row.sku.trim().toUpperCase();
        if (!/^[A-Z0-9]{3,20}$/.test(sku)) {
          errors.push(`Row ${processedCount + errorCount + 1}: Invalid SKU format (must be 3-20 alphanumeric characters)`);
          errorCount++;
          continue;
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ sku: sku });
        if (existingProduct) {
          errors.push(`Row ${processedCount + errorCount + 1}: SKU ${sku} already exists`);
          errorCount++;
          continue;
        }

        // Validate discount price if provided
        if (row.discountPrice) {
          const discountPrice = parseFloat(row.discountPrice);
          if (isNaN(discountPrice) || discountPrice < 0 || discountPrice >= regularPrice) {
            errors.push(`Row ${processedCount + errorCount + 1}: Invalid discountPrice (must be a positive number less than regularPrice)`);
            errorCount++;
            continue;
          }
        }

        // Process image URLs from image1, image2, image3 columns
        const images = [];
        const imageColumns = ['image1', 'image2', 'image3'];
        
        for (const col of imageColumns) {
          if (row[col] && row[col].toString().trim() !== '') {
            const imageUrl = row[col].toString().trim();
            // Basic URL validation
            try {
              new URL(imageUrl);
              images.push(imageUrl);
            } catch (error) {
              // Invalid URL, skip this image
              console.warn(`Invalid image URL in ${col}: ${imageUrl}`);
            }
          }
        }
        
        // If no valid images provided, use default placeholder
        if (images.length === 0) {
          // Use inline SVG placeholder to avoid external network dependency
          images.push('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNlZWYiLz48dGV4dCB4PSIyMDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==');
        }

        // Prepare product data using validated values
        const productData = {
          name: row.name.trim(),
          category: row.category.trim(),
          description: row.description.trim(),
          sku: sku,
          regularPrice: regularPrice,
          stock: stock,
          lowStockThreshold: parseInt(row.lowStockThreshold) || 10,
          featured: row.featured === 'true' || row.featured === '1' || row.featured === true,
          published: row.published !== 'false' && row.published !== '0' && row.published !== false,
          tags: row.tags ? row.tags.split(',').map(tag => tag.trim().toLowerCase()) : [],
          weight: row.weight ? parseFloat(row.weight) : null,
          dimensions: {
            length: row.length ? parseFloat(row.length) : null,
            width: row.width ? parseFloat(row.width) : null,
            height: row.height ? parseFloat(row.height) : null
          },
          images: images
        };

        // Add discount price if provided and valid
        if (row.discountPrice) {
          const discountPrice = parseFloat(row.discountPrice);
          if (!isNaN(discountPrice) && discountPrice > 0 && discountPrice < regularPrice) {
            productData.discountPrice = discountPrice;
          }
        }

        // Create product
        console.log('Creating product:', productData);
        await Product.create(productData);
        processedCount++;
        console.log('Product created successfully, total processed:', processedCount);

      } catch (error) {
        errors.push(`Row ${processedCount + errorCount + 1}: ${error.message}`);
        errorCount++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log('File processing completed:', {
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors
    });

    res.json({
      success: true,
      message: `File processed successfully. ${processedCount} products created, ${errorCount} errors`,
      data: { 
        processed: processedCount,
        errors: errorCount,
        errorDetails: errors
      }
    });

  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return next(new AppError(`Error processing file: ${error.message}`, 500));
  }
});

// @desc    Create discount
// @route   POST /api/admin/products/discounts
// @access  Private (Admin only)
const createDiscount = asyncHandler(async (req, res, next) => {
  const {
    name,
    type,
    value,
    applicableTo,
    category,
    products,
    startDate,
    endDate,
    usageLimit,
    minOrderValue,
    maxDiscountAmount,
    description
  } = req.body;

  // Validate required fields
  if (!name || !type || !value || !applicableTo || !startDate || !endDate) {
    return next(new AppError('Missing required fields', 400));
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start < now) {
    return next(new AppError('Start date must be in the future', 400));
  }

  if (end <= start) {
    return next(new AppError('End date must be after start date', 400));
  }

  // Validate value based on type
  if (type === 'percentage' && (value < 0 || value > 100)) {
    return next(new AppError('Percentage discount must be between 0-100', 400));
  }

  if (type === 'fixed' && value < 0) {
    return next(new AppError('Fixed discount must be positive', 400));
  }

  // Validate applicableTo specific requirements
  if (applicableTo === 'category' && !category) {
    return next(new AppError('Category is required when applicableTo is category', 400));
  }

  if (applicableTo === 'products' && (!products || !Array.isArray(products) || products.length === 0)) {
    return next(new AppError('Products are required when applicableTo is products', 400));
  }

  // Create discount
  const discount = await Discount.create({
    name,
    type,
    value,
    applicableTo,
    category: applicableTo === 'category' ? category : undefined,
    products: applicableTo === 'products' ? products : undefined,
    startDate: start,
    endDate: end,
    usageLimit,
    minOrderValue: minOrderValue || 0,
    maxDiscountAmount,
    description,
    createdBy: req.user._id,
    autoApplied: false,
    autoRemoved: false,
    appliedProducts: []
  });

  // If discount starts immediately, apply it automatically
  if (start <= new Date()) {
    try {
      await discount.autoApplyToProducts();
    } catch (error) {
      console.error('Error auto-applying discount:', error);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Discount created successfully',
    data: { discount }
  });
});

// @desc    Get all discounts
// @route   GET /api/admin/products/discounts
// @access  Private (Admin only)
const getAllDiscounts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const { status, search } = req.query;

  let query = {};

  // Filter by status
  if (status) {
    const now = new Date();
    switch (status) {
      case 'active':
        query = {
          active: true,
          startDate: { $lte: now },
          endDate: { $gte: now }
        };
        break;
      case 'scheduled':
        query = {
          active: true,
          startDate: { $gt: now }
        };
        break;
      case 'expired':
        query = {
          endDate: { $lt: now }
        };
        break;
      case 'inactive':
        query = { active: false };
        break;
    }
  }

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const discounts = await Discount.find(query)
    .populate('createdBy', 'name email')
    .populate('products', 'name sku')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Discount.countDocuments(query);

  res.json({
    success: true,
    data: {
      discounts,
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

// @desc    Get single discount
// @route   GET /api/admin/products/discounts/:id
// @access  Private (Admin only)
const getDiscount = asyncHandler(async (req, res, next) => {
  const discount = await Discount.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('products', 'name sku category');

  if (!discount) {
    return next(new AppError('Discount not found', 404));
  }

  res.json({
    success: true,
    data: { discount }
  });
});

// @desc    Update discount
// @route   PUT /api/admin/products/discounts/:id
// @access  Private (Admin only)
const updateDiscount = asyncHandler(async (req, res, next) => {
  const discount = await Discount.findById(req.params.id);

  if (!discount) {
    return next(new AppError('Discount not found', 404));
  }

  const {
    name,
    type,
    value,
    applicableTo,
    category,
    products,
    startDate,
    endDate,
    active,
    usageLimit,
    minOrderValue,
    maxDiscountAmount,
    description
  } = req.body;

  // Validate dates if provided
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : discount.startDate;
    const end = endDate ? new Date(endDate) : discount.endDate;

    if (end <= start) {
      return next(new AppError('End date must be after start date', 400));
    }
  }

  // Update fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (value !== undefined) updateData.value = value;
  if (applicableTo !== undefined) updateData.applicableTo = applicableTo;
  if (category !== undefined) updateData.category = category;
  if (products !== undefined) updateData.products = products;
  if (startDate !== undefined) updateData.startDate = new Date(startDate);
  if (endDate !== undefined) updateData.endDate = new Date(endDate);
  if (active !== undefined) updateData.active = active;
  if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
  if (minOrderValue !== undefined) updateData.minOrderValue = minOrderValue;
  if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
  if (description !== undefined) updateData.description = description;

  const updatedDiscount = await Discount.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email').populate('products', 'name sku');

  res.json({
    success: true,
    message: 'Discount updated successfully',
    data: { discount: updatedDiscount }
  });
});

// @desc    Delete discount
// @route   DELETE /api/admin/products/discounts/:id
// @access  Private (Admin only)
const deleteDiscount = asyncHandler(async (req, res, next) => {
  const discount = await Discount.findById(req.params.id);

  if (!discount) {
    return next(new AppError('Discount not found', 404));
  }

  // Check if discount is currently active
  if (discount.isApplicable()) {
    return next(new AppError('Cannot delete active discount. Deactivate it first.', 400));
  }

  await Discount.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Discount deleted successfully'
  });
});

// @desc    Apply discount to product
// @route   PUT /api/admin/products/:id/discount
// @access  Private (Admin only)
const applyDiscountToProduct = asyncHandler(async (req, res, next) => {
  const { discountId, appliedBy = 'manual' } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const discount = await Discount.findById(discountId);
  if (!discount) {
    return next(new AppError('Discount not found', 404));
  }

  // Check if discount applies to this product
  if (!discount.appliesToProduct(product._id, product.category)) {
    return next(new AppError('Discount does not apply to this product', 400));
  }

  // Add discount using the new method
  const added = product.addDiscount(discount, appliedBy);
  
  if (!added) {
    return next(new AppError('Discount already applied to this product', 400));
  }

  await product.save();

  res.json({
    success: true,
    message: 'Discount applied to product successfully',
    data: { 
      product,
      finalPrice: product.finalPrice,
      totalDiscounts: product.appliedDiscounts.length
    }
  });
});

// @desc    Remove discount from product
// @route   DELETE /api/admin/products/:id/discount/:discountId
// @access  Private (Admin only)
const removeDiscountFromProduct = asyncHandler(async (req, res, next) => {
  const { discountId } = req.params;
  
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Remove specific discount using the new method
  const removed = product.removeDiscount(discountId);
  
  if (!removed) {
    return next(new AppError('Discount not found on this product', 404));
  }

  await product.save();

  res.json({
    success: true,
    message: 'Discount removed from product successfully',
    data: { 
      product,
      finalPrice: product.finalPrice,
      remainingDiscounts: product.appliedDiscounts.length
    }
  });
});

// @desc    Apply category-based discounts to all products in category
// @route   POST /api/admin/discounts/:id/apply-to-category
// @access  Private (Admin only)
const applyDiscountToCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.body;

  const discount = await Discount.findById(req.params.id);
  if (!discount) {
    return next(new AppError('Discount not found', 404));
  }

  if (discount.applicableTo !== 'category') {
    return next(new AppError('This discount is not applicable to categories', 400));
  }

  if (discount.category !== category) {
    return next(new AppError('Discount category does not match specified category', 400));
  }

  // Find all products in the category
  const products = await Product.find({ 
    category: category,
    published: true,
    archived: false 
  });

  let appliedCount = 0;
  let skippedCount = 0;

  // Apply discount to each product
  for (const product of products) {
    const added = product.addDiscount(discount, 'category');
    if (added) {
      appliedCount++;
      await product.save();
    } else {
      skippedCount++;
    }
  }

  res.json({
    success: true,
    message: `Discount applied to ${appliedCount} products, ${skippedCount} already had this discount`,
    data: {
      appliedCount,
      skippedCount,
      totalProducts: products.length,
      discountId: discount._id,
      category
    }
  });
});

// @desc    Get upcoming discounts for products
// @route   GET /api/admin/products/upcoming-discounts
// @access  Private (Admin only)
const getUpcomingDiscounts = asyncHandler(async (req, res) => {
  const { category, limit = 50 } = req.query;
  const now = new Date();
  
  // Find discounts that are scheduled to start in the future or recently started
  const upcomingDiscounts = await Discount.find({
    active: true,
    startDate: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Include discounts from last 24 hours
    endDate: { $gt: now },
    autoRemoved: false
  })
  .populate('appliedProducts.productId', 'name category regularPrice sku')
  .sort({ startDate: 1 })
  .limit(parseInt(limit));

  // Process discounts and get affected products
  const affectedProducts = [];
  
  for (const discount of upcomingDiscounts) {
    let products = [];
    let productCount = 0;
    
    // If discount has already been applied, get the applied products
    if (discount.autoApplied && discount.appliedProducts.length > 0) {
      products = discount.appliedProducts
        .filter(ap => !ap.removedAt)
        .map(ap => ap.productId)
        .filter(Boolean); // Remove null/undefined products
      productCount = products.length;
    } else {
      // Get products that will be affected
      let productQuery = { published: true, archived: false };
      
      switch (discount.applicableTo) {
        case 'all':
          // All products
          break;
        case 'category':
          productQuery.category = discount.category;
          break;
        case 'products':
          productQuery._id = { $in: discount.products };
          break;
      }
      
      const dbProducts = await Product.find(productQuery)
        .select('name category regularPrice sku')
        .limit(20); // Limit products per discount for performance
      
      products = dbProducts;
      productCount = dbProducts.length;
    }
    
    affectedProducts.push({
      discount: {
        _id: discount._id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        startDate: discount.startDate,
        endDate: discount.endDate,
        applicableTo: discount.applicableTo,
        category: discount.category,
        autoApplied: discount.autoApplied,
        appliedCount: discount.appliedProducts.filter(ap => !ap.removedAt).length,
        status: discount.status
      },
      products: products,
      productCount: productCount
    });
  }

  res.json({
    success: true,
    data: {
      upcomingDiscounts: affectedProducts,
      total: upcomingDiscounts.length
    }
  });
});

// @desc    Get available discounts for product
// @route   GET /api/admin/products/:id/available-discounts
// @access  Private (Admin only)
const getAvailableDiscountsForProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const now = new Date();
  const discounts = await Discount.find({
    active: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { applicableTo: 'all' },
      { applicableTo: 'category', category: product.category },
      { applicableTo: 'products', products: product._id }
    ]
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { discounts }
  });
});

// @desc    Send custom email to order customer
// @route   POST /api/admin/orders/:id/send-email
// @access  Private (Admin only)
const sendOrderEmail = asyncHandler(async (req, res, next) => {
  const { content, subject = 'Order Update' } = req.body;
  const orderId = req.params.id;

  if (!content || !content.trim()) {
    return next(new AppError('Email content is required', 400));
  }

  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (!order.user || !order.user.email) {
    return next(new AppError('Customer email not found for this order', 400));
  }

  try {
    await sendEmailNotification(
      order.user.email,
      subject,
      content,
      order.user.name || 'Customer'
    );

    res.json({
      success: true,
      message: 'Email sent successfully to customer'
    });
  } catch (error) {
    console.error('Error sending order email:', error);
    return next(new AppError('Failed to send email', 500));
  }
});

// @desc    Send order status update notification
// @route   POST /api/admin/orders/send-notification
// @access  Private (Admin only)
const sendOrderStatusNotification = asyncHandler(async (req, res, next) => {
  const { orderId, type, status } = req.body;

  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (!order.user || !order.user.email) {
    return next(new AppError('Customer email not found for this order', 400));
  }

  let subject, message;

  if (type === 'status_update') {
    subject = `Order Status Update - Order #${order.orderNumber}`;
    message = `Hello ${order.user.name || 'Customer'}!

Your order #${order.orderNumber} status has been updated to: ${status.toUpperCase()}

Order Details:
- Order Number: ${order.orderNumber}
- Total Amount: ₹${order.total}
- Items: ${order.items.length} item(s)
- Status: ${status.toUpperCase()}

${status === 'shipped' ? 'Your order is now on its way to you!' : ''}
${status === 'delivered' ? 'Your order has been delivered successfully!' : ''}
${status === 'cancelled' ? 'Your order has been cancelled. If you have any questions, please contact our support team.' : ''}

Thank you for choosing UrbanSprout!`;
  } else {
    subject = `Order Update - Order #${order.orderNumber}`;
    message = `Hello ${order.user.name || 'Customer'}!

This is an update regarding your order #${order.orderNumber}.

Thank you for choosing UrbanSprout!`;
  }

  try {
    await sendEmailNotification(
      order.user.email,
      subject,
      message,
      order.user.name || 'Customer'
    );

    res.json({
      success: true,
      message: 'Status update notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending status notification:', error);
    return next(new AppError('Failed to send notification', 500));
  }
});

// ==================== PLANT SUGGESTIONS MANAGEMENT ====================

// @desc    Get all plant suggestions with pagination and filters
// @route   GET /api/admin/plant-suggestions
// @access  Private (Admin only)
const getAllPlantSuggestions = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search, space, sunlight, experience, time, purpose, isActive } = req.query;
  const { skip } = req.pagination;

  let query = {};

  // Search filter
  if (search) {
    query.$or = [
      { combinationKey: { $regex: search, $options: 'i' } },
      { recommendationMessage: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by combination parameters
  if (space) query.space = space;
  if (sunlight) query.sunlight = sunlight;
  if (experience) query.experience = experience;
  if (time) query.time = time;
  if (purpose) query.purpose = purpose;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const plantSuggestions = await PlantSuggestion.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PlantSuggestion.countDocuments(query);

  res.json({
    success: true,
    data: {
      plantSuggestions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});


// @desc    Get single plant suggestion
// @route   GET /api/admin/plant-suggestions/:id
// @access  Private (Admin only)
const getPlantSuggestion = asyncHandler(async (req, res, next) => {
  const plantSuggestion = await PlantSuggestion.findById(req.params.id);

  if (!plantSuggestion) {
    return next(new AppError('Plant suggestion not found', 404));
  }

  res.json({
    success: true,
    data: { plantSuggestion }
  });
});

// @desc    Create new plant suggestion
// @route   POST /api/admin/plant-suggestions
// @access  Private (Admin only)
const createPlantSuggestion = asyncHandler(async (req, res, next) => {
  const {
    space,
    sunlight,
    experience,
    time,
    purpose,
    plants,
    recommendationMessage
  } = req.body;

  // Validate required fields
  if (!space || !sunlight || !experience || !time || !purpose) {
    return next(new AppError('All combination parameters are required: space, sunlight, experience, time, purpose', 400));
  }

  if (!plants || !Array.isArray(plants) || plants.length === 0) {
    return next(new AppError('At least one plant is required', 400));
  }

  if (plants.length > 9) {
    return next(new AppError('Maximum 9 plants allowed per combination', 400));
  }

  if (!recommendationMessage || recommendationMessage.trim() === '') {
    return next(new AppError('Recommendation message is required', 400));
  }

  // Validate plant data
  for (let i = 0; i < plants.length; i++) {
    const plant = plants[i];
    if (!plant.name || !plant.description || !plant.image) {
      return next(new AppError(`Plant ${i + 1}: name, description, and image are required`, 400));
    }
  }

  // Check if combination already exists
  const combinationKey = `${space}_${sunlight}_${experience}_${time}_${purpose}`;
  const existingSuggestion = await PlantSuggestion.findOne({ combinationKey });
  
  if (existingSuggestion) {
    return next(new AppError('This combination already exists', 400));
  }

  const plantSuggestion = await PlantSuggestion.create({
    space,
    sunlight,
    experience,
    time,
    purpose,
    plants,
    recommendationMessage: recommendationMessage.trim(),
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: 'Plant suggestion created successfully',
    data: { plantSuggestion }
  });
});

// @desc    Update plant suggestion
// @route   PUT /api/admin/plant-suggestions/:id
// @access  Private (Admin only)
const updatePlantSuggestion = asyncHandler(async (req, res, next) => {
  const plantSuggestion = await PlantSuggestion.findById(req.params.id);

  if (!plantSuggestion) {
    return next(new AppError('Plant suggestion not found', 404));
  }

  const {
    space,
    sunlight,
    experience,
    time,
    purpose,
    plants,
    recommendationMessage,
    isActive
  } = req.body;

  // Validate plants if provided
  if (plants) {
    if (!Array.isArray(plants) || plants.length === 0) {
      return next(new AppError('At least one plant is required', 400));
    }

    if (plants.length > 9) {
      return next(new AppError('Maximum 9 plants allowed per combination', 400));
    }

    // Validate plant data
    for (let i = 0; i < plants.length; i++) {
      const plant = plants[i];
      if (!plant.name || !plant.description || !plant.image) {
        return next(new AppError(`Plant ${i + 1}: name, description, and image are required`, 400));
      }
    }
  }

  // Check for combination conflicts if combination parameters are being updated
  if (space || sunlight || experience || time || purpose) {
    const newSpace = space || plantSuggestion.space;
    const newSunlight = sunlight || plantSuggestion.sunlight;
    const newExperience = experience || plantSuggestion.experience;
    const newTime = time || plantSuggestion.time;
    const newPurpose = purpose || plantSuggestion.purpose;
    
    const newCombinationKey = `${newSpace}_${newSunlight}_${newExperience}_${newTime}_${newPurpose}`;
    
    if (newCombinationKey !== plantSuggestion.combinationKey) {
      const existingSuggestion = await PlantSuggestion.findOne({ 
        combinationKey: newCombinationKey,
        _id: { $ne: req.params.id }
      });
      
      if (existingSuggestion) {
        return next(new AppError('This combination already exists', 400));
      }
    }
  }

  // Update fields
  if (space) plantSuggestion.space = space;
  if (sunlight) plantSuggestion.sunlight = sunlight;
  if (experience) plantSuggestion.experience = experience;
  if (time) plantSuggestion.time = time;
  if (purpose) plantSuggestion.purpose = purpose;
  if (plants) plantSuggestion.plants = plants;
  if (recommendationMessage) plantSuggestion.recommendationMessage = recommendationMessage.trim();
  if (isActive !== undefined) plantSuggestion.isActive = isActive;

  await plantSuggestion.save();

  res.json({
    success: true,
    message: 'Plant suggestion updated successfully',
    data: { plantSuggestion }
  });
});

// @desc    Delete plant suggestion
// @route   DELETE /api/admin/plant-suggestions/:id
// @access  Private (Admin only)
const deletePlantSuggestion = asyncHandler(async (req, res, next) => {
  const plantSuggestion = await PlantSuggestion.findById(req.params.id);

  if (!plantSuggestion) {
    return next(new AppError('Plant suggestion not found', 404));
  }

  await PlantSuggestion.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Plant suggestion deleted successfully'
  });
});

// @desc    Toggle plant suggestion active status
// @route   PUT /api/admin/plant-suggestions/:id/toggle
// @access  Private (Admin only)
const togglePlantSuggestionStatus = asyncHandler(async (req, res, next) => {
  const plantSuggestion = await PlantSuggestion.findById(req.params.id);

  if (!plantSuggestion) {
    return next(new AppError('Plant suggestion not found', 404));
  }

  plantSuggestion.isActive = !plantSuggestion.isActive;
  await plantSuggestion.save();

  res.json({
    success: true,
    message: `Plant suggestion ${plantSuggestion.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { plantSuggestion }
  });
});

// @desc    Get plant suggestion statistics
// @route   GET /api/admin/plant-suggestions/stats
// @access  Private (Admin only)
const getPlantSuggestionStats = asyncHandler(async (req, res, next) => {
  const totalSuggestions = await PlantSuggestion.countDocuments();
  const activeSuggestions = await PlantSuggestion.countDocuments({ isActive: true });
  const inactiveSuggestions = await PlantSuggestion.countDocuments({ isActive: false });

  // Get combination distribution
  const combinationStats = await PlantSuggestion.aggregate([
    {
      $group: {
        _id: {
          space: '$space',
          sunlight: '$sunlight',
          experience: '$experience',
          time: '$time',
          purpose: '$purpose'
        },
        count: { $sum: 1 },
        isActive: { $first: '$isActive' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get most common combinations
  const mostCommonCombinations = await PlantSuggestion.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$space',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  res.json({
    success: true,
    data: {
      totalSuggestions,
      activeSuggestions,
      inactiveSuggestions,
      combinationStats,
      mostCommonCombinations
    }
  });
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  blockUser,
  suspendUser,
  resetUserPassword,
  sendUserEmail,
  updateUserNotes,
  flagUser,
  bulkUserOperations,
  getUserDetails,
  sendOrderEmail,
  sendOrderStatusNotification,
  getAllOrders,
  updateOrderStatus,
  getAllBlogPosts,
  approveBlogPost,
  rejectBlogPost,
  deleteBlogPost,
  toggleCommentApproval,
  // Product management
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  deleteProduct,
  getProductCategories,
  getCategoriesWithProducts,
  createCategory,
  deleteCategory,
  updateCategory,
  bulkUpdateProducts,
  getInventoryStats,
  getInventoryInsights,
  getInventoryInsightsDebug,
  recalculateAnalytics,
  getNotifications,
  getProductReviews,
  handleReviewAction,
  bulkEditProducts,
  uploadCSV,
  createDiscount,
  getAllDiscounts,
  getDiscount,
  updateDiscount,
  deleteDiscount,
  applyDiscountToProduct,
  removeDiscountFromProduct,
  applyDiscountToCategory,
  getUpcomingDiscounts,
  getAvailableDiscountsForProduct,
  // Plant Suggestions Management
  getAllPlantSuggestions,
  getPlantSuggestion,
  createPlantSuggestion,
  updatePlantSuggestion,
  deletePlantSuggestion,
  togglePlantSuggestionStatus,
  getPlantSuggestionStats,
};