const User = require('../models/User');
const BeginnerUser = require('../models/BeginnerUser');
const ExpertUser = require('../models/ExpertUser');
const VendorUser = require('../models/VendorUser');
const Admin = require('../models/Admin');
const Blog = require('../models/Blog');
const { isDbConnected } = require('../config/database');
const { generateToken } = require('../middlewares/auth');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const { sendPasswordResetEmail, sendWelcomeEmail, sendRegistrationEmail } = require('../utils/emailService');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

// Helper function to get user model based on role
const getUserModel = (role) => {
  switch (role) {
    case 'beginner':
      return BeginnerUser;
    case 'expert':
      return ExpertUser;
    case 'vendor':
      return VendorUser;
    default:
      return User;
  }
};

// Helper function to find user in any collection by email
const findUserByEmail = async (email) => {
  const lowerEmail = email.toLowerCase();
  let user = await BeginnerUser.findOne({ email: lowerEmail }).select('+password');
  if (user) return { user, model: BeginnerUser };
  
  user = await ExpertUser.findOne({ email: lowerEmail }).select('+password');
  if (user) return { user, model: ExpertUser };
  
  user = await VendorUser.findOne({ email: lowerEmail }).select('+password');
  if (user) return { user, model: VendorUser };
  
  user = await User.findOne({ email: lowerEmail }).select('+password');
  if (user) return { user, model: User };
  
  return { user: null, model: null };
};

// Helper function to find user in any collection by ID
const findUserById = async (userId) => {
  let user = await BeginnerUser.findById(userId);
  if (user) return { user, model: BeginnerUser };
  
  user = await ExpertUser.findById(userId);
  if (user) return { user, model: ExpertUser };
  
  user = await VendorUser.findById(userId);
  if (user) return { user, model: VendorUser };
  
  user = await User.findById(userId);
  if (user) return { user, model: User };
  
  return { user: null, model: null };
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, username, email, password, role = 'beginner' } = req.body;

  // Validate required fields
  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  if (!name) {
    return next(new AppError('Name is required', 400));
  }

  if (!password) {
    return next(new AppError('Password is required', 400));
  }

  // Validate role
  const validRoles = ['beginner', 'expert', 'vendor'];
  if (!validRoles.includes(role)) {
    return next(new AppError('Invalid role specified', 400));
  }

  // Check if user already exists by email across all collections
  const { user: existingUserByEmail } = await findUserByEmail(email);
  if (existingUserByEmail) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Check if username already exists across all collections (only if username is provided)
  if (username) {
    const lowerUsername = username.toLowerCase();
    const existingBeginner = await BeginnerUser.findOne({ username: lowerUsername });
    const existingExpert = await ExpertUser.findOne({ username: lowerUsername });
    const existingVendor = await VendorUser.findOne({ username: lowerUsername });
    const existingUser = await User.findOne({ username: lowerUsername });
    
    if (existingBeginner || existingExpert || existingVendor || existingUser) {
      return next(new AppError('Username already taken', 400));
    }
  }

  // Get the appropriate model for the role
  const UserModel = getUserModel(role);

  // Create user data
  const userData = {
    name: name.trim(),
    email: email.toLowerCase(),
    password,
    role
  };

  // Add username only if provided
  if (username) {
    userData.username = username.toLowerCase().trim();
  }

  // Create user in the appropriate collection
  const user = await UserModel.create(userData);

  // Auto-create empty cart and wishlist for the user
  try {
    await Promise.all([
      Cart.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id, items: [], updatedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      Wishlist.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id, items: [], updatedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    ]);
  } catch (e) {
    console.error('Failed to initialize cart/wishlist for user:', e.message);
  }

  // Generate token
  const token = generateToken(user._id);

  // Send registration confirmation email
  try {
    const emailResult = await sendRegistrationEmail(user.email, user.name, user.role);
    if (emailResult.success) {
      console.log(`✅ Registration email sent to ${user.email}`);
    } else {
      console.log(`📧 Registration email simulation for ${user.email}`);
    }
  } catch (emailError) {
    console.error('Failed to send registration email:', emailError);
    // Don't fail registration if email fails
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again in a moment.'
    });
  }

  const { email, password, role } = req.body;

  // Validate required fields
  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  if (!password) {
    return next(new AppError('Password is required', 400));
  }

  // If role is provided, verify against specific collection
  if (role) {
    // Validate role
    const validRoles = ['beginner', 'expert', 'vendor', 'admin'];
    if (!validRoles.includes(role)) {
      return next(new AppError('Invalid role specified', 400));
    }

    // Check Admin collection if role is admin
    if (role === 'admin') {
      const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!admin) {
        return next(new AppError('Invalid email or password', 401));
      }

      // Check if admin account is locked
      if (admin.isLocked) {
        return next(new AppError('Account is temporarily locked due to too many failed login attempts', 401));
      }

      // Check password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        // Increment login attempts
        await admin.incLoginAttempts();
        return next(new AppError('Invalid email or password', 401));
      }

      // Reset login attempts on successful login
      if (admin.loginAttempts > 0) {
        await admin.resetLoginAttempts();
      }

      // Update last login and activity
      admin.lastLogin = new Date();
      admin.activity.lastActivity = new Date();
      admin.activity.totalLogins += 1;
      await admin.save();

      // Generate token
      const token = generateToken(admin._id, 'admin');

      return res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
            permissions: admin.permissions,
            status: admin.status,
            avatar: admin.profile.avatar,
            lastLogin: admin.lastLogin,
            isAdmin: true
          },
          token
        }
      });
    }

    // For other roles, only check the collection for the selected role (no fallback to other collections)
    const UserModel = getUserModel(role);
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (user.role !== role) {
      return next(new AppError('Invalid role for this account', 401));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferences: user.preferences,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        token
      }
    });
  }

  // If no role provided, fall back to checking all collections (backward compatibility)
  // First check Admin collection
  let admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (admin) {
    // Check if admin account is locked
    if (admin.isLocked) {
      return next(new AppError('Account is temporarily locked due to too many failed login attempts', 401));
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await admin.incLoginAttempts();
      return next(new AppError('Invalid email or password', 401));
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Update last login and activity
    admin.lastLogin = new Date();
    admin.activity.lastActivity = new Date();
    admin.activity.totalLogins += 1;
    await admin.save();

    // Generate token
    const token = generateToken(admin._id, 'admin');

    return res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin',
          permissions: admin.permissions,
          status: admin.status,
          avatar: admin.profile.avatar,
          lastLogin: admin.lastLogin,
          isAdmin: true
        },
        token
      }
    });
  }

  // If not admin, check all user collections
  const { user, model: UserModel } = await findUserByEmail(email);
  
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Update last login
  if (UserModel) {
    user.lastLogin = new Date();
    await user.save();
  }

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      token
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res, next) => {
  const { user, model } = await findUserById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, preferences, avatar } = req.body;

  const { user, model } = await findUserById(req.user._id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Store old name for blog post updates
  const oldName = user.name;

  // Update fields if provided
  if (name) user.name = name.trim();
  if (preferences) user.preferences = { ...user.preferences, ...preferences };
  if (avatar) user.avatar = avatar;

  await user.save();

  // If name was updated, update author names in all blog posts
  if (name && name.trim() !== oldName) {
    try {
      await Blog.updateMany(
        { authorEmail: user.email },
        { author: name.trim() }
      );
      console.log(`✅ Updated author name in blog posts for user ${user.email}: "${oldName}" → "${name.trim()}"`);
    } catch (error) {
      console.error('❌ Error updating blog post author names:', error);
      // Don't fail the profile update if blog post update fails
    }
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        avatar: user.avatar,
        updatedAt: user.updatedAt
      }
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required', 400));
  }

  // Get user with password from appropriate collection
  const { user, model: UserModel } = await findUserById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get user with password field
  const userWithPassword = await UserModel.findById(req.user._id).select('+password');
  
  // Check current password
  const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Validate new password
  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long', 400));
  }

  // Update password
  userWithPassword.password = newPassword;
  await userWithPassword.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Update user preferences (plant quiz results)
// @route   PUT /api/auth/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res, next) => {
  const { lightLevel, wateringFrequency, spaceType, experience, petFriendly, airPurifying } = req.body;

  const { user, model } = await findUserById(req.user._id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update preferences
  const updatedPreferences = {
    ...user.preferences,
    ...(lightLevel && { lightLevel }),
    ...(wateringFrequency && { wateringFrequency }),
    ...(spaceType && { spaceType }),
    ...(experience && { experience }),
    ...(petFriendly !== undefined && { petFriendly }),
    ...(airPurifying !== undefined && { airPurifying })
  };

  user.preferences = updatedPreferences;
  await user.save();

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      preferences: user.preferences
    }
  });
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
});

// @desc    Google Sign In
// @route   POST /api/auth/google
// @access  Public
const googleSignIn = asyncHandler(async (req, res, next) => {
  const { uid, email, name, photoURL, emailVerified, role = 'beginner' } = req.body;

  if (!uid || !email) {
    return next(new AppError('Google authentication data is incomplete', 400));
  }

  // Validate required fields
  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  // Enforce admin role for specific emails
  const adminEmails = ['admin@urbansprout.com', 'lxiao0391@gmail.com'];
  const isAdminEmail = adminEmails.includes(email.toLowerCase());

  // Check if user already exists with this email across all collections
  const { user: existingUser, model: existingModel } = await findUserByEmail(email);

  if (existingUser) {
    // Update Google ID if not set
    if (!existingUser.googleId) {
      existingUser.googleId = uid;
      existingUser.emailVerified = emailVerified || existingUser.emailVerified;
      if (photoURL && !existingUser.avatar) {
        existingUser.avatar = photoURL;
      }
    }
    // Upgrade to admin if email is in admin list (note: this would require migration)
    if (isAdminEmail && existingUser.role !== 'admin') {
      existingUser.role = 'admin';
    }
    await existingUser.save();
    
    const token = generateToken(existingUser._id);
    return res.json({
      success: true,
      message: 'Google sign-in successful',
      data: {
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          avatar: existingUser.avatar,
          emailVerified: existingUser.emailVerified,
          createdAt: existingUser.createdAt
        },
        token
      }
    });
  }

  // Create new user with proper role in appropriate collection
  const validRoles = ['beginner', 'expert', 'vendor'];
  const userRole = isAdminEmail ? 'admin' : (validRoles.includes(role) ? role : 'beginner');
  const UserModel = getUserModel(userRole);

  const user = await UserModel.create({
    name: name || 'Google User',
    email: email.toLowerCase(),
    googleId: uid,
    role: userRole,
    avatar: photoURL,
    emailVerified: emailVerified || false,
    password: 'google_auth_' + uid // Placeholder password for Google users
  });

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Google sign-in successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      token
    }
  });
});

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  const { user, model: UserModel } = await findUserById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // For Google users, skip password check
  if (!user.googleId && !password) {
    return next(new AppError('Password is required to delete account', 400));
  }

  // Get user with password (if not Google user)
  if (!user.googleId) {
    const userWithPassword = await UserModel.findById(req.user._id).select('+password');
    
    // Verify password
    const isPasswordValid = await userWithPassword.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Password is incorrect', 400));
    }
  }

  // Delete user from appropriate collection
  await UserModel.findByIdAndDelete(req.user._id);

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const { user, model: UserModel } = await findUserByEmail(email);

  if (!user) {
    return next(new AppError('User with this email does not exist', 404));
  }

  // Generate reset token
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to user
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  await user.save();

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  // Send password reset email
  const emailResult = await sendPasswordResetEmail(user.email, resetUrl, user.name);

  if (emailResult.success) {
    console.log(`Password reset email sent to ${email}`);
    res.json({
      success: true,
      message: 'Password reset link has been sent to your email address. Please check your inbox.',
    });
  } else {
    console.error('Failed to send password reset email:', emailResult.error);
    
    // Fallback: provide reset URL directly if email fails
    res.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetUrl: resetUrl,
      instructions: 'Copy and paste this link in your browser to reset your password',
      emailError: emailResult.error
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return next(new AppError('Token and password are required', 400));
  }

  // Hash the token
  const crypto = require('crypto');
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token across all collections
  let user = await BeginnerUser.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    user = await ExpertUser.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });
  }
  
  if (!user) {
    user = await VendorUser.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });
  }
  
  if (!user) {
    user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });
  }

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.'
  });
});

module.exports = {
  register,
  login,
  googleSignIn,
  getProfile,
  updateProfile,
  changePassword,
  updatePreferences,
  logout,
  deleteAccount,
  forgotPassword,
  resetPassword
};