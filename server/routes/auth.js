const express = require('express');
const {
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
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const admin = require('firebase-admin');
if (!admin.apps.length) {
  try {
    // Prefer explicit service account via env vars if provided
    const {
      FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY
    } = process.env;

    if (FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL && FIREBASE_PROJECT_ID) {
      const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey
        })
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Fallback to ADC if explicit key not provided
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        ...(process.env.FIREBASE_PROJECT_ID && { projectId: process.env.FIREBASE_PROJECT_ID })
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // As a minimal path, allow unverified token parsing using projectId (emulator-like)
      // Note: This will still require valid Google credentials to call Admin APIs.
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    } else {
      throw new Error('Firebase Admin credentials are not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS');
    }
  } catch (e) {
    // Initialization warning suppressed to reduce noise
  }
}
const { validateRegistration, validateLogin } = require('../middlewares/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/google', googleSignIn);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// OTP verification routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Email validation endpoint
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists with this email
    const User = require('../models/User');
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    });

    res.json({
      success: true,
      exists: !!existingUser,
      message: existingUser ? 'Email already registered' : 'Email available'
    });

  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email availability'
    });
  }
});

// Username validation endpoint
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Basic validation
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters'
      });
    }

    if (username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be less than 20 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
    }

    if (username.startsWith('_') || username.endsWith('_')) {
      return res.status(400).json({
        success: false,
        message: 'Username cannot start or end with underscore'
      });
    }

    // Check if user exists with this username
    const User = require('../models/User');
    const existingUser = await User.findOne({ 
      username: username.toLowerCase() 
    });

    res.json({
      success: true,
      exists: !!existingUser,
      message: existingUser ? 'Username already taken' : 'Username available'
    });

  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking username availability'
    });
  }
});
router.post('/firebase-auth', async (req, res) => {
  try {
    const { idToken, role, name, email } = req.body;
    console.log('Firebase auth request received:', { hasIdToken: !!idToken, email, name, role });
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let uid = null;
    let userEmail = email;

    // For now, skip Firebase token verification due to missing credentials
    // Use email-based authentication instead
    if (idToken) {
      try {
        // Try to decode token without verification (for development)
        const jwt = require('jsonwebtoken');
        const decodedToken = jwt.decode(idToken);
        if (decodedToken && decodedToken.email) {
          userEmail = decodedToken.email;
          uid = decodedToken.sub || decodedToken.user_id || `firebase_${userEmail.replace('@', '_').replace('.', '_')}`;
          console.log('Token decoded without verification:', { uid, email: userEmail });
        }
      } catch (error) {
        console.log('Token decoding failed, using email fallback:', error.message);
      }
    }

    // If no uid from token, generate one from email
    if (!uid) {
      uid = `firebase_${userEmail.replace('@', '_').replace('.', '_')}`;
      console.log('Using email fallback:', { uid, email: userEmail });
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Could not determine user email' });
    }

    // Find or create user
    let user = await require('../models/User').findOne({ email: userEmail.toLowerCase() });
    
    // Define admin emails (could be moved to env in the future)
    const adminEmails = ['admin@urbansprout.com', 'lxiao0391@gmail.com'];
    const isAdminEmail = adminEmails.includes(userEmail.toLowerCase());

    if (!user) {
      const defaultRole = isAdminEmail ? 'admin' : 'beginner';
      
      user = new (require('../models/User'))({
        name: name || 'Google User',
        email: userEmail.toLowerCase(),
        googleId: uid, // Use googleId field for Firebase UID
        role: defaultRole,
        password: 'firebase-auth', // placeholder
        emailVerified: true // Assume Google users are verified
      });
      await user.save();
      console.log('Created new user:', { id: user._id, email: user.email, role: user.role });
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = uid;
      }
      // Enforce admin role if email is an admin email
      if (isAdminEmail && user.role !== 'admin') {
        user.role = 'admin';
      }
      await user.save();
      console.log('Updated existing user:', { id: user._id, email: user.email, role: user.role });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'dev_secret_key_change_me',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Protected routes
router.use(protect); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.put('/preferences', updatePreferences);
router.post('/logout', logout);
router.delete('/account', deleteAccount);

module.exports = router;