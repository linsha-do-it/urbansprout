const mongoose = require('mongoose');
const PlantSuggestion = require('../models/PlantSuggestion');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbansprout', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const plantSuggestionsData = [
  // Small Space + Full Sun + Beginner + Low Maintenance + Food
  {
    space: 'small',
    sunlight: 'full_sun',
    experience: 'beginner',
    time: 'low',
    purpose: 'food',
    plants: [
      {
        name: 'Cherry Tomato',
        category: 'Fruits',
        description: 'Small, sweet tomatoes perfect for containers. Easy to grow!',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&h=200&fit=crop&q=80',
        growingTime: '60-75 days',
        sunlight: 'Full Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹30-50'
      },
      {
        name: 'Strawberry',
        category: 'Fruits',
        description: 'Sweet, juicy berries perfect for desserts.',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop&q=80',
        growingTime: '60-80 days',
        sunlight: 'Full Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹25-40'
      },
      {
        name: 'Sweet Basil',
        category: 'Herbs',
        description: 'Aromatic herb perfect for cooking. Great for beginners!',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&h=200&fit=crop&q=80',
        growingTime: '30-45 days',
        sunlight: 'Full Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹20-30'
      },
      {
        name: 'Fresh Mint',
        category: 'Herbs',
        description: 'Fast-growing herb perfect for teas and cooking.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '20-30 days',
        sunlight: 'Full Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹15-25'
      },
      {
        name: 'Bell Pepper',
        category: 'Vegetables',
        description: 'Colorful peppers that add flavor to any dish.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=200&fit=crop&q=80',
        growingTime: '70-90 days',
        sunlight: 'Full Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹25-40'
      },
      {
        name: 'Lettuce',
        category: 'Vegetables',
        description: 'Crisp, fresh greens perfect for salads.',
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop&q=80',
        growingTime: '30-45 days',
        sunlight: 'Full Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹15-25'
      }
    ],
    recommendationMessage: 'Perfect for small spaces! Here are beginner-friendly, low-maintenance plants that match your growing conditions.'
  },
  // Small Space + Partial Sun + Beginner + Low Maintenance + Food
  {
    space: 'small',
    sunlight: 'partial_sun',
    experience: 'beginner',
    time: 'low',
    purpose: 'food',
    plants: [
      {
        name: 'Strawberry',
        category: 'Fruits',
        description: 'Sweet, juicy berries perfect for desserts.',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop&q=80',
        growingTime: '60-80 days',
        sunlight: 'Partial Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹25-40'
      },
      {
        name: 'Cherry Tomato',
        category: 'Fruits',
        description: 'Small, sweet tomatoes perfect for containers. Easy to grow!',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&h=200&fit=crop&q=80',
        growingTime: '60-75 days',
        sunlight: 'Partial Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹30-50'
      },
      {
        name: 'Cilantro',
        category: 'Herbs',
        description: 'Fresh herb perfect for Indian cooking and garnishing.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '25-35 days',
        sunlight: 'Partial Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹15-25'
      },
      {
        name: 'Parsley',
        category: 'Herbs',
        description: 'Versatile herb great for cooking and garnishing.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '30-40 days',
        sunlight: 'Partial Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹18-28'
      },
      {
        name: 'Spinach',
        category: 'Vegetables',
        description: 'Nutrient-rich leafy green that grows well in partial shade.',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=200&fit=crop&q=80',
        growingTime: '35-50 days',
        sunlight: 'Partial Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹20-30'
      },
      {
        name: 'Green Onions',
        category: 'Vegetables',
        description: 'Quick-growing onions perfect for garnishing dishes.',
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop&q=80',
        growingTime: '20-30 days',
        sunlight: 'Partial Sun',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹10-20'
      }
    ],
    recommendationMessage: 'Perfect for small spaces! Here are beginner-friendly, low-maintenance plants that grow well in partial sunlight.'
  },
  // Medium Space + Full Sun + Intermediate + Medium Maintenance + Food
  {
    space: 'medium',
    sunlight: 'full_sun',
    experience: 'intermediate',
    time: 'medium',
    purpose: 'food',
    plants: [
      {
        name: 'Watermelon',
        category: 'Fruits',
        description: 'Sweet, refreshing summer fruit perfect for hot days.',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop&q=80',
        growingTime: '80-100 days',
        sunlight: 'Full Sun',
        space: 'Medium',
        difficulty: 'Medium',
        price: '₹50-80'
      },
      {
        name: 'Cantaloupe',
        category: 'Fruits',
        description: 'Sweet melon perfect for desserts and snacks.',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop&q=80',
        growingTime: '75-90 days',
        sunlight: 'Full Sun',
        space: 'Medium',
        difficulty: 'Medium',
        price: '₹45-75'
      },
      {
        name: 'Rosemary',
        category: 'Herbs',
        description: 'Aromatic herb perfect for Mediterranean cooking.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '60-90 days',
        sunlight: 'Full Sun',
        space: 'Medium',
        difficulty: 'Medium',
        price: '₹30-45'
      },
      {
        name: 'Oregano',
        category: 'Herbs',
        description: 'Mediterranean herb perfect for Italian dishes.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '40-50 days',
        sunlight: 'Full Sun',
        space: 'Medium',
        difficulty: 'Medium',
        price: '₹20-30'
      },
      {
        name: 'Cucumber',
        category: 'Vegetables',
        description: 'Refreshing vegetable perfect for salads and pickling.',
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop&q=80',
        growingTime: '50-70 days',
        sunlight: 'Full Sun',
        space: 'Medium',
        difficulty: 'Medium',
        price: '₹30-45'
      },
      {
        name: 'Zucchini',
        category: 'Vegetables',
        description: 'Versatile summer squash perfect for cooking.',
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop&q=80',
        growingTime: '45-60 days',
        sunlight: 'Full Sun',
        space: 'Medium',
        difficulty: 'Medium',
        price: '₹25-40'
      }
    ],
    recommendationMessage: 'Perfect for medium spaces! Here are intermediate-level, moderate-care plants that match your growing conditions.'
  },
  // Large Space + Full Sun + Advanced + High Maintenance + Food
  {
    space: 'large',
    sunlight: 'full_sun',
    experience: 'advanced',
    time: 'high',
    purpose: 'food',
    plants: [
      {
        name: 'Grapes',
        category: 'Fruits',
        description: 'Sweet fruits perfect for eating and winemaking.',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop&q=80',
        growingTime: '120-150 days',
        sunlight: 'Full Sun',
        space: 'Large',
        difficulty: 'Hard',
        price: '₹70-120'
      },
      {
        name: 'Figs',
        category: 'Fruits',
        description: 'Sweet, unique fruits perfect for desserts.',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop&q=80',
        growingTime: '100-130 days',
        sunlight: 'Full Sun',
        space: 'Large',
        difficulty: 'Hard',
        price: '₹60-100'
      },
      {
        name: 'Lavender',
        category: 'Herbs',
        description: 'Fragrant herb perfect for aromatherapy and cooking.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '90-120 days',
        sunlight: 'Full Sun',
        space: 'Large',
        difficulty: 'Hard',
        price: '₹40-70'
      },
      {
        name: 'Sage',
        category: 'Herbs',
        description: 'Aromatic herb perfect for stuffing and cooking.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '50-70 days',
        sunlight: 'Full Sun',
        space: 'Large',
        difficulty: 'Hard',
        price: '₹25-40'
      },
      {
        name: 'Pumpkin',
        category: 'Vegetables',
        description: 'Versatile vegetable perfect for cooking and decoration.',
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop&q=80',
        growingTime: '90-120 days',
        sunlight: 'Full Sun',
        space: 'Large',
        difficulty: 'Hard',
        price: '₹40-70'
      },
      {
        name: 'Corn',
        category: 'Vegetables',
        description: 'Sweet corn perfect for grilling and cooking.',
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop&q=80',
        growingTime: '70-90 days',
        sunlight: 'Full Sun',
        space: 'Large',
        difficulty: 'Hard',
        price: '₹30-50'
      }
    ],
    recommendationMessage: 'Perfect for large spaces! Here are advanced, high-maintenance plants that match your growing conditions.'
  },
  // Small Space + Shade + Beginner + Low Maintenance + Health
  {
    space: 'small',
    sunlight: 'shade',
    experience: 'beginner',
    time: 'low',
    purpose: 'health',
    plants: [
      {
        name: 'Strawberry',
        category: 'Fruits',
        description: 'Sweet, juicy berries perfect for desserts.',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop&q=80',
        growingTime: '60-80 days',
        sunlight: 'Shade',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹25-40'
      },
      {
        name: 'Cherry Tomato',
        category: 'Fruits',
        description: 'Small, sweet tomatoes perfect for containers. Easy to grow!',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&h=200&fit=crop&q=80',
        growingTime: '60-75 days',
        sunlight: 'Shade',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹30-50'
      },
      {
        name: 'Spider Plant',
        category: 'Herbs',
        description: 'Air-purifying plant perfect for beginners.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '45-75 days',
        sunlight: 'Shade',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹120-250'
      },
      {
        name: 'Snake Plant',
        category: 'Herbs',
        description: 'Low-maintenance air purifier perfect for small spaces.',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&q=80',
        growingTime: '90-120 days',
        sunlight: 'Shade',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹150-300'
      },
      {
        name: 'Mushrooms',
        category: 'Vegetables',
        description: 'Nutritious fungi that grow well in low light conditions.',
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop&q=80',
        growingTime: '14-21 days',
        sunlight: 'Shade',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹30-50'
      },
      {
        name: 'Microgreens',
        category: 'Vegetables',
        description: 'Nutrient-dense baby greens perfect for salads.',
        image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop&q=80',
        growingTime: '7-14 days',
        sunlight: 'Shade',
        space: 'Small',
        difficulty: 'Easy',
        price: '₹20-35'
      }
    ],
    recommendationMessage: 'Perfect for small spaces! Here are beginner-friendly, low-maintenance air-purifying plants that grow well in shade.'
  }
];

async function populatePlantSuggestions() {
  try {
    console.log('Starting to populate plant suggestions...');
    
    // Clear existing data
    await PlantSuggestion.deleteMany({});
    console.log('Cleared existing plant suggestions');
    
    // Insert new data
    const result = await PlantSuggestion.insertMany(plantSuggestionsData);
    console.log(`Successfully populated ${result.length} plant suggestion combinations`);
    
    // Verify the data
    const count = await PlantSuggestion.countDocuments();
    console.log(`Total plant suggestions in database: ${count}`);
    
    // Show sample data
    const sample = await PlantSuggestion.findOne();
    if (sample) {
      console.log('Sample combination:', sample.combinationKey);
      console.log('Number of plants in sample:', sample.plants.length);
      console.log('Plant categories:', sample.plants.map(p => p.category));
    }
    
  } catch (error) {
    console.error('Error populating plant suggestions:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
populatePlantSuggestions();


