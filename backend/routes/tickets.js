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

    const ticketNumber = generateTicketNumber();

    const ticket = await Ticket.create({
      ticketNumber,
      userId: req.user.userId,
      userEmail: user.email,
      userName: userData.name,
      status: 'active',
      issue: issue.trim(),
      conversation: [{
        sender: 'user',
        message: issue.trim(),
        timestamp: new Date()
      }]
    });

    // Update user data
    await UserData.updateOne(
      { userId: req.user.userId },
      { 
        ticketNumber: ticketNumber,
        ticketStatus: 'active'
      }
    );

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket
    });

  } catch (error) {
    console.error('Create ticket error:', error);
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
    const tickets = await Ticket.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tickets.length,
      tickets
    });

  } catch (error) {
    console.error('Get tickets error:', error);
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

    ticket.conversation.push({
      sender: 'user',
      message: message.trim(),
      timestamp: new Date()
    });

    await ticket.save();

    res.json({
      success: true,
      message: 'Message added successfully',
      ticket
    });

  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;