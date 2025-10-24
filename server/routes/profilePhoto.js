const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  uploadProfilePhoto,
  getProfilePhoto,
  deleteProfilePhoto,
  getBatchProfilePhotos
} = require('../controllers/profilePhotoController');

// @route   POST /api/profile-photo
// @desc    Upload/Update user profile photo
// @access  Private
router.post('/', protect, uploadProfilePhoto);

// @route   GET /api/profile-photo/:userId
// @desc    Get user profile photo
// @access  Public
router.get('/:userId', getProfilePhoto);

// @route   DELETE /api/profile-photo
// @desc    Delete user profile photo
// @access  Private
router.delete('/', protect, deleteProfilePhoto);

// @route   POST /api/profile-photos/batch
// @desc    Get multiple profile photos by user IDs
// @access  Public
router.post('/batch', getBatchProfilePhotos);

module.exports = router;
