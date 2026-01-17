const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Question = require('../models/Question');
const Formula = require('../models/Formula');
const MockTest = require('../models/MockTest');
const MockTestAttempt = require('../models/MockTestAttempt');
const GiftCode = require('../models/GiftCode');
const Ticket = require('../models/Ticket');
const PaymentDetails = require('../models/PaymentDetails');
const UserData = require('../models/UserData');
const { authenticate, isAdmin } = require('../middleware/auth');
const { 
  generateQuestionId, 
  generateSerialNumber, 
  generateTestId,
  generateGiftCode,
  parseCSVLine 
} = require('../utils/helpers');
const { decryptPhone } = require('../utils/encryption');

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const freeUsers = await Subscription.countDocuments({ subscription: 'free' });
    const silverUsers = await Subscription.countDocuments({ subscription: 'silver' });
    const goldUsers = await Subscription.countDocuments({ subscription: 'gold' });

    const jeeQuestions = await Question.countDocuments({ examType: 'jee' });
    const neetQuestions = await Question.countDocuments({ examType: 'neet' });

    const mockTests = await MockTest.countDocuments();
    const mockTestAttempts = await MockTestAttempt.countDocuments();

    const giftCodes = await GiftCode.countDocuments();
    const usedGiftCodes = await GiftCode.countDocuments({ status: 'used' });

    const activeTickets = await Ticket.countDocuments({ status: 'active' });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          free: freeUsers,
          silver: silverUsers,
          gold: goldUsers
        },
        questions: {
          total: jeeQuestions + neetQuestions,
          jee: jeeQuestions,
          neet: neetQuestions
        },
        mockTests: {
          total: mockTests,
          attempts: mockTestAttempts
        },
        giftCodes: {
          total: giftCodes,
          used: usedGiftCodes,
          available: giftCodes - usedGiftCodes
        },
        tickets: {
          active: activeTickets
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/questions/bulk-upload
// @desc    Bulk upload questions via CSV
// @access  Admin
router.post('/questions/bulk-upload', async (req, res) => {
  try {
    const { csvText, examType } = req.body;

    if (!csvText || !examType) {
      return res.status(400).json({
        success: false,
        message: 'CSV text and exam type are required'
      });
    }

    const lines = csvText.trim().split('\n');
    const questions = [];
    const errors = [];

    // FIX: Get current max question ID from database
    const lastQuestion = await Question.findOne()
      .sort({ questionId: -1 })
      .select('questionId');
    
    let questionCount = lastQuestion 
      ? parseInt(lastQuestion.questionId) 
      : 0;

    console.log('📊 Starting bulk upload');
    console.log('   Last Question ID:', lastQuestion?.questionId || 'None');
    console.log('   Starting from:', questionCount + 1);
    console.log('   Total lines:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      try {
        const parts = parseCSVLine(lines[i]);

        if (parts.length < 16) {
          errors.push(`Line ${i + 1}: Invalid format (expected 16 fields, got ${parts.length})`);
          continue;
        }

        const questionType = parts[0]?.trim(); // S or N
        const subject = parts[1]?.trim();
        const chapter = parts[2]?.trim();
        const topic = parts[3]?.trim();
        const question = parts[4]?.trim();
        const optionA = parts[5]?.trim() || null;
        const optionB = parts[6]?.trim() || null;
        const optionC = parts[7]?.trim() || null;
        const optionD = parts[8]?.trim() || null;
        const answer = parts[9]?.trim();
        const questionImageUrl = parts[10]?.trim() || null;
        const optionAImageUrl = parts[11]?.trim() || null;
        const optionBImageUrl = parts[12]?.trim() || null;
        const optionCImageUrl = parts[13]?.trim() || null;
        const optionDImageUrl = parts[14]?.trim() || null;
        const explanation = parts[15]?.trim() || null;

        // Validate required fields
        if (!questionType || !subject || !chapter || !topic || !question || !answer) {
          errors.push(`Line ${i + 1}: Missing required fields`);
          continue;
        }

        if (!['S', 'N'].includes(questionType)) {
          errors.push(`Line ${i + 1}: Invalid question type "${questionType}" (must be S or N)`);
          continue;
        }

        // FIX: Increment BEFORE using
        questionCount++;
        const questionId = generateQuestionId(questionCount);
        
        // Generate chapter and topic IDs
        const chapterNum = '1'; // You may want to implement chapter numbering
        const topicId = 'A'; // You may want to implement topic ID generation
        const serialNumber = generateSerialNumber(
          examType,
          subject,
          chapterNum,
          topicId,
          questionCount
        );

        const questionData = {
          questionId,
          serialNumber,
          examType,
          questionType,
          subject,
          chapter,
          chapterId: `${examType === 'jee' ? 'J' : 'N'}${subject[0]}${chapterNum}`,
          topic,
          topicId,
          question: question.replace(/latex:/g, ''),
          optionA,
          optionB,
          optionC,
          optionD,
          answer,
          questionImageUrl,
          optionAImageUrl,
          optionBImageUrl,
          optionCImageUrl,
          optionDImageUrl,
          explanation
        };

        questions.push(questionData);

        console.log(`✅ Processed line ${i + 1}: QuestionID ${questionId}`);

      } catch (error) {
        errors.push(`Line ${i + 1}: ${error.message}`);
        console.error(`❌ Error on line ${i + 1}:`, error.message);
      }
    }

    console.log(`📊 Processing complete:`);
    console.log(`   Valid questions: ${questions.length}`);
    console.log(`   Errors: ${errors.length}`);

    // Insert questions
    let insertedCount = 0;
    if (questions.length > 0) {
      try {
        const result = await Question.insertMany(questions, { ordered: false });
        insertedCount = result.length;
        console.log(`✅ Inserted ${insertedCount} questions`);
      } catch (error) {
        // Handle partial insertion
        if (error.insertedDocs) {
          insertedCount = error.insertedDocs.length;
          console.log(`⚠️ Partial insertion: ${insertedCount} questions`);
          
          // Add write errors to errors array
          if (error.writeErrors) {
            error.writeErrors.forEach((we, idx) => {
              errors.push(`Question ${idx + 1}: ${we.errmsg}`);
            });
          }
        } else {
          throw error;
        }
      }
    }

    res.json({
      success: true,
      message: `Upload complete: ${insertedCount} questions uploaded`,
      uploaded: insertedCount,
      total: questions.length,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('💥 Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/questions/update
// @desc    Update a question
// @access  Admin
router.put('/questions/update', async (req, res) => {
  try {
    const { questionId, question, optionA, optionB, optionC, optionD, answer, explanation, explanationImageUrl } = req.body;

    console.log('📝 Updating question:', questionId);

    const updatedQuestion = await Question.findOneAndUpdate(
      { questionId },
      {
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        answer,
        explanation,
        explanationImageUrl
      },
      { new: true }
    );

    if (!updatedQuestion) {
      console.log('❌ Question not found:', questionId);
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    console.log('✅ Question updated successfully');

    res.json({
      success: true,
      message: 'Question updated successfully',
      question: updatedQuestion
    });

  } catch (error) {
    console.error('💥 Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});


// @route   DELETE /api/admin/questions/:questionId
// @desc    Delete a question
// @access  Admin
router.delete('/questions/:questionId', async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({ 
      questionId: req.params.questionId 
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Replace the search section in admin.js with this:

// @route   GET /api/admin/questions/search
// @desc    Search questions by ID or serial number
// @access  Admin
router.get('/questions/search', authenticate, isAdmin, async (req, res) => {
  try {
    const { query } = req.query;

    console.log('🔍 Searching for question:', query);

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchTerm = query.trim();

    // Try multiple search strategies
    const questions = await Question.find({
      $or: [
        { questionId: searchTerm },  // Exact match for questionId
        { questionId: new RegExp(searchTerm, 'i') },  // Partial match for questionId
        { serialNumber: searchTerm },  // Exact match for serialNumber
        { serialNumber: new RegExp(searchTerm, 'i') }  // Partial match for serialNumber
      ]
    }).limit(50);

    console.log('✅ Found questions:', questions.length);

    res.json({
      success: true,
      count: questions.length,
      questions
    });

  } catch (error) {
    console.error('💥 Search questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/formulas/add
// @desc    Add a formula
// @access  Admin
router.post('/formulas/add', async (req, res) => {
  try {
    const { examType, subject, chapter, topicName, pdfUrl, description } = req.body;

    const formula = await Formula.create({
      examType,
      subject,
      chapter,
      topicName,
      pdfUrl,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Formula added successfully',
      formula
    });

  } catch (error) {
    console.error('Add formula error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/formulas/:id
// @desc    Delete a formula
// @access  Admin
router.delete('/formulas/:id', async (req, res) => {
  try {
    const formula = await Formula.findByIdAndDelete(req.params.id);

    if (!formula) {
      return res.status(404).json({
        success: false,
        message: 'Formula not found'
      });
    }

    res.json({
      success: true,
      message: 'Formula deleted successfully'
    });

  } catch (error) {
    console.error('Delete formula error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/mock-tests/create
// @desc    Create a mock test
// @access  Admin
router.post('/mock-tests/create', async (req, res) => {
  try {
    const { examType, testName, csvText } = req.body;

    const lines = csvText.trim().split('\n');
    const questions = [];

    for (const line of lines) {
      const parts = parseCSVLine(line);
      
      questions.push({
        questionType: parts[0],
        subject: parts[1],
        chapter: parts[2],
        topic: parts[3],
        question: parts[4],
        optionA: parts[5] || null,
        optionB: parts[6] || null,
        optionC: parts[7] || null,
        optionD: parts[8] || null,
        answer: parts[9],
        questionImageUrl: parts[10] || null,
        optionAImageUrl: parts[11] || null,
        optionBImageUrl: parts[12] || null,
        optionCImageUrl: parts[13] || null,
        optionDImageUrl: parts[14] || null,
        explanation: parts[15] || null
      });
    }

    const requiredQuestions = examType === 'jee' ? 90 : 180;

    if (questions.length !== requiredQuestions) {
      return res.status(400).json({
        success: false,
        message: `Test must have exactly ${requiredQuestions} questions`
      });
    }

    const testId = generateTestId(examType);

    const mockTest = await MockTest.create({
      testId,
      examType,
      testName,
      duration: 180,
      totalQuestions: requiredQuestions,
      questions
    });

    res.status(201).json({
      success: true,
      message: 'Mock test created successfully',
      test: {
        testId: mockTest.testId,
        testName: mockTest.testName,
        totalQuestions: mockTest.totalQuestions
      }
    });

  } catch (error) {
    console.error('Create mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/mock-tests/:testId
// @desc    Delete a mock test
// @access  Admin
router.delete('/mock-tests/:testId', async (req, res) => {
  try {
    const test = await MockTest.findOneAndDelete({ testId: req.params.testId });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    res.json({
      success: true,
      message: 'Mock test deleted successfully'
    });

  } catch (error) {
    console.error('Delete mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    const usersWithDetails = await Promise.all(users.map(async (user) => {
      const userData = await UserData.findOne({ userId: user.userId });
      const subscription = await Subscription.findOne({ userId: user.userId });

      return {
        userId: user.userId,
        email: user.email,
        phoneNumber: decryptPhone(user.phoneNumber),
        name: userData?.name,
        exam: userData?.exam,
        subscription: subscription?.subscription,
        subscriptionStatus: subscription?.subscriptionStatus,
        createdAt: user.createdAt
      };
    }));

    res.json({
      success: true,
      users: usersWithDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/users/deactivate
// @desc    Deactivate a user
// @access  Admin
router.post('/users/deactivate', async (req, res) => {
  try {
    const { userId } = req.body;

    await Subscription.updateOne(
      { userId },
      { subscriptionStatus: 'inactive' }
    );

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/giftcodes/generate
// @desc    Generate gift codes
// @access  Admin
router.post('/giftcodes/generate', async (req, res) => {
  try {
    const { subscriptionType, duration, quantity, notes } = req.body;

    if (quantity > 100) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate more than 100 codes at once'
      });
    }

    const codes = [];

    for (let i = 0; i < quantity; i++) {
      const code = generateGiftCode(subscriptionType, duration);
      
      codes.push({
        code,
        subscriptionType,
        duration,
        status: 'available',
        notes
      });
    }

    await GiftCode.insertMany(codes);

    res.status(201).json({
      success: true,
      message: `${quantity} gift codes generated successfully`,
      codes: codes.map(c => c.code)
    });

  } catch (error) {
    console.error('Generate gift codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/giftcodes/list
// @desc    Get gift codes
// @access  Admin
router.get('/giftcodes/list', async (req, res) => {
  try {
    const { filter } = req.query;

    const query = {};
    if (filter === 'used') query.status = 'used';
    if (filter === 'available') query.status = 'available';

    const giftCodes = await GiftCode.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: giftCodes.length,
      giftCodes
    });

  } catch (error) {
    console.error('Get gift codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/giftcodes/:code
// @desc    Delete a gift code
// @access  Admin
router.delete('/giftcodes/:code', async (req, res) => {
  try {
    const giftCode = await GiftCode.findOneAndDelete({ code: req.params.code });

    if (!giftCode) {
      return res.status(404).json({
        success: false,
        message: 'Gift code not found'
      });
    }

    res.json({
      success: true,
      message: 'Gift code deleted successfully'
    });

  } catch (error) {
    console.error('Delete gift code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Add this to the existing admin.js file, replacing the tickets section

// @route   GET /api/admin/tickets
// @desc    Get all tickets with user subscription details
// @access  Admin
router.get('/tickets', authenticate, isAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });

    // Fetch subscription details for each ticket
    const ticketsWithSubscription = await Promise.all(
      tickets.map(async (ticket) => {
        const subscription = await Subscription.findOne({ userId: ticket.userId });
        return {
          ...ticket.toObject(),
          subscriptionDetails: subscription ? {
            subscription: subscription.subscription,
            subscriptionStatus: subscription.subscriptionStatus,
            subscriptionStartTime: subscription.subscriptionStartTime,
            subscriptionEndTime: subscription.subscriptionEndTime,
            exam: subscription.exam
          } : null
        };
      })
    );

    res.json({
      success: true,
      count: ticketsWithSubscription.length,
      tickets: ticketsWithSubscription
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

// @route   POST /api/admin/tickets/reply
// @desc    Reply to a ticket
// @access  Admin
router.post('/tickets/reply', authenticate, isAdmin, async (req, res) => {
  try {
    const { ticketNumber, message } = req.body;

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.conversation.push({
      sender: 'admin',
      message: message.trim(),
      timestamp: new Date()
    });

    await ticket.save();

    res.json({
      success: true,
      message: 'Reply sent successfully',
      ticket
    });

  } catch (error) {
    console.error('Reply to ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/tickets/close
// @desc    Close a ticket
// @access  Admin
router.post('/tickets/close', authenticate, isAdmin, async (req, res) => {
  try {
    const { ticketNumber } = req.body;

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.status = 'inactive';
    ticket.resolvedAt = new Date();
    await ticket.save();

    // Update user data
    await UserData.updateOne(
      { userId: ticket.userId },
      { ticketStatus: 'inactive' }
    );

    res.json({
      success: true,
      message: 'Ticket closed successfully'
    });

  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/tickets/request-refund
// @desc    Admin marks ticket for refund request
// @access  Admin
router.post('/tickets/request-refund', authenticate, isAdmin, async (req, res) => {
  try {
    const { ticketNumber } = req.body;

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.refundRequested = true;
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket marked for refund'
    });

  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/tickets/refund-eligible
// @desc    Mark ticket as eligible for refund
// @access  Admin
router.post('/tickets/refund-eligible', authenticate, isAdmin, async (req, res) => {
  try {
    const { ticketNumber } = req.body;

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.refundEligible = true;
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket marked as eligible for refund'
    });

  } catch (error) {
    console.error('Mark refund eligible error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/refunds/process
// @desc    Process a refund (50% of subscription amount)
// @access  Admin
router.post('/refunds/process', async (req, res) => {
  try {
    const { ticketNumber } = req.body;

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket || !ticket.refundEligible) {
      return res.status(400).json({
        success: false,
        message: 'Ticket not eligible for refund'
      });
    }

    // Get latest payment
    const payment = await PaymentDetails.findOne({ 
      userId: ticket.userId,
      status: 'success'
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No payment found for this user'
      });
    }

    // Calculate 50% refund
    const refundAmount = payment.amount * 0.5;

    payment.refundAmount = refundAmount;
    payment.refundStatus = 'completed';
    payment.refundDate = new Date();
    await payment.save();

    // Close ticket
    ticket.status = 'inactive';
    ticket.resolvedAt = new Date();
    await ticket.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundAmount
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;