// backend/routes/subscriptionCancelRoute.js - USER CANCEL/REFUND ROUTE (CORRECTED LOGIC)
const express = require('express');
const router = express.Router();
const RefundRequest = require('../models/RefundRequest');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const Wallet = require('../models/Wallet');
const { authenticate } = require('../middleware/auth');
const { getNextResetTime } = require('../utils/helpers');

// @route   POST /api/subscription/cancel-refund
// @desc    Cancel subscription ONLY if <50% used, with 50% refund to wallet
// @access  Private
router.post('/cancel-refund', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.userId;

    console.log('🎫 CANCEL/REFUND REQUEST:', { userId, reason });

    // Get user's subscription
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    // Check if user has active paid subscription
    if (subscription.subscription === 'free') {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }

    // Check if subscription is from gift code (NOT ELIGIBLE)
    if (subscription.subscriptionType === 'giftcode') {
      return res.status(400).json({
        success: false,
        message: 'Gift code subscriptions cannot be refunded',
        refunded: false
      });
    }

    // Calculate eligibility
    const now = new Date();
    const subscriptionStart = new Date(subscription.subscriptionStartTime);
    const subscriptionEnd = new Date(subscription.subscriptionEndTime);
    
    const totalDuration = subscriptionEnd - subscriptionStart;
    const elapsedDuration = now - subscriptionStart;
    const percentageUsed = (elapsedDuration / totalDuration) * 100;

    console.log('📊 Refund calculation:', {
      totalDuration: Math.floor(totalDuration / (1000 * 60 * 60 * 24)) + ' days',
      elapsedDuration: Math.floor(elapsedDuration / (1000 * 60 * 60 * 24)) + ' days',
      percentageUsed: percentageUsed.toFixed(2) + '%'
    });

    // 🔥 CRITICAL: Check if >=50% used - REJECT cancellation
    if (percentageUsed >= 50) {
      console.log('❌ Not eligible for cancellation - more than 50% used');
      
      return res.status(400).json({
        success: false,
        refunded: false,
        cancelled: false,
        message: 'Cannot cancel subscription. More than 50% of subscription period has elapsed. Your subscription will remain active until expiry.',
        percentageUsed: percentageUsed.toFixed(2),
        daysRemaining: Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24)),
        expiryDate: subscriptionEnd.toISOString()
      });
    }

    // 🔥 ONLY PROCEED IF <50% USED

    // Get subscription amount from payment details
    const PaymentDetails = require('../models/PaymentDetails');
    const payment = await PaymentDetails.findOne({
      userId: userId,
      subscriptionPlan: subscription.subscription,
      status: 'success'
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Calculate 50% refund
    const refundAmount = Math.floor(payment.amount * 0.5);
    
    console.log('💰 Refund eligible:', {
      originalAmount: payment.amount,
      refundAmount
    });

    // Create refund request
    const refundRequest = await RefundRequest.create({
      userId: userId,
      subscription: subscription.subscription,
      subscriptionAmount: payment.amount,
      subscriptionStartDate: subscription.subscriptionStartTime,
      subscriptionEndDate: subscription.subscriptionEndTime,
      reason: reason || 'User requested cancellation',
      status: 'approved', // Auto-approve since eligible
      refundAmount: refundAmount,
      processedAt: new Date()
    });

    console.log('✅ Refund request created:', refundRequest._id);

    // Credit to wallet
    const wallet = await Wallet.getOrCreateWallet(userId);
    await wallet.adminAddMoney(
      refundAmount,
      `Refund (50%) for ${subscription.subscription} subscription cancellation`
    );

    console.log('✅ Refund credited to wallet');

    // Downgrade to FREE
    subscription.subscription = 'free';
    subscription.subscriptionType = 'original';
    subscription.subscriptionStatus = 'inactive';
    subscription.subscriptionStartTime = now;
    subscription.subscriptionEndTime = null;
    await subscription.save();

    // Reset limits to FREE tier
    await Limits.updateOne(
      { userId },
      {
        subscription: 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        questionCountLimitReached: false,
        chapterTestCountLimitReached: false,
        mockTestCountLimitReached: false,
        ticketCountLimitReached: false,
        limitResetTime: getNextResetTime()
      }
    );

    // Invalidate cache
    const cacheService = require('../services/cacheService');
    await cacheService.invalidateUserCache(userId);

    console.log('✅ Subscription cancelled and downgraded to FREE');

    // Return success
    const currentWallet = await Wallet.findOne({ userId });
    return res.json({
      success: true,
      refunded: true,
      cancelled: true,
      message: 'Subscription cancelled successfully and 50% refund processed to wallet',
      refundAmount: refundAmount,
      walletBalance: currentWallet?.balance || 0,
      percentageUsed: percentageUsed.toFixed(2)
    });

  } catch (error) {
    console.error('❌ Cancel/Refund Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;