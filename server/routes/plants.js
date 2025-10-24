const express = require('express');
const router = express.Router();
const { 
  createPlant, 
  getPlantSuggestionsByQuiz, 
  updatePlant, 
  deletePlant, 
  getAllPlants, 
  getPlantById, 
  getPlantsByCategory, 
  searchPlants 
} = require('../controllers/plantController');

// POST /api/plants - Create a new plant
router.post('/', createPlant);

// GET /api/plants/quiz - Get plant suggestions based on quiz answers
router.get('/quiz', getPlantSuggestionsByQuiz);

// GET /api/plants/search - Search plants
router.get('/search', searchPlants);

// GET /api/plants/category/:category - Get plants by category
router.get('/category/:category', getPlantsByCategory);

// GET /api/plants - Get all plants with filters
router.get('/', getAllPlants);

// GET /api/plants/:id - Get specific plant by ID
router.get('/:id', getPlantById);

// PUT /api/plants/:id - Update a plant
router.put('/:id', updatePlant);

// DELETE /api/plants/:id - Delete a plant (soft delete)
router.delete('/:id', deletePlant);

module.exports = router;







