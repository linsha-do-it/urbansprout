const Plant = require('../models/Plant');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Create a new plant
const createPlant = async (req, res) => {
  try {
    const plantData = req.body;
    
    // Handle both single plant and array of plants
    if (Array.isArray(plantData)) {
      // Bulk create plants
      const plants = [];
      for (const singlePlant of plantData) {
        // Validate only essential required fields
        const requiredFields = ['plantName', 'imageUrl', 'description', 'benefits', 'sunlight', 'space', 'experience', 'maintenance', 'category', 'difficulty', 'growingTime'];
        const missingFields = requiredFields.filter(field => !singlePlant[field]);
        
        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Missing required fields in plant "${singlePlant.plantName || 'Unknown'}": ${missingFields.join(', ')}`
          });
        }

        // Set default values for optional fields
        const plantWithDefaults = {
          ...singlePlant,
          daysToGrow: singlePlant.daysToGrow || 60,
          price: singlePlant.price || '₹20-40',
          isActive: true,
          archived: false
        };

        plants.push(plantWithDefaults);
      }

      // Insert all plants
      const createdPlants = await Plant.insertMany(plants);
      
      res.status(201).json({
        success: true,
        message: `${createdPlants.length} plants created successfully`,
        data: createdPlants
      });
      return;
    }

    // Single plant creation
    // Validate only essential required fields
    const requiredFields = ['plantName', 'imageUrl', 'description', 'benefits', 'sunlight', 'space', 'experience', 'maintenance', 'category', 'difficulty', 'growingTime'];
    const missingFields = requiredFields.filter(field => !plantData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Set default values for optional fields
    const plantWithDefaults = {
      ...plantData,
      daysToGrow: plantData.daysToGrow || 60,
      price: plantData.price || '₹20-40',
      isActive: true,
      archived: false
    };

    const plant = new Plant(plantWithDefaults);
    await plant.save();

    res.status(201).json({
      success: true,
      message: 'Plant created successfully',
      data: plant
    });
  } catch (error) {
    console.error('Error creating plant:', error);
    res.status(500).json({
            success: false,
      message: 'Error creating plant',
      error: error.message
    });
  }
};

// Get plant suggestions based on quiz answers
const getPlantSuggestionsByQuiz = async (req, res) => {
  try {
    const { sunlight, space, experience, time } = req.query;

    // Validate required fields
    if (!sunlight || !space || !experience || !time) {
      return res.status(400).json({
        success: false,
        message: 'All quiz parameters are required: sunlight, space, experience, time'
      });
    }

    // Build query for exact match first
    // Map time parameter to maintenance field
    const maintenanceMap = {
      'low': 'low',
      'medium': 'medium', 
      'high': 'high'
    };
    
    let query = {
      sunlight: sunlight.toLowerCase(),
      space: space.toLowerCase(),
      experience: experience.toLowerCase(),
      maintenance: maintenanceMap[time.toLowerCase()] || time.toLowerCase(),
      isActive: true,
      archived: false
    };

    let plants = await Plant.find(query).limit(6);

    // If no exact matches, try partial matches
    if (plants.length === 0) {
      // Try matching 3 out of 4 criteria
      const partialQueries = [
        { sunlight, space, experience, isActive: true, archived: false },
        { sunlight, space, maintenance: maintenanceMap[time.toLowerCase()] || time.toLowerCase(), isActive: true, archived: false },
        { sunlight, experience, maintenance: maintenanceMap[time.toLowerCase()] || time.toLowerCase(), isActive: true, archived: false },
        { space, experience, maintenance: maintenanceMap[time.toLowerCase()] || time.toLowerCase(), isActive: true, archived: false }
      ];

      for (const partialQuery of partialQueries) {
        plants = await Plant.find(partialQuery).limit(6);
        if (plants.length > 0) break;
      }
    }

    // If still no matches, try matching 2 out of 4 criteria
    if (plants.length === 0) {
      const twoCriteriaQueries = [
        { sunlight, space, isActive: true, archived: false },
        { sunlight, experience, isActive: true, archived: false },
        { space, experience, isActive: true, archived: false },
        { experience, maintenance: maintenanceMap[time.toLowerCase()] || time.toLowerCase(), isActive: true, archived: false }
      ];

      for (const twoQuery of twoCriteriaQueries) {
        plants = await Plant.find(twoQuery).limit(6);
        if (plants.length > 0) break;
      }
    }

    // If still no matches, return empty array (no fallback plants)
    // This ensures only plants from the database are shown

    // Transform plants to match frontend expectations
    const transformedPlants = plants.map(plant => ({
      name: plant.plantName,
      category: plant.category,
      description: plant.description,
      image: plant.imageUrl,
      growingTime: plant.growingTime,
      sunlight: plant.sunlight,
      space: plant.space,
      difficulty: plant.difficulty,
      price: plant.price,
      benefits: plant.benefits,
      maintenance: plant.maintenance,
      daysToGrow: plant.daysToGrow
    }));

    res.json({
      success: true,
      plants: transformedPlants,
      total: transformedPlants.length,
      query: { sunlight, space, experience, time }
    });

  } catch (error) {
    console.error('Error getting plant suggestions by quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plant suggestions',
      error: error.message
    });
  }
};

// Update a plant
const updatePlant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plant = await Plant.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }

    res.json({
      success: true,
      message: 'Plant updated successfully',
      data: plant
    });
  } catch (error) {
    console.error('Error updating plant:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plant',
      error: error.message
    });
  }
};

// Delete a plant (soft delete by setting archived to true)
const deletePlant = async (req, res) => {
  try {
    const { id } = req.params;

    const plant = await Plant.findByIdAndUpdate(id, { archived: true, isActive: false }, { new: true });

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }

    res.json({
      success: true,
      message: 'Plant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plant:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plant',
      error: error.message
    });
  }
};

const getAllPlants = async (req, res) => {
  try {
    const {
      plantName,
      sunlight,
      space,
      experience,
      time,
      goal,
      maintenance,
      minDays,
      maxDays,
      search,
      page = 1,
      limit = 12
    } = req.query;

    const query = { isActive: true };
    if (plantName) query.plantName = { $regex: plantName, $options: 'i' };
    if (sunlight) query.sunlight = sunlight;
    if (space) query.space = space;
    if (experience) query.experience = experience;
    if (time) query.time = time;
    if (goal) query.goal = goal;
    if (maintenance) query.maintenance = maintenance;
    if (minDays || maxDays) {
      query.daysToGrow = {};
      if (minDays) query.daysToGrow.$gte = Number(minDays);
      if (maxDays) query.daysToGrow.$lte = Number(maxDays);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [plants, total] = await Promise.all([
      Plant.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Plant.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        plants,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all plants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plants',
      error: error.message
    });
  }
};

const getPlantById = async (req, res) => {
  try {
    const { id } = req.params;
    const plant = await Plant.findById(id);
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }

    res.json({
      success: true,
      data: plant
    });
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plant',
      error: error.message
    });
  }
};

// Get plants by category
const getPlantsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [plants, total] = await Promise.all([
      Plant.find({ 
        category: category.toLowerCase(), 
        isActive: true, 
        archived: false 
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
      Plant.countDocuments({ 
        category: category.toLowerCase(), 
        isActive: true, 
        archived: false 
      })
    ]);

    res.json({
      success: true,
      data: {
        plants,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching plants by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plants by category',
      error: error.message
    });
  }
};

// Search plants
const searchPlants = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [plants, total] = await Promise.all([
      Plant.find({
        $text: { $search: q },
        isActive: true,
        archived: false
      })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limitNum),
      Plant.countDocuments({
        $text: { $search: q },
        isActive: true,
        archived: false
      })
    ]);

    res.json({
      success: true,
      data: {
        plants,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error searching plants:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching plants',
      error: error.message
    });
  }
};

module.exports = {
  createPlant,
  getPlantSuggestionsByQuiz,
  updatePlant,
  deletePlant,
  getAllPlants,
  getPlantById,
  getPlantsByCategory,
  searchPlants
};







