const mongoose = require('mongoose');

const courseQuestionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500
    },
    answer: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: ''
    },
    status: {
      type: String,
      enum: ['open', 'answered'],
      default: 'open'
    }
  },
  { timestamps: true, collection: 'coursequestions' }
);

module.exports = mongoose.model('CourseQuestion', courseQuestionSchema);

