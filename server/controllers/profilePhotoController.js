const ProfilePhoto = require('../models/ProfilePhoto');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');

// @desc    Upload/Update user profile photo
// @route   POST /api/auth/profile-photo
// @access  Private
const uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  const { imageData, imageType, imageSize, dimensions } = req.body;
  const userId = req.user._id;

  if (!imageData || !imageType) {
    return next(new AppError('Image data and type are required', 400));
  }

  // Validate image size (max 2MB)
  if (imageSize > 2 * 1024 * 1024) {
    return next(new AppError('Image size must be less than 2MB', 400));
  }

  // Validate image type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(imageType)) {
    return next(new AppError('Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed', 400));
  }

  try {
    // Check if user already has a profile photo
    const existingPhoto = await ProfilePhoto.findOne({ userId });

    if (existingPhoto) {
      // Update existing photo
      existingPhoto.imageData = imageData;
      existingPhoto.imageType = imageType;
      existingPhoto.imageSize = imageSize;
      existingPhoto.dimensions = dimensions;
      existingPhoto.lastUpdated = new Date();
      await existingPhoto.save();
    } else {
      // Create new photo
      const profilePhoto = new ProfilePhoto({
        userId,
        imageData,
        imageType,
        imageSize,
        dimensions
      });
      await profilePhoto.save();
    }

    // Update user's avatar field to reference the photo
    await User.findByIdAndUpdate(userId, {
      avatar: `/api/profile-photo/${userId}`,
      hasProfilePhoto: true
    });

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        photoUrl: `/api/profile-photo/${userId}`,
        dimensions,
        imageSize
      }
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return next(new AppError('Failed to upload profile photo', 500));
  }
});

// @desc    Get user profile photo
// @route   GET /api/auth/profile-photo/:userId
// @access  Public
const getProfilePhoto = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  try {
    const profilePhoto = await ProfilePhoto.findOne({ userId });

    if (!profilePhoto) {
      return res.status(404).json({
        success: false,
        message: 'Profile photo not found'
      });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': profilePhoto.imageType,
      'Content-Length': profilePhoto.imageSize,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Last-Modified': profilePhoto.lastUpdated.toUTCString()
    });

    // Convert base64 to buffer and send
    const imageBuffer = Buffer.from(profilePhoto.imageData, 'base64');
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error retrieving profile photo:', error);
    return next(new AppError('Failed to retrieve profile photo', 500));
  }
});

// @desc    Delete user profile photo
// @route   DELETE /api/auth/profile-photo
// @access  Private
const deleteProfilePhoto = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const profilePhoto = await ProfilePhoto.findOne({ userId });

    if (!profilePhoto) {
      return res.status(404).json({
        success: false,
        message: 'Profile photo not found'
      });
    }

    // Delete the photo from database
    await ProfilePhoto.findOneAndDelete({ userId });

    // Update user's avatar field
    await User.findByIdAndUpdate(userId, {
      avatar: null,
      hasProfilePhoto: false
    });

    res.json({
      success: true,
      message: 'Profile photo deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting profile photo:', error);
    return next(new AppError('Failed to delete profile photo', 500));
  }
});

// @desc    Get multiple profile photos by user IDs
// @route   POST /api/auth/profile-photos/batch
// @access  Public
const getBatchProfilePhotos = asyncHandler(async (req, res, next) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    return next(new AppError('User IDs array is required', 400));
  }

  try {
    const profilePhotos = await ProfilePhoto.find({ 
      userId: { $in: userIds } 
    }).select('userId imageData imageType');

    const photosMap = {};
    profilePhotos.forEach(photo => {
      photosMap[photo.userId.toString()] = {
        imageData: photo.imageData,
        imageType: photo.imageType,
        photoUrl: `/api/auth/profile-photo/${photo.userId}`
      };
    });

    res.json({
      success: true,
      data: photosMap
    });

  } catch (error) {
    console.error('Error retrieving batch profile photos:', error);
    return next(new AppError('Failed to retrieve profile photos', 500));
  }
});

module.exports = {
  uploadProfilePhoto,
  getProfilePhoto,
  deleteProfilePhoto,
  getBatchProfilePhotos
};
