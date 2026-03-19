const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createQuestion,
  getExpertQuestions,
  getMyQuestions,
  answerQuestion
} = require('../controllers/courseQuestionController');

router.use(protect);

router.post('/', createQuestion);
router.get('/expert', getExpertQuestions);
router.get('/my', getMyQuestions);
router.put('/:id/answer', answerQuestion);

module.exports = router;

