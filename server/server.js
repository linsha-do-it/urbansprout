const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const setupSocketIO = require('./utils/socketIO');
const discountLifecycleService = require('./services/discountLifecycleService');

// Load env from project root first (for MONGODB_URI), then server/.env for others
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

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
const allowedOrigins = Array.from(new Set([ ...defaultAllowedOrigins, ...normalizedEnvOrigins ]));

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
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    return res.sendStatus(204);
  }
  next();
});

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, be lenient to avoid blocking
    if ((process.env.NODE_ENV || 'development') === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (removed verbose logs)
app.use((req, res, next) => {
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌱 UrbanSprout Backend API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth',
      plants: '/api/plants',
      store: '/api/store',
      blog: '/api/blog',
      garden: '/api/garden',
      chatbot: '/api/chatbot',
      notifications: '/api/notifications'
    }
  });
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
const storeRoutes = require('./routes/store');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const chatbotRoutes = require('./routes/chatbot');
const notificationRoutes = require('./routes/notifications');
const plantRoutes = require('./routes/plants');
const gardenRoutes = require('./routes/garden');
const statsRoutes = require('./routes/stats');
const profilePhotoRoutes = require('./routes/profilePhoto');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/store', storeRoutes);
// Debug route for inventory insights (no auth required)
const { getInventoryInsightsDebug } = require('./controllers/adminController');
app.get('/api/admin/inventory-insights-debug', getInventoryInsightsDebug);

app.use('/api/admin', adminRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/garden', gardenRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/profile-photo', profilePhotoRoutes);

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
    
    // Only start discount lifecycle service if database is connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Database connected - Starting discount lifecycle service');
      discountLifecycleService.start();
    } else {
      console.log('⚠️  Database not connected - Discount lifecycle service will not start');
      console.log('⚠️  Waiting for database connection...');
      
      // Listen for successful connection
      mongoose.connection.once('open', () => {
        console.log('✅ Database connected - Starting discount lifecycle service');
        discountLifecycleService.start();
      });
    }
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

// Initialize database connection and start server
async function initializeApp() {
  try {
    // Connect to database first
    await connectDB();
    
    // Start server after database is connected
    startServer(DEFAULT_PORT);
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    // Still start the server even if DB connection fails (as per original logic)
    startServer(DEFAULT_PORT);
  }
}

initializeApp();