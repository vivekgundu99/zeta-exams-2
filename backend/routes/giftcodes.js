// backend/routes/giftcodes.js - COMPREHENSIVE UPGRADE FIX
const express = require('express');
const router = express.Router();
const GiftCode = require('../models/GiftCode');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { validateGiftCode } = require('../middleware/validator');
const { calculateSubscriptionEndDate, getNextResetTime } = require('../utils/helpers');

// Validate gift code
router.post('/validate', authenticate, validateGiftCode, async (req, res) => {
  try {
    const { code } = req.body;

    const giftCode = await GiftCode.findOne({ 
      code: code.toUpperCase(),
      status: 'available'
    });

    if (!giftCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or already used gift code'
      });
    }

    res.json({
      success: true,
      giftCode: {
        subscription: giftCode.subscriptionType,
        duration: giftCode.duration
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

// 🔥 COMPREHENSIVE FIX: Redeem gift code with ALL upgrade paths
router.post('/redeem', authenticate, validateGiftCode, async (req, res) => {
  try {
    const { code } = req.body;

    console.log('🎁 Gift code redemption started');
    console.log(`   User: ${req.user.userId}`);
    console.log(`   Code: ${code}`);

    const giftCode = await GiftCode.findOne({ 
      code: code.toUpperCase(),
      status: 'available'
    });

    if (!giftCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or already used gift code'
      });
    }

    console.log(`   Plan: ${giftCode.subscriptionType}`);
    console.log(`   Duration: ${giftCode.duration}`);

    // 🔥 CRITICAL: Get or create subscription
    let subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (!subscription) {
      console.log('⚠️ No subscription found - Creating new subscription');
      subscription = new Subscription({
        userId: req.user.userId,
        exam: null,
        subscription: 'free',
        subscriptionType: 'original',
        subscriptionStatus: 'active'
      });
    }

    const currentPlan = subscription.subscription;
    const newPlan = giftCode.subscriptionType;
    
    console.log(`   Current plan: ${currentPlan}`);
    console.log(`   New plan: ${newPlan}`);

    // 🔥 COMPREHENSIVE UPGRADE LOGIC
    const now = new Date();
    const endDate = calculateSubscriptionEndDate(giftCode.duration);
    
    // Store previous subscription info
    subscription.previousSubscription = currentPlan;
    subscription.previousSubscriptionType = subscription.subscriptionType;
    
    // Set new subscription
    subscription.subscription = newPlan;
    subscription.subscriptionType = 'giftcode';
    subscription.subscriptionStatus = 'active';
    subscription.subscriptionStartTime = now;
    subscription.subscriptionEndTime = endDate;
    
    await subscription.save();

    console.log(`   ✅ Subscription updated: ${currentPlan} → ${newPlan}`);
    console.log(`   ✅ Valid until: ${endDate.toISOString()}`);

    // 🔥 CRITICAL: Update or create limits
    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      console.log('⚠️ No limits found - Creating new limits');
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: newPlan,
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
    } else {
      limits.subscription = newPlan;
      limits.questionCount = 0;
      limits.chapterTestCount = 0;
      limits.mockTestCount = 0;
      limits.ticketCount = 0;
      limits.questionCountLimitReached = false;
      limits.chapterTestCountLimitReached = false;
      limits.mockTestCountLimitReached = false;
      limits.ticketCountLimitReached = false;
      await limits.save();
    }

    console.log(`   ✅ Limits updated to ${newPlan.toUpperCase()} tier`);

    // Mark gift code as used
    giftCode.status = 'used';
    giftCode.usedBy = req.user.userId;
    giftCode.usedAt = new Date();
    await giftCode.save();

    console.log('   ✅ Gift code marked as used');

    res.json({
      success: true,
      message: 'Gift code redeemed successfully',
      subscription: {
        plan: newPlan,
        type: 'giftcode',
        duration: giftCode.duration,
        startDate: now,
        endDate: endDate,
        upgradedFrom: currentPlan !== newPlan ? currentPlan : null
      }
    });

  } catch (error) {
    console.error('❌ Gift code redemption error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;