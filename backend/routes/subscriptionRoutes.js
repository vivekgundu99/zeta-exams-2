// backend/routes/subscriptionRoutes.js - ADD THIS NEW ROUTE
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   POST /api/subscription/cancel-refund
// @desc    Cancel subscription and process refund (50% to wallet if eligible)
// @access  Private
router.post('/cancel-refund', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has active subscription
    if (user.subscription === 'free') {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel',
      });
    }

    // Check if subscription is from gift code
    if (user.subscriptionType === 'giftcode') {
      return res.status(400).json({
        success: false,
        message: 'Gift code subscriptions cannot be refunded',
      });
    }

    // Calculate eligibility for refund
    const now = new Date();
    const subscriptionStart = new Date(user.subscriptionStartDate);
    const subscriptionEnd = new Date(user.subscriptionEndDate);
    
    const totalDuration = subscriptionEnd - subscriptionStart;
    const elapsedDuration = now - subscriptionStart;
    const percentageUsed = (elapsedDuration / totalDuration) * 100;

    let refundAmount = 0;
    let refundEligible = false;

    // Check if less than 50% duration elapsed
    if (percentageUsed < 50) {
      refundEligible = true;
      
      // Get original subscription amount
      const subscriptionAmount = user.subscriptionAmount || 0;
      
      // Calculate 50% refund
      refundAmount = Math.floor(subscriptionAmount * 0.5);
      
      if (refundAmount > 0) {
        // Credit refund to wallet
        user.walletBalance = (user.walletBalance || 0) + refundAmount;

        // Create transaction record
        const transaction = new Transaction({
          userId: user._id,
          type: 'admin_credit',
          amount: refundAmount,
          status: 'completed',
          description: `Refund (50%) for ${user.subscription} subscription cancellation`,
          createdAt: new Date(),
        });
        await transaction.save();
      }
    }

    // Downgrade to FREE immediately
    user.subscription = 'free';
    user.subscriptionStartDate = null;
    user.subscriptionEndDate = null;
    user.subscriptionType = 'original';
    user.subscriptionAmount = 0;

    await user.save();

    // Return response
    if (refundEligible && refundAmount > 0) {
      return res.json({
        success: true,
        refunded: true,
        message: 'Subscription cancelled and refund processed',
        refundAmount: refundAmount,
        walletBalance: user.walletBalance,
      });
    } else {
      return res.json({
        success: true,
        refunded: false,
        message: 'Subscription cancelled. No refund eligible as more than 50% of subscription period has elapsed.',
      });
    }
  } catch (error) {
    console.error('Cancel/Refund Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;