// backend/routes/subscriptionCancelRoute.js - FIXED FOR WALLET PURCHASES
const express = require('express');
const router = express.Router();
const RefundRequest = require('../models/RefundRequest');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const Wallet = require('../models/Wallet');
const { authenticate } = require('../middleware/auth');
const { getNextResetTime, getSubscriptionPrice } = require('../utils/helpers');

// @route   POST /api/subscription/cancel-refund
// @desc    Cancel subscription with 50% refund to wallet if <50% used
// @access  Private
router.post('/cancel-refund', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.userId;

    console.log('🎫 CANCEL/REFUND REQUEST:', { userId, reason });

    // Get user's subscription
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      console.log('❌ No subscription found');
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    // Check if user has active paid subscription
    if (subscription.subscription === 'free') {
      console.log('❌ User is on FREE plan');
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }

    // Check if subscription is from gift code (NOT ELIGIBLE)
    if (subscription.subscriptionType === 'giftcode') {
      console.log('❌ Gift code subscription - not eligible');
      return res.status(400).json({
        success: false,
        message: 'Gift code subscriptions cannot be refunded',
        refunded: false,
        cancelled: false
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
      percentageUsed: percentageUsed.toFixed(2) + '%',
      plan: subscription.subscription,
      type: subscription.subscriptionType
    });

    // 🔥 CRITICAL: Check if >=50% used - REJECT and NO DOWNGRADE
    if (percentageUsed >= 50) {
      console.log('❌ Not eligible - more than 50% used - NO DOWNGRADE');
      
      return res.json({
        success: false,
        refunded: false,
        cancelled: false,
        message: `Cannot cancel subscription. More than 50% of subscription period has elapsed (${percentageUsed.toFixed(1)}% used). Your subscription will remain active until expiry.`,
        percentageUsed: percentageUsed.toFixed(2),
        daysRemaining: Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24)),
        expiryDate: subscriptionEnd.toISOString()
      });
    }

    // 🔥 ELIGIBLE FOR REFUND (<50% used)
    console.log('✅ Eligible for refund - less than 50% used');

    // 🔥 FIX: Get subscription amount from MULTIPLE sources
    let subscriptionAmount = 0;
    let paymentSource = '';

    // Try 1: Check PaymentDetails (Razorpay purchases)
    const PaymentDetails = require('../models/PaymentDetails');
    const razorpayPayment = await PaymentDetails.findOne({
      userId: userId,
      subscriptionPlan: subscription.subscription,
      status: 'success'
    }).sort({ createdAt: -1 });

    if (razorpayPayment) {
      subscriptionAmount = razorpayPayment.amount;
      paymentSource = 'razorpay';
      console.log('💳 Found Razorpay payment:', subscriptionAmount);
    } else {
      // Try 2: Check Wallet transactions (Wallet purchases)
      const wallet = await Wallet.findOne({ userId });
      
      if (wallet) {
        // Look for the wallet debit transaction for this subscription
        const walletDebit = wallet.transactions.find(t => 
          t.type === 'debit' && 
          t.description.toLowerCase().includes(subscription.subscription.toLowerCase()) &&
          new Date(t.timestamp) >= subscriptionStart
        );

        if (walletDebit) {
          subscriptionAmount = walletDebit.amount;
          paymentSource = 'wallet';
          console.log('💰 Found Wallet payment:', subscriptionAmount);
        }
      }
    }

    // Try 3: Fallback - Calculate from pricing table
    if (subscriptionAmount === 0) {
      console.log('⚠️ No payment record found - calculating from pricing');
      
      // Calculate duration from dates
      const durationMs = subscriptionEnd - subscriptionStart;
      const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
      
      let duration = '1month';
      if (durationDays >= 350) duration = '1year';
      else if (durationDays >= 170) duration = '6months';
      
      const pricing = getSubscriptionPrice(subscription.subscription, duration);
      if (pricing) {
        subscriptionAmount = pricing.sp;
        paymentSource = 'calculated';
        console.log('📊 Calculated amount from pricing:', subscriptionAmount, 'Duration:', duration);
      }
    }

    // If still no amount found, return error
    if (subscriptionAmount === 0) {
      console.log('❌ Cannot determine subscription amount');
      return res.status(400).json({
        success: false,
        refunded: false,
        cancelled: false,
        message: 'Cannot process refund - subscription amount not found'
      });
    }

    // Calculate 50% refund
    const refundAmount = Math.floor(subscriptionAmount * 0.5);
    
    console.log('💰 Refund calculation:', {
      source: paymentSource,
      originalAmount: subscriptionAmount,
      refundAmount: refundAmount,
      percentageUsed: percentageUsed.toFixed(2)
    });

    // Create refund request record
    const refundRequest = await RefundRequest.create({
      userId: userId,
      subscription: subscription.subscription,
      subscriptionAmount: subscriptionAmount,
      subscriptionStartDate: subscription.subscriptionStartTime,
      subscriptionEndDate: subscription.subscriptionEndTime,
      reason: reason || 'User requested cancellation',
      status: 'approved',
      refundAmount: refundAmount,
      processedAt: new Date()
    });

    console.log('✅ Refund request created:', refundRequest._id);

    // Credit to wallet
    const wallet = await Wallet.getOrCreateWallet(userId);
    await wallet.adminAddMoney(
      refundAmount,
      `Refund (50%) for ${subscription.subscription.toUpperCase()} subscription (${paymentSource})`
    );

    console.log('✅ Refund credited to wallet:', refundAmount);

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

    // Return success with wallet balance
    const currentWallet = await Wallet.findOne({ userId });
    
    return res.json({
      success: true,
      refunded: true,
      cancelled: true,
      message: 'Subscription cancelled successfully and 50% refund processed to wallet',
      refundAmount: refundAmount,
      walletBalance: currentWallet?.balance || 0,
      percentageUsed: percentageUsed.toFixed(2),
      paymentSource: paymentSource
    });

  } catch (error) {
    console.error('❌ Cancel/Refund Error:', error);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      refunded: false,
      cancelled: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message
    });
  }
});

module.exports = router;