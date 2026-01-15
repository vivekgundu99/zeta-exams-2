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

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    const userData = await UserData.findOne({ userId: req.user.userId });
    const subscription = await Subscription.findOne({ userId: req.user.userId });
    const limits = await Limits.findOne({ userId: req.user.userId });

    if (!user || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Decrypt phone number
    const decryptedPhone = decryptPhone(user.phoneNumber);

    // Check limits
    const limitStatus = limits ? limits.checkLimits() : null;

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
      subscription: subscription ? {
        subscription: subscription.subscription,
        subscriptionType: subscription.subscriptionType,
        subscriptionStatus: subscription.subscriptionStatus,
        subscriptionStartTime: subscription.subscriptionStartTime,
        subscriptionEndTime: subscription.subscriptionEndTime,
        exam: subscription.exam
      } : null,
      limits: limitStatus
    });

  } catch (error) {
    console.error('Get profile error:', error);
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
router.post('/update-details', authenticate, validateUserDetails, async (req, res) => {
  try {
    const { name, profession, grade, exam, collegeName, state, lifeAmbition } = req.body;

    const userData = await UserData.findOne({ userId: req.user.userId });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    // Update user details
    userData.name = name;
    userData.profession = profession;
    userData.grade = profession === 'teacher' ? 'other' : grade;
    userData.exam = exam;
    userData.collegeName = collegeName;
    userData.state = state;
    userData.lifeAmbition = lifeAmbition;
    userData.userDetails = true;

    await userData.save();

    // Update subscription exam
    await Subscription.updateOne(
      { userId: req.user.userId },
      { exam }
    );

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
    console.error('Update details error:', error);
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
    const { name, profession, grade, collegeName, state, lifeAmbition } = req.body;

    const userData = await UserData.findOne({ userId: req.user.userId });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    // Update only provided fields
    if (name) userData.name = name;
    if (profession) userData.profession = profession;
    if (grade) userData.grade = profession === 'teacher' ? 'other' : grade;
    if (collegeName) userData.collegeName = collegeName;
    if (state) userData.state = state;
    if (lifeAmbition) userData.lifeAmbition = lifeAmbition;

    await userData.save();

    res.status(200).json({
      success: true,
      message: 'Details updated successfully',
      userData: {
        name: userData.name,
        profession: userData.profession,
        grade: userData.grade,
        collegeName: userData.collegeName,
        state: userData.state,
        lifeAmbition: userData.lifeAmbition
      }
    });

  } catch (error) {
    console.error('Edit details error:', error);
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

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
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

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });

  } catch (error) {
    console.error('Change password error:', error);
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
    const limits = await Limits.findOne({ userId: req.user.userId });

    if (!limits) {
      return res.status(404).json({
        success: false,
        message: 'Limits not found'
      });
    }

    const limitStatus = limits.checkLimits();

    res.status(200).json({
      success: true,
      limits: limitStatus,
      resetTime: limits.limitResetTime
    });

  } catch (error) {
    console.error('Get limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;