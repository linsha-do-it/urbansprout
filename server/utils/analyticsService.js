const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Analytics Service - Handles order analytics and rollback operations
 */

/**
 * Update analytics when order status changes
 * @param {Object} order - The order object
 * @param {String} previousStatus - Previous order status
 * @param {String} newStatus - New order status
 */
const updateOrderAnalytics = async (order, previousStatus, newStatus) => {
  try {
    console.log(`📊 Updating analytics for order ${order._id}: ${previousStatus} -> ${newStatus}`);

    // If order was delivered and now being cancelled/returned, remove from analytics
    if (previousStatus === 'delivered' && (newStatus === 'cancelled' || newStatus === 'returned')) {
      await removeOrderFromAnalytics(order);
      console.log(`📉 Removed order ${order._id} from analytics (${newStatus})`);
    }
    
    // If order was cancelled/returned and now being delivered, add to analytics
    else if ((previousStatus === 'cancelled' || previousStatus === 'returned') && newStatus === 'delivered') {
      await addOrderToAnalytics(order);
      console.log(`📈 Added order ${order._id} to analytics (delivered)`);
    }
    
    // If order is being delivered for the first time, add to analytics
    else if (newStatus === 'delivered' && !order.analyticsTracked) {
      await addOrderToAnalytics(order);
      console.log(`📈 Added order ${order._id} to analytics (first delivery)`);
    }

    // Update analytics tracking flag
    order.analyticsTracked = (newStatus === 'delivered');
    await order.save();

  } catch (error) {
    console.error('❌ Error updating order analytics:', error);
  }
};

/**
 * Remove order from analytics calculations
 * @param {Object} order - The order to remove
 */
const removeOrderFromAnalytics = async (order) => {
  try {
    // Update product sales counts (decrease)
    for (const item of order.items) {
      const productId = item.productId || item.product;
      if (productId) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { 
            'salesCount': -item.quantity,
            'totalRevenue': -(item.price * item.quantity)
          }
        });
        console.log(`📉 Decreased sales for product ${productId}: -${item.quantity} units, -₹${item.price * item.quantity}`);
      }
    }
  } catch (error) {
    console.error('❌ Error removing order from analytics:', error);
  }
};

/**
 * Add order to analytics calculations
 * @param {Object} order - The order to add
 */
const addOrderToAnalytics = async (order) => {
  try {
    // Update product sales counts (increase)
    for (const item of order.items) {
      const productId = item.productId || item.product;
      if (productId) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { 
            'salesCount': item.quantity,
            'totalRevenue': (item.price * item.quantity)
          }
        });
        console.log(`📈 Increased sales for product ${productId}: +${item.quantity} units, +₹${item.price * item.quantity}`);
      }
    }
  } catch (error) {
    console.error('❌ Error adding order to analytics:', error);
  }
};

/**
 * Recalculate all analytics from scratch (for data integrity)
 */
const recalculateAllAnalytics = async () => {
  try {
    console.log('🔄 Recalculating all analytics...');
    
    // Reset all product analytics
    await Product.updateMany({}, {
      $set: {
        salesCount: 0,
        totalRevenue: 0
      }
    });

    // Recalculate from delivered orders only
    const deliveredOrders = await Order.find({ 
      status: 'delivered',
      analyticsTracked: true 
    });

    let totalProcessed = 0;
    for (const order of deliveredOrders) {
      await addOrderToAnalytics(order);
      totalProcessed++;
    }

    console.log(`✅ Analytics recalculation complete. Processed ${totalProcessed} delivered orders.`);
    return { success: true, processedOrders: totalProcessed };

  } catch (error) {
    console.error('❌ Error recalculating analytics:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get category performance with proper rollback handling
 */
const getCategoryPerformance = async (period = '30d') => {
  try {
    // Calculate date range
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
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get category performance from all orders (excluding cancelled and returned)
    const categoryPerformance = await Order.aggregate([
      { 
        $match: { 
          status: { $nin: ['cancelled', 'returned'] },
          createdAt: { $gte: startDate }
        } 
      },
      { $unwind: '$items' },
      // Filter out items with invalid productId format
      { $match: { 'items.productId': { $regex: /^[0-9a-fA-F]{24}$/ } } },
      {
        $lookup: {
          from: 'products',
          let: { productId: { $toObjectId: '$items.productId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$productId'] } } }
          ],
          as: 'product'
        }
      },
      { $match: { product: { $ne: [] } } },
      {
        $group: {
          _id: { $arrayElemAt: ['$product.category', 0] },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          productCount: { $addToSet: '$items.productId' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalSold: 1,
          totalRevenue: 1,
          uniqueProducts: { $size: '$productCount' }
        }
      },
      { $sort: { totalSold: -1 } }
    ]);

    return categoryPerformance;

  } catch (error) {
    console.error('❌ Error getting category performance:', error);
    return [];
  }
};

/**
 * Get fast-moving products with proper rollback handling
 */
const getFastMovingProducts = async (period = '30d', limit = 10) => {
  try {
    // Calculate date range
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
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get fast-moving products from all orders (excluding cancelled and returned)
    const fastMovingProducts = await Order.aggregate([
      { 
        $match: { 
          status: { $nin: ['cancelled', 'returned'] },
          createdAt: { $gte: startDate }
        } 
      },
      { $unwind: '$items' },
      // Filter out items with invalid productId format
      { $match: { 'items.productId': { $regex: /^[0-9a-fA-F]{24}$/ } } },
      {
        $lookup: {
          from: 'products',
          let: { productId: { $toObjectId: '$items.productId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$productId'] } } }
          ],
          as: 'product'
        }
      },
      { $match: { product: { $ne: [] } } },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: { $arrayElemAt: ['$product.name', 0] } },
          category: { $first: { $arrayElemAt: ['$product.category', 0] } },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          avgPrice: { $avg: '$items.price' }
        }
      },
      {
        $project: {
          productId: '$_id',
          productName: 1,
          category: 1,
          totalSold: 1,
          totalRevenue: 1,
          avgPrice: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);

    return fastMovingProducts;

  } catch (error) {
    console.error('❌ Error getting fast-moving products:', error);
    return [];
  }
};

module.exports = {
  updateOrderAnalytics,
  removeOrderFromAnalytics,
  addOrderToAnalytics,
  recalculateAllAnalytics,
  getCategoryPerformance,
  getFastMovingProducts
};
