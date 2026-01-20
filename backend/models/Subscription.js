const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  exam: {
    type: String,
    enum: ['jee', 'neet', null],
    default: null
  },
  subscription: {
    type: String,
    enum: ['free', 'silver', 'gold'],
    default: 'free'
  },
  subscriptionType: {
    type: String,
    enum: ['original', 'giftcode'],
    default: 'original'
  },
  subscriptionStartTime: {
    type: Date,
    default: Date.now
  },
  subscriptionEndTime: {
    type: Date,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ subscriptionStatus: 1 });
subscriptionSchema.index({ subscriptionEndTime: 1 });

// Method to check if subscription is expired
subscriptionSchema.methods.isExpired = function() {
  if (this.subscription === 'free') return false;
  if (!this.subscriptionEndTime) return false;
  return new Date() > this.subscriptionEndTime;
};

// Auto-update status based on expiry
subscriptionSchema.pre('save', function(next) {
  if (this.isExpired()) {
    this.subscriptionStatus = 'inactive';
    this.subscription = 'free';
  }
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);