const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Simple Decision Tree Node
 */
class TreeNode {
  constructor(feature, threshold, left = null, right = null, value = null) {
    this.feature = feature;
    this.threshold = threshold;
    this.left = left;
    this.right = right;
    this.value = value;
  }
}

/**
 * Simple Decision Tree for Revenue Prediction
 * Using basic regression tree approach
 */
class DecisionTreeRegressor {
  constructor(maxDepth = 5, minSamples = 2) {
    this.maxDepth = maxDepth;
    this.minSamples = minSamples;
    this.tree = null;
  }

  /**
   * Calculate mean squared error for split
   */
  meanSquaredError(left, right) {
    const leftMean = left.length > 0 ? left.reduce((a, b) => a + b, 0) / left.length : 0;
    const rightMean = right.length > 0 ? right.reduce((a, b) => a + b, 0) / right.length : 0;

    const leftMSE = left.reduce((sum, val) => sum + Math.pow(val - leftMean, 2), 0) / left.length;
    const rightMSE = right.reduce((sum, val) => sum + Math.pow(val - rightMean, 2), 0) / right.length;

    return (leftMSE * left.length + rightMSE * right.length) / (left.length + right.length);
  }

  /**
   * Find best split for a feature
   */
  findBestSplit(X, y, feature) {
    let bestThreshold = 0;
    let bestMSE = Infinity;

    const values = X.map(row => row[feature]).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

    for (let i = 0; i < values.length - 1; i++) {
      const threshold = (values[i] + values[i + 1]) / 2;

      const leftIndices = X.map((row, idx) => row[feature] <= threshold ? idx : null).filter(v => v !== null);
      const rightIndices = X.map((row, idx) => row[feature] > threshold ? idx : null).filter(v => v !== null);

      const leftY = leftIndices.map(idx => y[idx]);
      const rightY = rightIndices.map(idx => y[idx]);

      if (leftY.length >= this.minSamples && rightY.length >= this.minSamples) {
        const mse = this.meanSquaredError(leftY, rightY);
        if (mse < bestMSE) {
          bestMSE = mse;
          bestThreshold = threshold;
        }
      }
    }

    return { threshold: bestThreshold, mse: bestMSE };
  }

  /**
   * Build the decision tree
   */
  buildTree(X, y, depth = 0) {
    // Base cases
    if (depth >= this.maxDepth || X.length <= this.minSamples) {
      const meanValue = y.reduce((a, b) => a + b, 0) / y.length;
      return new TreeNode(null, null, null, null, meanValue);
    }

    // Find best feature to split on
    const features = Object.keys(X[0] || {});
    let bestFeature = null;
    let bestThreshold = 0;
    let bestMSE = Infinity;
    let bestLeft = [];
    let bestRight = [];

    for (const feature of features) {
      const { threshold, mse } = this.findBestSplit(X, y, feature);
      if (mse < bestMSE) {
        bestMSE = mse;
        bestFeature = feature;
        bestThreshold = threshold;

        const leftIndices = X.map((row, idx) => row[feature] <= threshold ? idx : null).filter(v => v !== null);
        const rightIndices = X.map((row, idx) => row[feature] > threshold ? idx : null).filter(v => v !== null);

        bestLeft = leftIndices.map(idx => ({ X: X[idx], y: y[idx] }));
        bestRight = rightIndices.map(idx => ({ X: X[idx], y: y[idx] }));
      }
    }

    // If no improvement, return leaf node
    if (bestFeature === null) {
      const meanValue = y.reduce((a, b) => a + b, 0) / y.length;
      return new TreeNode(null, null, null, null, meanValue);
    }

    // Recursively build left and right subtrees
    const leftX = bestLeft.map(item => item.X);
    const leftY = bestLeft.map(item => item.y);
    const rightX = bestRight.map(item => item.X);
    const rightY = bestRight.map(item => item.y);

    return new TreeNode(
      bestFeature,
      bestThreshold,
      this.buildTree(leftX, leftY, depth + 1),
      this.buildTree(rightX, rightY, depth + 1)
    );
  }

  /**
   * Make a prediction
   */
  predict(node, x) {
    if (node.value !== null) {
      return node.value;
    }

    if (x[node.feature] <= node.threshold) {
      return this.predict(node.left, x);
    } else {
      return this.predict(node.right, x);
    }
  }

  /**
   * Train the model
   */
  fit(X, y) {
    this.tree = this.buildTree(X, y);
  }

  /**
   * Make predictions for multiple samples
   */
  predictMultiple(X_test) {
    return X_test.map(x => this.predict(this.tree, x));
  }
}

/**
 * Prepare training data from orders
 */
async function prepareTrainingData(days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get historical orders (include all statuses for revenue prediction)
  const orders = await Order.find({
    createdAt: { $gte: startDate }
  }).sort({ createdAt: 1 });

  if (orders.length === 0) {
    return { X: [], y: [], orders: [] };
  }

  // Prepare features (X) and target (y = revenue)
  const X = [];
  const y = [];
  const orderDetails = [];

  for (const order of orders) {
    const date = new Date(order.createdAt);
    
    const features = {
      dayOfWeek: date.getDay(), // 0-6
      month: date.getMonth(), // 0-11
      dayOfMonth: date.getDate(), // 1-31
      numItems: order.items.length,
      avgItemPrice: order.items.reduce((sum, item) => sum + item.price, 0) / order.items.length,
      totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
      // Product categories (one-hot encoded features can be added here)
    };

    const revenue = order.total;

    X.push(features);
    y.push(revenue);
    orderDetails.push({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      total: order.total,
      status: order.status
    });
  }

  return { X, y, orders: orderDetails };
}

/**
 * Predict future revenue
 */
async function predictRevenue(days = 30) {
  try {
    // Prepare training data from last 90 days
    const { X, y, orders } = await prepareTrainingData(90);

    if (X.length < 10) {
      // Not enough data, return simple trend prediction
      const recentOrders = await Order.find({})
        .sort({ createdAt: -1 })
        .limit(30);

      const avgDailyRevenue = recentOrders.length > 0
        ? recentOrders.reduce((sum, o) => sum + o.total, 0) / recentOrders.length
        : 0;

      // Generate future dates so the frontend can label bars
      const futureDates = [];
      const today = new Date();
      for (let i = 1; i <= days; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);
        futureDates.push(futureDate);
      }

      return {
        predictions: Array(days).fill(avgDailyRevenue),
        confidence: 'low',
        avgDailyRevenue,
        modelAccuracy: null,
        trainingData: {
          totalOrders: recentOrders.length,
          dateRange: null
        },
        futureDates
      };
    }

    // Train decision tree
    const model = new DecisionTreeRegressor(5, 3);
    model.fit(X, y);

    // Generate predictions for next N days
    const predictions = [];
    const futureDates = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      futureDates.push(futureDate);

      // Use average of recent orders for prediction features
      const avgFeatures = {
        dayOfWeek: futureDate.getDay(),
        month: futureDate.getMonth(),
        dayOfMonth: futureDate.getDate(),
        numItems: X.reduce((sum, x) => sum + x.numItems, 0) / X.length,
        avgItemPrice: X.reduce((sum, x) => sum + x.avgItemPrice, 0) / X.length,
        totalItems: X.reduce((sum, x) => sum + x.totalItems, 0) / X.length,
      };

      const prediction = model.predict(model.tree, avgFeatures);
      predictions.push(Math.max(0, prediction)); // Ensure non-negative
    }

    // Calculate model accuracy (simple approach)
    const predictionsOnTrainingData = X.map(x => model.predict(model.tree, x));
    const errors = y.map((actual, idx) => Math.abs(actual - predictionsOnTrainingData[idx]));
    const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
    const meanActual = y.reduce((a, b) => a + b, 0) / y.length;
    const accuracy = Math.max(0, Math.min(100, (1 - meanError / meanActual) * 100));

    // Calculate average daily revenue from historical data
    // Group orders by day and calculate daily totals
    const dailyRevenue = {};
    orders.forEach(order => {
      const dayKey = new Date(order.date).toISOString().split('T')[0];
      if (!dailyRevenue[dayKey]) {
        dailyRevenue[dayKey] = 0;
      }
      dailyRevenue[dayKey] += order.total;
    });
    
    const dailyRevenues = Object.values(dailyRevenue);
    const avgDailyRevenue = dailyRevenues.length > 0 
      ? dailyRevenues.reduce((a, b) => a + b, 0) / dailyRevenues.length 
      : 0;

    const result = {
      predictions,
      confidence: accuracy > 80 ? 'high' : accuracy > 60 ? 'medium' : 'low',
      avgDailyRevenue,
      modelAccuracy: accuracy,
      trainingData: {
        totalOrders: orders.length,
        dateRange: {
          start: orders[0]?.date,
          end: orders[orders.length - 1]?.date
        }
      },
      futureDates
    };

    return result;

  } catch (error) {
    console.error('Error in revenue prediction:', error);
    throw error;
  }
}

/**
 * Get current revenue metrics
 */
async function getCurrentRevenueMetrics() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 7); // Last 7 days
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const [todayRevenue, weekRevenue, monthRevenue, allTimeRevenue] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: {} },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ])
    ]);

    return {
      today: {
        revenue: todayRevenue[0]?.total || 0,
        orders: todayRevenue[0]?.count || 0
      },
      week: {
        revenue: weekRevenue[0]?.total || 0,
        orders: weekRevenue[0]?.count || 0
      },
      month: {
        revenue: monthRevenue[0]?.total || 0,
        orders: monthRevenue[0]?.count || 0
      },
      allTime: {
        revenue: allTimeRevenue[0]?.total || 0,
        orders: allTimeRevenue[0]?.count || 0
      }
    };
  } catch (error) {
    console.error('Error getting revenue metrics:', error);
    throw error;
  }
}

module.exports = {
  predictRevenue,
  getCurrentRevenueMetrics,
  prepareTrainingData
};

