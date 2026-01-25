// backend/routes/mockTests.js - FULLY FIXED VERSION
const express = require('express');
const router = express.Router();
const MockTest = require('../models/MockTest');
const MockTestAttempt = require('../models/MockTestAttempt');
const Limits = require('../models/Limits');
const Analytics = require('../models/Analytics');
const Subscription = require('../models/Subscription');
const { authenticate } = require('../middleware/auth');
const { needsLimitReset, getNextResetTime } = require('../utils/helpers');

// @route   GET /api/mock-tests/list
// @desc    Get all mock tests
// @access  Private
router.get('/list', authenticate, async (req, res) => {
  try {
    const { examType, filter } = req.query;

    const tests = await MockTest.find({ examType })
      .select('-questions')
      .sort({ createdAt: -1 });

    // Get user's attempts
    const attempts = await MockTestAttempt.find({ 
      userId: req.user.userId,
      status: 'completed'
    });

    let filteredTests = tests;

    if (filter === 'attempted') {
      const attemptedTestIds = attempts.map(a => a.testId);
      filteredTests = tests.filter(t => attemptedTestIds.includes(t.testId));
    } else if (filter === 'unattempted') {
      const attemptedTestIds = attempts.map(a => a.testId);
      filteredTests = tests.filter(t => !attemptedTestIds.includes(t.testId));
    }

    res.json({
      success: true,
      count: filteredTests.length,
      tests: filteredTests
    });

  } catch (error) {
    console.error('Get mock tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/mock-tests/attempts
// @desc    Get user's mock test attempts
// @access  Private
router.get('/attempts', authenticate, async (req, res) => {
  try {
    console.log('📋 Loading attempts for user:', req.user.userId);
    
    const attempts = await MockTestAttempt.find({ 
      userId: req.user.userId 
    }).sort({ createdAt: -1 });

    console.log('✅ Found attempts:', attempts.length);

    res.json({
      success: true,
      count: attempts.length,
      attempts
    });

  } catch (error) {
    console.error('💥 Get attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/mock-tests/start
// @desc    Start a mock test attempt
// @access  Private
router.post('/start', authenticate, async (req, res) => {
  try {
    const { testId } = req.body;

    console.log('🎯 Start mock test:', testId);

    // 🔥 FIX 1: Auto-abandon old ongoing tests (older than 4 hours)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    
    const oldOngoingTests = await MockTestAttempt.find({
      userId: req.user.userId,
      status: 'ongoing',
      startTime: { $lt: fourHoursAgo }
    });

    if (oldOngoingTests.length > 0) {
      console.log(`🗑️ Auto-abandoning ${oldOngoingTests.length} old test(s)`);
      
      await MockTestAttempt.updateMany(
        {
          userId: req.user.userId,
          status: 'ongoing',
          startTime: { $lt: fourHoursAgo }
        },
        {
          $set: {
            status: 'abandoned',
            endTime: new Date()
          }
        }
      );
    }

    // Check for ongoing test (after cleanup)
    const ongoingTest = await MockTestAttempt.findOne({
      userId: req.user.userId,
      status: 'ongoing'
    });

    if (ongoingTest) {
      return res.status(400).json({
        success: false,
        message: 'You have an ongoing test. Please complete it first.',
        ongoingTest
      });
    }

    // Get or create limits
    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription?.subscription || 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        limitResetTime: getNextResetTime()
      });
    }
    
    // Reset limits if needed
    if (needsLimitReset(limits.limitResetTime)) {
      console.log('🔄 Resetting limits');
      limits.mockTestCount = 0;
      limits.mockTestCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
    }

    const limitStatus = limits.checkLimits();
    if (limitStatus.mockTests.reached) {
      return res.status(403).json({
        success: false,
        message: 'Daily mock test limit reached',
        limit: limitStatus.mockTests
      });
    }

    // Get the test
    const test = await MockTest.findOne({ testId });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Create attempt
    const attempt = await MockTestAttempt.create({
      userId: req.user.userId,
      testId: test.testId,
      examType: test.examType,
      testName: test.testName,
      status: 'ongoing',
      startTime: new Date(),
      totalQuestions: test.totalQuestions,
      answers: []
    });

    // Increment mock test count
    limits.mockTestCount += 1;
    await limits.save();

    console.log('✅ Mock test started');

    res.json({
      success: true,
      test: {
        testId: test.testId,
        testName: test.testName,
        examType: test.examType,
        duration: test.duration,
        totalQuestions: test.totalQuestions,
        questions: test.questions
      },
      attempt: {
        _id: attempt._id,
        startTime: attempt.startTime
      }
    });

  } catch (error) {
    console.error('💥 Start mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/mock-tests/submit
// @desc    Submit mock test
// @access  Private
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    const attempt = await MockTestAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (attempt.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get the test to check answers
    const test = await MockTest.findOne({ testId: attempt.testId });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Calculate results
    const processedAnswers = answers.map((answer, index) => {
      const question = test.questions[index];
      const isCorrect = answer.answer === question.answer;

      return {
        questionIndex: index,
        userAnswer: answer.answer || '',
        correctAnswer: question.answer,
        isCorrect,
        timeTaken: answer.timeTaken || 0,
        flagged: answer.flagged || false
      };
    });

    attempt.answers = processedAnswers;
    attempt.endTime = new Date();
    attempt.status = 'completed';
    attempt.timeTaken = Math.round((attempt.endTime - attempt.startTime) / 60000);

    attempt.calculateResults();
    await attempt.save();

    // Update analytics for Gold users
    const subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (subscription && subscription.subscription === 'gold') {
      let analytics = await Analytics.findOne({ userId: req.user.userId });
      
      if (analytics) {
        analytics.overallStats.totalMockTests += 1;
        await analytics.save();
      }
    }

    res.json({
      success: true,
      message: 'Test submitted successfully',
      results: {
        attemptId: attempt._id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        unanswered: attempt.unanswered,
        accuracy: attempt.accuracy
      }
    });

  } catch (error) {
    console.error('Submit mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/mock-tests/clear-ongoing
// @desc    Force clear ongoing tests (for fixing stuck tests)
// @access  Private
router.post('/clear-ongoing', authenticate, async (req, res) => {
  try {
    console.log('🗑️ Clearing ongoing tests for user:', req.user.userId);
    
    const result = await MockTestAttempt.updateMany(
      { 
        userId: req.user.userId,
        status: 'ongoing'
      },
      {
        $set: {
          status: 'abandoned',
          endTime: new Date()
        }
      }
    );

    console.log('✅ Cleared ongoing tests:', result.modifiedCount);

    res.json({
      success: true,
      message: `Cleared ${result.modifiedCount} ongoing test(s)`,
      cleared: result.modifiedCount
    });

  } catch (error) {
    console.error('💥 Clear ongoing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear ongoing tests',
      error: error.message
    });
  }
});

// @route   POST /api/mock-tests/abandon
// @desc    Abandon ongoing test
// @access  Private
router.post('/abandon', authenticate, async (req, res) => {
  try {
    const { attemptId } = req.body;

    console.log('🗑️ Abandoning test:', attemptId);

    const attempt = await MockTestAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    if (attempt.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (attempt.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Test is not ongoing'
      });
    }

    attempt.status = 'abandoned';
    attempt.endTime = new Date();
    await attempt.save();

    console.log('✅ Test abandoned successfully');

    res.json({
      success: true,
      message: 'Test abandoned successfully'
    });

  } catch (error) {
    console.error('💥 Abandon test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/mock-tests/result/:attemptId
// @desc    Get mock test result
// @access  Private
router.get('/result/:attemptId', authenticate, async (req, res) => {
  try {
    const attempt = await MockTestAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (attempt.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get test to include questions and explanations
    const test = await MockTest.findOne({ testId: attempt.testId });

    const detailedResults = attempt.answers.map((answer, index) => {
      const question = test.questions[index];
      return {
        ...answer.toObject(),
        question: question.question,
        questionType: question.questionType,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        explanation: question.explanation,
        explanationImageUrl: question.explanationImageUrl
      };
    });

    res.json({
      success: true,
      attempt: {
        ...attempt.toObject(),
        detailedResults
      }
    });

  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;