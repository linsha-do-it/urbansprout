const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      validate: v => Array.isArray(v) && v.length >= 2,
      required: true,
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    passingScore: {
      type: Number,
      default: 70, // percent
      min: 0,
      max: 100,
    },
    questions: {
      type: [quizQuestionSchema],
      validate: v => Array.isArray(v) && v.length > 0,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'quizzes',
  }
);

module.exports = mongoose.model('Quiz', quizSchema);

