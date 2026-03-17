const express = require('express');
const multer = require('multer');
const {
  getAllPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  submitEditRequest,
  deletePost,
  toggleLike,
  toggleBookmark,
  sharePost,
  addComment,
  replyToComment,
  getCategories,
  getFeaturedPosts,
  approvePost,
  rejectPost,
  getMyPosts,
  getBlogStats,
  getTopContributors,
  getTrendingHashtags,
  uploadBlogImage
} = require('../controllers/blogController');
const { protect } = require('../middlewares/auth');
const { admin } = require('../middlewares/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Use JPEG, PNG or WebP.'), false);
  }
});

// Public routes
router.get('/', getAllPosts);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedPosts);
router.get('/stats', getBlogStats);
router.get('/top-contributors', getTopContributors);
router.get('/trending-hashtags', getTrendingHashtags);
router.get('/slug/:slug', getPostBySlug);

// User-specific routes (must be before /:id)
router.get('/mine', protect, getMyPosts);

// Generic routes (must be last for GET by id)
router.get('/:id', getPost);

// Protected routes
router.post('/', protect, createPost);
router.post('/upload-image', protect, upload.single('image'), uploadBlogImage);
router.post('/:id/edit', protect, submitEditRequest);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/share', protect, sharePost);
router.post('/:id/comments', protect, addComment);
router.post('/:id/comments/:commentId/reply', protect, replyToComment);

// Admin routes
router.put('/:id', protect, admin, updatePost);
router.delete('/:id', protect, admin, deletePost);
router.put('/:id/approve', protect, admin, approvePost);
router.put('/:id/reject', protect, admin, rejectPost);

module.exports = router;