const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');
const connectDB = require('./config/database');
const { isDbConnected } = require('./config/database');
const setupSocketIO = require('./utils/socketIO');
const discountLifecycleService = require('./services/discountLifecycleService');

// Load env from server/.env and optionally server/.envnew.
// This lets you keep secrets in .envnew locally without committing them.
const envPath = path.join(__dirname, '.env');
const envNewPath = path.join(__dirname, '.envnew');
const loaded = [];
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  loaded.push(path.basename(envPath));
}
if (fs.existsSync(envNewPath)) {
  // Don't override values already defined in .env; only fill in missing ones.
  dotenv.config({ path: envNewPath, override: false });
  loaded.push(path.basename(envNewPath));
}
if (loaded.length > 0) {
  console.log(`🔧 Loaded environment from: ${loaded.join(' + ')}`);
} else {
  console.warn('⚠️  No server env file found (.env or .envnew). Some features may not work.');
}

// Helpful debug: log which Mongo URI the server thinks it's using (without credentials)
if (process.env.MONGODB_URI) {
  try {
    const masked = process.env.MONGODB_URI.replace(
      /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
      (_, prefix, user) => `${prefix}${user}:*****@`
    );
    console.log('🔧 Using MONGODB_URI from server/.env:', masked);
  } catch {
    console.log('🔧 Using MONGODB_URI from server/.env');
  }
} else {
  console.warn('⚠️  MONGODB_URI is not set in server/.env');
}

// Connect to MongoDB before starting the server (avoids "buffering timed out" on login)
const app = express();

// Middleware
// Allow common local dev origins if CORS_ORIGIN is not explicitly set
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
];
const envOrigins = (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []);
const normalizedEnvOrigins = envOrigins.map(o => o && o.trim()).filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...normalizedEnvOrigins]));

// Ensure Access-Control-Allow-Origin is always sent for allowed origins (placed BEFORE cors())
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    if (!res.get('Access-Control-Allow-Origin')) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    }
    // Keep credentials aligned with CORS config
    if (!res.get('Access-Control-Allow-Credentials')) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }
  // Quick response for OPTIONS if not handled yet
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    return res.sendStatus(204);
  }
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, be lenient to avoid blocking
    if ((process.env.NODE_ENV || 'development') === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Space planner can send base64 images; allow a bit more headroom.
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Fail fast when DB is disconnected (avoids 10s buffering timeouts)
app.use('/api', (req, res, next) => {
  const path = req.path || req.originalUrl?.split('?')[0] || '';
  if (path === '/health' || path === '/test' || path.endsWith('/health') || path.endsWith('/test')) return next();
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again in a moment.'
    });
  }
  next();
});

// Request logging middleware (removed verbose logs)
app.use((req, res, next) => {
  next();
});

// Base test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '🌱 UrbanSprout Backend is running successfully!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const courseRoutes = require('./routes/courseRoutes'); // New Course Routes
const storeRoutes = require('./routes/store');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const chatbotRoutes = require('./routes/chatbot');
const spacePlannerRoutes = require('./routes/spacePlanner');
const notificationRoutes = require('./routes/notifications');
const plantRoutes = require('./routes/plants');
const gardenRoutes = require('./routes/garden');
const statsRoutes = require('./routes/stats');
const profilePhotoRoutes = require('./routes/profilePhoto');
const vendorRoutes = require('./routes/vendor');
const plantHealthRoutes = require('./routes/plantHealth');
const { protect } = require('./middlewares/auth');
const { updateVendorOrderStatus } = require('./controllers/vendorController');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/courses', courseRoutes); // Mount Course Routes
app.use('/api/store', storeRoutes);
// Debug route for inventory insights (no auth required)
const { getInventoryInsightsDebug } = require('./controllers/adminController');
app.get('/api/admin/inventory-insights-debug', getInventoryInsightsDebug);

app.use('/api/admin', adminRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/space-planner', spacePlannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/garden', gardenRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/profile-photo', profilePhotoRoutes);
app.use('/api/plant-health', plantHealthRoutes);
// Vendor order status – register before /api/vendor so this path is matched first
app.put('/api/vendor/orders/:id/status', protect, updateVendorOrderStatus);
app.patch('/api/vendor/orders/:id/status', protect, updateVendorOrderStatus);
app.use('/api/vendor', vendorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  // Prefer AppError's statusCode if available, fallback to numeric status, else 500
  const statusCode = typeof err.statusCode === 'number'
    ? err.statusCode
    : (typeof err.status === 'number' ? err.status : 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const DEFAULT_PORT = Number(process.env.PORT) || 5001;

function startServer(port, attemptsLeft = 3) {
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = setupSocketIO(server);

  // Make io available globally for other modules
  app.set('io', io);

  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📡 Socket.IO server initialized`);
    console.log(`🌱 UrbanSprout Backend is ready!`);

    // Start discount lifecycle service
    discountLifecycleService.start();
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
      if (attemptsLeft > 0) {
        const nextPort = port + 1;
        console.warn(`🔁 Retrying on port ${nextPort} (remaining attempts: ${attemptsLeft})...`);
        setTimeout(() => startServer(nextPort, attemptsLeft - 1), 500);
      } else {
        console.error('💥 All retry attempts failed.');
        console.error('To free the port on macOS:');
        console.error(`1) lsof -i :${port}`);
        console.error('2) kill -9 <PID>');
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

(async () => {
  await connectDB();
  startServer(DEFAULT_PORT);
})();