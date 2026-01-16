const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Authenticate user
const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 Authentication Check:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization
    });

    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header or invalid format');
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ Token is empty after split');
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.'
      });
    }
    
    console.log('🔑 Token received:', token.substring(0, 20) + '...');
    
    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('✅ Token verified successfully:', {
        userId: decoded.userId,
        email: decoded.email,
        isAdmin: decoded.isAdmin
      });
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
        error: error.message
      });
    }
    
    // For admin users, skip user existence check
    if (decoded.isAdmin) {
      console.log('👑 Admin user authenticated');
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        isAdmin: true
      };
      return next();
    }
    
    // Check if user exists (for regular users only)
    console.log('👤 Checking regular user existence:', decoded.userId);
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }
    
    console.log('✅ User found and authenticated');
    
    // Attach user info to request
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
      error: error.message
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  console.log('🔒 Admin check:', {
    hasUser: !!req.user,
    isAdmin: req.user?.isAdmin
  });

  if (!req.user || !req.user.isAdmin) {
    console.log('❌ Admin access denied');
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  console.log('✅ Admin access granted');
  next();
};

// Check subscription access
const checkSubscription = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      console.log('📋 Subscription check for plan:', requiredPlan);

      // Skip subscription check for admin
      if (req.user.isAdmin) {
        console.log('✅ Admin - subscription check skipped');
        return next();
      }

      const Subscription = require('../models/Subscription');
      
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      
      if (!subscription) {
        console.log('❌ No subscription found');
        return res.status(403).json({
          success: false,
          message: 'No active subscription found.'
        });
      }
      
      // Check if subscription is expired
      if (subscription.isExpired()) {
        console.log('⚠️ Subscription expired');
        subscription.subscriptionStatus = 'inactive';
        subscription.subscription = 'free';
        await subscription.save();
        
        return res.status(403).json({
          success: false,
          message: 'Subscription expired. Please renew.'
        });
      }
      
      // Check subscription level
      const planHierarchy = { free: 0, silver: 1, gold: 2 };
      const userPlanLevel = planHierarchy[subscription.subscription];
      const requiredPlanLevel = planHierarchy[requiredPlan];
      
      if (userPlanLevel < requiredPlanLevel) {
        console.log('❌ Insufficient subscription level');
        return res.status(403).json({
          success: false,
          message: `This feature requires ${requiredPlan} subscription.`,
          currentPlan: subscription.subscription,
          requiredPlan: requiredPlan
        });
      }
      
      console.log('✅ Subscription check passed');
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('💥 Subscription check error:', error);
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