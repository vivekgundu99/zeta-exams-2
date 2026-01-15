const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Authenticate user
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user exists
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
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
      const Subscription = require('../models/Subscription');
      
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No active subscription found.'
        });
      }
      
      // Check if subscription is expired
      if (subscription.isExpired()) {
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