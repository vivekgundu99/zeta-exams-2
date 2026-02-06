// backend/models/RefundRequest.js - REFUND REQUEST MODEL
const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscription: {
    type: String,
    required: true,
    enum: ['silver', 'gold'],
  },
  subscriptionAmount: {
    type: Number,
    required: true,
  },
  subscriptionStartDate: {
    type: Date,
    required: true,
  },
  subscriptionEndDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('RefundRequest', refundRequestSchema);