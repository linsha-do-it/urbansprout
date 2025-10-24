const Admin = require('../models/Admin');
const { generateToken } = require('../middlewares/auth');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const { sendPasswordResetEmail } = require('../utils/emailService');

// @desc    Create new admin
// @route   POST /api/admin/auth/register
// @access  Private (Super Admin only)
const createAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'admin', permissions = [] } = req.body;

  // Check if admin already exists
  const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    return next(new AppError('Admin with this email already exists', 400));
  }

  // Validate permissions
  const validPermissions = [
    'user_management',
    'blog_management', 
    'product_management',
    'order_management',
    'analytics_view',
    'system_settings',
    'notification_management',
    'plant_suggestions'
  ];

  const validatedPermissions = permissions.filter(permission => 
    validPermissions.includes(permission)
  );

  // Create admin
  const admin = await Admin.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password,
    role,
    permissions: validatedPermissions,
    createdBy: req.user._id,
    notes: `Created by ${req.user.name} on ${new Date().toISOString()}`
  });

  res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status,
        createdAt: admin.createdAt
      }
    }
  });
});

// @desc    Get admin profile
// @route   GET /api/admin/auth/profile
// @access  Private (Admin only)
const getAdminProfile = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req.user._id);

  res.json({
    success: true,
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status,
        profile: admin.profile,
        lastLogin: admin.lastLogin,
        activity: admin.activity,
        createdAt: admin.createdAt
      }
    }
  });
});

// @desc    Update admin profile
// @route   PUT /api/admin/auth/profile
// @access  Private (Admin only)
const updateAdminProfile = asyncHandler(async (req, res, next) => {
  const { name, profile } = req.body;

  const admin = await Admin.findById(req.user._id);

  if (name) {
    admin.name = name.trim();
  }

  if (profile) {
    admin.profile = {
      ...admin.profile,
      ...profile
    };
  }

  await admin.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status,
        profile: admin.profile,
        lastLogin: admin.lastLogin,
        activity: admin.activity
      }
    }
  });
});

// @desc    Change admin password
// @route   PUT /api/admin/auth/change-password
// @access  Private (Admin only)
const changeAdminPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  admin.password = newPassword;
  await admin.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot admin password
// @route   POST /api/admin/auth/forgot-password
// @access  Public
const forgotAdminPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase() });

  if (!admin) {
    return next(new AppError('Admin with this email does not exist', 404));
  }

  // Generate reset token
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  admin.security.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  admin.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await admin.save();

  // Send reset email
  try {
    await sendPasswordResetEmail(email, admin.name, resetToken, 'admin');
    console.log(`Password reset email sent to admin: ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Password reset email sent'
  });
});

// @desc    Reset admin password
// @route   PUT /api/admin/auth/reset-password/:token
// @access  Public
const resetAdminPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token
  const crypto = require('crypto');
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find admin with this token
  const admin = await Admin.findOne({
    'security.passwordResetToken': hashedToken,
    'security.passwordResetExpires': { $gt: Date.now() }
  });

  if (!admin) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Update password
  admin.password = password;
  admin.security.passwordResetToken = undefined;
  admin.security.passwordResetExpires = undefined;
  admin.security.passwordChangedAt = Date.now();

  await admin.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Get all admins
// @route   GET /api/admin/auth/admins
// @access  Private (Super Admin only)
const getAllAdmins = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status, role } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (role) filter.role = role;

  const admins = await Admin.find(filter)
    .select('-password -security.twoFactorSecret')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Admin.countDocuments(filter);

  res.json({
    success: true,
    data: {
      admins,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    }
  });
});

// @desc    Update admin status
// @route   PUT /api/admin/auth/:id/status
// @access  Private (Super Admin only)
const updateAdminStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const admin = await Admin.findById(id);
  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  // Prevent super admin from changing their own status
  if (admin._id.toString() === req.user._id.toString() && admin.role === 'super_admin') {
    return next(new AppError('Cannot change your own status', 400));
  }

  admin.status = status;
  await admin.save();

  res.json({
    success: true,
    message: `Admin status updated to ${status}`,
    data: { admin }
  });
});

// @desc    Delete admin
// @route   DELETE /api/admin/auth/:id
// @access  Private (Super Admin only)
const deleteAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const admin = await Admin.findById(id);
  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  // Prevent super admin from deleting themselves
  if (admin._id.toString() === req.user._id.toString()) {
    return next(new AppError('Cannot delete your own account', 400));
  }

  // Prevent deletion of super admins
  if (admin.role === 'super_admin') {
    return next(new AppError('Cannot delete super admin accounts', 400));
  }

  await Admin.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Admin deleted successfully'
  });
});

module.exports = {
  createAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  forgotAdminPassword,
  resetAdminPassword,
  getAllAdmins,
  updateAdminStatus,
  deleteAdmin
};


















