// backend/routes/user.js - COMPREHENSIVE SUBSCRIPTION FIX
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserData = require('../models/UserData');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { validateUserDetails } = require('../middleware/validator');
const { decryptPhone } = require('../utils/encryption');
const { needsLimitReset, getNextResetTime } = require('../utils/helpers');
const cacheService = require('../services/cacheService');

// 🔥 COMPREHENSIVE FIX: Get profile with subscription initialization
router.get('/profile', authenticate, async (req, res) => {
  try {
    console.log('📊 GET /api/user/profile - User:', req.user.userId);

    // Handle admin profile request
    if (req.user.isAdmin) {
      console.log('👑 Admin profile request');
      return res.json({
        success: true,
        user: {
          userId: 'ADMIN',
          email: req.user.email,
          name: 'Admin',
          isAdmin: true,
          userDetails: true,
          exam: null
        },
        subscription: null,
        limits: null
      });
    }

    // 🔥 ALWAYS FETCH FRESH DATA - NO CACHE for subscription
    console.log('⚠️ Fetching fresh data from database');

    const user = await User.findOne({ userId: req.user.userId });
    const userData = await UserData.findOne({ userId: req.user.userId });
    let subscription = await Subscription.findOne({ userId: req.user.userId });
    let limits = await Limits.findOne({ userId: req.user.userId });

    if (!user || !userData) {
      console.log('❌ User or UserData not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create subscription if doesn't exist
    if (!subscription) {
      console.log('⚠️ Creating missing subscription for user');
      subscription = await Subscription.create({
        userId: req.user.userId,
        exam: userData.exam || null,
        subscription: 'free',
        subscriptionType: 'original',
        subscriptionStartTime: new Date(),
        subscriptionEndTime: null,
        subscriptionStatus: 'active'
      });
    }

    // 🔥 CRITICAL: Check expiry EVERY time (no caching)
    if (subscription.subscription !== 'free') {
      const isExpired = subscription.isExpired();
      
      if (isExpired && subscription.subscriptionStatus === 'active') {
        console.log('⚠️ Subscription expired - Auto-downgrading to FREE');
        
        subscription.subscription = 'free';
        subscription.subscriptionType = 'original';
        subscription.subscriptionStatus = 'inactive';
        subscription.subscriptionEndTime = null;
        
        await subscription.save();
        
        console.log('✅ Auto-downgraded to FREE');
      }
    }

    // Create limits if doesn't exist
    if (!limits) {
      console.log('⚠️ Creating missing limits for user');
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription.subscription,
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
    }

    // Auto-reset limits if needed
    if (needsLimitReset(limits.limitResetTime)) {
      console.log('🔄 Auto-resetting limits - time passed');
      limits.questionCount = 0;
      limits.chapterTestCount = 0;
      limits.mockTestCount = 0;
      limits.ticketCount = 0;
      limits.questionCountLimitReached = false;
      limits.chapterTestCountLimitReached = false;
      limits.mockTestCountLimitReached = false;
      limits.ticketCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
      console.log('✅ Limits auto-reset completed');
    }

    // Sync limits subscription
    if (limits.subscription !== subscription.subscription) {
      console.log('🔄 Syncing limits subscription:', subscription.subscription);
      limits.subscription = subscription.subscription;
      await limits.save();
    }

    // Decrypt phone number
    let decryptedPhone = user.phoneNumber;
    try {
      decryptedPhone = decryptPhone(user.phoneNumber);
    } catch (error) {
      console.error('⚠️ Phone decryption error:', error);
    }

    // Check limits status
    const limitStatus = limits.checkLimits();

    const userProfile = {
      userId: user.userId,
      email: user.email,
      phoneNumber: decryptedPhone,
      name: userData.name,
      profession: userData.profession,
      grade: userData.grade,
      exam: userData.exam,
      collegeName: userData.collegeName,
      state: userData.state,
      lifeAmbition: userData.lifeAmbition,
      userDetails: userData.userDetails,
      lastLoginTime: user.lastLoginTime
    };

    const subscriptionData = {
      userId: subscription.userId,
      exam: subscription.exam,
      subscription: subscription.subscription,
      subscriptionType: subscription.subscriptionType,
      subscriptionStatus: subscription.subscriptionStatus,
      subscriptionStartTime: subscription.subscriptionStartTime,
      subscriptionEndTime: subscription.subscriptionEndTime
    };

    const limitsData = {
      limits: limitStatus,
      resetTime: limits.limitResetTime
    };

    // 🔥 ONLY cache user profile and limits, NOT subscription
    await Promise.all([
      cacheService.setUserProfile(req.user.userId, userProfile, 1800),
      cacheService.setLimits(req.user.userId, limitsData, 600) // Shorter cache for limits
    ]);

    console.log('✅ Profile data prepared (subscription not cached)');

    res.status(200).json({
      success: true,
      user: userProfile,
      subscription: subscriptionData,
      limits: limitStatus,
      resetTime: limits.limitResetTime
    });

  } catch (error) {
    console.error('💥 Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// 🔥 FIX: Update user details with subscription sync
router.post('/update-details', authenticate, async (req, res) => {
  try {
    const { name, profession, grade, exam, collegeName, state, lifeAmbition } = req.body;

    console.log('📝 POST /api/user/update-details');
    console.log('User:', req.user.userId);

    // Validate
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!profession || !['student', 'teacher'].includes(profession)) {
      return res.status(400).json({
        success: false,
        message: 'Valid profession is required'
      });
    }

    if (!exam || !['jee', 'neet'].includes(exam)) {
      return res.status(400).json({
        success: false,
        message: 'Valid exam type is required'
      });
    }

    if (profession === 'student' && !grade) {
      return res.status(400).json({
        success: false,
        message: 'Grade is required for students'
      });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: 'State is required'
      });
    }

    const userData = await UserData.findOne({ userId: req.user.userId });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    // Update user details
    userData.name = name.trim();
    userData.profession = profession;
    userData.grade = profession === 'teacher' ? 'other' : (grade || 'other');
    userData.exam = exam;
    userData.collegeName = collegeName ? collegeName.trim() : null;
    userData.state = state.trim();
    userData.lifeAmbition = lifeAmbition ? lifeAmbition.trim() : null;
    userData.userDetails = true;

    await userData.save();

    // 🔥 CREATE OR UPDATE SUBSCRIPTION (ensuring it exists)
    let subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.user.userId,
        exam: exam,
        subscription: 'free',
        subscriptionType: 'original',
        subscriptionStartTime: new Date(),
        subscriptionEndTime: null,
        subscriptionStatus: 'active'
      });
      console.log('✅ Subscription created');
    } else {
      subscription.exam = exam;
      await subscription.save();
      console.log('✅ Subscription updated');
    }

    // 🔥 CREATE OR UPDATE LIMITS (ensuring it exists)
    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription.subscription,
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
      console.log('✅ Limits created');
    }

    // 🔥 INVALIDATE CACHE
    await cacheService.invalidateUserCache(req.user.userId);
    console.log('✅ Cache invalidated after profile update');

    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
      userData: {
        name: userData.name,
        profession: userData.profession,
        grade: userData.grade,
        exam: userData.exam,
        collegeName: userData.collegeName,
        state: userData.state,
        lifeAmbition: userData.lifeAmbition,
        userDetails: userData.userDetails
      }
    });

  } catch (error) {
    console.error('💥 Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Edit existing user details
router.put('/edit-details', authenticate, async (req, res) => {
  try {
    const { name, profession, grade, exam, collegeName, state, lifeAmbition } = req.body;

    console.log('✏️ PUT /api/user/edit-details - User:', req.user.userId);

    const userData = await UserData.findOne({ userId: req.user.userId });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    // Update only provided fields
    if (name) userData.name = name.trim();
    if (profession) userData.profession = profession;
    if (grade) userData.grade = profession === 'teacher' ? 'other' : grade;
    if (exam) userData.exam = exam;
    if (collegeName !== undefined) userData.collegeName = collegeName ? collegeName.trim() : null;
    if (state) userData.state = state;
    if (lifeAmbition !== undefined) userData.lifeAmbition = lifeAmbition ? lifeAmbition.trim() : null;

    await userData.save();

    // Update subscription exam if changed
    if (exam) {
      await Subscription.updateOne(
        { userId: req.user.userId },
        { exam: exam }
      );
    }

    // 🔥 INVALIDATE CACHE
    await cacheService.invalidateUserCache(req.user.userId);
    console.log('✅ Cache invalidated after details edit');

    console.log('✅ Details updated successfully');

    res.status(200).json({
      success: true,
      message: 'Details updated successfully',
      userData: {
        name: userData.name,
        profession: userData.profession,
        grade: userData.grade,
        exam: userData.exam,
        collegeName: userData.collegeName,
        state: userData.state,
        lifeAmbition: userData.lifeAmbition
      }
    });

  } catch (error) {
    console.error('💥 Edit details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log('🔐 POST /api/user/change-password - User:', req.user.userId);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const userData = await UserData.findOne({ userId: req.user.userId });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, userData.password);

    if (!isPasswordValid) {
      console.log('❌ Current password incorrect');
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userData.password = hashedPassword;
    await userData.save();

    // Logout from all devices
    await User.updateOne(
      { userId: req.user.userId },
      { loginStatus: false }
    );

    console.log('✅ Password changed successfully');

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });

  } catch (error) {
    console.error('💥 Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get current usage limits
router.get('/limits', authenticate, async (req, res) => {
  try {
    console.log('📊 GET /api/user/limits - User:', req.user.userId);

    const cachedLimits = await cacheService.getLimits(req.user.userId);
    
    if (cachedLimits && !needsLimitReset(cachedLimits.resetTime)) {
      console.log('✅ Serving limits from cache');
      return res.status(200).json({
        success: true,
        limits: cachedLimits.limits,
        resetTime: cachedLimits.resetTime
      });
    }

    console.log('⚠️ Cache miss - fetching limits from database');

    let limits = await Limits.findOne({ userId: req.user.userId });
    const subscription = await Subscription.findOne({ userId: req.user.userId });

    if (!limits) {
      console.log('⚠️ Creating missing limits for user');
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription?.subscription || 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
    }

    if (needsLimitReset(limits.limitResetTime)) {
      console.log('🔄 Auto-resetting limits for user:', req.user.userId);
      
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
      console.log('✅ Limits reset successfully');
    }

    if (limits.subscription !== subscription?.subscription) {
      console.log('🔄 Syncing limits subscription:', subscription?.subscription);
      limits.subscription = subscription?.subscription || 'free';
      await limits.save();
    }

    const limitStatus = limits.checkLimits();

    const limitsData = {
      limits: limitStatus,
      resetTime: limits.limitResetTime
    };
    await cacheService.setLimits(req.user.userId, limitsData, 3600);
    console.log('✅ Limits cached successfully');

    res.status(200).json({
      success: true,
      limits: limitStatus,
      resetTime: limits.limitResetTime
    });

  } catch (error) {
    console.error('💥 Get limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Check and reset limits
router.post('/check-and-reset-limits', authenticate, async (req, res) => {
  try {
    console.log('🔄 Checking limits reset for user:', req.user.userId);

    if (req.user.isAdmin) {
      return res.json({ success: true, message: 'Admin has no limits' });
    }

    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription?.subscription || 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
      
      console.log('✅ New limits created for user');
      return res.json({ success: true, reset: false, message: 'Limits created' });
    }

    if (needsLimitReset(limits.limitResetTime)) {
      console.log('🔄 Resetting limits - time passed');
      
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

      await cacheService.invalidateLimits(req.user.userId);
      console.log('✅ Cache invalidated after limits reset');
      
      console.log('✅ Limits reset successfully');
      
      return res.json({ 
        success: true, 
        reset: true, 
        message: 'Limits reset successfully',
        nextReset: limits.limitResetTime
      });
    }

    console.log('⏳ No reset needed yet');
    
    return res.json({ 
      success: true, 
      reset: false, 
      message: 'No reset needed',
      nextReset: limits.limitResetTime
    });

  } catch (error) {
    console.error('❌ Check and reset limits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check limits',
      error: error.message
    });
  }
});

module.exports = router;