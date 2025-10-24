const Blog = require('../models/Blog');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const notificationService = require('../utils/notificationService');

// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Public
const getAllPosts = asyncHandler(async (req, res) => {
  const { category, tag, search, status = 'published', page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build query - only show approved posts for public
  let query = { 
    status: 'published',
    approvalStatus: 'approved'
  };

  if (category) {
    query.category = category.toLowerCase();
  }

  if (tag) {
    query.tags = { $in: [tag.toLowerCase()] };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  // Get posts with pagination
  const posts = await Blog.find(query)
    .populate('authorId', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await Blog.countDocuments(query);

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get single blog post
// @route   GET /api/blog/:id
// @access  Public
const getPost = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id)
    .populate('authorId', 'name email avatar')
    .populate('comments.user', 'name avatar')
    .populate('comments.replies.user', 'name avatar')
    .populate('relatedPosts', 'title slug excerpt featuredImage publishedAt');

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  // Increment views
  post.views += 1;
  await post.save();

  res.json({
    success: true,
    data: { post }
  });
});

// @desc    Get blog post by slug
// @route   GET /api/blog/slug/:slug
// @access  Public
const getPostBySlug = asyncHandler(async (req, res, next) => {
  const post = await Blog.findOne({ slug: req.params.slug, status: 'published' })
    .populate('authorId', 'name email avatar')
    .populate('comments.user', 'name avatar')
    .populate('comments.replies.user', 'name avatar')
    .populate('relatedPosts', 'title slug excerpt featuredImage publishedAt');

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  // Increment views
  post.views += 1;
  await post.save();

  res.json({
    success: true,
    data: { post }
  });
});

// @desc    Create new blog post
// @route   POST /api/blog
// @access  Private
const createPost = asyncHandler(async (req, res, next) => {
  const {
    title,
    content,
    excerpt,
    category,
    tags,
    image,
    status = 'published'
  } = req.body;

  const post = await Blog.create({
    title,
    content,
    excerpt: excerpt || content.substring(0, 200) + '...',
    category: category || 'question',
    tags: tags || [],
    image,
    author: req.user.name,
    authorEmail: req.user.email,
    authorId: req.user._id,
    status
  });

  res.status(201).json({
    success: true,
    message: 'Blog post created successfully',
    data: { post }
  });
});

// @desc    Update blog post
// @route   PUT /api/blog/:id
// @access  Private (Admin only)
const updatePost = asyncHandler(async (req, res, next) => {
  let post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  const {
    title,
    excerpt,
    content,
    category,
    tags,
    featuredImage,
    status,
    isFeatured,
    seo
  } = req.body;

  // Update fields
  if (title) post.title = title;
  if (excerpt) post.excerpt = excerpt;
  if (content) post.content = content;
  if (category) post.category = category.toLowerCase();
  if (tags) post.tags = tags.map(tag => tag.toLowerCase());
  if (featuredImage) post.featuredImage = featuredImage;
  if (status) post.status = status;
  if (isFeatured !== undefined) post.isFeatured = isFeatured;
  if (seo) post.seo = { ...post.seo, ...seo };

  await post.save();
  await post.populate('authorId', 'name email avatar');

  res.json({
    success: true,
    message: 'Blog post updated successfully',
    data: { post }
  });
});

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private (Admin only)
const deletePost = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  await Blog.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Blog post deleted successfully'
  });
});

// @desc    Like/Unlike blog post
// @route   POST /api/blog/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  const userEmail = req.user.email;
  const likeIndex = post.likes.findIndex(like => like.userEmail === userEmail);

  if (likeIndex > -1) {
    // Unlike
    post.likes.splice(likeIndex, 1);
  } else {
    // Like
    post.likes.push({ 
      userEmail: userEmail,
      userId: req.user._id 
    });

    // Send notification to blog author (only if it's not the author liking their own post)
    if (post.authorId.toString() !== req.user._id.toString()) {
      try {
        await notificationService.sendNotification(post.authorId, {
          userEmail: post.authorEmail,
          type: 'blog_like',
          title: '❤️ New Like!',
          message: `Someone liked your blog post "${post.title}"`,
          relatedId: post._id,
          relatedModel: 'Blog'
        });
        console.log(`✅ Blog like notification sent to ${post.authorEmail}`);
      } catch (notificationError) {
        console.error('❌ Failed to send blog like notification:', notificationError);
        // Don't fail the like if notification fails
      }
    }
  }

  await post.save();

  res.json({
    success: true,
    message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
    data: {
      liked: likeIndex === -1,
      likeCount: post.likes.length
    }
  });
});

// @desc    Bookmark/Unbookmark blog post
// @route   POST /api/blog/:id/bookmark
// @access  Private
const toggleBookmark = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  const userEmail = req.user.email;
  const bookmarkIndex = post.bookmarks.findIndex(bookmark => bookmark.userEmail === userEmail);

  if (bookmarkIndex > -1) {
    // Remove bookmark
    post.bookmarks.splice(bookmarkIndex, 1);
  } else {
    // Add bookmark
    post.bookmarks.push({ 
      userEmail: userEmail,
      userId: req.user._id 
    });
  }

  await post.save();

  res.json({
    success: true,
    message: bookmarkIndex > -1 ? 'Post unbookmarked' : 'Post bookmarked',
    data: {
      bookmarked: bookmarkIndex === -1,
      bookmarkCount: post.bookmarks.length
    }
  });
});

// @desc    Share blog post
// @route   POST /api/blog/:id/share
// @access  Private
const sharePost = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  // Add share record
  post.shares.push({ 
    userEmail: req.user.email,
    userId: req.user._id 
  });

  await post.save();

  res.json({
    success: true,
    message: 'Post shared successfully',
    data: {
      shareCount: post.shares.length
    }
  });
});

// @desc    Add comment to blog post
// @route   POST /api/blog/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return next(new AppError('Comment content is required', 400));
  }

  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  const comment = {
    author: req.user.name,
    authorEmail: req.user.email,
    user: req.user._id,
    content: content.trim(),
    isApproved: req.user.role === 'admin' // Auto-approve admin comments
  };

  post.comments.push(comment);
  await post.save();

  await post.populate('comments.user', 'name avatar');

  const newComment = post.comments[post.comments.length - 1];

  // Send notification to blog author (only if it's not the author commenting on their own post)
  if (post.authorId.toString() !== req.user._id.toString()) {
    try {
      await notificationService.sendNotification(post.authorId, {
        userEmail: post.authorEmail,
        type: 'blog_comment',
        title: '💬 New Comment!',
        message: `Someone commented on your blog post "${post.title}"`,
        relatedId: post._id,
        relatedModel: 'Blog'
      });
      console.log(`✅ Blog comment notification sent to ${post.authorEmail}`);
    } catch (notificationError) {
      console.error('❌ Failed to send blog comment notification:', notificationError);
      // Don't fail the comment if notification fails
    }
  }

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment: newComment }
  });
});

// @desc    Reply to comment
// @route   POST /api/blog/:id/comments/:commentId/reply
// @access  Private
const replyToComment = asyncHandler(async (req, res, next) => {
  const { content } = req.body;
  const { commentId } = req.params;

  if (!content || content.trim().length === 0) {
    return next(new AppError('Reply content is required', 400));
  }

  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  const comment = post.comments.id(commentId);

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  const reply = {
    author: req.user.name,
    authorEmail: req.user.email,
    user: req.user._id,
    content: content.trim()
  };

  comment.replies.push(reply);
  await post.save();

  await post.populate('comments.replies.user', 'name avatar');

  const newReply = comment.replies[comment.replies.length - 1];

  res.status(201).json({
    success: true,
    message: 'Reply added successfully',
    data: { reply: newReply }
  });
});

// @desc    Get blog categories
// @route   GET /api/blog/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Blog.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: { categories }
  });
});

// @desc    Get featured posts
// @route   GET /api/blog/featured
// @access  Public
const getFeaturedPosts = asyncHandler(async (req, res) => {
  const posts = await Blog.find({ status: 'published', isFeatured: true })
    .populate('authorId', 'name email avatar')
    .sort({ publishedAt: -1 })
    .limit(6);

  res.json({
    success: true,
    data: { posts }
  });
});

// @desc    Approve blog post
// @route   PUT /api/blog/:id/approve
// @access  Private (Admin only)
const approvePost = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  post.approvalStatus = 'approved';
  post.status = 'published';
  post.approvedBy = req.user._id;
  post.approvedAt = new Date();
  post.rejectionReason = undefined; // Clear any previous rejection reason

  await post.save();

  // Send notification to blog author
  try {
    await notificationService.sendNotification(post.authorId, {
      userEmail: post.authorEmail,
      type: 'blog_approved',
      title: '✅ Blog Post Approved!',
      message: `Your blog post "${post.title}" has been approved and is now live on the feed!`,
      relatedId: post._id,
      relatedModel: 'Blog'
    });
    console.log(`✅ Blog approval notification sent to ${post.authorEmail}`);
  } catch (notificationError) {
    console.error('❌ Failed to send blog approval notification:', notificationError);
    // Don't fail the approval if notification fails
  }

  res.json({
    success: true,
    message: 'Blog post approved successfully',
    data: { post }
  });
});

// @desc    Reject blog post
// @route   PUT /api/blog/:id/reject
// @access  Private (Admin only)
const rejectPost = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return next(new AppError('Rejection reason is required', 400));
  }

  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  post.approvalStatus = 'rejected';
  post.status = 'rejected';
  post.rejectionReason = reason.trim();
  post.rejectedBy = req.user._id;
  post.rejectedAt = new Date();

  await post.save();

  // Send notification to blog author
  try {
    await notificationService.sendNotification(post.authorId, {
      userEmail: post.authorEmail,
      type: 'blog_rejected',
      title: '❌ Blog Post Rejected',
      message: `Your blog post "${post.title}" has been rejected. Reason: ${reason.trim()}`,
      relatedId: post._id,
      relatedModel: 'Blog'
    });
    console.log(`✅ Blog rejection notification sent to ${post.authorEmail}`);
  } catch (notificationError) {
    console.error('❌ Failed to send blog rejection notification:', notificationError);
    // Don't fail the rejection if notification fails
  }

  res.json({
    success: true,
    message: 'Blog post rejected successfully',
    data: { post }
  });
});

// @desc    Get user's blog posts with approval status
// @route   GET /api/blog/my-posts
// @access  Private
const getMyPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const posts = await Blog.find({ 
    authorId: req.user._id,
    approvalStatus: 'approved',
    status: 'published'
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Blog.countDocuments({ 
    authorId: req.user._id,
    approvalStatus: 'approved',
    status: 'published'
  });

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get blog statistics
// @route   GET /api/blog/stats
// @access  Public
const getBlogStats = asyncHandler(async (req, res) => {
  const totalPosts = await Blog.countDocuments({ 
    status: 'published', 
    approvalStatus: 'approved' 
  });
  
  const totalComments = await Blog.aggregate([
    { $match: { status: 'published', approvalStatus: 'approved' } },
    { $project: { commentCount: { $size: { $ifNull: ['$comments', []] } } } },
    { $group: { _id: null, total: { $sum: '$commentCount' } } }
  ]);

  const totalLikes = await Blog.aggregate([
    { $match: { status: 'published', approvalStatus: 'approved' } },
    { $project: { likeCount: { $size: { $ifNull: ['$likes', []] } } } },
    { $group: { _id: null, total: { $sum: '$likeCount' } } }
  ]);

  const activeToday = await Blog.countDocuments({
    status: 'published',
    approvalStatus: 'approved',
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
  });

  res.json({
    success: true,
    data: {
      totalPosts,
      totalComments: totalComments[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0,
      activeToday
    }
  });
});

// @desc    Get top contributors
// @route   GET /api/blog/top-contributors
// @access  Public
const getTopContributors = asyncHandler(async (req, res) => {
  const contributors = await Blog.aggregate([
    { $match: { status: 'published', approvalStatus: 'approved' } },
    { $group: { 
      _id: '$authorId', 
      name: { $first: '$author' },
      postCount: { $sum: 1 },
      totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
      totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
    }},
    { $sort: { postCount: -1, totalLikes: -1 } },
    { $limit: 10 },
    { $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $project: {
      _id: 1,
      name: 1,
      postCount: 1,
      totalLikes: 1,
      totalComments: 1,
      avatar: '$user.avatar'
    }}
  ]);

  res.json({
    success: true,
    data: { contributors }
  });
});

// @desc    Get trending hashtags
// @route   GET /api/blog/trending-hashtags
// @access  Public
const getTrendingHashtags = asyncHandler(async (req, res) => {
  const hashtags = await Blog.aggregate([
    { $match: { status: 'published', approvalStatus: 'approved' } },
    { $unwind: '$tags' },
    { $group: { 
      _id: '$tags', 
      count: { $sum: 1 },
      posts: { $push: '$_id' }
    }},
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: {
      tag: '$_id',
      count: 1,
      posts: { $size: '$posts' }
    }}
  ]);

  res.json({
    success: true,
    data: { hashtags }
  });
});

module.exports = {
  getAllPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  sharePost,
  addComment,
  replyToComment,
  getCategories,
  getFeaturedPosts,
  approvePost,
  rejectPost,
  getMyPosts,
  getBlogStats,
  getTopContributors,
  getTrendingHashtags
};