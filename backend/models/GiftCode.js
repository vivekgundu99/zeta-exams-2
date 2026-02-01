// backend/models/GiftCode.js - FIXED DUPLICATE INDEX WARNINGS
const mongoose = require('mongoose');

const giftCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  subscriptionType: {
    type: String,
    enum: ['silver', 'gold'],
    required: true
  },
  duration: {
    type: String,
    enum: ['1month', '6months', '1year'],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'used'],
    default: 'available'
  },
  usedBy: {
    type: String,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// 🔥 FIX: Create indexes only once using schema.index()
giftCodeSchema.index({ code: 1 }, { unique: true });
giftCodeSchema.index({ status: 1 });

// Method to decode gift code
giftCodeSchema.statics.decodeGiftCode = function(code) {
  if (code.length !== 8) return null;
  
  const subscriptionMap = { 'S': 'silver', 'G': 'gold' };
  const durationMap = { '1': '1month', '6': '6months', 'Y': '1year' };
  
  const subscription = subscriptionMap[code[0]];
  const duration = durationMap[code[1]];
  
  if (!subscription || !duration) return null;
  
  return { subscription, duration };
};

module.exports = mongoose.model('GiftCode', giftCodeSchema);