// backend/routes/tickets.js - ENHANCED VERSION WITH LOGGING
'use client';

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

    console.log('');
    console.log('🎫 ========================================');
    console.log('🎫 CREATE TICKET REQUEST');
    console.log('🎫 ========================================');
    console.log('   User ID:', req.user.userId);
    console.log('   User Email:', req.user.email);
    console.log('   Issue:', issue);
    console.log('   Issue length:', issue?.length || 0);

    // Validate issue
    if (!issue || issue.trim().length === 0) {
      console.log('❌ Validation failed: Issue is empty');
      return res.status(400).json({
        success: false,
        message: 'Issue description is required'
      });
    }

    if (issue.length > 150) {
      console.log('❌ Validation failed: Issue too long');
      return res.status(400).json({
        success: false,
        message: 'Issue description must not exceed 150 characters'
      });
    }

    // Check if user already has an active ticket
    console.log('🔍 Checking for existing active tickets...');
    const activeTicket = await Ticket.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (activeTicket) {
      console.log('❌ User already has active ticket:', activeTicket.ticketNumber);
      return res.status(400).json({
        success: false,
        message: 'You already have an active ticket',
        ticket: activeTicket
      });
    }

    console.log('✅ No active tickets found');

    // Get user details
    console.log('👤 Fetching user details...');
    const user = await User.findOne({ userId: req.user.userId });
    const userData = await UserData.findOne({ userId: req.user.userId });

    if (!user || !userData) {
      console.log('❌ User data not found');
      console.log('   User exists:', !!user);
      console.log('   UserData exists:', !!userData);
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    console.log('✅ User details found:');
    console.log('   Email:', user.email);
    console.log('   Name:', userData.name || 'User');

    // Generate ticket number
    const ticketNumber = generateTicketNumber();
    console.log('🎟️ Generated ticket number:', ticketNumber);

    // Create ticket
    console.log('💾 Creating ticket in database...');
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

    console.log('✅ Ticket created successfully');
    console.log('   Ticket ID:', ticket._id);
    console.log('   Ticket Number:', ticket.ticketNumber);

    // Update user data with ticket info
    console.log('📝 Updating UserData with ticket info...');
    await UserData.updateOne(
      { userId: req.user.userId },
      { 
        ticketNumber: ticketNumber,
        ticketStatus: 'active'
      }
    );

    console.log('✅ UserData updated');
    console.log('🎫 ========================================');
    console.log('');

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
    console.error('');
    console.error('💥 ========================================');
    console.error('💥 CREATE TICKET ERROR');
    console.error('💥 ========================================');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('💥 ========================================');
    console.error('');
    
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
    console.log('');
    console.log('📋 GET MY TICKETS - User:', req.user.userId);

    const tickets = await Ticket.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    console.log('✅ Found', tickets.length, 'tickets');
    console.log('');

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

    console.log('');
    console.log('💬 ADD MESSAGE TO TICKET');
    console.log('   Ticket:', ticketNumber);
    console.log('   User:', req.user.userId);
    console.log('   Message length:', message?.length || 0);

    if (!message || message.trim().length === 0) {
      console.log('❌ Validation failed: Message is empty');
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    if (message.length > 150) {
      console.log('❌ Validation failed: Message too long');
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
    console.log('');

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

    console.log('');
    console.log('💰 REFUND REQUEST');
    console.log('   Ticket:', ticketNumber);
    console.log('   User:', req.user.userId);

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket) {
      console.log('❌ Ticket not found');
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.userId !== req.user.userId) {
      console.log('❌ Unauthorized');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (ticket.refundRequested) {
      console.log('❌ Refund already requested');
      return res.status(400).json({
        success: false,
        message: 'Refund already requested for this ticket'
      });
    }

    ticket.refundRequested = true;
    await ticket.save();

    console.log('✅ Refund requested successfully');
    console.log('');

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