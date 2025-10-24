const express = require('express');
const multer = require('multer');
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  blockUser,
  suspendUser,
  resetUserPassword,
  sendUserEmail,
  updateUserNotes,
  flagUser,
  bulkUserOperations,
  getUserDetails,
  getAllOrders,
  updateOrderStatus,
  sendOrderEmail,
  sendOrderStatusNotification,
  getAllBlogPosts,
  approveBlogPost,
  rejectBlogPost,
  deleteBlogPost,
  toggleCommentApproval,
  // Product management
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  deleteProduct,
  getProductCategories,
  getCategoriesWithProducts,
  createCategory,
  deleteCategory,
  updateCategory,
  bulkUpdateProducts,
  getInventoryStats,
  getInventoryInsights,
  getInventoryInsightsDebug,
  recalculateAnalytics,
  getNotifications,
  getProductReviews,
  handleReviewAction,
  bulkEditProducts,
  uploadCSV,
  createDiscount,
  getAllDiscounts,
  getDiscount,
  updateDiscount,
  deleteDiscount,
  applyDiscountToProduct,
  removeDiscountFromProduct,
  applyDiscountToCategory,
  getUpcomingDiscounts,
  getAvailableDiscountsForProduct,
  // Plant Suggestions Management
  getAllPlantSuggestions,
  getPlantSuggestion,
  createPlantSuggestion,
  updatePlantSuggestion,
  deletePlantSuggestion,
  togglePlantSuggestionStatus,
  getPlantSuggestionStats
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/auth');
const { 
  validateObjectId, 
  validatePagination, 
  // validatePlant removed for Plants collection to use custom schema
  validateBlogPost 
} = require('../middlewares/validation');
const trackAdminActivity = require('../middleware/trackAdminActivity');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Multer destination:', file.originalname);
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + '-' + file.originalname;
    console.log('Multer filename:', filename);
    cb(null, filename)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('Multer file filter:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    // Allow CSV and Excel files
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      console.log('File rejected:', file.originalname, file.mimetype);
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// All admin routes require authentication and admin role
router.use(protect, admin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', validatePagination, getAllUsers);
router.get('/users/:id/details', validateObjectId, getUserDetails);
router.put('/users/:id/role', validateObjectId, trackAdminActivity('user_updated', (req) => `Updated user role to ${req.body.role}`), updateUserRole);
router.put('/users/:id/block', validateObjectId, trackAdminActivity('user_updated', (req) => `Blocked/unblocked user`), blockUser);
router.put('/users/:id/suspend', validateObjectId, trackAdminActivity('user_updated', (req) => `Suspended user`), suspendUser);
router.post('/users/:id/reset-password', validateObjectId, trackAdminActivity('user_updated', 'Reset user password'), resetUserPassword);
router.post('/users/:id/send-email', validateObjectId, trackAdminActivity('user_updated', 'Sent email to user'), sendUserEmail);
router.put('/users/:id/notes', validateObjectId, trackAdminActivity('user_updated', 'Updated user notes'), updateUserNotes);
router.put('/users/:id/flag', validateObjectId, trackAdminActivity('user_updated', 'Flagged/unflagged user'), flagUser);
router.delete('/users/:id', validateObjectId, trackAdminActivity('user_deleted', (req) => `Deleted user ${req.params.id}`), deleteUser);
router.post('/users/bulk', trackAdminActivity('user_updated', 'Performed bulk user operations'), bulkUserOperations);


// Order management
router.get('/orders', validatePagination, getAllOrders);
router.put('/orders/:id/status', validateObjectId, trackAdminActivity('order_updated', (req) => `Updated order ${req.params.id} status to ${req.body.status}`), updateOrderStatus);
router.post('/orders/:id/send-email', validateObjectId, trackAdminActivity('order_updated', 'Sent email to order customer'), sendOrderEmail);
router.post('/orders/send-notification', trackAdminActivity('order_updated', 'Sent order status notification'), sendOrderStatusNotification);

// Blog management
router.get('/blog', validatePagination, getAllBlogPosts);
router.put('/blog/:id/approve', validateObjectId, trackAdminActivity('blog_approved', (req) => `Approved blog post "${req.params.id}"`), approveBlogPost);
router.put('/blog/:id/reject', validateObjectId, trackAdminActivity('blog_rejected', (req) => `Rejected blog post "${req.params.id}"`), rejectBlogPost);
router.delete('/blog/:id', validateObjectId, trackAdminActivity('blog_deleted', (req) => `Deleted blog post "${req.params.id}"`), deleteBlogPost);
router.put('/blog/:id/comments/:commentId/approve', validateObjectId, toggleCommentApproval);

// Product management
router.get('/products', validatePagination, getAllProducts);
router.get('/products/categories', getProductCategories);
router.get('/products/categories-with-products', getCategoriesWithProducts);
router.post('/products/categories', trackAdminActivity('category_created', (req) => `Created category "${req.body.categoryName}"`), createCategory);
router.delete('/products/categories/:categoryName', trackAdminActivity('category_deleted', (req) => `Deleted category "${req.params.categoryName}"`), deleteCategory);
router.put('/products/categories/:oldCategoryName', trackAdminActivity('category_updated', (req) => `Updated category "${req.params.oldCategoryName}" to "${req.body.newCategoryName}"`), updateCategory);
router.get('/products/inventory-stats', getInventoryStats);
router.get('/inventory-insights', getInventoryInsights);
router.get('/inventory-insights-debug', getInventoryInsightsDebug);
router.post('/analytics/recalculate', recalculateAnalytics);
router.get('/products/reviews', getProductReviews);
router.put('/products/reviews/:id/:action', handleReviewAction);
router.put('/products/bulk-edit', trackAdminActivity('product_updated', 'Performed bulk product edit'), bulkEditProducts);
router.post('/products/upload-csv', upload.single('file'), trackAdminActivity('product_created', 'Bulk uploaded products via CSV'), uploadCSV);

// Discount management routes
router.get('/products/discounts', validatePagination, getAllDiscounts);
router.get('/products/discounts/:id', validateObjectId, getDiscount);
router.post('/products/discounts', trackAdminActivity('discount_created', (req) => `Created discount "${req.body.name}"`), createDiscount);
router.put('/products/discounts/:id', validateObjectId, trackAdminActivity('discount_updated', (req) => `Updated discount "${req.params.id}"`), updateDiscount);
router.delete('/products/discounts/:id', validateObjectId, trackAdminActivity('discount_deleted', (req) => `Deleted discount "${req.params.id}"`), deleteDiscount);
router.get('/products/upcoming-discounts', getUpcomingDiscounts);
router.get('/products/:id/available-discounts', validateObjectId, getAvailableDiscountsForProduct);
router.put('/products/:id/discount', validateObjectId, trackAdminActivity('product_updated', (req) => `Applied discount to product "${req.params.id}"`), applyDiscountToProduct);
router.delete('/products/:id/discount/:discountId', validateObjectId, trackAdminActivity('product_updated', (req) => `Removed discount from product "${req.params.id}"`), removeDiscountFromProduct);
router.post('/discounts/:id/apply-to-category', validateObjectId, trackAdminActivity('discount_applied', (req) => `Applied discount "${req.params.id}" to category`), applyDiscountToCategory);

router.get('/products/:id', validateObjectId, getProduct);
router.post('/products', trackAdminActivity('product_created', (req) => `Created product "${req.body.name}"`), createProduct);
router.put('/products/:id', validateObjectId, trackAdminActivity('product_updated', (req) => `Updated product "${req.params.id}"`), updateProduct);
router.put('/products/:id/archive', validateObjectId, trackAdminActivity('product_deleted', (req) => `Archived product "${req.params.id}"`), archiveProduct);
router.put('/products/:id/restore', validateObjectId, trackAdminActivity('product_updated', (req) => `Restored product "${req.params.id}"`), restoreProduct);
router.delete('/products/:id', validateObjectId, trackAdminActivity('product_deleted', (req) => `Deleted product "${req.params.id}"`), deleteProduct);
router.put('/products/bulk', trackAdminActivity('product_updated', 'Performed bulk product update'), bulkUpdateProducts);

// Notifications
router.get('/notifications', getNotifications);

// Plant Suggestions Management
router.get('/plant-suggestions', validatePagination, getAllPlantSuggestions);
router.get('/plant-suggestions/stats', getPlantSuggestionStats);
router.get('/plant-suggestions/:id', validateObjectId, getPlantSuggestion);
router.post('/plant-suggestions', createPlantSuggestion);
router.put('/plant-suggestions/:id', validateObjectId, updatePlantSuggestion);
router.delete('/plant-suggestions/:id', validateObjectId, deletePlantSuggestion);
router.put('/plant-suggestions/:id/toggle', validateObjectId, togglePlantSuggestionStatus);

module.exports = router;