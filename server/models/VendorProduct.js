const mongoose = require('mongoose');

const vendorProductSchema = new mongoose.Schema({
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
    default: '',
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
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [{
    type: String,
    required: true
  }],
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
    required: true
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
  }
}, {
  timestamps: true,
  collection: 'vendorproducts'
});

vendorProductSchema.index({ vendor: 1, archived: 1 });
vendorProductSchema.index({ category: 1, published: 1 });

module.exports = mongoose.model('VendorProduct', vendorProductSchema);
