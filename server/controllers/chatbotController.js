const Plant = require('../models/Plant');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const mistralService = require('../services/mistralService');
const fs = require('fs');
const path = require('path');

// Load plant database from CSV
let plantDatabase = [];
try {
  const csvPath = path.join(__dirname, '../../client/src/data/plant_database.csv');
  console.log('Loading plant database from:', csvPath);
  const csvData = fs.readFileSync(csvPath, 'utf8');
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  plantDatabase = lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const plant = {};
    headers.forEach((header, index) => {
      plant[header.trim()] = values[index] ? values[index].trim() : '';
    });
    return plant;
  });
  console.log('Loaded', plantDatabase.length, 'plants from CSV');
} catch (error) {
  console.error('Error loading plant database:', error);
  // Fallback to basic plant data
  plantDatabase = [
    {
      name: 'Lettuce',
      type: 'vegetable',
      category: 'leafy_green',
      sunlight: 'low',
      maintenance: 'low',
      space: 'small',
      growTime: '30-45 days',
      description: 'Fast-growing leafy green that tolerates shade',
      tips: 'Harvest outer leaves first, Keep soil moist, Perfect for containers',
      image_url: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop',
      features: 'salad,quick_growing,beginner_friendly'
    },
    {
      name: 'Radishes',
      type: 'vegetable',
      category: 'root',
      sunlight: 'full',
      maintenance: 'low',
      space: 'small',
      growTime: '25-30 days',
      description: 'Fastest growing vegetable, perfect for beginners',
      tips: 'Direct sow, Thin seedlings, Harvest when firm',
      image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&h=200&fit=crop',
      features: 'quick_growing,beginner_friendly,root_vegetable'
    },
    {
      name: 'Microgreens',
      type: 'vegetable',
      category: 'leafy_green',
      sunlight: 'full',
      maintenance: 'low',
      space: 'small',
      growTime: '7-14 days',
      description: 'Nutrient-dense baby greens ready in days',
      tips: 'Harvest in 1-2 weeks, Multiple varieties, Year-round growing',
      image_url: 'https://images.unsplash.com/photo-1622207215132-edf4f6f5d8c4?w=300&h=200&fit=crop',
      features: 'superfood,quick_growing,indoor_growing'
    },
    {
      name: 'Cherry Tomatoes',
      type: 'fruit',
      category: 'solanaceae',
      sunlight: 'partial',
      maintenance: 'low',
      space: 'small',
      growTime: '60-80 days',
      description: 'Small sweet tomatoes perfect for containers',
      tips: 'Easier than large tomatoes, Harvest frequently, Support with stakes',
      image_url: 'https://images.unsplash.com/photo-1592841200221-21e1c4e6e8e5?w=300&h=200&fit=crop',
      features: 'container_friendly,sweet_flavor,snacking'
    },
    {
      name: 'Strawberries',
      type: 'fruit',
      category: 'berry',
      sunlight: 'partial',
      maintenance: 'low',
      space: 'small',
      growTime: '90-120 days',
      description: 'Sweet berries that tolerate partial shade',
      tips: 'Plant in spring, Remove runners, Protect from birds',
      image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop',
      features: 'sweet_berry,perennial,container_friendly'
    },
    {
      name: 'Basil',
      type: 'herb',
      category: 'culinary',
      sunlight: 'partial',
      maintenance: 'low',
      space: 'small',
      growTime: '30-60 days',
      description: 'Essential cooking herb with aromatic leaves',
      tips: 'Harvest regularly, Pinch flowers, Great for beginners',
      image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop',
      features: 'cooking_essential,aromatic,italian_cuisine'
    },
    {
      name: 'Spinach',
      type: 'vegetable',
      category: 'leafy_green',
      sunlight: 'low',
      maintenance: 'low',
      space: 'small',
      growTime: '40-50 days',
      description: 'Nutritious leafy green for shaded areas',
      tips: 'Cool weather crop, Harvest baby leaves, Succession plant',
      image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=200&fit=crop',
      features: 'salad,superfood,low_maintenance'
    },
    {
      name: 'Green Onions',
      type: 'vegetable',
      category: 'allium',
      sunlight: 'low',
      maintenance: 'low',
      space: 'small',
      growTime: '60-90 days',
      description: 'Easy to grow, regrows from kitchen scraps',
      tips: 'Regrows from roots, Harvest green tops, Very low maintenance',
      image_url: 'https://images.unsplash.com/photo-1553395572-0b35b5d9b9b5?w=300&h=200&fit=crop',
      features: 'regrowable,cooking_essential,beginner_friendly'
    },
    {
      name: 'Arugula',
      type: 'vegetable',
      category: 'leafy_green',
      sunlight: 'partial',
      maintenance: 'low',
      space: 'small',
      growTime: '25-40 days',
      description: 'Peppery leafy green perfect for salads',
      tips: 'Quick growing, Harvest baby leaves, Peppery flavor',
      image_url: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=200&fit=crop',
      features: 'peppery_flavor,salad_green,quick_growing'
    },
    {
      name: 'Cilantro',
      type: 'herb',
      category: 'culinary',
      sunlight: 'partial',
      maintenance: 'low',
      space: 'small',
      growTime: '30-45 days',
      description: 'Fresh herb popular in Mexican and Asian cuisine',
      tips: 'Harvest leaves early, Goes to seed quickly, Cool weather crop',
      image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop',
      features: 'mexican_cuisine,asian_cuisine,fresh_flavor'
    },
    {
      name: 'Parsley',
      type: 'herb',
      category: 'culinary',
      sunlight: 'partial',
      maintenance: 'low',
      space: 'small',
      growTime: '40-60 days',
      description: 'Classic garnish herb with mild flavor',
      tips: 'Biennial plant, Harvest outer leaves, Rich in vitamins',
      image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop',
      features: 'garnish,mediterranean_cuisine,vitamin_rich'
    },
    {
      name: 'Mint',
      type: 'herb',
      category: 'culinary',
      sunlight: 'partial',
      maintenance: 'low',
      space: 'small',
      growTime: '30-45 days',
      description: 'Refreshing herb perfect for drinks and cooking',
      tips: 'Spreads quickly, Harvest regularly, Great for beverages',
      image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop',
      features: 'refreshing,beverage_herb,spreading_habit'
    },
    {
      name: 'Kale',
      type: 'vegetable',
      category: 'leafy_green',
      sunlight: 'low',
      maintenance: 'low',
      space: 'medium',
      growTime: '50-65 days',
      description: 'Hardy superfood that grows in partial shade',
      tips: 'Cold tolerant, Harvest outer leaves, Grows well in containers',
      image_url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=300&h=200&fit=crop',
      features: 'superfood,salad,smoothie_ingredient'
    },
    {
      name: 'Swiss Chard',
      type: 'vegetable',
      category: 'leafy_green',
      sunlight: 'low',
      maintenance: 'low',
      space: 'medium',
      growTime: '45-60 days',
      description: 'Colorful leafy green with edible stems',
      tips: 'Cut and come again, Colorful varieties, Heat tolerant',
      image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&h=200&fit=crop',
      features: 'colorful,salad,cooking_vegetable'
    },
    {
      name: 'Cucumber',
      type: 'vegetable',
      category: 'cucurbit',
      sunlight: 'full',
      maintenance: 'medium',
      space: 'medium',
      growTime: '50-70 days',
      description: 'Refreshing climbing vegetable for hot weather',
      tips: 'Climbing variety, Regular watering, Harvest frequently',
      image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=200&fit=crop',
      features: 'refreshing,climbing_vine,salad_ingredient'
    },
    {
      name: 'Bell Peppers',
      type: 'vegetable',
      category: 'solanaceae',
      sunlight: 'full',
      maintenance: 'medium',
      space: 'medium',
      growTime: '70-90 days',
      description: 'Sweet colorful peppers perfect for cooking',
      tips: 'Warm season crop, Support heavy fruits, Harvest when colored',
      image_url: 'https://images.unsplash.com/photo-1583662017845-4bfb0b2b2e8e?w=300&h=200&fit=crop',
      features: 'sweet_flavor,cooking_vegetable,colorful'
    },
    {
      name: 'Zucchini',
      type: 'vegetable',
      category: 'cucurbit',
      sunlight: 'full',
      maintenance: 'medium',
      space: 'medium',
      growTime: '45-60 days',
      description: 'Prolific summer squash with versatile uses',
      tips: 'Harvest young fruits, Regular watering, Great for cooking',
      image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=200&fit=crop',
      features: 'prolific,cooking_vegetable,summer_crop'
    },
    {
      name: 'Blueberries',
      type: 'fruit',
      category: 'berry',
      sunlight: 'partial',
      maintenance: 'medium',
      space: 'medium',
      growTime: '365+ days',
      description: 'Sweet antioxidant-rich berries',
      tips: 'Acidic soil needed, Prune annually, Multiple harvests',
      image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop',
      features: 'antioxidant_rich,perennial,sweet_berry'
    },
    {
      name: 'Raspberries',
      type: 'fruit',
      category: 'berry',
      sunlight: 'partial',
      maintenance: 'medium',
      space: 'medium',
      growTime: '365+ days',
      description: 'Sweet tart berries perfect for desserts',
      tips: 'Perennial canes, Prune after fruiting, Support needed',
      image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop',
      features: 'perennial,sweet_berry,climbing_habit'
    }
  ];
}

// Session management for Mistral conversation history
const userSessions = new Map();

// Session management functions for Mistral conversations
function getSession(userId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      conversationHistory: [],
      timestamp: Date.now()
    });
  }
  return userSessions.get(userId);
}

function updateSession(userId, step, data = {}) {
  const session = getSession(userId);
  if (data.conversationHistory) {
    session.conversationHistory = data.conversationHistory;
  }
  session.timestamp = Date.now();
  userSessions.set(userId, session);
}

// Removed static plant recommendation function - now using Mistral AI

// Store item recommendation function - now returns actual product IDs
async function getStoreRecommendations(space, maintenance) {
  const Product = require('../models/Product');
  
  try {
    // Get chatbot recommended products
    const recommendedProducts = await Product.find({ chatbotRecommended: true })
      .select('_id name price description category image')
      .limit(4);
    
    return recommendedProducts.map(product => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image
    }));
  } catch (error) {
    console.error('Error fetching store recommendations:', error);
    // Fallback to generic recommendations
    return [
      { name: "Small Ceramic Pots", description: "Perfect for herbs and small vegetables", category: "container" },
      { name: "Hand Trowel", description: "Essential for planting and transplanting", category: "tool" }
    ];
  }
}

// Removed static specific recommendations function - now using Mistral AI

// Removed static fruit recommendations function - now using Mistral AI

// Removed static vegetable recommendations function - now using Mistral AI

// Mistral-powered conversation processing
async function processMistralConversation(userId, message) {
  try {
    // Get conversation history from session
    const session = getSession(userId);
    const conversationHistory = session.conversationHistory || [];
    
    // Generate response using Mistral
    const mistralResponse = await mistralService.getFilteredResponse(message, conversationHistory);
    
    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: mistralResponse }
    );
    
    // Keep only last 10 messages to avoid token limits
    if (conversationHistory.length > 20) {
      conversationHistory.splice(0, conversationHistory.length - 20);
    }
    
    updateSession(userId, 'mistral_conversation', { conversationHistory });
    
    // Get relevant plant suggestions based on the response
    const plantSuggestions = extractPlantSuggestions(mistralResponse);
    const storeItems = await getStoreRecommendations('medium', 'medium');
    
    return {
      message: mistralResponse,
      plants: plantSuggestions,
      storeItems: storeItems,
      buttons: [
        "Show me container-friendly vegetables",
        "What hybrid fruits can I grow in pots?",
        "I'm a beginner, help me start",
        "Show me fast-growing hybrid varieties",
        "Tell me about dwarf fruit trees"
      ],
      step: "mistral_response"
    };
  } catch (error) {
    console.error('Mistral conversation error:', error);
    // Fallback to traditional conversation processing
    return processConversationMessage(userId, message);
  }
}

// Extract plant suggestions from Mistral response
function extractPlantSuggestions(response) {
  const ediblePlants = [
    'tomato', 'lettuce', 'spinach', 'carrot', 'radish', 'pepper', 'cucumber',
    'zucchini', 'broccoli', 'cauliflower', 'cabbage', 'bean', 'pea', 'onion',
    'garlic', 'strawberry', 'blueberry', 'raspberry', 'apple', 'kale', 'arugula',
    'chard', 'beet', 'turnip', 'eggplant', 'leek', 'brussels sprout', 'squash',
    'pumpkin', 'corn', 'potato', 'sweet potato'
  ];
  
  const responseLower = response.toLowerCase();
  const mentionedPlants = [];
  
  ediblePlants.forEach(plant => {
    if (responseLower.includes(plant)) {
      // Find the plant in our database
      const foundPlant = plantDatabase.find(p => 
        p.name.toLowerCase().includes(plant) || 
        plant.includes(p.name.toLowerCase())
      );
      
      if (foundPlant) {
        mentionedPlants.push(foundPlant);
      }
    }
  });
  
  // Remove duplicates and return top 4
  const uniquePlants = mentionedPlants.filter((plant, index, self) => 
    index === self.findIndex(p => p.name === plant.name)
  );
  
  return uniquePlants.slice(0, 4);
}

// Fallback conversation processing (only used when Mistral API is unavailable)
async function processConversationMessage(userId, message) {
  // Simple fallback response when Mistral API is not available
  return {
    message: "Hi! I'm Sprouty, your friendly garden buddy! I'm excited to help you grow amazing vegetables and fruits! I specialize in container gardening and hybrid varieties that are perfect for small spaces. What delicious plants would you like to grow together?",
    buttons: [
      "I'm a beginner, help me start",
      "Show me container-friendly vegetables",
      "What hybrid fruits can I grow in pots?",
      "Tell me about fast-growing varieties"
    ],
    step: "fallback"
  };
}

// @desc    Process chatbot message
// @route   POST /api/chatbot/message
// @access  Public
const processMessage = asyncHandler(async (req, res) => {
  const { message, userId } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  // Always try Mistral-powered conversation processing first (includes intelligent fallback)
  try {
    // Use Mistral-powered conversation processing (with intelligent fallback if no API key)
    const response = await processMistralConversation(userId || 'anonymous', message);
    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Mistral processing failed, falling back to traditional processing:', error);
    // Fall through to traditional processing
  }

  // Fallback to traditional conversation processing
  const response = await processConversationMessage(userId || 'anonymous', message);

  res.json({
    success: true,
    data: response
  });
});

// @desc    Get plant care tips
// @route   GET /api/chatbot/tips
// @access  Public
const getCareTips = asyncHandler(async (req, res) => {
  const tips = [
    {
      category: 'Watering',
      tip: "Check soil moisture with your finger before watering. Most plants prefer to dry out slightly between waterings.",
      icon: '💧'
    },
    {
      category: 'Light',
      tip: "Rotate your plants weekly to ensure even growth and prevent them from leaning toward the light source.",
      icon: '☀️'
    },
    {
      category: 'Humidity',
      tip: "Group plants together or use a pebble tray with water to increase humidity around your plants.",
      icon: '💨'
    },
    {
      category: 'Cleaning',
      tip: "Dust plant leaves regularly with a damp cloth to help them photosynthesize more efficiently.",
      icon: '🧽'
    },
    {
      category: 'Observation',
      tip: "Check your plants regularly for signs of pests, disease, or stress. Early detection makes treatment easier.",
      icon: '👀'
    }
  ];

  // Return a random tip
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  res.json({
    success: true,
    data: {
      tip: randomTip,
      allTips: tips
    }
  });
});

// @desc    Get plant identification help
// @route   POST /api/chatbot/identify
// @access  Public
const identifyPlant = asyncHandler(async (req, res) => {
  const { description, characteristics } = req.body;

  if (!description) {
    return res.status(400).json({
      success: false,
      message: 'Plant description is required'
    });
  }

  // Simple plant identification based on keywords
  const identificationGuide = {
    'thick leaves': ['succulent', 'jade plant', 'aloe vera'],
    'heart shaped': ['pothos', 'philodendron', 'monstera'],
    'long thin leaves': ['snake plant', 'spider plant', 'dracaena'],
    'split leaves': ['monstera', 'fiddle leaf fig'],
    'trailing': ['pothos', 'ivy', 'string of pearls'],
    'spiky': ['snake plant', 'aloe vera', 'cactus']
  };

  const desc = description.toLowerCase();
  let possiblePlants = [];

  for (const [characteristic, plants] of Object.entries(identificationGuide)) {
    if (desc.includes(characteristic)) {
      possiblePlants.push(...plants);
    }
  }

  // Remove duplicates
  possiblePlants = [...new Set(possiblePlants)];

  let response = "Based on your description, here are some possible matches:";
  if (possiblePlants.length === 0) {
    response = "I couldn't identify your plant from that description. Try describing the leaf shape, size, or growth pattern.";
    possiblePlants = ['pothos', 'snake plant', 'spider plant']; // Default suggestions
  }

  // Try to find these plants in the database
  let matchingPlants = [];
  try {
    for (const plantName of possiblePlants.slice(0, 3)) {
      const plants = await Plant.find({
        name: { $regex: plantName, $options: 'i' },
        isActive: true
      }).limit(1).select('name scientificName images description careInstructions');
      
      matchingPlants.push(...plants);
    }
  } catch (error) {
    console.error('Error fetching matching plants:', error);
  }

  res.json({
    success: true,
    data: {
      response,
      possibleMatches: possiblePlants,
      plants: matchingPlants,
      suggestions: [
        "Can you describe the leaf shape?",
        "How big is the plant?",
        "Does it have flowers?",
        "Is it a trailing or upright plant?"
      ]
    }
  });
});

// @desc    Get seasonal care advice
// @route   GET /api/chatbot/seasonal
// @access  Public
const getSeasonalAdvice = asyncHandler(async (req, res) => {
  const currentMonth = new Date().getMonth(); // 0-11
  let season, advice;

  if (currentMonth >= 2 && currentMonth <= 4) {
    season = 'Spring';
    advice = {
      title: 'Spring Plant Care',
      tips: [
        'Start fertilizing your plants as they enter their growing season',
        'This is the best time for repotting most houseplants',
        'Increase watering frequency as plants become more active',
        'Begin taking cuttings for propagation'
      ],
      icon: '🌸'
    };
  } else if (currentMonth >= 5 && currentMonth <= 7) {
    season = 'Summer';
    advice = {
      title: 'Summer Plant Care',
      tips: [
        'Water more frequently but check soil moisture first',
        'Provide extra humidity during hot, dry weather',
        'Move plants away from air conditioning vents',
        'Continue regular fertilizing schedule'
      ],
      icon: '☀️'
    };
  } else if (currentMonth >= 8 && currentMonth <= 10) {
    season = 'Fall';
    advice = {
      title: 'Fall Plant Care',
      tips: [
        'Reduce fertilizing as plant growth slows down',
        'Begin reducing watering frequency',
        'Bring outdoor plants inside before first frost',
        'Check for pests that may have developed over summer'
      ],
      icon: '🍂'
    };
  } else {
    season = 'Winter';
    advice = {
      title: 'Winter Plant Care',
      tips: [
        'Water less frequently as plants are dormant',
        'Stop fertilizing until spring',
        'Provide extra light with grow lamps if needed',
        'Keep plants away from cold drafts and heating vents'
      ],
      icon: '❄️'
    };
  }

  res.json({
    success: true,
    data: {
      season,
      advice,
      month: new Date().toLocaleString('default', { month: 'long' })
    }
  });
});

module.exports = {
  processMessage,
  getCareTips,
  identifyPlant,
  getSeasonalAdvice
};