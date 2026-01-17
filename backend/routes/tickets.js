'use client';

const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const UserData = require('../models/UserData');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Limits = require('../models/Limits');
const { authenticate } = require('../middleware/auth');
const { generateTicketNumber, needsLimitReset, getNextResetTime } = require('../utils/helpers');

// @route   POST /api/tickets/create
// @desc    Create a new support ticket (Silver/Gold only)
// @access  Private
router.post('/create', authenticate, async (req, res) => {
  try {
    const { issue } = req.body;

    console.log('🎫 CREATE TICKET REQUEST');
    console.log('   User ID:', req.user.userId);
    console.log('   Issue:', issue);

    // Check subscription - only Silver and Gold can create tickets
    const subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (!subscription || subscription.subscription === 'free') {
      return res.status(403).json({
        success: false,
        message: 'Tickets are only available for Silver and Gold subscribers',
        upgradeRequired: true
      });
    }

    // Check limits
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
    }

    // Reset limits if needed
    if (needsLimitReset(limits.limitResetTime)) {
      limits.questionCount = 0;
      limits.chapterTestCount = 0;
      limits.mockTestCount = 0;
      limits.ticketCount = 0;
      limits.ticketCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
    }

    // Check ticket limit
    const limitStatus = limits.checkLimits();
    if (limitStatus.tickets.reached) {
      return res.status(403).json({
        success: false,
        message: 'Daily ticket limit reached. You can create 1 ticket per day.',
        limit: limitStatus.tickets
      });
    }

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
        message: 'Issue description must not exceed 150 characters'
      });
    }

    // Check if user already has an active ticket
    const activeTicket = await Ticket.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (activeTicket) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active ticket',
        ticket: activeTicket
      });
    }

    // Get user details
    const user = await User.findOne({ userId: req.user.userId });
    const userData = await UserData.findOne({ userId: req.user.userId });

    if (!user || !userData) {
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
      conversation: [{
        sender: 'user',
        message: issue.trim(),
        timestamp: new Date()
      }],
      userMessageCount: 1,
      maxUserMessages: 10,
      refundRequested: false,
      refundEligible: false
    });

    // Update user data with ticket info
    await UserData.updateOne(
      { userId: req.user.userId },
      { 
        ticketNumber: ticketNumber,
        ticketStatus: 'active'
      }
    );

    // Increment ticket count
    limits.ticketCount += 1;
    await limits.save();

    console.log('✅ Ticket created successfully:', ticketNumber);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        userId: ticket.userId,
        userEmail: ticket.userEmail,
        userName: ticket.userName,
        status: ticket.status,
        issue: ticket.issue,
        conversation: ticket.conversation,
        userMessageCount: ticket.userMessageCount,
        maxUserMessages: ticket.maxUserMessages,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('💥 CREATE TICKET ERROR:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating ticket',
      error: error.message
    });
  }
});

// @route   GET /api/tickets/my-tickets
// @desc    Get user's tickets
// @access  Private
router.get('/my-tickets', authenticate, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

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

// @route   POST /api/tickets/add-message
// @desc    Add message to ticket conversation (max 10 user messages)
// @access  Private
router.post('/add-message', authenticate, async (req, res) => {
  try {
    const { ticketNumber, message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    if (message.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Message must not exceed 150 characters'
      });
    }

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add message to closed ticket'
      });
    }

    // Check if user has reached max messages
    if (!ticket.canAddUserMessage()) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${ticket.maxUserMessages} user messages reached for this ticket`,
        maxReached: true
      });
    }

    ticket.conversation.push({
      sender: 'user',
      message: message.trim(),
      timestamp: new Date()
    });

    ticket.userMessageCount += 1;
    await ticket.save();

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

// @route   POST /api/tickets/request-refund
// @desc    Request refund for a ticket (REMOVED - Admin only now)
// @access  Private
// This endpoint is removed - refunds are now admin-only

module.exports = router;