const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Import models to ensure collections are created
const User = require('../models/User');
const Blog = require('../models/Blog');
const Product = require('../models/Product');
const Plant = require('../models/Plant');
const Order = require('../models/Order');

const setupUrbanDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB (urban database)...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to urban database successfully!');

    // Create collections by ensuring indexes
    console.log('📋 Setting up collections...');

    // Users collection
    await User.createIndexes();
    console.log('✅ Users collection ready');

    // Blog posts collection
    await Blog.createIndexes();
    console.log('✅ Blog posts collection ready');

    // Products collection
    await Product.createIndexes();
    console.log('✅ Products collection ready');

    // Plants collection
    await Plant.createIndexes();
    console.log('✅ Plants collection ready');

    // Orders collection
    await Order.createIndexes();
    console.log('✅ Orders collection ready');

    // Blog posts seeding disabled - no dummy posts will be created
    // Users can create their own posts through the application
    console.log('📝 Blog posts seeding disabled - ready for user-generated content');

    // Seed some sample products if none exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts === 0) {
      console.log('🛒 Seeding sample products...');
      
      const sampleProducts = [
        {
          name: 'Snake Plant',
          description: 'Perfect for beginners, tolerates low light and infrequent watering',
          price: 24.99,
          category: 'indoor-plants',
          inStock: true,
          image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
          tags: ['low-maintenance', 'air-purifying', 'beginner-friendly']
        },
        {
          name: 'Pothos Golden',
          description: 'Fast-growing trailing plant, excellent for hanging baskets',
          price: 18.99,
          category: 'indoor-plants',
          inStock: true,
          image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
          tags: ['trailing', 'fast-growing', 'easy-care']
        },
        {
          name: 'Ceramic Planter Set',
          description: 'Set of 3 modern ceramic planters with drainage holes',
          price: 34.99,
          category: 'accessories',
          inStock: true,
          image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
          tags: ['planters', 'ceramic', 'modern-design']
        }
      ];

      await Product.insertMany(sampleProducts);
      console.log('✅ Sample products created');
    }

    console.log('🎉 Urban database setup completed successfully!');
    console.log('📊 Database statistics:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Blog Posts: ${await Blog.countDocuments()}`);
    console.log(`   Products: ${await Product.countDocuments()}`);
    console.log(`   Plants: ${await Plant.countDocuments()}`);
    console.log(`   Orders: ${await Order.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error setting up urban database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the setup
setupUrbanDatabase();

