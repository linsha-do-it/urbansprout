const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getQuizzes,
  getQuizById,
  submitQuiz,
} = require('../controllers/quizController');

router.use(protect);

router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.post('/:id/submit', submitQuiz);

module.exports = router;

