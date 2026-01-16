// backend/routes/subscription.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { getSubscriptionPrice } = require('../utils/helpers');

// Get subscription plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: {
      free: {
        price: 0,
        features: {
          questionsPerDay: 50,
          chapterTests: 0,
          mockTests: 0,
          formulas: false,
          analytics: false
        }
      },
      silver: {
        '1month': getSubscriptionPrice('silver', '1month'),
        '6months': getSubscriptionPrice('silver', '6months'),
        '1year': getSubscriptionPrice('silver', '1year'),
        features: {
          questionsPerDay: 200,
          chapterTests: 10,
          mockTests: 0,
          formulas: false,
          analytics: false
        }
      },
      gold: {
        '1month': getSubscriptionPrice('gold', '1month'),
        '6months': getSubscriptionPrice('gold', '6months'),
        '1year': getSubscriptionPrice('gold', '1year'),
        features: {
          questionsPerDay: 5000,
          chapterTests: 50,
          mockTests: 8,
          formulas: true,
          analytics: true
        }
      }
    }
  });
});

// FIX: Get subscription status with proper error handling
router.get('/status', authenticate, async (req, res) => {
  try {
    console.log('📊 GET /api/subscription/status - User:', req.user.userId);
    
    const subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (!subscription) {
      console.log('❌ Subscription not found for user:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check if subscription is expired
    const isExpired = subscription.isExpired();
    
    // Auto-update if expired
    if (isExpired && subscription.subscription !== 'free') {
      subscription.subscriptionStatus = 'inactive';
      subscription.subscription = 'free';
      await subscription.save();
    }

    console.log('✅ Subscription status:', {
      subscription: subscription.subscription,
      status: subscription.subscriptionStatus,
      exam: subscription.exam
    });

    res.json({
      success: true,
      subscription: {
        userId: subscription.userId,
        exam: subscription.exam,
        subscription: subscription.subscription,
        subscriptionType: subscription.subscriptionType,
        subscriptionStartTime: subscription.subscriptionStartTime,
        subscriptionEndTime: subscription.subscriptionEndTime,
        subscriptionStatus: subscription.subscriptionStatus,
        isExpired
      }
    });

  } catch (error) {
    console.error('💥 Subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;