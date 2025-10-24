const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectAndCheck = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI || 'Not set');
    
    // Try to connect
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbansprout');
    console.log('✅ Connected to MongoDB successfully!');
    
    // Import models
    const Order = require('./models/Order');
    const Product = require('./models/Product');
    const User = require('./models/User');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Check data counts
    const orderCount = await Order.countDocuments();
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('📊 Data counts:');
    console.log(`   Orders: ${orderCount}`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Users: ${userCount}`);
    
    // Get sample data
    if (orderCount > 0) {
      const sampleOrder = await Order.findOne().populate('user', 'name email');
      console.log('📦 Sample order:', {
        orderNumber: sampleOrder.orderNumber,
        status: sampleOrder.status,
        total: sampleOrder.total,
        itemsCount: sampleOrder.items.length,
        createdAt: sampleOrder.createdAt
      });
    }
    
    if (productCount > 0) {
      const sampleProduct = await Product.findOne();
      console.log('🛍️ Sample product:', {
        name: sampleProduct.name,
        category: sampleProduct.category,
        stock: sampleProduct.stock,
        price: sampleProduct.regularPrice
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
};

connectAndCheck();
