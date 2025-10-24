const express = require('express');
const router = express.Router();
const { processMessage } = require('../controllers/chatbotController');

// Main chatbot endpoint
router.post('/', processMessage);

// Get predefined questions endpoint
router.get('/questions', (req, res) => {
  const predefinedQuestions = [
    "I'm a beginner, give me suggestions",
    "I want specific recommendations", 
    "Show me quick growing options",
    "I want plants for salads",
    "I want plants for smoothies",
    "What exotic fruits can I grow?",
    "I have a small balcony space",
    "I want low maintenance plants",
    "Help me start a vegetable garden"
  ];
  
  res.json({
    success: true,
    data: predefinedQuestions
  });
});

module.exports = router;
