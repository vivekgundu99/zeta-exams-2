// backend/middleware/auth.js - FIXED SESSION VERSION LOGIC
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const cacheService = require('../services/cacheService');

// 🔥 In-memory token cache (60 seconds)
const tokenCache = new Map();
const TOKEN_CACHE_TTL = 60000; // 60 seconds

// 🔥 PERFORMANCE: Clean expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokenCache.entries()) {
    if (now - data.timestamp > TOKEN_CACHE_TTL) {
      tokenCache.delete(token);
    }
  }
}, 300000);

// 🔥 FIXED: Authenticate with proper session version handling
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '').trim().replace(/^["']|["']$/g, '');
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login.',
        code: 'INVALID_TOKEN'
      });
    }
    
    // 🔥 PERFORMANCE: Check in-memory token cache first
    const cachedToken = tokenCache.get(token);
    if (cachedToken && Date.now() - cachedToken.timestamp < TOKEN_CACHE_TTL) {
      req.user = cachedToken.user;
      return next();
    }
    
    // Verify JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      tokenCache.delete(token); // Remove invalid token from cache
      return res.status(401).json({
        success: false,
        message: 'Token expired or invalid. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // 🔥 ADMIN EXCEPTION - Skip session version check for admin
    if (decoded.isAdmin) {
      const userData = {
        userId: decoded.userId,
        email: decoded.email,
        isAdmin: true
      };
      
      // 🔥 Cache admin token
      tokenCache.set(token, {
        user: userData,
        timestamp: Date.now()
      });
      
      req.user = userData;
      return next();
    }
    
    // 🔥 CRITICAL FIX: Get CURRENT session version from database
    const user = await User.findOne({ userId: decoded.userId })
      .select('userId email sessionVersion')
      .lean(); // 🔥 PERFORMANCE: Use lean() for faster queries
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 🔥 CRITICAL FIX: Compare token's sessionVersion with current DB sessionVersion
    // If they DON'T match, this login was from a previous session (another device logged in after this)
    if (decoded.sessionVersion !== user.sessionVersion) {
      tokenCache.delete(token); // Remove invalid token from cache
      
      return res.status(401).json({
        success: false,
        message: 'You have been logged in from another device. Please login again.',
        code: 'SESSION_EXPIRED'
      });
    }
    
    // 🔥 SUCCESS: Session version matches - this is the current active login
    const userData = {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: false
    };
    
    // 🔥 Cache valid token
    tokenCache.set(token, {
      user: userData,
      timestamp: Date.now()
    });
    
    req.user = userData;
    next();
  } catch (error) {
    console.error('💥 Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
      code: 'AUTH_FAILED'
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// 🔥 OPTIMIZED: Check subscription with Redis caching
const checkSubscription = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      if (req.user.isAdmin) {
        return next();
      }

      // 🔥 PERFORMANCE: Check Redis cache first
      const cachedSub = await cacheService.getSubscription(req.user.userId);
      
      let subscription;
      if (cachedSub) {
        subscription = cachedSub;
      } else {
        const Subscription = require('../models/Subscription');
        subscription = await Subscription.findOne({ userId: req.user.userId })
          .select('subscription subscriptionStatus subscriptionEndTime')
          .lean(); // 🔥 PERFORMANCE: Use lean()
        
        if (subscription) {
          // Cache for 10 minutes
          await cacheService.setSubscription(req.user.userId, subscription, 600);
        }
      }
      
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No active subscription found.'
        });
      }
      
      // Check if expired
      if (subscription.subscriptionEndTime && new Date() > new Date(subscription.subscriptionEndTime)) {
        return res.status(403).json({
          success: false,
          message: 'Subscription expired. Please renew.'
        });
      }
      
      const planHierarchy = { free: 0, silver: 1, gold: 2 };
      const userPlanLevel = planHierarchy[subscription.subscription];
      const requiredPlanLevel = planHierarchy[requiredPlan];
      
      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${requiredPlan} subscription.`,
          currentPlan: subscription.subscription,
          requiredPlan: requiredPlan
        });
      }
      
      req.subscription = subscription;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription',
        error: error.message
      });
    }
  };
};

module.exports = {
  authenticate,
  isAdmin,
  checkSubscription
};