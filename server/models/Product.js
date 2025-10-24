const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  regularPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: null
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  images: [{
    type: String,
    required: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  published: {
    type: Boolean,
    default: true
  },
  archived: {
    type: Boolean,
    default: false
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  specifications: {
    type: Map,
    of: String
  },
  // Discount linking
  linkedDiscount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discount',
    default: null
  },
  // Analytics fields
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  lastSoldAt: {
    type: Date,
    default: null
  },
  // Auto-calculated discount fields (for performance)
  appliedDiscounts: [{
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discount',
      required: true
    },
    discountName: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    appliedBy: {
      type: String,
      enum: ['manual', 'category', 'automatic'],
      default: 'manual'
    }
  }],
  // Legacy field for backward compatibility
  appliedDiscount: {
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discount',
      default: null
    },
    discountName: {
      type: String,
      default: null
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: null
    },
    discountValue: {
      type: Number,
      default: null
    },
    calculatedPrice: {
      type: Number,
      default: null
    },
    appliedAt: {
      type: Date,
      default: null
    }
  },
  // Final calculated price after all discounts
  finalPrice: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
productSchema.index({ category: 1, published: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ sku: 1 });
productSchema.index({ featured: 1, published: 1 });
productSchema.index({ archived: 1 });

// Method to calculate total discount from all applied discounts
productSchema.methods.calculateTotalDiscount = function() {
  let totalDiscountAmount = 0;
  let currentPrice = this.regularPrice || this.price || 0;
  
  // Apply discounts in order (percentage first, then fixed)
  const appliedDiscounts = this.appliedDiscounts || [];
  const percentageDiscounts = appliedDiscounts.filter(d => d.discountType === 'percentage');
  const fixedDiscounts = appliedDiscounts.filter(d => d.discountType === 'fixed');
  
  // Apply percentage discounts first
  for (const discount of percentageDiscounts) {
    const discountAmount = (currentPrice * discount.discountValue) / 100;
    totalDiscountAmount += discountAmount;
    currentPrice -= discountAmount;
  }
  
  // Apply fixed discounts
  for (const discount of fixedDiscounts) {
    const discountAmount = Math.min(discount.discountValue, currentPrice);
    totalDiscountAmount += discountAmount;
    currentPrice -= discountAmount;
  }
  
  return {
    totalDiscountAmount,
    finalPrice: Math.max(0, currentPrice),
    discountCount: appliedDiscounts.length
  };
};

// Method to add a discount to the product
productSchema.methods.addDiscount = function(discount, appliedBy = 'manual') {
  // Initialize appliedDiscounts if it doesn't exist
  if (!this.appliedDiscounts) {
    this.appliedDiscounts = [];
  }
  
  // Check if discount already exists
  const existingDiscount = this.appliedDiscounts.find(d => 
    d.discountId.toString() === discount._id.toString()
  );
  
  if (existingDiscount) {
    return false; // Discount already applied
  }
  
  // Calculate discount amount
  const currentPrice = this.finalPrice || this.regularPrice || this.price || 0;
  let discountAmount = 0;
  
  if (discount.type === 'percentage') {
    discountAmount = (currentPrice * discount.value) / 100;
  } else {
    discountAmount = Math.min(discount.value, currentPrice);
  }
  
  // Add discount to array
  this.appliedDiscounts.push({
    discountId: discount._id,
    discountName: discount.name,
    discountType: discount.type,
    discountValue: discount.value,
    discountAmount: discountAmount,
    appliedBy: appliedBy,
    appliedAt: new Date()
  });
  
  // Recalculate final price
  const { finalPrice } = this.calculateTotalDiscount();
  this.finalPrice = finalPrice;
  
  return true;
};

// Method to remove a discount from the product
productSchema.methods.removeDiscount = function(discountId) {
  if (!this.appliedDiscounts) {
    this.appliedDiscounts = [];
  }
  
  this.appliedDiscounts = this.appliedDiscounts.filter(d => 
    d.discountId.toString() !== discountId.toString()
  );
  
  // Recalculate final price
  const { finalPrice } = this.calculateTotalDiscount();
  this.finalPrice = finalPrice;
  
  return true;
};

// Virtual for current price (final price after all discounts)
productSchema.virtual('currentPrice').get(function() {
  if (this.finalPrice !== null) {
    return this.finalPrice;
  }
  if (this.appliedDiscount && this.appliedDiscount.calculatedPrice) {
    return this.appliedDiscount.calculatedPrice;
  }
  return this.discountPrice || this.regularPrice;
});

// Virtual for total discount percentage
productSchema.virtual('discountPercentage').get(function() {
  const originalPrice = this.regularPrice || this.price || 0;
  const currentPrice = this.currentPrice;
  
  if (originalPrice > 0 && currentPrice < originalPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
  return 0;
});

// Virtual for active discounts info
productSchema.virtual('activeDiscounts').get(function() {
  if (!this.appliedDiscounts || !Array.isArray(this.appliedDiscounts)) {
    return [];
  }
  return this.appliedDiscounts.map(discount => ({
    id: discount.discountId,
    name: discount.discountName,
    type: discount.discountType,
    value: discount.discountValue,
    amount: discount.discountAmount,
    appliedBy: discount.appliedBy,
    appliedAt: discount.appliedAt
  }));
});

// Virtual for active discount info (legacy compatibility)
productSchema.virtual('activeDiscount').get(function() {
  if (this.appliedDiscounts && Array.isArray(this.appliedDiscounts) && this.appliedDiscounts.length > 0) {
    const primaryDiscount = this.appliedDiscounts[0];
    return {
      id: primaryDiscount.discountId,
      name: primaryDiscount.discountName,
      type: primaryDiscount.discountType,
      value: primaryDiscount.discountValue,
      calculatedPrice: this.currentPrice,
      appliedAt: primaryDiscount.appliedAt
    };
  }
  if (this.appliedDiscount && this.appliedDiscount.discountId) {
    return {
      id: this.appliedDiscount.discountId,
      name: this.appliedDiscount.discountName,
      type: this.appliedDiscount.discountType,
      value: this.appliedDiscount.discountValue,
      calculatedPrice: this.appliedDiscount.calculatedPrice,
      appliedAt: this.appliedDiscount.appliedAt
    };
  }
  return null;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
module.exports = mongoose.model('Product', productSchema);