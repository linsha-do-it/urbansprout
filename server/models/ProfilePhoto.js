const mongoose = require('mongoose');

const profilePhotoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  imageData: {
    type: String, // base64 encoded image
    required: true
  },
  imageType: {
    type: String, // e.g., 'image/jpeg', 'image/png'
    required: true
  },
  imageSize: {
    type: Number, // size in bytes
    required: true
  },
  dimensions: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
profilePhotoSchema.index({ userId: 1 });

module.exports = mongoose.model('ProfilePhoto', profilePhotoSchema);





