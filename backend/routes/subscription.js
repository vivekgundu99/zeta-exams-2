// backend/routes/subscription.js - COMPREHENSIVE FIX
const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { getSubscriptionPrice, getNextResetTime } = require('../utils/helpers');

// Get subscription plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: {
      free: {
        price: 0,
        features: {
          questionsPerDay: 20,
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

// 🔥 CRITICAL FIX: Get subscription status with proper initialization
router.get('/status', authenticate, async (req, res) => {
  try {
    console.log('📊 GET /api/subscription/status - User:', req.user.userId);
    
    let subscription = await Subscription.findOne({ userId: req.user.userId });
    
    // 🔥 FIX 1: Create subscription if doesn't exist (for new users)
    if (!subscription) {
      console.log('⚠️ No subscription found - Creating FREE subscription for new user');
      
      subscription = await Subscription.create({
        userId: req.user.userId,
        exam: null, // Will be set when user completes profile
        subscription: 'free',
        subscriptionType: 'original',
        subscriptionStartTime: new Date(),
        subscriptionEndTime: null,
        subscriptionStatus: 'active'
      });
      
      // Also create limits
      await Limits.create({
        userId: req.user.userId,
        subscription: 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
      
      console.log('✅ FREE subscription created for new user');
    }

    // 🔥 FIX 2: Check expiry and auto-downgrade BEFORE returning
    if (subscription.subscription !== 'free') {
      const isExpired = subscription.isExpired();
      
      if (isExpired && subscription.subscriptionStatus === 'active') {
        console.log('⚠️ Subscription expired - Auto-downgrading to FREE');
        
        // Store previous subscription info
        subscription.previousSubscription = subscription.subscription;
        subscription.previousSubscriptionType = subscription.subscriptionType;
        
        // Downgrade to free
        subscription.subscription = 'free';
        subscription.subscriptionType = 'original';
        subscription.subscriptionStatus = 'inactive';
        subscription.subscriptionEndTime = null;
        
        await subscription.save();
        
        // Update limits
        await Limits.updateOne(
          { userId: req.user.userId },
          { 
            subscription: 'free',
            questionCount: 0,
            chapterTestCount: 0,
            mockTestCount: 0,
            ticketCount: 0,
            questionCountLimitReached: false,
            chapterTestCountLimitReached: false,
            mockTestCountLimitReached: false,
            ticketCountLimitReached: false
          }
        );
        
        console.log('✅ Auto-downgraded to FREE');
      }
    }

    // Return final status
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
        isExpired: subscription.subscription !== 'free' && subscription.isExpired()
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