const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Product = require('../models/Product');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const populateGardeningStore = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database successfully!');

    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});
    console.log('✅ Existing products cleared');

    const products = [
      // POTS & PLANTERS
      {
        name: 'Ceramic Plant Pot - Small (6")',
        category: 'Pots',
        sku: 'POT-SM-001',
        regularPrice: 12.99,
        description: 'Beautiful ceramic pot perfect for small plants and herbs. Drainage hole included.',
        images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop'],
        stock: 25,
        featured: true,
        rating: 4.5,
        reviews: 23
      },
      {
        name: 'Ceramic Plant Pot - Medium (8")',
        category: 'Pots',
        price: 18.99,
        description: 'Medium ceramic pot with elegant design. Perfect for most houseplants.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 20,
        featured: false,
        rating: 4.3,
        reviews: 18
      },
      {
        name: 'Terracotta Planter - Large (12")',
        category: 'Pots',
        price: 24.99,
        description: 'Classic terracotta planter with excellent drainage. Perfect for larger plants.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 15,
        featured: true,
        rating: 4.7,
        reviews: 31
      },
      {
        name: 'Hanging Basket - Macrame Style',
        category: 'Pots',
        price: 29.99,
        description: 'Sturdy hanging basket with macrame design. Perfect for trailing plants.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 12,
        featured: true,
        rating: 4.6,
        reviews: 27
      },
      {
        name: 'Self-Watering Planter - Smart Pot',
        category: 'Pots',
        price: 34.99,
        description: 'Smart self-watering planter with water reservoir. Perfect for busy gardeners.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 10,
        featured: true,
        rating: 4.8,
        reviews: 35
      },
      {
        name: 'Decorative Planter Set - 3 Pack',
        category: 'Pots',
        price: 39.99,
        description: 'Set of 3 decorative planters in different sizes. Modern minimalist design.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 8,
        featured: false,
        rating: 4.4,
        reviews: 19
      },

      // GARDENING TOOLS
      {
        name: 'Professional Garden Trowel Set',
        category: 'Tools',
        price: 24.99,
        description: 'Professional-grade trowel set with ergonomic handles. Essential for planting.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 30,
        featured: true,
        rating: 4.8,
        reviews: 45
      },
      {
        name: 'Pruning Shears - Bypass Type',
        category: 'Tools',
        price: 28.99,
        description: 'Sharp bypass pruning shears for clean cuts. Comfortable grip and spring-loaded.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 22,
        featured: true,
        rating: 4.6,
        reviews: 32
      },
      {
        name: 'Garden Gloves - Reinforced Pack of 3',
        category: 'Tools',
        price: 16.99,
        description: 'Durable garden gloves with reinforced fingertips. Pack of 3 pairs in different sizes.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 40,
        featured: false,
        rating: 4.2,
        reviews: 33
      },
      {
        name: 'Plant Labels - Weather Resistant Set of 50',
        category: 'Tools',
        price: 9.99,
        description: 'Weather-resistant plant labels for organizing your garden. Includes marker pen.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 50,
        featured: false,
        rating: 4.1,
        reviews: 12
      },
      {
        name: 'Hand Cultivator - 3 Prong',
        category: 'Tools',
        price: 14.99,
        description: 'Hand cultivator for breaking up soil and removing weeds. Ergonomic wooden handle.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 25,
        featured: false,
        rating: 4.3,
        reviews: 16
      },
      {
        name: 'Garden Fork - Hand Tool',
        category: 'Tools',
        price: 19.99,
        description: 'Hand garden fork for aerating soil and mixing compost. Stainless steel tines.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 18,
        featured: false,
        rating: 4.4,
        reviews: 21
      },

      // FERTILIZERS & NUTRIENTS
      {
        name: 'Organic Compost - Premium 10lb Bag',
        category: 'Fertilizers',
        price: 19.99,
        description: 'Rich organic compost perfect for all plants. Improves soil structure and fertility.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 35,
        featured: true,
        rating: 4.6,
        reviews: 28
      },
      {
        name: 'Liquid Plant Food - All Purpose',
        category: 'Fertilizers',
        price: 14.99,
        description: 'Concentrated liquid fertilizer for indoor and outdoor plants. Easy to use.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 25,
        featured: true,
        rating: 4.3,
        reviews: 21
      },
      {
        name: 'Slow-Release Fertilizer Pellets',
        category: 'Fertilizers',
        price: 22.99,
        description: 'Slow-release fertilizer pellets that feed plants for up to 6 months.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 20,
        featured: true,
        rating: 4.5,
        reviews: 24
      },
      {
        name: 'Worm Castings - Organic 5lb',
        category: 'Fertilizers',
        price: 24.99,
        description: 'Premium worm castings - nature\'s perfect fertilizer. Rich in nutrients and beneficial microbes.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 15,
        featured: false,
        rating: 4.7,
        reviews: 18
      },
      {
        name: 'Fish Emulsion Fertilizer',
        category: 'Fertilizers',
        price: 16.99,
        description: 'Organic fish emulsion fertilizer. Great for leafy greens and vegetables.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 18,
        featured: false,
        rating: 4.2,
        reviews: 14
      },

      // WATERING CANS & SYSTEMS
      {
        name: 'Galvanized Watering Can - 2 Gallon',
        category: 'Watering Cans',
        price: 32.99,
        description: 'Classic galvanized watering can with fine rose attachment. Rust-resistant.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 18,
        featured: true,
        rating: 4.7,
        reviews: 26
      },
      {
        name: 'Plastic Watering Can - 1 Gallon',
        category: 'Watering Cans',
        price: 17.99,
        description: 'Lightweight plastic watering can perfect for indoor plants. Easy to handle.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 30,
        featured: false,
        rating: 4.2,
        reviews: 17
      },
      {
        name: 'Watering Wand - 24 inch Extension',
        category: 'Watering Cans',
        price: 24.99,
        description: 'Long watering wand perfect for hanging baskets and tall plants. Adjustable flow.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 15,
        featured: true,
        rating: 4.4,
        reviews: 19
      },
      {
        name: 'Plant Mister Bottle - Fine Spray',
        category: 'Watering Cans',
        price: 11.99,
        description: 'Fine mist spray bottle perfect for tropical plants and seedlings.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 40,
        featured: false,
        rating: 4.1,
        reviews: 18
      },
      {
        name: 'Drip Irrigation Kit - 20 Plant',
        category: 'Watering Cans',
        price: 39.99,
        description: 'Complete drip irrigation kit for up to 20 plants. Timer included.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 12,
        featured: true,
        rating: 4.6,
        reviews: 22
      },

      // SOIL & COMPOST
      {
        name: 'Potting Soil - Premium Mix 20lb',
        category: 'Soil & Compost',
        price: 16.99,
        description: 'Premium potting soil mix with perlite and vermiculite. Perfect for containers.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 30,
        featured: true,
        rating: 4.5,
        reviews: 25
      },
      {
        name: 'Succulent Soil Mix - Well Draining',
        category: 'Soil & Compost',
        price: 14.99,
        description: 'Specialized well-draining soil mix perfect for succulents and cacti.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 25,
        featured: true,
        rating: 4.5,
        reviews: 22
      },
      {
        name: 'Seed Starting Mix - Sterile',
        category: 'Soil & Compost',
        price: 12.99,
        description: 'Sterile seed starting mix perfect for germinating seeds. Fine texture.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 35,
        featured: false,
        rating: 4.3,
        reviews: 19
      },
      {
        name: 'Perlite - Soil Amendment 8qt',
        category: 'Soil & Compost',
        price: 8.99,
        description: 'Perlite for improving soil drainage and aeration. Essential for healthy roots.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 40,
        featured: false,
        rating: 4.2,
        reviews: 16
      },
      {
        name: 'Vermiculite - Moisture Retention',
        category: 'Soil & Compost',
        price: 9.99,
        description: 'Vermiculite for improving moisture retention in soil. Great for seed starting.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 35,
        featured: false,
        rating: 4.1,
        reviews: 13
      },

      // PLANT CARE PRODUCTS
      {
        name: 'Neem Oil - Organic Pest Control',
        category: 'Plant Care',
        price: 18.99,
        description: 'Organic neem oil for natural pest control. Safe for edible plants.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 20,
        featured: true,
        rating: 4.4,
        reviews: 27
      },
      {
        name: 'Plant Stakes - Bamboo Set of 10',
        category: 'Plant Care',
        price: 7.99,
        description: 'Bamboo plant stakes for supporting growing plants. Natural and biodegradable.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 50,
        featured: false,
        rating: 4.0,
        reviews: 15
      },
      {
        name: 'Plant Ties - Soft Garden Ties',
        category: 'Plant Care',
        price: 6.99,
        description: 'Soft plant ties for securing plants to stakes. Won\'t damage stems.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 45,
        featured: false,
        rating: 4.1,
        reviews: 11
      },
      {
        name: 'Plant Saucer - Drainage Trays',
        category: 'Plant Care',
        price: 4.99,
        description: 'Plant saucers for catching excess water. Set of 5 in different sizes.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 60,
        featured: false,
        rating: 4.0,
        reviews: 8
      },

      // GARDEN ACCESSORIES
      {
        name: 'Garden Kneeler - Foldable Seat',
        category: 'Garden Accessories',
        price: 29.99,
        description: 'Foldable garden kneeler that converts to a seat. Comfortable gardening accessory.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 15,
        featured: true,
        rating: 4.6,
        reviews: 23
      },
      {
        name: 'Garden Apron - Multi-Pocket',
        category: 'Garden Accessories',
        price: 19.99,
        description: 'Multi-pocket garden apron for carrying tools and seeds. Waterproof material.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 20,
        featured: false,
        rating: 4.3,
        reviews: 16
      },
      {
        name: 'Garden Cart - Collapsible',
        category: 'Garden Accessories',
        price: 79.99,
        description: 'Collapsible garden cart for transporting plants and supplies. Heavy-duty wheels.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 8,
        featured: true,
        rating: 4.7,
        reviews: 19
      },
      {
        name: 'Garden Tool Organizer',
        category: 'Garden Accessories',
        price: 24.99,
        description: 'Wall-mounted garden tool organizer. Keeps tools organized and easily accessible.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 12,
        featured: false,
        rating: 4.4,
        reviews: 14
      },

      // INDOOR GROWING EQUIPMENT
      {
        name: 'LED Grow Light - Full Spectrum',
        category: 'Indoor Growing',
        price: 49.99,
        description: 'Full spectrum LED grow light perfect for indoor gardening. Energy efficient.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 12,
        featured: true,
        rating: 4.7,
        reviews: 34
      },
      {
        name: 'Seed Starting Tray - 72 Cells',
        category: 'Indoor Growing',
        price: 11.99,
        description: '72-cell seed starting tray with humidity dome. Perfect for starting seeds.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 35,
        featured: true,
        rating: 4.6,
        reviews: 29
      },
      {
        name: 'Plant Heat Mat - Seedling',
        category: 'Indoor Growing',
        price: 24.99,
        description: 'Heated mat for seed starting. Maintains optimal temperature for germination.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 18,
        featured: false,
        rating: 4.5,
        reviews: 21
      },
      {
        name: 'Humidity Dome - Clear Plastic',
        category: 'Indoor Growing',
        price: 8.99,
        description: 'Clear plastic humidity dome for maintaining moisture during seed germination.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 40,
        featured: false,
        rating: 4.2,
        reviews: 17
      },

      // OUTDOOR GROWING EQUIPMENT
      {
        name: 'Garden Trellis - Expandable',
        category: 'Outdoor Growing',
        price: 19.99,
        description: 'Expandable garden trellis for climbing plants. Easy to assemble and store.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 25,
        featured: true,
        rating: 4.4,
        reviews: 20
      },
      {
        name: 'Garden Netting - Bird Protection',
        category: 'Outdoor Growing',
        price: 14.99,
        description: 'Garden netting to protect plants from birds and pests. UV resistant.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 30,
        featured: false,
        rating: 4.3,
        reviews: 18
      },
      {
        name: 'Cold Frame - Mini Greenhouse',
        category: 'Outdoor Growing',
        price: 89.99,
        description: 'Cold frame mini greenhouse for extending growing season. Polycarbonate panels.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 6,
        featured: true,
        rating: 4.6,
        reviews: 15
      },
      {
        name: 'Garden Mulch - Organic 2cu ft',
        category: 'Outdoor Growing',
        price: 12.99,
        description: 'Organic garden mulch for moisture retention and weed suppression.',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
        stock: 40,
        featured: false,
        rating: 4.2,
        reviews: 16
      }
    ];

    // Insert all products
    console.log(`📦 Inserting ${products.length} gardening products...`);
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Successfully created ${createdProducts.length} products!`);

    // Show summary by category
    console.log('\n📊 Products by Category:');
    const categoryCounts = {};
    createdProducts.forEach(product => {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });

    console.log('\n🎯 Gardening Store Setup Complete!');
    console.log(`✅ Total Products: ${createdProducts.length}`);
    console.log(`✅ Featured Products: ${createdProducts.filter(p => p.featured).length}`);
    console.log(`✅ All products are gardening supplies - no plants or seeds!`);

  } catch (error) {
    console.error('❌ Error populating gardening store:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

populateGardeningStore();


