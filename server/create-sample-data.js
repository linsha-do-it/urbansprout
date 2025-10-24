const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');

const createSampleData = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database successfully!');

    // Create sample products
    const sampleProducts = [
      {
        name: 'Snake Plant',
        category: 'Indoor Plants',
        sku: 'PLANT-SNAKE-001',
        regularPrice: 24.99,
        description: 'Perfect for beginners, tolerates low light and infrequent watering',
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop'],
        stock: 15,
        featured: true,
        rating: 4.5,
        reviews: 23
      },
      {
        name: 'Pothos Golden',
        category: 'Indoor Plants',
        sku: 'PLANT-POTHOS-001',
        regularPrice: 18.99,
        description: 'Fast-growing trailing plant, excellent for hanging baskets',
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop'],
        stock: 20,
        featured: true,
        rating: 4.3,
        reviews: 18
      },
      {
        name: 'Ceramic Planter Set',
        category: 'Accessories',
        sku: 'POT-CERAMIC-001',
        regularPrice: 34.99,
        description: 'Set of 3 modern ceramic planters with drainage holes',
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop'],
        stock: 8,
        featured: false,
        rating: 4.4,
        reviews: 19
      },
      {
        name: 'Garden Trowel Set',
        category: 'Tools',
        sku: 'TOOL-TROWEL-001',
        regularPrice: 24.99,
        description: 'Professional-grade trowel set with ergonomic handles',
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop'],
        stock: 30,
        featured: true,
        rating: 4.8,
        reviews: 45
      },
      {
        name: 'Organic Potting Soil',
        category: 'Soil & Fertilizer',
        sku: 'SOIL-ORG-001',
        regularPrice: 12.99,
        description: 'Premium organic potting soil for all plants',
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop'],
        stock: 50,
        featured: true,
        rating: 4.6,
        reviews: 67
      }
    ];

    console.log('📦 Creating sample products...');
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Get a user to create orders
    let user = await User.findOne();
    if (!user) {
      console.log('👤 No users found, creating a sample user...');
      user = await User.create({
        name: 'Sample User',
        email: 'sample@urbansprout.com',
        password: 'hashedpassword',
        role: 'user'
      });
      console.log('✅ Created sample user');
    }

    // Create sample orders
    const sampleOrders = [
      {
        orderNumber: 'ORD-001',
        user: user._id,
        items: [
          {
            product: createdProducts[0]._id,
            name: createdProducts[0].name,
            price: createdProducts[0].regularPrice,
            quantity: 2
          },
          {
            product: createdProducts[1]._id,
            name: createdProducts[1].name,
            price: createdProducts[1].regularPrice,
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Sample User',
          address: '123 Main St',
          city: 'Sample City',
          postalCode: '12345',
          country: 'India',
          phone: '1234567890'
        },
        subtotal: 68.97,
        shipping: 0,
        tax: 0,
        total: 68.97,
        status: 'delivered',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        orderNumber: 'ORD-002',
        user: user._id,
        items: [
          {
            product: createdProducts[2]._id,
            name: createdProducts[2].name,
            price: createdProducts[2].regularPrice,
            quantity: 1
          },
          {
            product: createdProducts[3]._id,
            name: createdProducts[3].name,
            price: createdProducts[3].regularPrice,
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Sample User',
          address: '123 Main St',
          city: 'Sample City',
          postalCode: '12345',
          country: 'India',
          phone: '1234567890'
        },
        subtotal: 59.98,
        shipping: 0,
        tax: 0,
        total: 59.98,
        status: 'shipped',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        orderNumber: 'ORD-003',
        user: user._id,
        items: [
          {
            product: createdProducts[4]._id,
            name: createdProducts[4].name,
            price: createdProducts[4].regularPrice,
            quantity: 3
          }
        ],
        shippingAddress: {
          fullName: 'Sample User',
          address: '123 Main St',
          city: 'Sample City',
          postalCode: '12345',
          country: 'India',
          phone: '1234567890'
        },
        subtotal: 38.97,
        shipping: 0,
        tax: 0,
        total: 38.97,
        status: 'processing',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    console.log('📦 Creating sample orders...');
    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Created ${createdOrders.length} orders`);

    console.log('🎉 Sample data created successfully!');
    console.log('📊 Summary:');
    console.log(`   Products: ${await Product.countDocuments()}`);
    console.log(`   Orders: ${await Order.countDocuments()}`);
    console.log(`   Users: ${await User.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

createSampleData();






