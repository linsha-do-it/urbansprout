const express = require('express');
const multer = require('multer');
const plantHealthController = require('../controllers/plantHealthController');

const router = express.Router();

// Store uploads in memory; the service decides what to do with bytes.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit to keep things beginner‑friendly
  }
});

// Beginner‑oriented endpoint: simple POST with an image file.
router.post('/analyze', upload.single('image'), plantHealthController.analyzePlant);

module.exports = router;

