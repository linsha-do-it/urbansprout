const express = require('express');
const router = express.Router();
const {
  createAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  forgotAdminPassword,
  resetAdminPassword,
  getAllAdmins,
  updateAdminStatus,
  deleteAdmin
} = require('../controllers/adminAuthController');
const { protect, admin } = require('../middlewares/auth');

// Admin profile routes
router.get('/profile', protect, admin, getAdminProfile);
router.put('/profile', protect, admin, updateAdminProfile);
router.put('/change-password', protect, admin, changeAdminPassword);

// Password reset routes
router.post('/forgot-password', forgotAdminPassword);
router.put('/reset-password/:token', resetAdminPassword);

// Admin management routes (Super Admin only)
router.post('/register', protect, admin, createAdmin);
router.get('/admins', protect, admin, getAllAdmins);
router.put('/:id/status', protect, admin, updateAdminStatus);
router.delete('/:id', protect, admin, deleteAdmin);

module.exports = router;


















