const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if this is an admin token
      if (decoded.type === 'admin') {
        const admin = await Admin.findById(decoded.id);
        
        if (!admin) {
          return res.status(401).json({
            success: false,
            message: 'Token is valid but admin no longer exists'
          });
        }

        // Check if admin is active
        if (admin.status !== 'active') {
          return res.status(401).json({
            success: false,
            message: 'Admin account is inactive'
          });
        }

        // Add admin to request object
        req.user = admin;
        req.isAdmin = true;
        next();
      } else {
        // Regular user token
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Token is valid but user no longer exists'
          });
        }

        // Add user to request object
        req.user = user;
        req.isAdmin = false;
        next();
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Admin only access
const admin = (req, res, next) => {
  if (req.isAdmin || (req.user && req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Optional auth: Invalid token provided');
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Generate JWT token
const generateToken = (id, type = 'user') => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = {
  protect,
  admin,
  optionalAuth,
  generateToken
};