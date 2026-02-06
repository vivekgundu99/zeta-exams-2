// backend/routes/adminWallet.js - ADMIN WALLET ROUTES
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middleware/auth');

// All admin wallet routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// @route   GET /api/admin/wallet/topups
// @desc    Get all wallet top-ups (for admin dashboard)
// @access  Admin
router.get('/topups', async (req, res) => {
  try {
    console.log('💰 Admin: Loading all wallet top-ups');

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all wallets with transactions
    const wallets = await Wallet.find({ 'transactions.0': { $exists: true } })
      .select('userId balance transactions')
      .lean();

    // Extract all top-up transactions
    const allTopups = [];
    
    for (const wallet of wallets) {
      const topups = wallet.transactions.filter(t => t.type === 'topup');
      
      for (const topup of topups) {
        allTopups.push({
          userId: wallet.userId,
          amount: topup.amount,
          razorpayOrderId: topup.razorpayOrderId,
          razorpayPaymentId: topup.razorpayPaymentId,
          timestamp: topup.timestamp
        });
      }
    }

    // Sort by timestamp (newest first)
    allTopups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const paginatedTopups = allTopups.slice(skip, skip + parseInt(limit));

    // Get user details for each top-up
    const topupsWithUserDetails = await Promise.all(
      paginatedTopups.map(async (topup) => {
        const user = await User.findOne({ userId: topup.userId })
          .select('email')
          .lean();
        
        return {
          ...topup,
          userEmail: user?.email || 'Unknown'
        };
      })
    );

    // Calculate total wallet money in system
    const totalWalletMoney = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

    console.log('✅ Admin: Loaded top-ups:', {
      total: allTopups.length,
      page: parseInt(page),
      totalWalletMoney
    });

    res.json({
      success: true,
      topups: topupsWithUserDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allTopups.length / parseInt(limit)),
        total: allTopups.length
      },
      stats: {
        totalWalletMoney,
        totalTopups: allTopups.length,
        totalTopupAmount: allTopups.reduce((sum, t) => sum + t.amount, 0)
      }
    });

  } catch (error) {
    console.error('💥 Admin get top-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/wallet/user/:userId
// @desc    Get specific user's wallet details
// @access  Admin
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('💰 Admin: Loading wallet for user:', userId);

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for this user'
      });
    }

    const user = await User.findOne({ userId }).select('email').lean();

    res.json({
      success: true,
      wallet: {
        userId: wallet.userId,
        userEmail: user?.email || 'Unknown',
        balance: wallet.balance,
        transactions: wallet.transactions,
        lastUpdated: wallet.lastUpdated
      }
    });

  } catch (error) {
    console.error('💥 Admin get user wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/wallet/add-money
// @desc    Admin manually adds money to user wallet
// @access  Admin
router.post('/add-money', async (req, res) => {
  try {
    const { userId, amount, note } = req.body;

    console.log('💰 Admin: Adding money to wallet:', { userId, amount });

    // Validate
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and positive amount required'
      });
    }

    // Get or create wallet
    const wallet = await Wallet.getOrCreateWallet(userId);

    // Add money
    await wallet.adminAddMoney(amount, note);

    console.log('✅ Admin: Money added successfully:', {
      userId,
      amount,
      newBalance: wallet.balance
    });

    res.json({
      success: true,
      message: `₹${amount} added to wallet successfully`,
      wallet: {
        userId: wallet.userId,
        balance: wallet.balance
      }
    });

  } catch (error) {
    console.error('💥 Admin add money error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add money',
      error: error.message
    });
  }
});

// @route   POST /api/admin/wallet/deduct-money
// @desc    Admin manually deducts money from user wallet
// @access  Admin
router.post('/deduct-money', async (req, res) => {
  try {
    const { userId, amount, note } = req.body;

    console.log('💰 Admin: Deducting money from wallet:', { userId, amount });

    // Validate
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and positive amount required'
      });
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for this user'
      });
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${wallet.balance}`,
        available: wallet.balance,
        required: amount
      });
    }

    // Deduct money
    await wallet.adminDeductMoney(amount, note);

    console.log('✅ Admin: Money deducted successfully:', {
      userId,
      amount,
      newBalance: wallet.balance
    });

    res.json({
      success: true,
      message: `₹${amount} deducted from wallet successfully`,
      wallet: {
        userId: wallet.userId,
        balance: wallet.balance
      }
    });

  } catch (error) {
    console.error('💥 Admin deduct money error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deduct money',
      error: error.message
    });
  }
});

// @route   GET /api/admin/wallet/stats
// @desc    Get wallet system statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    console.log('💰 Admin: Loading wallet stats');

    const wallets = await Wallet.find().lean();

    const stats = {
      totalWallets: wallets.length,
      totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
      walletsWithBalance: wallets.filter(w => w.balance > 0).length,
      averageBalance: wallets.length > 0 
        ? (wallets.reduce((sum, w) => sum + w.balance, 0) / wallets.length).toFixed(2)
        : 0,
      totalTransactions: wallets.reduce((sum, w) => sum + w.transactions.length, 0),
      topUsers: wallets
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10)
        .map(w => ({ userId: w.userId, balance: w.balance }))
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('💥 Admin get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;