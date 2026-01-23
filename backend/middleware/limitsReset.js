// backend/middleware/limitsReset.js - NEW FILE
const Limits = require('../models/Limits');
const { getNextResetTime, needsLimitReset } = require('../utils/helpers');

// 🔥 CRITICAL: Auto-reset limits middleware
const autoResetLimits = async (req, res, next) => {
  try {
    // Only run for authenticated users
    if (!req.user || req.user.isAdmin) {
      return next();
    }

    const userId = req.user.userId;
    
    // Find user's limits
    let limits = await Limits.findOne({ userId });
    
    if (!limits) {
      return next(); // No limits found, will be created later
    }

    // Check if reset is needed
    if (needsLimitReset(limits.limitResetTime)) {
      console.log(`🔄 Auto-resetting limits for user: ${userId}`);
      
      // Reset all limits
      limits.questionCount = 0;
      limits.chapterTestCount = 0;
      limits.mockTestCount = 0;
      limits.ticketCount = 0;
      limits.questionCountLimitReached = false;
      limits.chapterTestCountLimitReached = false;
      limits.mockTestCountLimitReached = false;
      limits.ticketCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      limits.lastUpdated = new Date();
      
      await limits.save();
      
      console.log(`✅ Limits reset successfully for user: ${userId}`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Auto-reset limits error:', error);
    // Don't block the request even if reset fails
    next();
  }
};

// 🔥 CRON JOB: Reset all limits at 4 AM IST
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