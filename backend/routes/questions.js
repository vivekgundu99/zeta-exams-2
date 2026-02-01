// backend/routes/questions.js - MAXIMUM PERFORMANCE OPTIMIZATION
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

// 🔥 PERFORMANCE: Get subjects for exam (CACHED)
router.get('/subjects', authenticate, async (req, res) => {
  try {
    const { examType } = req.query;
    
    // 🔥 Static data - cache for 24 hours
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
    
    // Cache for 24 hours
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

// 🔥 PERFORMANCE: Get chapters for subject (HEAVILY CACHED)
router.get('/chapters/:subject', authenticate, async (req, res) => {
  try {
    const { subject } = req.params;
    const { examType } = req.query;

    // 🔥 Try cache first (2 hours)
    const cachedChapters = await cacheService.getChapters(examType, subject);
    
    if (cachedChapters) {
      return res.json({
        success: true,
        chapters: cachedChapters
      });
    }

    // 🔥 PERFORMANCE: Optimized query with lean()
    const chapters = await Question.distinct('chapter', {
      examType,
      subject: new RegExp(`^${subject}$`, 'i')
    });

    // Cache for 2 hours
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

// 🔥 PERFORMANCE: Get topics for chapter (HEAVILY CACHED)
router.get('/topics/:subject/:chapter', authenticate, async (req, res) => {
  try {
    const { subject, chapter } = req.params;
    const { examType } = req.query;

    // 🔥 Try cache first (2 hours)
    const cachedTopics = await cacheService.getTopics(examType, subject, chapter);
    
    if (cachedTopics) {
      return res.json({
        success: true,
        topics: cachedTopics
      });
    }

    // 🔥 PERFORMANCE: Optimized query
    const topics = await Question.distinct('topic', {
      examType,
      subject: new RegExp(`^${subject}$`, 'i'),
      chapter: new RegExp(`^${chapter}$`, 'i')
    });

    // Cache for 2 hours
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

// 🔥 MAXIMUM PERFORMANCE: Get questions list (AGGRESSIVE CACHING)
router.get('/list', authenticate, questionLimiter, async (req, res) => {
  try {
    const { examType, subject, chapter, topic, page = 1, limit = 20 } = req.query;

    // 🔥 Try cache first
    const cacheKey = `qlist:${examType}:${subject}:${chapter}:${topic}:${page}`;
    const cachedList = await cacheService.redis?.get(cacheKey);

    if (cachedList) {
      const parsed = JSON.parse(cachedList);
      
      // Get attempt status (not cached as it changes frequently)
      const questionIds = parsed.questions.map(q => q.questionId);
      const attempts = await QuestionAttempt.find({
        userId: req.user.userId,
        questionId: { $in: questionIds }
      })
      .select('questionId userAnswer')
      .lean(); // 🔥 PERFORMANCE

      const attemptsMap = new Map(attempts.map(a => [a.questionId, a.userAnswer]));

      const questionsWithStatus = parsed.questions.map(q => ({
        ...q,
        status: attemptsMap.has(q.questionId) ? 'attempted' : 'unattempted',
        userAnswer: attemptsMap.get(q.questionId) || null
      }));

      return res.json({
        success: true,
        count: questionsWithStatus.length,
        total: parsed.total,
        page: parseInt(page),
        totalPages: parsed.totalPages,
        questions: questionsWithStatus
      });
    }

    // 🔥 PERFORMANCE: Optimized query
    const query = { examType };
    if (subject) query.subject = new RegExp(`^${subject}$`, 'i');
    if (chapter) query.chapter = new RegExp(`^${chapter}$`, 'i');
    if (topic) query.topic = new RegExp(`^${topic}$`, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔥 PERFORMANCE: Select only needed fields + lean()
    const questions = await Question.find(query)
      .select('questionId serialNumber questionType question subject chapter topic questionImageUrl')
      .sort({ serialNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Question.countDocuments(query);

    // Get attempt status
    const questionIds = questions.map(q => q.questionId);
    const attempts = await QuestionAttempt.find({
      userId: req.user.userId,
      questionId: { $in: questionIds }
    })
    .select('questionId userAnswer')
    .lean();

    const attemptsMap = new Map(attempts.map(a => [a.questionId, a.userAnswer]));

    const questionsWithStatus = questions.map(q => ({
      ...q,
      status: attemptsMap.has(q.questionId) ? 'attempted' : 'unattempted',
      userAnswer: attemptsMap.get(q.questionId) || null
    }));

    const totalPages = Math.ceil(total / parseInt(limit));

    // 🔥 Cache the base list (2 hours)
    const cacheData = {
      questions,
      total,
      totalPages
    };
    await cacheService.redis?.setex(cacheKey, 7200, JSON.stringify(cacheData));

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

// 🔥 MAXIMUM PERFORMANCE: Get single FULL question
router.get('/:questionId', authenticate, questionLimiter, async (req, res) => {
  try {
    const { questionId } = req.params;

    // 🔥 Try cache first
    const cachedQuestion = await cacheService.getFullQuestion(questionId);

    if (cachedQuestion) {
      // Check attempt status
      const attempt = await QuestionAttempt.findOne({
        userId: req.user.userId,
        questionId: questionId
      })
      .select('userAnswer')
      .lean();

      // 🔥 PERFORMANCE: Check limits from cache
      let limits = await cacheService.getLimits(req.user.userId);
      
      if (!limits) {
        limits = await Limits.findOne({ userId: req.user.userId })
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
        
        // Cache limits
        const limitStatus = Limits.getLimitsForSubscription(limits.subscription);
        const limitsData = {
          limits: {
            questions: {
              used: limits.questionCount,
              limit: limitStatus.questions,
              reached: limits.questionCount >= limitStatus.questions
            }
          },
          resetTime: limits.limitResetTime
        };
        await cacheService.setLimits(req.user.userId, limitsData, 3600);
      }

      // Check if limit reached
      if (limits.limits?.questions?.reached) {
        return res.status(403).json({
          success: false,
          message: 'Daily question limit reached',
          limit: limits.limits.questions
        });
      }

      // Increment count (async - don't wait)
      Limits.updateOne(
        { userId: req.user.userId },
        { $inc: { questionCount: 1 } }
      ).exec();
      
      // Invalidate cache (async - don't wait)
      cacheService.invalidateLimits(req.user.userId);

      return res.json({
        success: true,
        question: {
          ...cachedQuestion,
          attempted: !!attempt,
          userAnswer: attempt?.userAnswer || null
        }
      });
    }

    // 🔥 CACHE MISS - Fetch from DB
    const question = await Question.findOne({ questionId: questionId }).lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check attempt
    const attempt = await QuestionAttempt.findOne({
      userId: req.user.userId,
      questionId: questionId
    })
    .select('userAnswer')
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

    // 🔥 Cache the question (2 hours)
    await cacheService.setFullQuestion(questionId, question, 7200);

    res.json({
      success: true,
      question: {
        ...question,
        attempted: !!attempt,
        userAnswer: attempt?.userAnswer || null
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

// 🔥 OPTIMIZED: Submit answer
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