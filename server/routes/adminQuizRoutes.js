const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middlewares/auth');
const {
  adminListQuizzes,
  adminGetQuiz,
  adminCreateQuiz,
  adminUpdateQuiz,
  adminSetPublished,
  adminDeleteQuiz,
  adminUploadQuizzesCsv,
} = require('../controllers/quizController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(protect);
router.use(admin);

router.get('/', adminListQuizzes);
router.post('/upload-csv', upload.single('file'), adminUploadQuizzesCsv);
router.post('/', adminCreateQuiz);
router.get('/:id', adminGetQuiz);
router.put('/:id', adminUpdateQuiz);
router.patch('/:id/publish', adminSetPublished);
router.delete('/:id', adminDeleteQuiz);

module.exports = router;

