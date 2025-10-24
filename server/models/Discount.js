const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  value: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        if (this.type === 'percentage') {
          return value >= 0 && value <= 100;
        }
        return value >= 0;
      },
      message: 'Percentage discounts must be between 0-100, fixed discounts must be positive'
    }
  },
  applicableTo: {
    type: String,
    required: true,
    enum: ['all', 'category', 'products'],
    default: 'all'
  },
  category: {
    type: String,
    required: function() {
      return this.applicableTo === 'category';
    }
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function() {
      return this.applicableTo === 'products';
    }
  }],
  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'Start date must be in the future'
    }
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    min: 1,
    default: null // null means unlimited usage
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  minOrderValue: {
    type: Number,
    min: 0,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    min: 0,
    default: null // null means no maximum limit
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Track applied products for automatic lifecycle management
  appliedProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    removedAt: {
      type: Date,
      default: null
    }
  }],
  // Automatic lifecycle management
  autoApplied: {
    type: Boolean,
    default: false
  },
  autoRemoved: {
    type: Boolean,
    default: false
  },
  lastProcessedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
discountSchema.index({ active: 1, startDate: 1, endDate: 1 });
discountSchema.index({ applicableTo: 1, category: 1 });
discountSchema.index({ products: 1 });
discountSchema.index({ createdBy: 1 });
discountSchema.index({ autoApplied: 1, autoRemoved: 1 });
discountSchema.index({ 'appliedProducts.productId': 1 });

// Virtual for discount status
discountSchema.virtual('status').get(function() {
  const now = new Date();
  
  if (!this.active) {
    return 'inactive';
  }
  
  if (now < this.startDate) {
    return 'scheduled';
  }
  
  if (now > this.endDate) {
    return 'expired';
  }
  
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return 'exhausted';
  }
  
  return 'active';
});

// Virtual for remaining usage
discountSchema.virtual('remainingUsage').get(function() {
  if (!this.usageLimit) {
    return null; // unlimited
  }
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Method to check if discount is currently applicable
discountSchema.methods.isApplicable = function() {
  const now = new Date();
  
  return this.active && 
         now >= this.startDate && 
         now <= this.endDate &&
         (!this.usageLimit || this.usedCount < this.usageLimit);
};

// Method to check if discount applies to a specific product
discountSchema.methods.appliesToProduct = function(productId, productCategory) {
  if (!this.isApplicable()) {
    return false;
  }
  
  switch (this.applicableTo) {
    case 'all':
      return true;
    case 'category':
      return this.category === productCategory;
    case 'products':
      return this.products.some(id => id.toString() === productId.toString());
    default:
      return false;
  }
};

// Method to calculate discount amount for a given price
discountSchema.methods.calculateDiscount = function(originalPrice) {
  if (!this.isApplicable() || originalPrice < this.minOrderValue) {
    return 0;
  }
  
  let discountAmount = 0;
  
  if (this.type === 'percentage') {
    discountAmount = (originalPrice * this.value) / 100;
  } else {
    discountAmount = this.value;
  }
  
  // Apply maximum discount limit if set
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount;
  }
  
  // Ensure discount doesn't exceed original price
  return Math.min(discountAmount, originalPrice);
};

// Method to increment usage count
discountSchema.methods.incrementUsage = function() {
  if (this.usageLimit && this.usedCount < this.usageLimit) {
    this.usedCount += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to automatically apply discount to products
discountSchema.methods.autoApplyToProducts = async function() {
  const Product = require('./Product');
  const now = new Date();
  
  if (!this.isApplicable() || this.autoApplied) {
    return { applied: 0, skipped: 0 };
  }

  let query = { published: true, archived: false };
  
  switch (this.applicableTo) {
    case 'all':
      // All products
      break;
    case 'category':
      query.category = this.category;
      break;
    case 'products':
      query._id = { $in: this.products };
      break;
  }

  const products = await Product.find(query);
  let appliedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    // Check if already applied
    const alreadyApplied = this.appliedProducts.some(
      ap => ap.productId.toString() === product._id.toString() && !ap.removedAt
    );
    
    if (alreadyApplied) {
      skippedCount++;
      continue;
    }

    // Apply discount to product
    const added = product.addDiscount(this, 'automatic');
    if (added) {
      appliedCount++;
      await product.save();
      
      // Track in discount
      this.appliedProducts.push({
        productId: product._id,
        appliedAt: now
      });
    } else {
      skippedCount++;
    }
  }

  this.autoApplied = true;
  this.lastProcessedAt = now;
  await this.save();

  return { applied: appliedCount, skipped: skippedCount };
};

// Method to automatically remove discount from products
discountSchema.methods.autoRemoveFromProducts = async function() {
  const Product = require('./Product');
  const now = new Date();
  
  if (this.autoRemoved) {
    return { removed: 0, skipped: 0 };
  }

  let removedCount = 0;
  let skippedCount = 0;

  for (const appliedProduct of this.appliedProducts) {
    if (appliedProduct.removedAt) {
      skippedCount++;
      continue;
    }

    try {
      const product = await Product.findById(appliedProduct.productId);
      if (product) {
        const removed = product.removeDiscount(this._id);
        if (removed) {
          removedCount++;
          await product.save();
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }

      // Mark as removed
      appliedProduct.removedAt = now;
    } catch (error) {
      console.error(`Error removing discount from product ${appliedProduct.productId}:`, error);
      skippedCount++;
    }
  }

  this.autoRemoved = true;
  this.lastProcessedAt = now;
  await this.save();

  return { removed: removedCount, skipped: skippedCount };
};

// Pre-save middleware to validate dates
discountSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// Ensure virtual fields are serialized
discountSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Discount', discountSchema);


