const express = require('express');
const router = express.Router();
const { 
  addPlantToGarden, 
  getUserGarden, 
  addJournalEntry, 
  getJournalEntries, 
  updatePlantStatus, 
  removePlantFromGarden 
} = require('../controllers/gardenController');
const { protect } = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(protect);

// POST /api/garden/add - Add plant to user's garden
router.post('/add', addPlantToGarden);

// GET /api/garden - Get user's garden
router.get('/', getUserGarden);

// POST /api/garden/:plantId/journal - Add journal entry to a plant
router.post('/:plantId/journal', addJournalEntry);

// GET /api/garden/:plantId/journal - Get journal entries for a plant
router.get('/:plantId/journal', getJournalEntries);

// PUT /api/garden/:plantId/status - Update plant status
router.put('/:plantId/status', updatePlantStatus);

// DELETE /api/garden/:plantId - Remove plant from garden
router.delete('/:plantId', removePlantFromGarden);

module.exports = router;

