const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema(
  {
    plantName: { type: String, required: true, index: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    benefits: { type: String, required: true },
    daysToGrow: { type: Number, required: true },
    maintenance: { type: String, required: true },
    sunlight: { 
      type: String, 
      required: true, 
      index: true,
      enum: ['full_sun', 'partial_sun', 'shade'],
      lowercase: true
    },
    space: { 
      type: String, 
      required: true, 
      index: true,
      enum: ['small', 'medium', 'large'],
      lowercase: true
    },
    experience: { 
      type: String, 
      required: true, 
      index: true,
      enum: ['beginner', 'intermediate', 'advanced'],
      lowercase: true
    },
    time: { 
      type: String, 
      required: true, 
      index: true,
      enum: ['low', 'medium', 'high'],
      lowercase: true
    },
    category: {
      type: String,
      required: true,
      enum: ['vegetables', 'fruits', 'herbs', 'flowers', 'succulents'],
      lowercase: true
    },
    price: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Moderate', 'Hard'],
      default: 'Easy'
    },
    growingTime: {
      type: String,
      required: true
    },
    isActive: { type: Boolean, default: true, index: true },
    archived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// Compound indexes for efficient querying based on quiz answers
plantSchema.index({ sunlight: 1, space: 1, experience: 1, time: 1 });
plantSchema.index({ category: 1, difficulty: 1 });
plantSchema.index({ isActive: 1, archived: 1 });

// Basic text index to support searching by name/description/benefits
plantSchema.index({ plantName: 'text', description: 'text', benefits: 'text' });

module.exports = mongoose.model('Plant', plantSchema);