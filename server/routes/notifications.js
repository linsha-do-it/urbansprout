const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  const filter = { userId: req.user._id };
  if (unreadOnly === 'true') {
    filter.isRead = false;
  }
  
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  const totalNotifications = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ 
    userId: req.user._id, 
    isRead: false 
  });
  
  res.json({
    success: true,
    data: {
      notifications,
      totalNotifications,
      unreadCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalNotifications / limitNum)
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  if (notification.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this notification'
    });
  }
  
  notification.isRead = true;
  await notification.save();
  
  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );
  
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ 
    userId: req.user._id, 
    isRead: false 
  });
  
  res.json({
    success: true,
    data: { unreadCount }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  if (notification.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this notification'
    });
  }
  
  await Notification.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
const clearAllNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ userId: req.user._id });
  
  res.json({
    success: true,
    message: `All notifications cleared successfully`,
    data: { deletedCount: result.deletedCount }
  });
});

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;


