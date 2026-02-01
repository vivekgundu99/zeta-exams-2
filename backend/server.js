// backend/server.js - WITH REDIS CACHING
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const cacheService = require('./services/cacheService');
const { scheduleDailyReset, autoResetLimits } = require('./middleware/limitsReset');
const { scheduleSubscriptionExpiry } = require('./utils/subscriptionScheduler');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// 🔥 Connect to Redis (Upstash)
connectRedis();
cacheService.init();

console.log('');
console.log('🚀 ==========================================');
console.log('🚀 ZETA EXAMS BACKEND - STARTING');
console.log('🚀 ==========================================');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not Set');
console.log('Redis URL:', process.env.UPSTASH_REDIS_URL ? '✅ Set' : '❌ Not Set');
console.log('JWT Secret:', process.env.JWT_SECRET ? '✅ Set (length: ' + process.env.JWT_SECRET.length + ')' : '❌ Not Set');
console.log('Resend API Key:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not Set');
console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Not Set');
console.log('Admin Email:', process.env.ADMIN_EMAIL || '❌ Not Set');
console.log('Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
console.log('🚀 ==========================================');
console.log('');

if (!process.env.JWT_SECRET) {
  console.error('');
  console.error('🔴🔴🔴 FATAL ERROR 🔴🔴🔴');
  console.error('JWT_SECRET is not set!');
  console.error('The application cannot start without JWT_SECRET');
  console.error('Please set it in Vercel environment variables');
  console.error('🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴');
  console.error('');
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Running without JWT_SECRET - authentication will fail');
  }
}

app.set('trust proxy', 1);
console.log('✅ Trust proxy enabled for Vercel');

app.use(helmet());
app.use(compression());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

console.log('🌐 CORS enabled for:', corsOptions.origin);
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Auto-reset limits middleware
app.use(autoResetLimits);

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.headers.authorization) {
    const authPreview = req.headers.authorization.substring(0, 30);
    console.log('  → Has Authorization header:', authPreview + '...');
    if (authPreview.includes('"') || authPreview.includes("'")) {
      console.log('  ⚠️ WARNING: Authorization header contains quotes!');
    }
  }
  next();
});

console.log('📍 Registering routes...');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/formulas', require('./routes/formulas'));
app.use('/api/mock-tests', require('./routes/mockTests'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/giftcodes', require('./routes/giftcodes'));
console.log('✅ All routes registered');

// 🔥 SCHEDULERS
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
  // Daily limits reset at 4 AM IST
  scheduleDailyReset();
  console.log('✅ Daily limits reset scheduler started (4 AM IST)');
  
  // Subscription expiry check every hour
  scheduleSubscriptionExpiry();
  console.log('✅ Subscription expiry scheduler started (every hour)');
}

app.get('/api/health', async (req, res) => {
  const health = {
    success: true,
    message: 'Zeta Exams API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      mongodb: process.env.MONGODB_URI ? 'configured' : 'missing',
      redis: cacheService.isAvailable() ? 'connected' : 'disconnected',
      jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing',
      resend: process.env.RESEND_API_KEY ? 'configured' : 'missing',
      razorpay: process.env.RAZORPAY_KEY_ID ? 'configured' : 'missing',
      trustProxy: app.get('trust proxy') ? 'enabled' : 'disabled',
      limitsScheduler: 'enabled',
      subscriptionScheduler: 'enabled'
    }
  };

  // 🔥 Add Redis stats if available
  if (cacheService.isAvailable()) {
    const stats = await cacheService.getCacheStats();
    health.redis = stats;
  }
  
  res.status(200).json(health);
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Zeta Exams API',
    version: '2.0.0',
    features: ['Redis Caching', 'Rate Limiting', 'Auto Scaling'],
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      user: '/api/user',
      admin: '/api/admin'
    }
  });
});

app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('💥 Global error handler:', err);
  console.error('Stack:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      error: err 
    })
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('');
    console.log('✅ ==========================================');
    console.log(`✅ Server running on port ${PORT}`);
    console.log('✅ ==========================================');
    console.log('');
  });
} else {
  console.log('✅ Server configured for production (Vercel)');
}

module.exports = app;