// backend/middleware/auth.js - UPDATED WITH ADMIN EXCEPTION
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// 🔥 UPDATED: Authenticate with admin exception for multi-device login
const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 Authentication Check:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization
    });

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header');
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '').trim().replace(/^["']|["']$/g, '');
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Invalid token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login.',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Verify JWT
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('✅ Token verified:', {
        userId: decoded.userId,
        isAdmin: decoded.isAdmin,
        sessionVersion: decoded.sessionVersion
      });
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token expired or invalid. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // 🔥 ADMIN EXCEPTION - Skip session version check for admin
    if (decoded.isAdmin) {
      console.log('👑 Admin authenticated - Multi-device login allowed');
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        isAdmin: true
      };
      return next();
    }
    
    // 🔥 REGULAR USER: Check user and validate sessionVersion
    console.log('👤 Validating user and session version...');
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 🔥 SESSION VERSION VALIDATION - Only for regular users
    if (decoded.sessionVersion !== user.sessionVersion) {
      console.log('❌ Session version mismatch:', {
        tokenVersion: decoded.sessionVersion,
        userVersion: user.sessionVersion
      });
      
      return res.status(401).json({
        success: false,
        message: 'You have been logged in from another device. Please login again.',
        code: 'SESSION_EXPIRED'
      });
    }
    
    console.log('✅ Session version validated');
    
    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: false
    };
    
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

// Check subscription access
const checkSubscription = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      if (req.user.isAdmin) {
        return next();
      }

      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No active subscription found.'
        });
      }
      
      if (subscription.isExpired()) {
        subscription.subscriptionStatus = 'inactive';
        subscription.subscription = 'free';
        await subscription.save();
        
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