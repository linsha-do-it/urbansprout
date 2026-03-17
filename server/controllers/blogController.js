const Blog = require('../models/Blog');
const User = require('../models/User');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const BeginnerUser = require('../models/BeginnerUser');
const ExpertUser = require('../models/ExpertUser');
const VendorUser = require('../models/VendorUser');
const Admin = require('../models/Admin');
const { AppError } = require('../middlewares/errorHandler');
const { asyncHandler } = require('../middlewares/errorHandler');
const notificationService = require('../utils/notificationService');
const { analyzeBlogContent } = require('../services/blogModerationService');
const { applyContentViolation } = require('../services/violationService');

if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
}

// @desc    Get all blog posts (ranked)
// @route   GET /api/blog
// @access  Public
const getAllPosts = asyncHandler(async (req, res) => {
  const {
    category,
    tag,
    search,
    status = 'published',
    page = 1,
    limit = 10,
    sort = 'hot' // 'hot' (default), 'newest'
  } = req.query;
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

  // Base query with pagination (DB-level sort mostly for 'newest' mode)
  const baseQuery = Blog.find(query)
    .populate('authorId', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const [posts, total] = await Promise.all([
    baseQuery,
    Blog.countDocuments(query)
  ]);

  // Increment views for each post in the feed (but don't wait for save)
  posts.forEach(post => {
    post.views = (post.views || 0) + 1;
    post
      .save()
      .catch(err => console.error('Error incrementing post views:', err));
  });

  // If sort=newest, keep the createdAt order and return early
  if (sort === 'newest') {
    return res.json({
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
  }

  // Personalized "hot" ranking: weighted engagement + time decay + user preference boost

  // Build a lightweight user profile from likes/bookmarks if user is logged in
  let userProfile = null;
  if (req.user && req.user._id) {
    userProfile = await buildUserProfile(req.user._id);
  }

  const ranked = posts
    .map(post => {
      const hotScore = computeHotScore(post);
      const userRelevance = computeUserRelevance(userProfile, post);
      const finalScore = computeFinalScore(hotScore, userRelevance);
      return { post, score: finalScore };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.post);

  res.json({
    success: true,
    data: {
      posts: ranked,
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

// @desc    Upload blog image to Cloudinary, return URL
// @route   POST /api/blog/upload-image
// @access  Private (any authenticated user)
const uploadBlogImage = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new AppError('No image file provided', 400);
  }

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(req.file.mimetype)) {
    throw new AppError('Invalid file type. Use JPEG, PNG or WebP.', 400);
  }

  if (!process.env.CLOUDINARY_URL) {
    throw new AppError('Image upload is not configured', 503);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'urbansprout/blog-images' },
      (err, result) => {
        if (err) {
          reject(new AppError(err.message || 'Upload failed', 500));
          return;
        }
        if (!result || !result.secure_url) {
          reject(new AppError('Upload failed', 500));
          return;
        }
        res.status(200).json({ success: true, url: result.secure_url });
        resolve();
      }
    );

    const stream = Readable.from(req.file.buffer);
    stream.pipe(uploadStream);
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
  // Check whether the user is currently allowed to post (strike system)
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.status === 'suspended') {
    return next(
      new AppError(
        'Your account is suspended due to repeated policy violations. You cannot create new blog posts.',
        403
      )
    );
  }

  if (user.postingDisabledUntil && user.postingDisabledUntil > new Date()) {
    return next(
      new AppError(
        'Blog posting is temporarily disabled on your account due to policy violations. Please try again later or contact support.',
        403
      )
    );
  }

  const {
    title,
    content,
    excerpt,
    category,
    tags,
    image,
    status = 'published'
  } = req.body;

  // Run automated toxicity analysis using transformer-based model
  const moderationResult = await analyzeBlogContent(content || '');
  const { overallScore, categories, moderationDecision } = moderationResult;

  // Default blog status/approval based on moderation decision
  let blogStatus = status;
  let approvalStatus = 'approved';

  if (moderationDecision === 'safe') {
    blogStatus = 'published';
    approvalStatus = 'approved';
  } else if (moderationDecision === 'flagged') {
    blogStatus = 'pending_approval';
    approvalStatus = 'pending';
  } else if (moderationDecision === 'removed') {
    blogStatus = 'rejected';
    approvalStatus = 'rejected';
  }

  // If content is severely harmful, do not publish at all and record violation
  if (moderationDecision === 'removed') {
    await applyContentViolation(user._id, 'Severe harmful blog content');

    return next(
      new AppError(
        'Your blog post violates our community guidelines and cannot be published.',
        400
      )
    );
  }

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
    authorRole: req.user.role || 'beginner',
    status: blogStatus,
    approvalStatus,
    toxicityScore: overallScore,
    moderationStatus: moderationDecision,
    moderationCategories: categories
  });

  res.status(201).json({
    success: true,
    message:
      moderationDecision === 'flagged'
        ? 'Blog post submitted and sent for moderation review.'
        : 'Blog post created and published successfully.',
    data: { post }
  });
});

// @desc    Update blog post (Admin only - direct update)
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

// @desc    Submit edit request for blog post (User)
// @route   POST /api/blog/:id/edit
// @access  Private
const submitEditRequest = asyncHandler(async (req, res, next) => {
  const post = await Blog.findById(req.params.id);

  if (!post) {
    return next(new AppError('Blog post not found', 404));
  }

  // Check if the user is the author
  if (post.authorId.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only edit your own posts', 403));
  }

  const {
    title,
    content,
    excerpt,
    category,
    tags,
    image
  } = req.body;
  const newContent = content || post.content || '';

  // Run automated toxicity analysis for the edited content
  const moderationResult = await analyzeBlogContent(newContent);
  const { overallScore, categories, moderationDecision } = moderationResult;

  // If content is severely harmful, do not accept the edit and record a violation
  if (moderationDecision === 'removed') {
    await applyContentViolation(req.user._id, 'Severe harmful blog edit content');

    return next(
      new AppError(
        'Your edited content violates our community guidelines and cannot be saved.',
        400
      )
    );
  }

  // If the edited content is safe, apply it immediately without admin review
  if (moderationDecision === 'safe') {
    if (title) post.title = title;
    if (newContent) post.content = newContent;
    post.excerpt = excerpt || newContent.substring(0, 200) + '...';
    post.category = category || post.category;
    post.tags = tags || [];
    post.image = image || post.image;

    post.toxicityScore = overallScore;
    post.moderationStatus = moderationDecision;
    post.moderationCategories = categories;

    // If content is safe, ensure the post is fully approved and published
    post.status = 'published';
    post.approvalStatus = 'approved';
    post.rejectionReason = undefined;

    // Clear any pending edit flags since we're applying directly
    post.pendingEdit = undefined;
    post.isEditPending = false;

    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Blog post updated successfully.',
      data: { post }
    });
  }

  // Borderline content: save as a pending edit for admin review
  post.pendingEdit = {
    title,
    content: newContent,
    excerpt: excerpt || newContent.substring(0, 200) + '...',
    category: category || post.category,
    tags: tags || [],
    image: image || post.image,
    submittedAt: new Date(),
    submittedBy: req.user._id
  };

  post.isEditPending = true;
  post.approvalStatus = 'pending'; // Reset approval status while edit is pending
  post.toxicityScore = overallScore;
  post.moderationStatus = moderationDecision;
  post.moderationCategories = categories;

  await post.save();

  // Send notification to admins (if you have admin notification logic)
  try {
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });

    for (const admin of admins) {
      await notificationService.sendNotification(admin._id, {
        userEmail: admin.email,
        type: 'blog_edit_pending',
        title: '📝 Blog Post Edit Pending Approval',
        message: `User ${req.user.name} submitted an edit to blog post "${post.title}"`,
        relatedId: post._id,
        relatedModel: 'Blog'
      });
    }
    console.log(`✅ Edit notification sent to admins`);
  } catch (notificationError) {
    console.error('❌ Failed to send edit notification:', notificationError);
  }

  res.status(201).json({
    success: true,
    message:
      moderationDecision === 'flagged'
        ? 'Edit submitted and sent for moderation review.'
        : 'Edit request submitted successfully.',
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

  // Store whether this was a pending edit before we clear the flag
  const wasEditPending = post.isEditPending;

  // If there's a pending edit, apply it
  if (post.isEditPending && post.pendingEdit) {
    post.title = post.pendingEdit.title;
    post.content = post.pendingEdit.content;
    post.excerpt = post.pendingEdit.excerpt;
    post.category = post.pendingEdit.category;
    post.tags = post.pendingEdit.tags;
    post.image = post.pendingEdit.image;

    // Clear the pending edit
    post.pendingEdit = undefined;
    post.isEditPending = false;
  }

  post.approvalStatus = 'approved';
  post.status = 'published';
  post.approvedBy = req.user._id;
  post.approvedAt = new Date();
  post.rejectionReason = undefined; // Clear any previous rejection reason

  await post.save();

  // Send notification to blog author
  try {
    const message = wasEditPending
      ? `Your edited blog post "${post.title}" has been approved and is now live!`
      : `Your blog post "${post.title}" has been approved and is now live on the feed!`;

    await notificationService.sendNotification(post.authorId, {
      userEmail: post.authorEmail,
      type: 'blog_approved',
      title: '✅ Blog Post Approved!',
      message: message,
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
    message: wasEditPending ? 'Blog post edit approved successfully' : 'Blog post approved successfully',
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

  // If there was a pending edit, clear it
  if (post.isEditPending && post.pendingEdit) {
    post.pendingEdit = undefined;
    post.isEditPending = false;
    // Reset to published/approved status if it was already published
    post.approvalStatus = 'approved';
    post.status = 'published';
  } else {
    post.approvalStatus = 'rejected';
    post.status = 'rejected';
  }

  post.rejectionReason = reason.trim();
  post.rejectedBy = req.user._id;
  post.rejectedAt = new Date();

  await post.save();

  // Send notification to blog author
  try {
    const message = post.isEditPending
      ? `Your edit request for blog post "${post.title}" has been rejected. Reason: ${reason.trim()}`
      : `Your blog post "${post.title}" has been rejected. Reason: ${reason.trim()}`;

    await notificationService.sendNotification(post.authorId, {
      userEmail: post.authorEmail,
      type: 'blog_rejected',
      title: '❌ Blog Post Rejected',
      message: message,
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

  // Calculate total views (readers) from all published and approved posts
  const totalViews = await Blog.aggregate([
    { $match: { status: 'published', approvalStatus: 'approved' } },
    { $group: { _id: null, total: { $sum: '$views' } } }
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
      totalViews: totalViews[0]?.total || 0,
      activeToday,
      totalUsers: (
        (await BeginnerUser.countDocuments()) +
        (await ExpertUser.countDocuments()) +
        (await VendorUser.countDocuments()) +
        (await Admin.countDocuments())
      )
    }
  });
});

// @desc    Get top contributors
// @route   GET /api/blog/top-contributors
// @access  Public
const getTopContributors = asyncHandler(async (req, res) => {
  const contributors = await Blog.aggregate([
    { $match: { status: 'published', approvalStatus: 'approved' } },
    {
      $group: {
        _id: '$authorId',
        name: { $first: '$author' },
        postCount: { $sum: 1 },
        totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
        totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
      }
    },
    { $sort: { postCount: -1, totalLikes: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        postCount: 1,
        totalLikes: 1,
        totalComments: 1,
        avatar: '$user.avatar'
      }
    }
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
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        posts: { $push: '$_id' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        tag: '$_id',
        count: 1,
        posts: { $size: '$posts' }
      }
    }
  ]);

  res.json({
    success: true,
    data: { hashtags }
  });
});

// ——— Ranking helpers: weighted engagement + time decay + simple user preference boost ———

const HOT_RANKING_WEIGHTS = {
  view: 0.5,
  like: 4,
  comment: 3,
  bookmark: 5,
  share: 2,
  decay: 1.2
};

function computeHotScore(post) {
  const views = post.views || 0;
  const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
  const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
  const bookmarkCount = Array.isArray(post.bookmarks) ? post.bookmarks.length : 0;
  const shareCount = Array.isArray(post.shares) ? post.shares.length : 0;

  const engagement =
    HOT_RANKING_WEIGHTS.view * Math.log(1 + views) +
    HOT_RANKING_WEIGHTS.like * likeCount +
    HOT_RANKING_WEIGHTS.comment * commentCount +
    HOT_RANKING_WEIGHTS.bookmark * bookmarkCount +
    HOT_RANKING_WEIGHTS.share * shareCount;

  const createdAt = post.createdAt ? new Date(post.createdAt).getTime() : Date.now();
  const hoursSinceCreated = Math.max(
    1,
    (Date.now() - createdAt) / (1000 * 60 * 60)
  );

  const score =
    engagement / Math.pow(hoursSinceCreated, HOT_RANKING_WEIGHTS.decay);

  // Guard against NaN/Infinity
  if (!Number.isFinite(score)) return 0;
  return score;
}

async function buildUserProfile(userId) {
  if (!userId) return null;

  const likedOrSaved = await Blog.find({
    $or: [{ 'likes.userId': userId }, { 'bookmarks.userId': userId }],
    status: 'published',
    approvalStatus: 'approved'
  })
    .select('category tags createdAt')
    .limit(200) // reasonable cap
    .lean();

  if (!likedOrSaved || likedOrSaved.length === 0) {
    return null;
  }

  const categoryCounts = {};
  const tagCounts = {};

  likedOrSaved.forEach(post => {
    if (post.category) {
      const cat = String(post.category).toLowerCase();
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    (post.tags || []).forEach(tag => {
      if (!tag) return;
      const t = String(tag).toLowerCase();
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  return { categoryCounts, tagCounts };
}

function computeUserRelevance(userProfile, post) {
  if (!userProfile || !post) return 0;

  const { categoryCounts, tagCounts } = userProfile;
  let score = 0;

  // Category preference boost
  if (post.category) {
    const catKey = String(post.category).toLowerCase();
    const catCount = categoryCounts[catKey] || 0;
    if (catCount > 0) {
      score += 2 * catCount;
    }
  }

  // Tag overlap boost
  (post.tags || []).forEach(tag => {
    if (!tag) return;
    const t = String(tag).toLowerCase();
    const tagCount = tagCounts[t] || 0;
    if (tagCount > 0) {
      score += 1 * tagCount;
    }
  });

  return score;
}

function computeFinalScore(hotScore, userRelevance) {
  const alpha = 1.0; // weight for global "hotness"
  const beta = 0.3; // weight for user preference
  return alpha * (hotScore || 0) + beta * (userRelevance || 0);
}

module.exports = {
  getAllPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  submitEditRequest,
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
  getTrendingHashtags,
  uploadBlogImage
};