const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
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

// Get subscription status
router.get('/status', authenticate, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const isExpired = subscription.isExpired();
    
    res.json({
      success: true,
      subscription: {
        type: subscription.subscription,
        status: subscription.subscriptionStatus,
        exam: subscription.exam,
        startTime: subscription.subscriptionStartTime,
        endTime: subscription.subscriptionEndTime,
        isExpired,
        subscriptionType: subscription.subscriptionType
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;