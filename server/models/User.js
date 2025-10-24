const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values but unique non-null values
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ]
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['beginner', 'expert', 'vendor', 'admin'],
    default: 'beginner'
  },
  professionalId: {
    type: String,
    sparse: true, // Allows multiple null values but unique non-null values
    trim: true
  },
  googleId: {
    type: String,
    sparse: true
  },
  firebaseUid: {
    type: String,
    sparse: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  suspensionEnd: {
    type: Date,
    default: null
  },
  suspensionReason: {
    type: String,
    default: null
  },
  blockReason: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flaggedReason: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    lightLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: null
    },
    wateringFrequency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: null
    },
    spaceType: {
      type: String,
      enum: ['apartment', 'house', 'office', 'balcony'],
      default: null
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: null
    },
    petFriendly: {
      type: Boolean,
      default: false
    },
    airPurifying: {
      type: Boolean,
      default: false
    }
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user without password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpire;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);