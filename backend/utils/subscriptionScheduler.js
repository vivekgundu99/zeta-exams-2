// backend/utils/subscriptionScheduler.js - AUTO-EXPIRE SUBSCRIPTIONS
const Subscription = require('../models/Subscription');

// 🔥 Run every hour to check for expired subscriptions
const scheduleSubscriptionExpiry = () => {
  const checkExpiredSubscriptions = async () => {
    try {
      console.log('');
      console.log('⏰ ==========================================');
      console.log('⏰ CHECKING EXPIRED SUBSCRIPTIONS');
      console.log('⏰ Time:', new Date().toISOString());
      console.log('⏰ ==========================================');
      
      const result = await Subscription.checkAndExpireAll();
      
      if (result.expired > 0) {
        console.log(`✅ Expired ${result.expired} subscription(s)`);
      } else {
        console.log('✅ No subscriptions to expire');
      }
      
      console.log('⏰ ==========================================');
      console.log('');
    } catch (error) {
      console.error('❌ Subscription expiry check error:', error);
    }
  };
  
  // Run immediately on startup
  setTimeout(checkExpiredSubscriptions, 5000);
  
  // Then run every hour (3600000 ms)
  setInterval(checkExpiredSubscriptions, 60 * 60 * 1000);
  
  console.log('✅ Subscription expiry scheduler started (runs every hour)');
};

module.exports = {
  scheduleSubscriptionExpiry
};