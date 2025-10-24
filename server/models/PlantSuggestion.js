const mongoose = require('mongoose');

const plantSuggestionSchema = new mongoose.Schema({
  combinationKey: {
    type: String,
    required: [true, 'Combination key is required'],
    unique: true,
    index: true
  },
  space: {
    type: String,
    required: true,
    enum: ['small', 'medium', 'large']
  },
  sunlight: {
    type: String,
    required: true,
    enum: ['full_sun', 'partial_sun', 'shade']
  },
  experience: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  time: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high']
  },
  purpose: {
    type: String,
    required: true,
    enum: ['food', 'beauty', 'health', 'hobby']
  },
  plants: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Vegetables', 'Herbs', 'Fruits']
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    growingTime: {
      type: String,
      required: true
    },
    sunlight: {
      type: String,
      required: true
    },
    space: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard']
    },
    price: {
      type: String,
      required: true
    }
  }],
  recommendationMessage: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create combination key from individual fields
plantSuggestionSchema.pre('save', function(next) {
  if (!this.combinationKey) {
    this.combinationKey = `${this.space}_${this.sunlight}_${this.experience}_${this.time}_${this.purpose}`;
  }
  next();
});

// Also create combination key before validation
plantSuggestionSchema.pre('validate', function(next) {
  if (!this.combinationKey) {
    this.combinationKey = `${this.space}_${this.sunlight}_${this.experience}_${this.time}_${this.purpose}`;
  }
  next();
});

// Index for efficient querying
plantSuggestionSchema.index({ combinationKey: 1 });
plantSuggestionSchema.index({ space: 1, sunlight: 1, experience: 1, time: 1, purpose: 1 });

module.exports = mongoose.model('PlantSuggestion', plantSuggestionSchema);
