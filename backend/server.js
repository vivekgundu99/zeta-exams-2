// backend/server.js - SERVERLESS-OPTIMIZED WITH ROBUST HEALTH CHECK
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const cacheService = require('./services/cacheService');
const { scheduleDailyReset } = require('./middleware/limitsReset');
const { scheduleSubscriptionExpiry } = require('./utils/subscriptionScheduler');
require('dotenv').config();

const app = express();

// 🔥 PERFORMANCE: Set keep-alive timeout
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  next();
});

// Connect to MongoDB
connectDB();

// 🔥 Connect to Redis (non-blocking, graceful degradation)
console.log('🔄 Starting Redis connection (non-blocking)...');
try {
  connectRedis();
  cacheService.init();
} catch (error) {
  console.log('⚠️ Redis connection failed - continuing without cache:', error.message);
}

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

// 🔥 PERFORMANCE: Helmet with optimized settings
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 🔥 PERFORMANCE: High compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 🔥 PERFORMANCE: Cache preflight for 24h
};

console.log('🌐 CORS enabled for:', corsOptions.origin);
app.use(cors(corsOptions));

// 🔥 PERFORMANCE: Optimized body parsing
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 50000
}));
app.use(cookieParser());

// 🔥 PERFORMANCE: Conditional logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (req.headers.authorization) {
      const authPreview = req.headers.authorization.substring(0, 30);
      console.log('  → Has Authorization header:', authPreview + '...');
    }
    next();
  });
}

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
app.use('/api/diagnostics', require('./routes/diagnostics')); // 🔥 ADD THIS LINE
console.log('✅ All routes registered');

// 🔥 SCHEDULERS - Only in production and only if not in serverless cold start
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
  // Delay scheduler start to avoid cold start issues
  setTimeout(() => {
    try {
      scheduleDailyReset();
      console.log('✅ Daily limits reset scheduler started (4 AM IST)');
    } catch (error) {
      console.log('⚠️ Scheduler start warning (non-critical):', error.message);
    }
  }, 10000); // Start after 10 seconds
  
  setTimeout(() => {
    try {
      scheduleSubscriptionExpiry();
      console.log('✅ Subscription expiry scheduler started (every hour)');
    } catch (error) {
      console.log('⚠️ Scheduler start warning (non-critical):', error.message);
    }
  }, 15000); // Start after 15 seconds
}

// 🔥 SERVERLESS-SAFE HEALTH CHECK
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection state
    let mongoStatus = 'disconnected';
    let mongoMessage = '';
    
    try {
      const mongoState = mongoose.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      switch(mongoState) {
        case 0:
          mongoStatus = 'disconnected';
          mongoMessage = 'MongoDB is disconnected';
          break;
        case 1:
          mongoStatus = 'connected';
          mongoMessage = 'MongoDB is connected';
          break;
        case 2:
          mongoStatus = 'connecting';
          mongoMessage = 'MongoDB is connecting...';
          break;
        case 3:
          mongoStatus = 'disconnecting';
          mongoMessage = 'MongoDB is disconnecting';
          break;
        default:
          mongoStatus = 'unknown';
          mongoMessage = 'MongoDB state unknown';
      }
    } catch (error) {
      mongoStatus = 'error';
      mongoMessage = error.message;
    }

    // Check Redis connection
    let redisStatus = 'disconnected';
    let redisMessage = '';
    
    try {
      if (cacheService.isAvailable()) {
        redisStatus = 'connected';
        redisMessage = 'Redis is connected';
      } else {
        redisStatus = 'disconnected';
        redisMessage = 'Redis is not available (app running without cache)';
      }
    } catch (error) {
      redisStatus = 'error';
      redisMessage = error.message;
    }

    const health = {
      success: true,
      message: 'Zeta Exams API is running',
      timestamp: new Date().toISOString(),
      serverless: true,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      database: {
        mongodb: {
          status: mongoStatus,
          message: mongoMessage,
          configured: !!process.env.MONGODB_URI
        },
        redis: {
          status: redisStatus,
          message: redisMessage,
          configured: !!process.env.UPSTASH_REDIS_URL
        }
      },
      services: {
        jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing',
        resend: process.env.RESEND_API_KEY ? 'configured' : 'missing',
        razorpay: process.env.RAZORPAY_KEY_ID ? 'configured' : 'missing',
        adminEmail: process.env.ADMIN_EMAIL ? 'configured' : 'missing'
      },
      features: {
        trustProxy: app.get('trust proxy') ? 'enabled' : 'disabled',
        cors: corsOptions.origin,
        compression: 'enabled',
        helmet: 'enabled'
      }
    };

    // 🔥 Only try Redis stats if connected (with timeout)
    if (redisStatus === 'connected') {
      try {
        const statsPromise = cacheService.getCacheStats();
        const stats = await Promise.race([
          statsPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
        ]);
        health.database.redis.stats = stats;
      } catch (error) {
        health.database.redis.stats = { status: 'timeout' };
      }
    }

    // Determine HTTP status code based on critical services
    const httpStatus = mongoStatus === 'connected' ? 200 : 503;
    
    res.status(httpStatus).json(health);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    // Even if health check fails, return a response
    res.status(500).json({
      success: false,
      message: 'Health check encountered an error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Zeta Exams API',
    version: '2.0.0',
    serverless: true,
    features: ['MongoDB', 'Redis Caching (Optional)', 'Rate Limiting', 'Auto Scaling'],
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      user: '/api/user',
      admin: '/api/admin'
    }
  });
});

// 🔥 PERFORMANCE: Optimized 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// 🔥 PERFORMANCE: Optimized error handler with serverless safety
app.use((err, req, res, next) => {
  // Only log errors in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('💥 Global error handler:', err);
    console.error('Stack:', err.stack);
  }
  
  // Ensure we always send a response
  if (!res.headersSent) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production' && { 
        stack: err.stack,
        error: err 
      })
    });
  }
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