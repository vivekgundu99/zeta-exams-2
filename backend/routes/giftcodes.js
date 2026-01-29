// backend/routes/giftcodes.js - FIXED UPGRADE LOGIC
const express = require('express');
const router = express.Router();
const GiftCode = require('../models/GiftCode');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { validateGiftCode } = require('../middleware/validator');
const { calculateSubscriptionEndDate } = require('../utils/helpers');

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

// 🔥 FIXED: Redeem gift code with proper upgrade logic
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

    // 🔥 CRITICAL: Get current subscription
    let subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (!subscription) {
      // Create new subscription if doesn't exist
      subscription = new Subscription({
        userId: req.user.userId,
        exam: null,
        subscription: 'free',
        subscriptionType: 'original',
        subscriptionStatus: 'active'
      });
    }

    const currentPlan = subscription.subscription;
    const currentType = subscription.subscriptionType;
    
    console.log(`   Current: ${currentPlan} (${currentType})`);

    // 🔥 USE UPGRADE METHOD - Handles all transitions correctly
    const endDate = calculateSubscriptionEndDate(giftCode.duration);
    await subscription.upgradeTo(
      giftCode.subscriptionType,
      giftCode.duration,
      'giftcode' // Mark as giftcode type
    );

    console.log(`   ✅ Upgraded to: ${giftCode.subscriptionType} (giftcode)`);
    console.log(`   ✅ Valid until: ${endDate.toISOString()}`);

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
        plan: giftCode.subscriptionType,
        type: 'giftcode',
        duration: giftCode.duration,
        endDate,
        upgradedFrom: currentPlan !== 'free' ? currentPlan : null
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