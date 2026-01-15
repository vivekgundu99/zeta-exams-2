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

// Redeem gift code
router.post('/redeem', authenticate, validateGiftCode, async (req, res) => {
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

    // Update gift code
    giftCode.status = 'used';
    giftCode.usedBy = req.user.userId;
    giftCode.usedAt = new Date();
    await giftCode.save();

    // Update subscription
    const endDate = calculateSubscriptionEndDate(giftCode.duration);
    
    await Subscription.updateOne(
      { userId: req.user.userId },
      {
        subscription: giftCode.subscriptionType,
        subscriptionType: 'giftcode',
        subscriptionStartTime: new Date(),
        subscriptionEndTime: endDate,
        subscriptionStatus: 'active'
      }
    );

    // Update limits
    await Limits.updateOne(
      { userId: req.user.userId },
      { subscription: giftCode.subscriptionType }
    );

    res.json({
      success: true,
      message: 'Gift code redeemed successfully',
      subscription: {
        plan: giftCode.subscriptionType,
        duration: giftCode.duration,
        endDate
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