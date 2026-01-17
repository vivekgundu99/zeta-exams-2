const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const QuestionAttempt = require('../models/QuestionAttempt');
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

// Get questions list with attempt status
router.get('/list', authenticate, async (req, res) => {
  try {
    const { examType, subject, chapter, topic, page = 1, limit = 20 } = req.query;

    const query = { examType };
    if (subject) query.subject = new RegExp(subject, 'i');
    if (chapter) query.chapter = new RegExp(chapter, 'i');
    if (topic) query.topic = new RegExp(topic, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await Question.find(query)
      .select('questionId serialNumber questionType question subject chapter topic')
      .sort({ serialNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(query);

    // Get attempt status for each question
    const questionIds = questions.map(q => q.questionId);
    const attempts = await QuestionAttempt.find({
      userId: req.user.userId,
      questionId: { $in: questionIds }
    }).select('questionId userAnswer');

    const attemptsMap = new Map(attempts.map(a => [a.questionId, a.userAnswer]));

    const questionsWithStatus = questions.map(q => ({
      ...q.toObject(),
      status: attemptsMap.has(q.questionId) ? 'attempted' : 'unattempted',
      userAnswer: attemptsMap.get(q.questionId) || null
    }));

    res.json({
      success: true,
      count: questionsWithStatus.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      questions: questionsWithStatus
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get single question with attempt data
router.get('/:questionId', authenticate, async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findOne({ questionId: questionId });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user has attempted this question
    const attempt = await QuestionAttempt.findOne({
      userId: req.user.userId,
      questionId: questionId
    });

    // Check limits
    let limits = await Limits.findOne({ userId: req.user.userId });
    
    if (!limits) {
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({ userId: req.user.userId });
      
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription?.subscription || 'free',
        questionCount: 0,
        chapterTestCount: 0,
        mockTestCount: 0,
        ticketCount: 0,
        questionCountLimitReached: false,
        chapterTestCountLimitReached: false,
        mockTestCountLimitReached: false,
        ticketCountLimitReached: false,
        limitResetTime: getNextResetTime()
      });
    }
    
    if (needsLimitReset(limits.limitResetTime)) {
      limits.questionCount = 0;
      limits.chapterTestCount = 0;
      limits.mockTestCount = 0;
      limits.ticketCount = 0;
      limits.questionCountLimitReached = false;
      limits.chapterTestCountLimitReached = false;
      limits.mockTestCountLimitReached = false;
      limits.ticketCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
    }

    // Only increment if not already attempted
    if (!attempt) {
      const limitStatus = limits.checkLimits();
      if (limitStatus.questions.reached) {
        return res.status(403).json({
          success: false,
          message: 'Daily question limit reached',
          limit: limitStatus.questions
        });
      }

      limits.questionCount += 1;
      await limits.save();
    }

    res.json({
      success: true,
      question: {
        ...question.toObject(),
        attempted: !!attempt,
        userAnswer: attempt?.userAnswer || null
      }
    });

  } catch (error) {
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

    // Save or update attempt
    await QuestionAttempt.findOneAndUpdate(
      { userId: req.user.userId, questionId },
      { userAnswer, attemptedAt: new Date() },
      { upsert: true }
    );

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