const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['registration', 'password-reset', 'email-verification'],
    default: 'registration'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true // For automatic cleanup
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  // Store user data temporarily until OTP is verified
  userData: {
    name: String,
    password: String,
    role: String
  }
}, {
  timestamps: true
});

// Index for automatic deletion of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

// Method to check if max attempts reached
otpSchema.methods.isMaxAttemptsReached = function() {
  return this.attempts >= this.maxAttempts;
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  await this.save();
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;





