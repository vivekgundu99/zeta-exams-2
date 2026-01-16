// backend/routes/questions.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Limits = require('../models/Limits');
const Analytics = require('../models/Analytics');
const { authenticate, checkSubscription } = require('../middleware/auth');
const { needsLimitReset, getNextResetTime } = require('../utils/helpers');

// Get subjects for exam
router.get('/subjects', authenticate, async (req, res) => {
  try {
    const { examType } = req.query;

    const subjects = examType === 'jee' 
      ? ['Physics', 'Chemistry', 'Mathematics']
      : ['Physics', 'Chemistry', 'Biology'];

    res.json({
      success: true,
      subjects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get chapters for subject
router.get('/chapters/:subject', authenticate, async (req, res) => {
  try {
    const { subject } = req.params;
    const { examType } = req.query;

    const chapters = await Question.distinct('chapter', {
      examType,
      subject: new RegExp(subject, 'i')
    });

    res.json({
      success: true,
      chapters
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get topics for chapter
router.get('/topics/:subject/:chapter', authenticate, async (req, res) => {
  try {
    const { subject, chapter } = req.params;
    const { examType } = req.query;

    const topics = await Question.distinct('topic', {
      examType,
      subject: new RegExp(subject, 'i'),
      chapter: new RegExp(chapter, 'i')
    });

    res.json({
      success: true,
      topics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get questions list
router.get('/list', authenticate, async (req, res) => {
  try {
    const { examType, subject, chapter, topic } = req.query;

    const query = { examType };
    if (subject) query.subject = new RegExp(subject, 'i');
    if (chapter) query.chapter = new RegExp(chapter, 'i');
    if (topic) query.topic = new RegExp(topic, 'i');

    const questions = await Question.find(query)
      .select('questionId serialNumber questionType question')
      .sort({ serialNumber: 1 });

    res.json({
      success: true,
      count: questions.length,
      questions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// FIX: Get single question with proper error handling and limit checking
router.get('/:questionId', authenticate, async (req, res) => {
  try {
    const { questionId } = req.params;

    console.log('📝 GET /api/questions/:questionId - QuestionID:', questionId);
    console.log('   User:', req.user.userId);

    // FIX: Get or create limits
    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      console.log('⚠️ Creating limits for user');
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription?.subscription || 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        questionCountLimitReached: false,
        chapterTestCountLimitReached: false,
        mockTestCountLimitReached: false,
        limitResetTime: getNextResetTime()
      });
    }
    
    // Check and reset limits if needed
    if (needsLimitReset(limits.limitResetTime)) {
      console.log('🔄 Resetting limits for user');
      limits.questionCount = 0;
      limits.chapterTestCount = 0;
      limits.mockTestCount = 0;
      limits.questionCountLimitReached = false;
      limits.chapterTestCountLimitReached = false;
      limits.mockTestCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
    }

    // Check question limit
    const limitStatus = limits.checkLimits();
    if (limitStatus.questions.reached) {
      console.log('❌ Question limit reached for user');
      return res.status(403).json({
        success: false,
        message: 'Daily question limit reached',
        limit: limitStatus.questions
      });
    }

    // FIX: Find question by questionId (not _id)
    const question = await Question.findOne({ questionId: questionId });

    if (!question) {
      console.log('❌ Question not found:', questionId);
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    console.log('✅ Question found:', question.questionId);

    // Increment question count
    limits.questionCount += 1;
    await limits.save();

    console.log('✅ Question count incremented:', limits.questionCount);

    res.json({
      success: true,
      question
    });

  } catch (error) {
    console.error('💥 Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Submit answer
router.post('/submit-answer', authenticate, async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;

    const question = await Question.findOne({ questionId });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const isCorrect = userAnswer === question.answer;

    // Update analytics for Gold users
    const Subscription = require('../models/Subscription');
    const subscription = await Subscription.findOne({ userId: req.user.userId });
    
    if (subscription && subscription.subscription === 'gold') {
      let analytics = await Analytics.findOne({ userId: req.user.userId });
      
      if (!analytics) {
        analytics = await Analytics.create({
          userId: req.user.userId,
          subscription: 'gold',
          exam: subscription.exam
        });
      }

      const subject = question.subject.toLowerCase();
      analytics.updateChapterStats(
        subject,
        question.chapterId,
        question.chapter,
        isCorrect
      );
      
      await analytics.save();
    }

    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
      explanationImageUrl: question.explanationImageUrl
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;