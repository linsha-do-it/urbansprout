const mongoose = require('mongoose');

const vendorOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProduct',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' }
}, { _id: false });

const vendorOrderSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true,
    index: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorUser',
    required: true,
    index: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
    // Buyer can be BeginnerUser, ExpertUser, etc. - no single ref
  },
  buyerName: { type: String, default: '' },
  buyerEmail: { type: String, default: '' },
  items: [vendorOrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, default: '' }
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'UPI', 'Cash on Delivery'],
    default: 'Cash on Delivery'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: { type: String, required: true },
    note: String,
    updatedAt: { type: Date, default: Date.now }
  }],
  notes: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'vendororders'
});

vendorOrderSchema.index({ vendor: 1, status: 1, createdAt: -1 });
vendorOrderSchema.index({ order: 1, vendor: 1 }, { unique: true });

module.exports = mongoose.model('VendorOrder', vendorOrderSchema);
