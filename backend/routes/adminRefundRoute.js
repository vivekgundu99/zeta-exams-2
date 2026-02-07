// backend/routes/adminRefundRoute.js - ADMIN REFUND PROCESSING (FIXED)
const express = require('express');
const router = express.Router();
const RefundRequest = require('../models/RefundRequest');
const Subscription = require('../models/Subscription');
const Wallet = require('../models/Wallet');
const Limits = require('../models/Limits');
const { authenticate, isAdmin } = require('../middleware/auth');
const { getNextResetTime } = require('../utils/helpers');
const cacheService = require('../services/cacheService');

// @route   GET /api/admin/refunds
// @desc    Get all refund requests
// @access  Admin only
router.get('/refunds', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📋 Admin: Loading refund requests');

    const refunds = await RefundRequest.find()
      .populate({
        path: 'userId',
        select: 'userId email name'
      })
      .sort({ requestedAt: -1 });

    // Get subscription details for each refund
    const refundsWithDetails = await Promise.all(
      refunds.map(async (refund) => {
        const subscription = await Subscription.findOne({ 
          userId: refund.userId.userId 
        });

        return {
          _id: refund._id,
          userId: refund.userId.userId,
          userEmail: refund.userId.email,
          userName: refund.userId.name,
          subscription: refund.subscription,
          subscriptionAmount: refund.subscriptionAmount,
          subscriptionStartDate: refund.subscriptionStartDate,
          subscriptionEndDate: refund.subscriptionEndDate,
          reason: refund.reason,
          status: refund.status,
          requestedAt: refund.requestedAt,
          processedAt: refund.processedAt,
          refundAmount: refund.refundAmount,
          currentSubscription: subscription?.subscription || 'free',
          percentageUsed: calculatePercentageUsed(
            refund.subscriptionStartDate,
            refund.subscriptionEndDate
          )
        };
      })
    );

    console.log('✅ Found refund requests:', refundsWithDetails.length);

    return res.json({
      success: true,
      count: refundsWithDetails.length,
      refunds: refundsWithDetails
    });

  } catch (error) {
    console.error('❌ Get Refunds Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/process-refund/:refundId
// @desc    Process refund request (approve/reject) - Credits 50% to wallet
// @access  Admin only
router.post('/process-refund/:refundId', authenticate, isAdmin, async (req, res) => {
  try {
    const { refundId } = req.params;
    const { approve } = req.body;

    console.log('🔄 Admin: Processing refund:', { refundId, approve });

    // Get refund request
    const refundRequest = await RefundRequest.findById(refundId).populate('userId');
    
    if (!refundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Refund request not found'
      });
    }

    // Check if already processed
    if (refundRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Refund request already ${refundRequest.status}`
      });
    }

    const userId = refundRequest.userId.userId;

    if (approve) {
      // Approve refund
      if (refundRequest.refundAmount > 0) {
        // Credit to wallet
        const wallet = await Wallet.getOrCreateWallet(userId);
        await wallet.adminAddMoney(
          refundRequest.refundAmount,
          `Admin approved refund (50%) for ${refundRequest.subscription} subscription`
        );

        console.log('💰 Credited to wallet:', refundRequest.refundAmount);
      }

      // Update refund request
      refundRequest.status = 'approved';
      refundRequest.processedAt = new Date();
      await refundRequest.save();

      // Downgrade to FREE (if not already)
      const subscription = await Subscription.findOne({ userId });
      if (subscription && subscription.subscription !== 'free') {
        subscription.subscription = 'free';
        subscription.subscriptionType = 'original';
        subscription.subscriptionStatus = 'inactive';
        subscription.subscriptionStartTime = new Date();
        subscription.subscriptionEndTime = null;
        await subscription.save();

        // Reset limits
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

        console.log('✅ Downgraded to FREE');
      }

      // Invalidate cache
      await cacheService.invalidateUserCache(userId);

      return res.json({
        success: true,
        message: 'Refund approved and credited to wallet',
        refundAmount: refundRequest.refundAmount
      });

    } else {
      // Reject refund
      refundRequest.status = 'rejected';
      refundRequest.processedAt = new Date();
      await refundRequest.save();

      console.log('❌ Refund rejected');

      return res.json({
        success: true,
        message: 'Refund request rejected'
      });
    }

  } catch (error) {
    console.error('❌ Process Refund Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Helper function
function calculatePercentageUsed(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const totalDuration = end - start;
  const elapsedDuration = now - start;
  
  return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100)).toFixed(2);
}

module.exports = router;