const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_created',
      'user_updated', 
      'user_deleted',
      'product_created',
      'product_updated',
      'product_deleted',
      'order_updated',
      'order_cancelled',
      'blog_approved',
      'blog_rejected',
      'blog_deleted',
      'discount_created',
      'discount_updated',
      'discount_deleted',
      'settings_updated',
      'category_created',
      'category_updated',
      'category_deleted'
    ]
  },
  description: {
    type: String,
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['User', 'Product', 'Order', 'Blog', 'Discount', 'Category']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
adminActivitySchema.index({ timestamp: -1 });
adminActivitySchema.index({ adminId: 1, timestamp: -1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);


