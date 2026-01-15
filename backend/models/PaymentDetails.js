const mongoose = require('mongoose');

const paymentDetailsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  subscriptionType: {
    type: String,
    enum: ['original', 'giftcode'],
    default: 'original'
  },
  // Razorpay Details
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  subscriptionPlan: {
    type: String,
    enum: ['silver', 'gold'],
    required: true
  },
  subscriptionDuration: {
    type: String,
    enum: ['1month', '6months', '1year'],
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'upi'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'completed'],
    default: 'none'
  },
  refundDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentDetailsSchema.index({ userId: 1 });
paymentDetailsSchema.index({ razorpayOrderId: 1 });
paymentDetailsSchema.index({ razorpayPaymentId: 1 });
paymentDetailsSchema.index({ status: 1 });

module.exports = mongoose.model('PaymentDetails', paymentDetailsSchema);