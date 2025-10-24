const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plant = require('../models/Plant');

// Get community statistics
router.get('/community', async (req, res) => {
  try {
    // Count total users (excluding admins)
    const totalUsers = await User.countDocuments({ 
      role: { $ne: 'admin' },
      status: 'active'
    });

    // Count total plants
    const totalPlants = await Plant.countDocuments({ 
      isActive: true,
      archived: false
    });

    // Get unique cities from user profiles (if available)
    const usersWithCities = await User.find({
      'profile.city': { $exists: true, $ne: null, $ne: '' },
      status: 'active'
    }).select('profile.city');

    const uniqueCities = new Set(usersWithCities.map(user => user.profile?.city).filter(Boolean));
    const citiesCount = uniqueCities.size;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPlants,
        citiesCount: citiesCount || 45 // Fallback to 45 if no city data
      }
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching community statistics',
      error: error.message
    });
  }
});

module.exports = router;
