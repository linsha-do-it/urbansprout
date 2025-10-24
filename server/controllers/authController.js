const User = require('../models/User');
const Admin = require('../models/Admin');
const Blog = require('../models/Blog');
const OTP = require('../models/OTP');
const { generateToken } = require('../middlewares/auth');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const { sendPasswordResetEmail, sendWelcomeEmail, sendRegistrationEmail, sendOTPEmail } = require('../utils/emailService');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, username, email, password, role = 'beginner', professionalId } = req.body;

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

  // Check if user already exists by email
  const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingUserByEmail) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Check if username already exists (only if username is provided)
  if (username) {
    const existingUserByUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUserByUsername) {
      return next(new AppError('Username already taken', 400));
    }
  }

  // Check if professional ID already exists (for experts and vendors)
  if (professionalId && (role === 'expert' || role === 'vendor')) {
    const existingProfessional = await User.findOne({ professionalId: professionalId.trim() });
    if (existingProfessional) {
      return next(new AppError(`${role === 'expert' ? 'Expert' : 'Vendor'} ID already exists`, 400));
    }
  }

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

  // Add professional ID if provided
  if (professionalId && (role === 'expert' || role === 'vendor')) {
    userData.professionalId = professionalId.trim();
  }

  // Create user
  const user = await User.create(userData);

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
        professionalId: user.professionalId,
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
  const { email, password } = req.body;

  // Validate required fields
  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  if (!password) {
    return next(new AppError('Password is required', 400));
  }

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

  // If not admin, check User collection
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
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
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

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
        isEmailVerified: user.isEmailVerified,
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

  const user = await User.findById(req.user._id);
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

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Validate new password
  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

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

  const user = await User.findById(req.user._id);
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

  // Check if user already exists with this email
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    // Update Google ID if not set
    if (!user.googleId) {
      user.googleId = uid;
      user.emailVerified = emailVerified || user.emailVerified;
      if (photoURL && !user.avatar) {
        user.avatar = photoURL;
      }
    }
    // Upgrade to admin if email is in admin list
    if (isAdminEmail && user.role !== 'admin') {
      user.role = 'admin';
    }
    await user.save();
  } else {
    // Create new user with proper role
    user = await User.create({
      name: name || 'Google User',
      email: email.toLowerCase(),
      googleId: uid,
      role: isAdminEmail ? 'admin' : role,
      avatar: photoURL,
      emailVerified: emailVerified || false,
      password: 'google_auth_' + uid // Placeholder password for Google users
    });
  }

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
        professionalId: user.professionalId,
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

  // For Google users, skip password check
  if (!req.user.googleId && !password) {
    return next(new AppError('Password is required to delete account', 400));
  }

  // Get user with password (if not Google user)
  if (!req.user.googleId) {
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Password is incorrect', 400));
    }
  }

  // Delete user
  await User.findByIdAndDelete(req.user._id);

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

  const user = await User.findOne({ email: email.toLowerCase() });

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

  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpire: { $gt: Date.now() }
  });

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

// @desc    Send OTP for email verification during signup
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'beginner' } = req.body;

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

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Delete any existing OTP for this email
  await OTP.deleteMany({ email: email.toLowerCase() });

  // Create OTP record with user data
  const otpRecord = await OTP.create({
    email: email.toLowerCase(),
    otp,
    type: 'registration',
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    userData: {
      name: name.trim(),
      password, // Will be hashed when user is created
      role
    }
  });

  // Send OTP email
  try {
    const emailResult = await sendOTPEmail(email, otp, name);
    if (emailResult.success) {
      console.log(`✅ OTP email sent to ${email}`);
    } else {
      console.log(`📧 OTP email simulation for ${email}: ${otp}`);
    }
  } catch (emailError) {
    console.error('Failed to send OTP email:', emailError);
    // Don't fail OTP generation if email fails - just log it
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email address. Please check your inbox.',
    data: {
      email: email.toLowerCase(),
      expiresIn: '10 minutes'
    }
  });
});

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  // Validate required fields
  if (!email || !otp) {
    return next(new AppError('Email and OTP are required', 400));
  }

  // Find OTP record
  const otpRecord = await OTP.findOne({ 
    email: email.toLowerCase(),
    type: 'registration'
  }).sort({ createdAt: -1 }); // Get most recent OTP

  if (!otpRecord) {
    return next(new AppError('No OTP found for this email. Please request a new one.', 400));
  }

  // Check if OTP is expired
  if (otpRecord.isExpired()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return next(new AppError('OTP has expired. Please request a new one.', 400));
  }

  // Check if max attempts reached
  if (otpRecord.isMaxAttemptsReached()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return next(new AppError('Maximum verification attempts reached. Please request a new OTP.', 400));
  }

  // Verify OTP
  if (otpRecord.otp !== otp.trim()) {
    await otpRecord.incrementAttempts();
    const attemptsLeft = otpRecord.maxAttempts - otpRecord.attempts;
    return next(new AppError(`Invalid OTP. ${attemptsLeft} attempts remaining.`, 400));
  }

  // OTP is valid - create the user
  const userData = {
    name: otpRecord.userData.name,
    email: email.toLowerCase(),
    password: otpRecord.userData.password,
    role: otpRecord.userData.role,
    emailVerified: true // Mark email as verified
  };

  const user = await User.create(userData);

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

  // Delete OTP record
  await OTP.deleteOne({ _id: otpRecord._id });

  // Generate token
  const token = generateToken(user._id);

  // Send welcome/registration email
  try {
    const emailResult = await sendRegistrationEmail(user.email, user.name, user.role);
    if (emailResult.success) {
      console.log(`✅ Registration email sent to ${user.email}`);
    }
  } catch (emailError) {
    console.error('Failed to send registration email:', emailError);
    // Don't fail registration if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Email verified successfully! Your account has been created.',
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

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  // Find existing OTP record
  const existingOTP = await OTP.findOne({ 
    email: email.toLowerCase(),
    type: 'registration'
  }).sort({ createdAt: -1 });

  if (!existingOTP) {
    return next(new AppError('No pending registration found for this email. Please start registration again.', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Delete old OTP and create new one
  await OTP.deleteMany({ email: email.toLowerCase() });
  
  const otpRecord = await OTP.create({
    email: email.toLowerCase(),
    otp,
    type: 'registration',
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    userData: existingOTP.userData // Keep the same user data
  });

  // Send OTP email
  try {
    const emailResult = await sendOTPEmail(email, otp, existingOTP.userData.name);
    if (emailResult.success) {
      console.log(`✅ OTP resent to ${email}`);
    } else {
      console.log(`📧 OTP resend simulation for ${email}: ${otp}`);
    }
  } catch (emailError) {
    console.error('Failed to resend OTP email:', emailError);
  }

  res.status(200).json({
    success: true,
    message: 'New OTP sent to your email address.',
    data: {
      email: email.toLowerCase(),
      expiresIn: '10 minutes'
    }
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
  resetPassword,
  sendOTP,
  verifyOTP,
  resendOTP
};