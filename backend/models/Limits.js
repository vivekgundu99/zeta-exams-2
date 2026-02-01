const mongoose = require('mongoose');

const limitsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  subscription: {
    type: String,
    enum: ['free', 'silver', 'gold'],
    default: 'free'
  },
  questionCount: {
    type: Number,
    default: 0
  },
  chapterTestCount: {
    type: Number,
    default: 0
  },
  mockTestCount: {
    type: Number,
    default: 0
  },
  ticketCount: {
    type: Number,
    default: 0
  },
  questionCountLimitReached: {
    type: Boolean,
    default: false
  },
  chapterTestCountLimitReached: {
    type: Boolean,
    default: false
  },
  mockTestCountLimitReached: {
    type: Boolean,
    default: false
  },
  ticketCountLimitReached: {
    type: Boolean,
    default: false
  },
  limitResetTime: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
limitsSchema.index({ userId: 1 });
limitsSchema.index({ limitResetTime: 1 });

// Method to get limits based on subscription
limitsSchema.statics.getLimitsForSubscription = function(subscription) {
  const limits = {
    free: {
      questions: 20,
      chapterTests: 0,
      mockTests: 0,
      tickets: 0  // Free users cannot create tickets
    },
    silver: {
      questions: 200,
      chapterTests: 10,
      mockTests: 0,
      tickets: 1  // 1 ticket per day - FIXED: Daily reset
    },
    gold: {
      questions: 5000,
      chapterTests: 50,
      mockTests: 8,
      tickets: 1  // 1 ticket per day - FIXED: Daily reset
    }
  };
  return limits[subscription] || limits.free;
};

// Method to check if limit is reached
limitsSchema.methods.checkLimits = function() {
  const limits = this.constructor.getLimitsForSubscription(this.subscription);
  
  this.questionCountLimitReached = this.questionCount >= limits.questions;
  this.chapterTestCountLimitReached = this.chapterTestCount >= limits.chapterTests;
  this.mockTestCountLimitReached = this.mockTestCount >= limits.mockTests;
  this.ticketCountLimitReached = this.ticketCount >= limits.tickets;
  
  return {
    questions: {
      used: this.questionCount,
      limit: limits.questions,
      reached: this.questionCountLimitReached
    },
    chapterTests: {
      used: this.chapterTestCount,
      limit: limits.chapterTests,
      reached: this.chapterTestCountLimitReached
    },
    mockTests: {
      used: this.mockTestCount,
      limit: limits.mockTests,
      reached: this.mockTestCountLimitReached
    },
    tickets: {
      used: this.ticketCount,
      limit: limits.tickets,
      reached: this.ticketCountLimitReached
    }
  };
};

module.exports = mongoose.model('Limits', limitsSchema);