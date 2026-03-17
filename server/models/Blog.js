const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  authorRole: {
    type: String,
    enum: ['beginner', 'expert', 'vendor', 'admin'],
    default: 'beginner'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  image: {
    type: String,
    default: null
  },
  author: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    enum: ['question', 'success_story'],
    required: false
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  likes: [{
    userEmail: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    userEmail: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: [{
    userEmail: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending_approval', 'rejected'],
    default: 'pending_approval'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Automated moderation fields
  toxicityScore: {
    // Overall maximum toxicity score across all categories (0–1)
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  moderationStatus: {
    // How the automated system classified this post
    type: String,
    enum: ['safe', 'flagged', 'removed', null],
    default: null
  },
  moderationCategories: {
    // Per-category scores, e.g. { toxicity: 0.12, hate: 0.03, ... }
    type: Object,
    default: {}
  },
  reviewedByAdmin: {
    // Set when an admin has explicitly reviewed a flagged/removed post
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  // Track pending edits for approval
  pendingEdit: {
    title: String,
    content: String,
    excerpt: String,
    category: String,
    tags: [String],
    image: String,
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isEditPending: {
    type: Boolean,
    default: false
  },
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update the updatedAt field before saving
blogSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

// Virtual for like count
blogSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0
})

// Virtual for comment count
blogSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0
})

// Virtual for bookmark count
blogSchema.virtual('bookmarkCount').get(function() {
  return this.bookmarks ? this.bookmarks.length : 0
})

// Virtual for share count
blogSchema.virtual('shareCount').get(function() {
  return this.shares ? this.shares.length : 0
})

// Ensure virtual fields are serialized
blogSchema.set('toJSON', { virtuals: true })

// Use the exact collection name "blogs" in MongoDB (database: test)
module.exports = mongoose.model('Blog', blogSchema, 'blogs')