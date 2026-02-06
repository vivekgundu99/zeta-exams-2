// backend/routes/adminRefundRoute.js - ADMIN REFUND PROCESSING
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RefundRequest = require('../models/RefundRequest');
const Transaction = require('../models/Transaction');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// @route   GET /api/admin/refunds
// @desc    Get all refund requests
// @access  Admin only
router.get('/refunds', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const refunds = await RefundRequest.find()
      .populate('userId', 'name email phone')
      .sort({ requestedAt: -1 });

    return res.json({
      success: true,
      refunds,
    });
  } catch (error) {
    console.error('Get Refunds Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// @route   POST /api/admin/process-refund/:refundId
// @desc    Process refund request (approve/reject) - Credits 50% to wallet
// @access  Admin only
router.post('/process-refund/:refundId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { refundId } = req.params;
    const { approve } = req.body;

    // Get refund request
    const refundRequest = await RefundRequest.findById(refundId);
    if (!refundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Refund request not found',
      });
    }

    // Check if already processed
    if (refundRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Refund request already processed',
      });
    }

    // Get user
    const user = await User.findById(refundRequest.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (approve) {
      // Calculate refund amount (50% of subscription amount)
      const refundAmount = Math.floor(refundRequest.subscriptionAmount * 0.5);

      if (refundAmount > 0) {
        // Credit to wallet
        user.walletBalance = (user.walletBalance || 0) + refundAmount;

        // Create transaction record
        const transaction = new Transaction({
          userId: user._id,
          type: 'admin_credit',
          amount: refundAmount,
          status: 'completed',
          description: `Refund (50%) for ${refundRequest.subscription} subscription - Admin approved`,
          createdAt: new Date(),
        });
        await transaction.save();

        // Update refund request
        refundRequest.status = 'approved';
        refundRequest.processedAt = new Date();
        refundRequest.refundAmount = refundAmount;
        await refundRequest.save();
      }

      // Downgrade to FREE
      user.subscription = 'free';
      user.subscriptionStartDate = null;
      user.subscriptionEndDate = null;
      user.subscriptionType = 'original';
      user.subscriptionAmount = 0;
      await user.save();

      return res.json({
        success: true,
        message: 'Refund approved and credited to wallet',
        refundAmount,
      });
    } else {
      // Reject refund
      refundRequest.status = 'rejected';
      refundRequest.processedAt = new Date();
      await refundRequest.save();

      return res.json({
        success: true,
        message: 'Refund request rejected',
      });
    }
  } catch (error) {
    console.error('Process Refund Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;