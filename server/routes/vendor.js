const express = require('express');
const multer = require('multer');
const {
  getMyStorefront,
  getVendorStorefront,
  getVendorPayUri,
  listVendors,
  getMyProducts,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
  uploadProductImage,
  updateStorefrontHeader,
  getDashboardStats,
  getPayoutDetails,
  savePayoutDetails,
  getVendorOrders,
  updateVendorOrderStatus,
  getVendorReviews,
  getPayoutSummary,
  getPayoutTransactions,
  createPromoCode,
  getPromoCodes
} = require('../controllers/vendorController');
const { protect } = require('../middlewares/auth');
const { validatePagination } = require('../middlewares/validation');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Use JPEG, PNG or WebP.'), false);
  }
});

// Public routes (no auth)
router.get('/list', listVendors);
router.get('/store/:vendorId', getVendorStorefront);
router.get('/store/:vendorId/pay-uri', getVendorPayUri);

// All routes below require vendor authentication
router.use(protect);

// Storefront header: save URL after client uploads image via POST /upload (same as product images)
router.patch('/storefront-header', updateStorefrontHeader);

// Vendor storefront for current vendor (with optional pagination)
router.get('/store/me', validatePagination, getMyStorefront);

// Dashboard stats (real data)
router.get('/dashboard-stats', getDashboardStats);

// Products
router.get('/products', validatePagination, getMyProducts);
router.post('/products', createProduct);
router.post('/upload', upload.single('image'), uploadProductImage);
router.put('/products/:id', updateProduct);
router.patch('/products/:id/toggle', toggleProductAvailability);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', getVendorOrders);
router.route('/orders/:id/status').patch(updateVendorOrderStatus).put(updateVendorOrderStatus);

// Reviews
router.get('/reviews', getVendorReviews);

// Payout details (UPI via Razorpay X)
router.get('/payout-details', getPayoutDetails);
router.post('/payout-details', savePayoutDetails);

// Payouts
router.get('/payouts/summary', getPayoutSummary);
router.get('/payouts/transactions', getPayoutTransactions);

// Promos
router.post('/promos', createPromoCode);
router.get('/promos', getPromoCodes);

module.exports = router;

