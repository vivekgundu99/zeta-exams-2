// backend/routes/tickets.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const UserData = require('../models/UserData');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { generateTicketNumber } = require('../utils/helpers');

// @route   POST /api/tickets/create
// @desc    Create a new support ticket
// @access  Private
router.post('/create', authenticate, async (req, res) => {
  try {
    const { issue } = req.body;

    console.log('🎫 POST /api/tickets/create');
    console.log('   User:', req.user.userId);
    console.log('   Issue:', issue);

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
      console.log('❌ User already has an active ticket:', activeTicket.ticketNumber);
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
      console.log('❌ User data not found');
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    const ticketNumber = generateTicketNumber();
    console.log('✅ Generated ticket number:', ticketNumber);

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
      refundRequested: false,
      refundEligible: false
    });

    console.log('✅ Ticket created successfully:', ticket.ticketNumber);

    // Update user data with ticket info
    await UserData.updateOne(
      { userId: req.user.userId },
      { 
        ticketNumber: ticketNumber,
        ticketStatus: 'active'
      }
    );

    console.log('✅ User data updated with ticket info');

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
        createdAt: ticket.createdAt
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

// @route   GET /api/tickets/my-tickets
// @desc    Get user's tickets
// @access  Private
router.get('/my-tickets', authenticate, async (req, res) => {
  try {
    console.log('📋 GET /api/tickets/my-tickets - User:', req.user.userId);

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

// @route   POST /api/tickets/add-message
// @desc    Add message to ticket conversation
// @access  Private
router.post('/add-message', authenticate, async (req, res) => {
  try {
    const { ticketNumber, message } = req.body;

    console.log('💬 POST /api/tickets/add-message');
    console.log('   Ticket:', ticketNumber);
    console.log('   User:', req.user.userId);

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
      console.log('❌ Ticket not found:', ticketNumber);
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.userId !== req.user.userId) {
      console.log('❌ Unauthorized access attempt');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (ticket.status !== 'active') {
      console.log('❌ Ticket is not active');
      return res.status(400).json({
        success: false,
        message: 'Cannot add message to closed ticket'
      });
    }

    ticket.conversation.push({
      sender: 'user',
      message: message.trim(),
      timestamp: new Date()
    });

    await ticket.save();

    console.log('✅ Message added successfully');

    res.json({
      success: true,
      message: 'Message added successfully',
      ticket
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
// @desc    Request refund for a ticket
// @access  Private
router.post('/request-refund', authenticate, async (req, res) => {
  try {
    const { ticketNumber } = req.body;

    console.log('💰 POST /api/tickets/request-refund');
    console.log('   Ticket:', ticketNumber);
    console.log('   User:', req.user.userId);

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

    if (ticket.refundRequested) {
      return res.status(400).json({
        success: false,
        message: 'Refund already requested for this ticket'
      });
    }

    ticket.refundRequested = true;
    await ticket.save();

    console.log('✅ Refund requested successfully');

    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      ticket
    });

  } catch (error) {
    console.error('💥 Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;