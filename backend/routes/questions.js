// backend/routes/questions.js - COMPLETE VERSION WITH FAVORITES FEATURE
const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const QuestionAttempt = require('../models/QuestionAttempt');
const Limits = require('../models/Limits');
const Analytics = require('../models/Analytics');
const { authenticate, checkSubscription } = require('../middleware/auth');
const { needsLimitReset, getNextResetTime } = require('../utils/helpers');
const cacheService = require('../services/cacheService');
const { questionLimiter } = require('../middleware/redisRateLimiter');

// Get subjects for exam (CACHED)
router.get('/subjects', authenticate, async (req, res) => {
  try {
    const { examType } = req.query;
    
    const cacheKey = `subjects:${examType}`;
    const cached = await cacheService.redis?.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        subjects: JSON.parse(cached)
      });
    }

    const subjects = examType === 'jee' 
      ? ['Physics', 'Chemistry', 'Mathematics']
      : ['Physics', 'Chemistry', 'Biology'];
    
    await cacheService.redis?.setex(cacheKey, 86400, JSON.stringify(subjects));

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

// Get chapters for subject (HEAVILY CACHED)
router.get('/chapters/:subject', authenticate, async (req, res) => {
  try {
    const { subject } = req.params;
    const { examType } = req.query;

    const cachedChapters = await cacheService.getChapters(examType, subject);
    
    if (cachedChapters) {
      return res.json({
        success: true,
        chapters: cachedChapters
      });
    }

    const chapters = await Question.distinct('chapter', {
      examType,
      subject: new RegExp(`^${subject}$`, 'i')
    });

    await cacheService.setChapters(examType, subject, chapters, 7200);

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

// Get topics for chapter (HEAVILY CACHED)
router.get('/topics/:subject/:chapter', authenticate, async (req, res) => {
  try {
    const { subject, chapter } = req.params;
    const { examType } = req.query;

    const cachedTopics = await cacheService.getTopics(examType, subject, chapter);
    
    if (cachedTopics) {
      return res.json({
        success: true,
        topics: cachedTopics
      });
    }

    const topics = await Question.distinct('topic', {
      examType,
      subject: new RegExp(`^${subject}$`, 'i'),
      chapter: new RegExp(`^${chapter}$`, 'i')
    });

    await cacheService.setTopics(examType, subject, chapter, topics, 7200);

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

// 🔥 NEW: Toggle favorite
router.post('/toggle-favorite', authenticate, questionLimiter, async (req, res) => {
  try {
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required'
      });
    }

    // Find existing attempt or create new one
    let attempt = await QuestionAttempt.findOne({
      userId: req.user.userId,
      questionId
    });

    if (!attempt) {
      // Create new attempt with favorite flag
      attempt = await QuestionAttempt.create({
        userId: req.user.userId,
        questionId,
        userAnswer: '', // Empty for favorite-only
        isFavorite: true
      });
    } else {
      // Toggle favorite
      attempt.isFavorite = !attempt.isFavorite;
      await attempt.save();
    }

    res.json({
      success: true,
      isFavorite: attempt.isFavorite,
      message: attempt.isFavorite ? 'Added to favorites' : 'Removed from favorites'
    });

  } catch (error) {
    console.error('💥 Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// 🔥 UPDATED: Get questions list with favorite filter
router.get('/list', authenticate, questionLimiter, async (req, res) => {
  try {
    const { examType, subject, chapter, topic, page = 1, limit = 20, filter } = req.query;

    // Build query
    const query = { examType };
    if (subject) query.subject = new RegExp(`^${subject}$`, 'i');
    if (chapter) query.chapter = new RegExp(`^${chapter}$`, 'i');
    if (topic) query.topic = new RegExp(`^${topic}$`, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔥 NEW: Filter by favorites
    if (filter === 'favorites') {
      // Get favorite question IDs
      const favoriteAttempts = await QuestionAttempt.find({
        userId: req.user.userId,
        isFavorite: true
      }).select('questionId').lean();

      const favoriteQuestionIds = favoriteAttempts.map(a => a.questionId);

      if (favoriteQuestionIds.length === 0) {
        return res.json({
          success: true,
          count: 0,
          total: 0,
          page: parseInt(page),
          totalPages: 0,
          questions: []
        });
      }

      query.questionId = { $in: favoriteQuestionIds };
    }

    const questions = await Question.find(query)
      .select('questionId serialNumber questionType question subject chapter topic questionImageUrl')
      .sort({ serialNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Question.countDocuments(query);

    // Get attempt status and favorites
    const questionIds = questions.map(q => q.questionId);
    const attempts = await QuestionAttempt.find({
      userId: req.user.userId,
      questionId: { $in: questionIds }
    })
    .select('questionId userAnswer isFavorite')
    .lean();

    const attemptsMap = new Map(attempts.map(a => [a.questionId, a]));

    const questionsWithStatus = questions.map(q => {
      const attempt = attemptsMap.get(q.questionId);
      return {
        ...q,
        status: attempt?.userAnswer ? 'attempted' : 'unattempted',
        userAnswer: attempt?.userAnswer || null,
        isFavorite: attempt?.isFavorite || false // 🔥 NEW
      };
    });

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      count: questionsWithStatus.length,
      total,
      page: parseInt(page),
      totalPages,
      questions: questionsWithStatus
    });

  } catch (error) {
    console.error('💥 Get question list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// 🔥 UPDATED: Get single question with favorite status
router.get('/:questionId', authenticate, questionLimiter, async (req, res) => {
  try {
    const { questionId } = req.params;

    const cachedQuestion = await cacheService.getFullQuestion(questionId);

    let question;
    if (cachedQuestion) {
      question = cachedQuestion;
    } else {
      question = await Question.findOne({ questionId: questionId }).lean();

      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      await cacheService.setFullQuestion(questionId, question, 7200);
    }

    // Check attempt and favorite
    const attempt = await QuestionAttempt.findOne({
      userId: req.user.userId,
      questionId: questionId
    })
    .select('userAnswer isFavorite')
    .lean();

    // Check limits
    let limits = await Limits.findOne({ userId: req.user.userId })
      .select('subscription questionCount limitResetTime')
      .lean();
    
    if (!limits) {
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({ userId: req.user.userId })
        .select('subscription')
        .lean();
      
      limits = await Limits.create({
        userId: req.user.userId,
        subscription: subscription?.subscription || 'free',
        questionCount: 0,
        limitResetTime: getNextResetTime()
      });
    }
    
    if (needsLimitReset(limits.limitResetTime)) {
      await Limits.updateOne(
        { userId: req.user.userId },
        {
          $set: {
            questionCount: 0,
            limitResetTime: getNextResetTime()
          }
        }
      );
      limits.questionCount = 0;
      await cacheService.invalidateLimits(req.user.userId);
    }

    const limitStatus = Limits.getLimitsForSubscription(limits.subscription);
    if (limits.questionCount >= limitStatus.questions) {
      return res.status(403).json({
        success: false,
        message: 'Daily question limit reached',
        limit: {
          used: limits.questionCount,
          limit: limitStatus.questions,
          reached: true
        }
      });
    }

    // Increment count (async)
    Limits.updateOne(
      { userId: req.user.userId },
      { $inc: { questionCount: 1 } }
    ).exec();
    
    cacheService.invalidateLimits(req.user.userId);

    res.json({
      success: true,
      question: {
        ...question,
        attempted: !!attempt,
        userAnswer: attempt?.userAnswer || null,
        isFavorite: attempt?.isFavorite || false // 🔥 NEW
      }
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
router.post('/submit-answer', authenticate, questionLimiter, async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;

    const question = await Question.findOne({ questionId })
      .select('answer explanation explanationImageUrl subject chapterId chapter')
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const isCorrect = userAnswer === question.answer;

    // Save attempt (async - don't wait for response)
    QuestionAttempt.findOneAndUpdate(
      { userId: req.user.userId, questionId },
      { userAnswer, attemptedAt: new Date() },
      { upsert: true }
    ).exec();

    // Update analytics for Gold users (async)
    const Subscription = require('../models/Subscription');
    Subscription.findOne({ userId: req.user.userId })
      .select('subscription exam')
      .lean()
      .then(async (subscription) => {
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
          await cacheService.invalidateAnalytics(req.user.userId);
        }
      })
      .catch(err => console.error('Analytics update error:', err));

    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
      explanationImageUrl: question.explanationImageUrl
    });

  } catch (error) {
    console.error('💥 Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;