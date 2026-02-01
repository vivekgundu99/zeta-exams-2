// backend/middleware/limitsReset.js - PERFORMANCE OPTIMIZED
const Limits = require('../models/Limits');
const { getNextResetTime, needsLimitReset } = require('../utils/helpers');
const cacheService = require('../services/cacheService');

// 🔥 PERFORMANCE: In-memory cache of checked users (1 minute TTL)
const checkedUsers = new Map();
const CHECK_CACHE_TTL = 60000; // 1 minute

// 🔥 PERFORMANCE: Clean cache every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamp] of checkedUsers.entries()) {
    if (now - timestamp > CHECK_CACHE_TTL) {
      checkedUsers.delete(userId);
    }
  }
}, 120000);

// 🔥 OPTIMIZED: Auto-reset limits middleware (only checks once per minute per user)
const autoResetLimits = async (req, res, next) => {
  try {
    // Only run for authenticated users
    if (!req.user || req.user.isAdmin) {
      return next();
    }

    const userId = req.user.userId;
    
    // 🔥 PERFORMANCE: Skip if checked recently (within 1 minute)
    const lastCheck = checkedUsers.get(userId);
    if (lastCheck && Date.now() - lastCheck < CHECK_CACHE_TTL) {
      return next();
    }
    
    // 🔥 PERFORMANCE: Try Redis cache first
    const cachedLimits = await cacheService.getLimits(userId);
    
    let limits;
    if (cachedLimits) {
      // Check if reset is needed using cached data
      if (!needsLimitReset(cachedLimits.resetTime)) {
        checkedUsers.set(userId, Date.now());
        return next();
      }
      
      // Reset needed - fetch from DB
      limits = await Limits.findOne({ userId }).lean();
    } else {
      // Cache miss - fetch from DB
      limits = await Limits.findOne({ userId }).lean();
    }
    
    if (!limits) {
      checkedUsers.set(userId, Date.now());
      return next(); // No limits found, will be created later
    }

    // Check if reset is needed
    if (needsLimitReset(limits.limitResetTime)) {
      console.log(`🔄 Auto-resetting limits for user: ${userId}`);
      
      // Reset all limits
      await Limits.updateOne(
        { userId },
        {
          $set: {
            questionCount: 0,
            chapterTestCount: 0,
            mockTestCount: 0,
            ticketCount: 0,
            questionCountLimitReached: false,
            chapterTestCountLimitReached: false,
            mockTestCountLimitReached: false,
            ticketCountLimitReached: false,
            limitResetTime: getNextResetTime(),
            lastUpdated: new Date()
          }
        }
      );
      
      // 🔥 Invalidate cache
      await cacheService.invalidateLimits(userId);
      
      console.log(`✅ Limits reset successfully for user: ${userId}`);
    }
    
    // 🔥 Mark as checked
    checkedUsers.set(userId, Date.now());
    
    next();
  } catch (error) {
    console.error('❌ Auto-reset limits error:', error);
    // Don't block the request even if reset fails
    next();
  }
};

// 🔥 OPTIMIZED: Reset all limits at 4 AM IST
const resetAllLimitsDaily = async () => {
  try {
    console.log('🕐 Running daily limits reset at 4 AM IST...');
    
    const now = new Date();
    
    // Update all limits that need reset
    const result = await Limits.updateMany(
      { limitResetTime: { $lte: now } },
      {
        $set: {
          questionCount: 0,
          chapterTestCount: 0,
          mockTestCount: 0,
          ticketCount: 0,
          questionCountLimitReached: false,
          chapterTestCountLimitReached: false,
          mockTestCountLimitReached: false,
          ticketCountLimitReached: false,
          limitResetTime: getNextResetTime(),
          lastUpdated: now
        }
      }
    );
    
    // 🔥 PERFORMANCE: Clear all limits cache after daily reset
    if (cacheService.isAvailable()) {
      try {
        // Get all keys matching limits:*
        const keys = await cacheService.redis.keys('limits:*');
        if (keys.length > 0) {
          await cacheService.redis.del(...keys);
          console.log(`🗑️ Cleared ${keys.length} limits cache entries`);
        }
      } catch (error) {
        console.error('Cache clear error:', error);
      }
    }
    
    console.log(`✅ Daily limits reset complete. Updated ${result.modifiedCount} users.`);
  } catch (error) {
    console.error('❌ Daily limits reset error:', error);
  }
};

// Schedule daily reset at 4 AM IST
const scheduleDailyReset = () => {
  const checkAndReset = () => {
    const now = new Date();
    
    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    const istHours = istTime.getUTCHours();
    const istMinutes = istTime.getUTCMinutes();
    
    // Run at 4:00 AM IST (allow 4:00-4:05 window)
    if (istHours === 4 && istMinutes < 5) {
      resetAllLimitsDaily();
    }
  };
  
  // Check every minute
  setInterval(checkAndReset, 60 * 1000);
  
  console.log('✅ Daily limits reset scheduler started (4 AM IST)');
};

module.exports = {
  autoResetLimits,
  resetAllLimitsDaily,
  scheduleDailyReset
};