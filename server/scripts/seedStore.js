const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const products = [
  // Pots Category
  {
    name: "Ceramic Plant Pot Set",
    category: "Pots",
    price: 1299,
    description: "Beautiful set of 3 ceramic pots in different sizes. Perfect for indoor plants with drainage holes and saucers included.",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop&q=80",
    stock: 25,
    inStock: true,
    featured: true,
    rating: 4.8,
    reviews: 127
  },
  {
    name: "Terracotta Planter Large",
    category: "Pots",
    price: 925,
    description: "Classic terracotta planter ideal for outdoor use. Excellent drainage and breathability for healthy root development.",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&q=80",
    stock: 40,
    inStock: true,
    rating: 4.6,
    reviews: 89
  },
  {
    name: "Modern Hanging Planters",
    category: "Pots",
    price: 1600,
    description: "Set of 4 modern hanging planters with macrame hangers. Perfect for creating vertical gardens in small spaces.",
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?w=400&h=300&fit=crop&q=80",
    stock: 15,
    inStock: true,
    rating: 4.7,
    reviews: 56
  },
  {
    name: "Self-Watering Planter",
    category: "Pots",
    price: 2299,
    description: "Innovative self-watering system keeps plants hydrated for weeks. Perfect for busy gardeners or vacation care.",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80",
    stock: 20,
    inStock: true,
    featured: true,
    rating: 4.9,
    reviews: 203
  },
  {
    name: "Window Box Planter",
    category: "Pots",
    price: 1437,
    description: "Long rectangular planter perfect for window sills. Ideal for herbs and small vegetables with built-in drainage.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&q=80",
    stock: 30,
    inStock: true,
    rating: 4.5,
    reviews: 74
  },

  // Tools Category
  {
    name: "Premium Garden Tool Set",
    category: "Tools",
    price: 4499,
    description: "Complete 10-piece garden tool set with ergonomic handles. Includes trowel, pruners, weeder, and more in a carrying case.",
    image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&q=80",
    stock: 35,
    inStock: true,
    featured: true,
    rating: 4.8,
    reviews: 156
  },
  {
    name: "Hand Trowel Stainless Steel",
    category: "Tools",
    price: 799,
    description: "Durable stainless steel hand trowel with comfortable grip handle. Perfect for planting, transplanting, and weeding.",
    image: "https://images.unsplash.com/photo-1594736797933-d0c4a0b2b8b0?w=400&h=300&fit=crop&q=80",
    stock: 60,
    inStock: true,
    rating: 4.6,
    reviews: 234
  },
  {
    name: "Pruning Shears Professional",
    category: "Tools",
    price: 1225,
    description: "Sharp, precision pruning shears for clean cuts. Ideal for harvesting vegetables and maintaining plants.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 45,
    inStock: true,
    rating: 4.7,
    reviews: 98
  },
  {
    name: "Garden Gloves Breathable",
    category: "Tools",
    price: 649,
    description: "Comfortable, breathable garden gloves with grip coating. Protects hands while maintaining dexterity.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 80,
    inStock: true,
    rating: 4.4,
    reviews: 167
  },
  {
    name: "Soil pH Testing Kit",
    category: "Tools",
    price: 999,
    description: "Easy-to-use soil pH testing kit with color chart. Essential for optimal plant growth and nutrient uptake.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 25,
    inStock: true,
    rating: 4.3,
    reviews: 45
  },

  // Fertilizers Category
  {
    name: "Organic Compost Premium",
    category: "Fertilizers",
    price: 849,
    description: "Rich, organic compost made from kitchen scraps and yard waste. Perfect natural fertilizer for all plants.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 50,
    inStock: true,
    featured: true,
    rating: 4.9,
    reviews: 289
  },
  {
    name: "Liquid Plant Food All-Purpose",
    category: "Fertilizers",
    price: 575,
    description: "Concentrated liquid fertilizer for indoor and outdoor plants. Easy application with measuring cap included.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 75,
    inStock: true,
    rating: 4.5,
    reviews: 134
  },
  {
    name: "Vegetable Garden Fertilizer",
    category: "Fertilizers",
    price: 712,
    description: "Specially formulated for vegetables with balanced NPK ratio. Promotes healthy growth and abundant harvests.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 40,
    inStock: true,
    rating: 4.7,
    reviews: 92
  },
  {
    name: "Bone Meal Organic",
    category: "Fertilizers",
    price: 699,
    description: "Slow-release organic bone meal fertilizer. Excellent source of phosphorus for strong root development.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 30,
    inStock: true,
    rating: 4.6,
    reviews: 67
  },
  {
    name: "Worm Castings Pure",
    category: "Fertilizers",
    price: 1149,
    description: "Premium worm castings - nature's perfect fertilizer. Rich in nutrients and beneficial microorganisms.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 20,
    inStock: true,
    rating: 4.8,
    reviews: 156
  },

  // Watering Cans Category
  {
    name: "Copper Watering Can Vintage",
    category: "Watering Cans",
    price: 2499,
    description: "Beautiful vintage-style copper watering can with long spout. Perfect for precise watering and garden decoration.",
    image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&q=80",
    stock: 15,
    inStock: true,
    featured: true,
    rating: 4.9,
    reviews: 78
  },
  {
    name: "Plastic Watering Can 2L",
    category: "Watering Cans",
    price: 649,
    description: "Lightweight plastic watering can with removable rose head. Perfect for indoor plants and seedlings.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 55,
    inStock: true,
    rating: 4.3,
    reviews: 123
  },
  {
    name: "Galvanized Steel Watering Can",
    category: "Watering Cans",
    price: 1725,
    description: "Durable galvanized steel watering can with brass fittings. Classic design that lasts for years.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 25,
    inStock: true,
    rating: 4.7,
    reviews: 89
  },
  {
    name: "Long Spout Watering Can",
    category: "Watering Cans",
    price: 1399,
    description: "Extra-long spout watering can for reaching hanging plants and deep containers. Ergonomic handle design.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 30,
    inStock: true,
    rating: 4.5,
    reviews: 56
  },
  {
    name: "Decorative Ceramic Watering Can",
    category: "Watering Cans",
    price: 1937,
    description: "Hand-painted ceramic watering can with floral design. Functional art piece for your garden collection.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 12,
    inStock: true,
    rating: 4.6,
    reviews: 34
  },

  // Chatbot Recommended Items
  {
    name: "Small Ceramic Pots Set",
    category: "Pots",
    price: 649,
    description: "Perfect for herbs and small vegetables. Set of 3 ceramic pots with drainage holes.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 50,
    inStock: true,
    featured: true,
    rating: 4.7,
    reviews: 89,
    chatbotRecommended: true
  },
  {
    name: "Window Box Planters",
    category: "Pots",
    price: 925,
    description: "Great for balcony gardening. Long rectangular planters perfect for herbs and small vegetables.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 35,
    inStock: true,
    rating: 4.5,
    reviews: 67,
    chatbotRecommended: true
  },
  {
    name: "Medium Garden Containers",
    category: "Pots",
    price: 1449,
    description: "Great for tomatoes and peppers. Medium-sized containers with excellent drainage.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 25,
    inStock: true,
    rating: 4.6,
    reviews: 45,
    chatbotRecommended: true
  },
  {
    name: "Raised Planter Boxes",
    category: "Pots",
    price: 3299,
    description: "Elevated growing for better drainage. Perfect for vegetables and herbs.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 15,
    inStock: true,
    rating: 4.8,
    reviews: 23,
    chatbotRecommended: true
  },
  {
    name: "Raised Garden Bed Kit",
    category: "Pots",
    price: 6299,
    description: "Complete garden bed system. Large raised bed perfect for extensive vegetable growing.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 10,
    inStock: true,
    rating: 4.9,
    reviews: 34,
    chatbotRecommended: true
  },
  {
    name: "Large Wooden Planters",
    category: "Pots",
    price: 4499,
    description: "Spacious containers for big plants. Durable wooden construction with drainage.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 12,
    inStock: true,
    rating: 4.7,
    reviews: 28,
    chatbotRecommended: true
  },
  {
    name: "Basic Hand Trowel",
    category: "Tools",
    price: 649,
    description: "Essential for planting and transplanting. Comfortable grip and durable construction.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 40,
    inStock: true,
    rating: 4.4,
    reviews: 156,
    chatbotRecommended: true
  },
  {
    name: "Gentle Watering Can",
    category: "Watering Cans",
    price: 999,
    description: "Gentle watering for seedlings. Perfect for delicate plants and indoor gardening.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 30,
    inStock: true,
    rating: 4.5,
    reviews: 78,
    chatbotRecommended: true
  },
  {
    name: "Pruning Shears Set",
    category: "Tools",
    price: 1149,
    description: "For harvesting and maintenance. Sharp blades for clean cuts on herbs and vegetables.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 25,
    inStock: true,
    rating: 4.6,
    reviews: 92,
    chatbotRecommended: true
  },
  {
    name: "Garden Hoe Compact",
    category: "Tools",
    price: 949,
    description: "Weeding and soil cultivation. Compact design perfect for small gardens.",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&q=80",
    stock: 20,
    inStock: true,
    rating: 4.3,
    reviews: 45,
    chatbotRecommended: true
  }
];

async function seedStore() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const insertedProducts = await Product.insertMany(products);
    console.log(`Inserted ${insertedProducts.length} products`);

    // Display summary
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 Store Inventory Summary:');
    categories.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} products`);
    });

    console.log('\n✅ Store seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding store:', error);
    process.exit(1);
  }
}

// Run the seed function
seedStore();