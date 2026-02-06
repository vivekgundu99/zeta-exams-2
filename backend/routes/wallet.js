// backend/routes/wallet.js - USER WALLET ROUTES
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Wallet = require('../models/Wallet');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { getNextResetTime } = require('../utils/helpers');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   GET /api/wallet
// @desc    Get user wallet balance and transactions
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('💰 GET /api/wallet - User:', req.user.userId);

    const wallet = await Wallet.getOrCreateWallet(req.user.userId);

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        transactions: wallet.transactions.slice(0, 50) // Last 50 transactions
      }
    });

  } catch (error) {
    console.error('💥 Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/wallet/topup/create-order
// @desc    Create Razorpay order for wallet top-up
// @access  Private
router.post('/topup/create-order', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    console.log('💰 Wallet top-up order creation:', { userId: req.user.userId, amount });

    // Validate amount
    if (!amount || amount < 50 || amount > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between ₹50 and ₹5000'
      });
    }

    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `wallet_topup_${req.user.userId}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created:', order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('💥 Create top-up order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @route   POST /api/wallet/topup/verify
// @desc    Verify Razorpay payment and add money to wallet
// @access  Private
router.post('/topup/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    console.log('💰 Verifying wallet top-up:', { userId: req.user.userId, amount });

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      console.log('❌ Invalid signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Add money to wallet
    const wallet = await Wallet.getOrCreateWallet(req.user.userId);
    await wallet.addMoney(amount, razorpay_order_id, razorpay_payment_id);

    console.log('✅ Wallet top-up successful:', {
      userId: req.user.userId,
      amount,
      newBalance: wallet.balance
    });

    res.json({
      success: true,
      message: `₹${amount} added to wallet successfully!`,
      wallet: {
        balance: wallet.balance
      }
    });

  } catch (error) {
    console.error('💥 Verify top-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// @route   POST /api/wallet/subscribe
// @desc    Purchase subscription using wallet money
// @access  Private
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { plan, duration } = req.body;

    console.log('💰 Wallet subscription purchase:', { userId: req.user.userId, plan, duration });

    // Validate plan and duration
    if (!['silver', 'gold'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    if (!['1month', '6months', '1year'].includes(duration)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription duration'
      });
    }

    // Get pricing
    const { getSubscriptionPrice, calculateSubscriptionEndDate } = require('../utils/helpers');
    const pricing = getSubscriptionPrice(plan, duration);

    if (!pricing) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan or duration'
      });
    }

    const amount = pricing.sp;

    // Get wallet
    const wallet = await Wallet.getOrCreateWallet(req.user.userId);

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance. Please top-up your wallet.',
        required: amount,
        available: wallet.balance,
        shortfall: amount - wallet.balance
      });
    }

    // Deduct money from wallet
    await wallet.deductMoney(
      amount,
      `Subscription: ${plan.toUpperCase()} - ${duration} (₹${amount})`
    );

    // Update subscription
    let subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.userId,
        exam: null,
        subscription: 'free',
        subscriptionType: 'original',
        subscriptionStatus: 'active'
      });
    }

    const now = new Date();
    const endDate = calculateSubscriptionEndDate(duration);
    
    subscription.subscription = plan;
    subscription.subscriptionType = 'original'; // Wallet purchases are 'original' type
    subscription.subscriptionStatus = 'active';
    subscription.subscriptionStartTime = now;
    subscription.subscriptionEndTime = endDate;
    
    await subscription.save();

    // Update limits
    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: plan,
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
    } else {
      limits.subscription = plan;
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

    // Invalidate cache
    const cacheService = require('../services/cacheService');
    await cacheService.invalidateUserCache(req.user.userId);

    console.log('✅ Wallet subscription successful:', {
      userId: req.user.userId,
      plan,
      duration,
      amount,
      newBalance: wallet.balance
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully!',
      subscription: {
        plan,
        type: 'original',
        duration,
        startDate: now,
        endDate,
        paidAmount: amount
      },
      wallet: {
        balance: wallet.balance
      }
    });

  } catch (error) {
    console.error('💥 Wallet subscribe error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Subscription purchase failed',
      error: error.message
    });
  }
});

module.exports = router;