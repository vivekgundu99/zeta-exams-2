const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserData = require('../models/UserData');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const OTP = require('../models/OTP');
const { encryptPhone } = require('../utils/encryption');
const { sendOTP } = require('../utils/email');
const { generateToken } = require('../utils/jwt');
const { generateOTP, generateUserId, getNextResetTime } = require('../utils/helpers');
const { validateRegistration, validateLogin, validateOTP } = require('../middleware/validator');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/auth/send-otp
// @desc    Send OTP for registration or password reset
// @access  Public
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email and purpose are required'
      });
    }

    // Check if email already exists (for registration)
    if (purpose === 'registration') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Check if email exists (for password reset)
    if (purpose === 'password-reset') {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Email not found'
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for this email and purpose
    await OTP.deleteMany({ email, purpose });

    // Save new OTP
    await OTP.create({
      email,
      otp,
      purpose,
      expiresAt
    });

    // Send OTP via email
    const emailResult = await sendOTP(email, otp, purpose);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user with OTP verification
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('📝 REGISTRATION REQUEST RECEIVED');
    const { email, phoneNumber, password, confirmPassword, otp } = req.body;

    // Validate required fields
    if (!email || !phoneNumber || !password || !confirmPassword || !otp) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    console.log('🔍 Verifying OTP for:', email);

    // Verify OTP
    const otpRecord = await OTP.findOne({ 
      email, 
      purpose: 'registration',
      isUsed: false
    });

    if (!otpRecord) {
      console.log('❌ OTP not found or already used');
      return res.status(400).json({
        success: false,
        message: 'OTP not found or already used'
      });
    }

    if (!otpRecord.isValid()) {
      console.log('❌ OTP expired or invalid');
      return res.status(400).json({
        success: false,
        message: 'OTP expired or invalid'
      });
    }

    if (otpRecord.otp !== otp) {
      console.log('❌ Invalid OTP');
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: 5 - otpRecord.attempts
      });
    }

    console.log('✅ OTP verified successfully');

    // Check if user already exists
    const encryptedPhone = encryptPhone(phoneNumber);
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber: encryptedPhone }] 
    });

    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone number'
      });
    }

    console.log('👤 Creating user...');

    // Generate userId
    const userId = generateUserId();

    // Create user
    const user = await User.create({
      userId,
      email,
      phoneNumber: encryptedPhone,
      loginStatus: false,
      lastLoginTime: null
    });

    console.log('✅ User created:', userId);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data
    await UserData.create({
      userId,
      password: hashedPassword,
      userDetails: false,
      exam: null
    });

    console.log('✅ User data created');

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    console.log('✅ OTP marked as used');

    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = generateToken(userId, email, false);
    console.log('✅ JWT token generated');

    console.log('🎉 Registration completed successfully!');

    // Return success response - No subscription or limits creation
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        userId,
        email,
        phoneNumber,
        userDetails: false
      }
    });

  } catch (error) {
    console.error('💥 REGISTRATION ERROR:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    User login (handles both admin and regular users)
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, phoneNumber, password, isAdmin } = req.body;

    console.log('Login attempt:', { email, isAdmin });

    // Admin login
    if (isAdmin) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD || 'Zeta@123';

      console.log('Admin login attempt - Checking credentials...');

      if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }

      console.log('Admin credentials valid - generating token');

      // Generate admin token
      const token = generateToken('ADMIN', email, true);

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token,
        isAdmin: true,
        user: {
          userId: 'ADMIN',
          email: email,
          isAdmin: true
        }
      });
    }

    // Regular user login
    console.log('Regular user login attempt');

    if (!email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone number, and password are required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get user data
    const userData = await UserData.findOne({ userId: user.userId });

    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'User data not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if already logged in
    if (user.loginStatus) {
      return res.status(400).json({
        success: false,
        message: 'Already logged in from another device',
        code: 'ALREADY_LOGGED_IN'
      });
    }

    // Update login status
    user.loginStatus = true;
    user.lastLoginTime = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user.userId, user.email, false);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      isAdmin: false,
      user: {
        userId: user.userId,
        email: user.email,
        userDetails: userData.userDetails,
        exam: userData.exam
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    User logout
// @access  Private
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    }

    const token = authHeader.split(' ')[1];
    const { verifyToken } = require('../utils/jwt');
    
    try {
      const decoded = verifyToken(token);

      // Skip for admin
      if (decoded.isAdmin) {
        return res.status(200).json({
          success: true,
          message: 'Logout successful'
        });
      }

      // Update login status for regular users
      await User.updateOne(
        { userId: decoded.userId },
        { loginStatus: false }
      );
    } catch (err) {
      // Token invalid or expired, still return success
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }
});

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices
// @access  Public
router.post('/logout-all', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.loginStatus = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ 
      email, 
      purpose: 'password-reset',
      isUsed: false
    });

    if (!otpRecord || !otpRecord.isValid() || otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserData.updateOne(
      { userId: user.userId },
      { password: hashedPassword }
    );

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Logout from all devices
    user.loginStatus = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;