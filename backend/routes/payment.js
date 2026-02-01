// backend/routes/payment.js - COMPREHENSIVE UPGRADE FIX
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentDetails = require('../models/PaymentDetails');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { calculateSubscriptionEndDate, getSubscriptionPrice, getNextResetTime } = require('../utils/helpers');
const { sendSubscriptionConfirmation } = require('../utils/email');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', authenticate, paymentLimiter, async (req, res) => {
  try {
    const { plan, duration } = req.body;

    if (!['silver', 'gold'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const pricing = getSubscriptionPrice(plan, duration);
    if (!pricing) {
      return res.status(400).json({
        success: false,
        message: 'Invalid duration'
      });
    }

    const options = {
      amount: pricing.sp * 100, // Amount in paise
      currency: 'INR',
      receipt: `${req.user.userId}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    // Save payment details
    await PaymentDetails.create({
      userId: req.user.userId,
      razorpayOrderId: order.id,
      amount: pricing.sp,
      status: 'pending',
      subscriptionPlan: plan,
      subscriptionDuration: duration
    });

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
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// 🔥 COMPREHENSIVE FIX: Verify payment with ALL upgrade paths
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment details
    const payment = await PaymentDetails.findOne({ razorpayOrderId: razorpay_order_id });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'success';
    payment.subscriptionType = 'original';
    await payment.save();

    console.log('💳 Payment verified successfully');
    console.log(`   User: ${req.user.userId}`);
    console.log(`   Plan: ${payment.subscriptionPlan}`);
    console.log(`   Duration: ${payment.subscriptionDuration}`);

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
    const newPlan = payment.subscriptionPlan;
    
    console.log(`   Current plan: ${currentPlan}`);
    console.log(`   New plan: ${newPlan}`);

    // 🔥 COMPREHENSIVE UPGRADE LOGIC
    const now = new Date();
    const endDate = calculateSubscriptionEndDate(payment.subscriptionDuration);
    
    // Store previous subscription info
    subscription.previousSubscription = currentPlan;
    subscription.previousSubscriptionType = subscription.subscriptionType;
    
    // Set new subscription
    subscription.subscription = newPlan;
    subscription.subscriptionType = 'original';
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

    // Send confirmation email
    const UserData = require('../models/UserData');
    const User = require('../models/User');
    const user = await User.findOne({ userId: req.user.userId });
    const userData = await UserData.findOne({ userId: req.user.userId });
    
    if (user && userData) {
      await sendSubscriptionConfirmation(
        user.email,
        userData.name,
        payment.subscriptionPlan,
        payment.subscriptionDuration,
        endDate
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      subscription: {
        plan: newPlan,
        type: 'original',
        duration: payment.subscriptionDuration,
        startDate: now,
        endDate: endDate,
        upgradedFrom: currentPlan !== newPlan ? currentPlan : null
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// Payment webhook
router.post('/webhook', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (webhookSignature === expectedSignature) {
      const event = req.body.event;
      
      if (event === 'payment.captured') {
        console.log('Payment captured:', req.body.payload.payment.entity);
      } else if (event === 'payment.failed') {
        const paymentId = req.body.payload.payment.entity.id;
        await PaymentDetails.updateOne(
          { razorpayPaymentId: paymentId },
          { status: 'failed' }
        );
      }
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = await PaymentDetails.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
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