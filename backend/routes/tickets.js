// backend/routes/tickets.js - UPDATED: ALL USERS CAN CREATE TICKETS
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Subscription = require('../models/Subscription');
const UserData = require('../models/UserData');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { generateTicketNumber } = require('../utils/helpers');

// 🔥 UPDATED: Get user's tickets (ALL USERS)
router.get('/my-tickets', authenticate, async (req, res) => {
  try {
    console.log('📋 GET /my-tickets - User:', req.user.userId);

    const tickets = await Ticket.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    console.log('✅ Found tickets:', tickets.length);

    res.json({
      success: true,
      count: tickets.length,
      tickets
    });

  } catch (error) {
    console.error('💥 Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// 🔥 UPDATED: Create ticket (ALL USERS - 1 per day limit)
router.post('/create', authenticate, async (req, res) => {
  try {
    const { issue } = req.body;

    console.log('🎫 POST /create - User:', req.user.userId);

    // Validate issue
    if (!issue || issue.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Issue description is required'
      });
    }

    if (issue.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Issue must not exceed 150 characters'
      });
    }

    // 🔥 UPDATED: Check limits for ALL users (no subscription check)
    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      console.log('⚠️ Creating limits for user');
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription?.subscription || 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: require('../utils/helpers').getNextResetTime()
      });
    }

    // 🔥 ALL USERS: 1 ticket per day limit
    if (limits.ticketCountLimitReached) {
      return res.status(403).json({
        success: false,
        message: 'Daily ticket limit reached (1 ticket per day). Try again after limit reset at 4 AM IST.',
        ticketCount: limits.ticketCount,
        limit: 1
      });
    }

    // Check active tickets
    const activeTicket = await Ticket.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (activeTicket) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active ticket. Please wait for it to be resolved.',
        existingTicket: activeTicket.ticketNumber
      });
    }

    // Get user data
    const userData = await UserData.findOne({ userId: req.user.userId });
    const user = await require('../models/User').findOne({ userId: req.user.userId });

    if (!userData || !user) {
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    // Generate ticket number
    const ticketNumber = generateTicketNumber();

    // Create ticket
    const ticket = await Ticket.create({
      ticketNumber,
      userId: req.user.userId,
      userEmail: user.email,
      userName: userData.name || 'User',
      status: 'active',
      issue: issue.trim(),
      conversation: [
        {
          sender: 'user',
          message: issue.trim(),
          timestamp: new Date()
        }
      ],
      userMessageCount: 1,
      maxUserMessages: 10  // 🔥 ALL USERS: 10 messages limit
    });

    // 🔥 Increment ticket count
    limits.ticketCount += 1;
    
    // 🔥 ALL USERS: 1 ticket per day
    if (limits.ticketCount >= 1) {
      limits.ticketCountLimitReached = true;
    }
    
    await limits.save();

    // Update user data
    userData.ticketNumber = ticketNumber;
    userData.ticketStatus = 'active';
    await userData.save();

    console.log('✅ Ticket created:', ticketNumber);

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        issue: ticket.issue,
        userMessageCount: ticket.userMessageCount,
        maxUserMessages: ticket.maxUserMessages
      }
    });

  } catch (error) {
    console.error('💥 Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Add message to ticket (10 messages limit for ALL users)
router.post('/add-message', authenticate, async (req, res) => {
  try {
    const { ticketNumber, message } = req.body;

    console.log('💬 POST /add-message - Ticket:', ticketNumber);

    if (!ticketNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Ticket number and message are required'
      });
    }

    if (message.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Message must not exceed 150 characters'
      });
    }

    const ticket = await Ticket.findOne({ ticketNumber, userId: req.user.userId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add message to closed ticket'
      });
    }

    // Check message limit (10 for ALL users)
    if (ticket.userMessageCount >= ticket.maxUserMessages) {
      return res.status(403).json({
        success: false,
        message: `Maximum ${ticket.maxUserMessages} messages reached for this ticket`,
        userMessageCount: ticket.userMessageCount,
        maxUserMessages: ticket.maxUserMessages
      });
    }

    // Add message
    ticket.conversation.push({
      sender: 'user',
      message: message.trim(),
      timestamp: new Date()
    });

    ticket.userMessageCount += 1;
    await ticket.save();

    console.log('✅ Message added. Count:', ticket.userMessageCount);

    res.json({
      success: true,
      message: 'Message added successfully',
      ticket,
      messagesRemaining: ticket.maxUserMessages - ticket.userMessageCount
    });

  } catch (error) {
    console.error('💥 Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get ticket by number
router.get('/:ticketNumber', authenticate, async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findOne({
      ticketNumber,
      userId: req.user.userId
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;