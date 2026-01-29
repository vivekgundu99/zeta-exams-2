// backend/models/Subscription.js - COMPREHENSIVE SUBSCRIPTION MANAGEMENT
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
  },
  // 🔥 NEW: Track previous subscription for downgrade reference
  previousSubscription: {
    type: String,
    enum: ['free', 'silver', 'gold'],
    default: null
  },
  previousSubscriptionType: {
    type: String,
    enum: ['original', 'giftcode'],
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ subscriptionStatus: 1 });
subscriptionSchema.index({ subscriptionEndTime: 1 });

// 🔥 CRITICAL: Check if subscription is expired
subscriptionSchema.methods.isExpired = function() {
  // Free plan never expires
  if (this.subscription === 'free') return false;
  
  // No end time = never expires (shouldn't happen but safety check)
  if (!this.subscriptionEndTime) return false;
  
  // Check if current time is past expiration
  return new Date() > this.subscriptionEndTime;
};

// 🔥 CRITICAL: Auto-downgrade to free when expired
subscriptionSchema.pre('save', async function(next) {
  try {
    // Only process if subscription is not free
    if (this.subscription !== 'free') {
      // Check if expired
      if (this.isExpired()) {
        console.log(`⚠️ Subscription expired for user ${this.userId}`);
        console.log(`   Previous: ${this.subscription} (${this.subscriptionType})`);
        
        // Store previous subscription info
        this.previousSubscription = this.subscription;
        this.previousSubscriptionType = this.subscriptionType;
        
        // Downgrade to free
        this.subscription = 'free';
        this.subscriptionType = 'original';
        this.subscriptionStatus = 'inactive';
        this.subscriptionEndTime = null;
        
        console.log(`   ✅ Auto-downgraded to FREE`);
        
        // 🔥 CRITICAL: Also update limits
        const Limits = require('./Limits');
        await Limits.updateOne(
          { userId: this.userId },
          { 
            subscription: 'free',
            $set: {
              questionCount: 0,
              chapterTestCount: 0,
              mockTestCount: 0,
              ticketCount: 0,
              questionCountLimitReached: false,
              chapterTestCountLimitReached: false,
              mockTestCountLimitReached: false,
              ticketCountLimitReached: false
            }
          }
        );
        
        console.log(`   ✅ Limits reset to FREE tier`);
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Auto-downgrade error:', error);
    next(error);
  }
});

// 🔥 NEW: Method to upgrade subscription
subscriptionSchema.methods.upgradeTo = async function(newPlan, duration, type = 'original') {
  const now = new Date();
  
  // Store previous subscription
  this.previousSubscription = this.subscription;
  this.previousSubscriptionType = this.subscriptionType;
  
  // Calculate end date
  let endDate = new Date(now);
  switch(duration) {
    case '1month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '6months':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case '1year':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  
  // Update subscription
  this.subscription = newPlan;
  this.subscriptionType = type;
  this.subscriptionStatus = 'active';
  this.subscriptionStartTime = now;
  this.subscriptionEndTime = endDate;
  
  await this.save();
  
  // 🔥 CRITICAL: Update limits to match new subscription
  const Limits = require('./Limits');
  await Limits.updateOne(
    { userId: this.userId },
    { 
      subscription: newPlan,
      $set: {
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        questionCountLimitReached: false,
        chapterTestCountLimitReached: false,
        mockTestCountLimitReached: false,
        ticketCountLimitReached: false
      }
    }
  );
  
  console.log(`✅ Upgraded ${this.userId} to ${newPlan.toUpperCase()} (${type})`);
  console.log(`   Valid until: ${endDate.toISOString()}`);
  
  return this;
};

// 🔥 NEW: Static method to check and expire subscriptions (for cron job)
subscriptionSchema.statics.checkAndExpireAll = async function() {
  try {
    console.log('🔄 Checking expired subscriptions...');
    
    const now = new Date();
    
    // Find all expired paid subscriptions
    const expiredSubs = await this.find({
      subscription: { $in: ['silver', 'gold'] },
      subscriptionEndTime: { $lte: now },
      subscriptionStatus: 'active'
    });
    
    if (expiredSubs.length === 0) {
      console.log('✅ No expired subscriptions found');
      return { expired: 0 };
    }
    
    console.log(`⚠️ Found ${expiredSubs.length} expired subscriptions`);
    
    let expiredCount = 0;
    const Limits = require('./Limits');
    
    for (const sub of expiredSubs) {
      console.log(`   Expiring: ${sub.userId} - ${sub.subscription}`);
      
      // Store previous
      sub.previousSubscription = sub.subscription;
      sub.previousSubscriptionType = sub.subscriptionType;
      
      // Downgrade to free
      sub.subscription = 'free';
      sub.subscriptionType = 'original';
      sub.subscriptionStatus = 'inactive';
      sub.subscriptionEndTime = null;
      
      await sub.save();
      
      // Reset limits
      await Limits.updateOne(
        { userId: sub.userId },
        { 
          subscription: 'free',
          $set: {
            questionCount: 0,
            chapterTestCount: 0,
            mockTestCount: 0,
            ticketCount: 0,
            questionCountLimitReached: false,
            chapterTestCountLimitReached: false,
            mockTestCountLimitReached: false,
            ticketCountLimitReached: false
          }
        }
      );
      
      expiredCount++;
    }
    
    console.log(`✅ Expired ${expiredCount} subscriptions`);
    return { expired: expiredCount };
    
  } catch (error) {
    console.error('❌ Expire subscriptions error:', error);
    throw error;
  }
};

module.exports = mongoose.model('Subscription', subscriptionSchema);