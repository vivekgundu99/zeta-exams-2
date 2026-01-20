// backend/routes/user.js - FIXED VERSION WITH PROPER LIMITS
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

// @route   GET /api/user/profile
// @desc    Get user profile with subscription and limits
// @access  Private
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

    // FIX: Create subscription if doesn't exist
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

    // FIX: Create limits if doesn't exist
    if (!limits) {
      console.log('⚠️ Creating missing limits for user');
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription.subscription,
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        questionCountLimitReached: false,
        chapterTestCountLimitReached: false,
        mockTestCountLimitReached: false,
        limitResetTime: getNextResetTime()
      });
    }

    // FIX: Check and reset limits if needed
    if (needsLimitReset(limits.limitResetTime)) {
      console.log('🔄 Resetting limits - time passed');
      limits.questionCount = 0;
      limits.chapterTestCount = 0;
      limits.mockTestCount = 0;
      limits.questionCountLimitReached = false;
      limits.chapterTestCountLimitReached = false;
      limits.mockTestCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
    }

    // FIX: Sync limits subscription with actual subscription
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

    console.log('✅ Profile fetched successfully with limits:', limitStatus);

    res.status(200).json({
      success: true,
      user: {
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
      },
      subscription: {
        userId: subscription.userId,
        exam: subscription.exam,
        subscription: subscription.subscription,
        subscriptionType: subscription.subscriptionType,
        subscriptionStatus: subscription.subscriptionStatus,
        subscriptionStartTime: subscription.subscriptionStartTime,
        subscriptionEndTime: subscription.subscriptionEndTime
      },
      limits: limitStatus
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

// @route   POST /api/user/update-details
// @desc    Update user details (first time setup)
// @access  Private
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

    // CREATE OR UPDATE SUBSCRIPTION
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

    // CREATE OR UPDATE LIMITS
    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
      console.log('✅ Limits created');
    }

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

// @route   PUT /api/user/edit-details
// @desc    Edit existing user details
// @access  Private
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

// @route   POST /api/user/change-password
// @desc    Change password
// @access  Private
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

// @route   GET /api/user/limits
// @desc    Get current usage limits
// @access  Private
router.get('/limits', authenticate, async (req, res) => {
  try {
    console.log('📊 GET /api/user/limits - User:', req.user.userId);

    let limits = await Limits.findOne({ userId: req.user.userId });

    // FIX: Create limits if doesn't exist
    if (!limits) {
      console.log('⚠️ Creating missing limits for user');
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription?.subscription || 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        questionCountLimitReached: false,
        chapterTestCountLimitReached: false,
        mockTestCountLimitReached: false,
        limitResetTime: getNextResetTime()
      });
    }

    // Check and reset if needed
    if (needsLimitReset(limits.limitResetTime)) {
      console.log('🔄 Resetting limits');
      limits.questionCount = 0;
      limits.chapterTestCount = 0;
      limits.mockTestCount = 0;
      limits.questionCountLimitReached = false;
      limits.chapterTestCountLimitReached = false;
      limits.mockTestCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
    }

    const limitStatus = limits.checkLimits();

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

module.exports = router;