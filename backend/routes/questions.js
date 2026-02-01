// backend/routes/questions.js - WITH REDIS CACHING
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

// Get chapters for subject (WITH REDIS CACHING)
router.get('/chapters/:subject', authenticate, async (req, res) => {
  try {
    const { subject } = req.params;
    const { examType } = req.query;

    // 🔥 TRY CACHE FIRST
    const cachedChapters = await cacheService.getChapters(examType, subject);
    
    if (cachedChapters) {
      console.log('✅ Serving chapters from cache');
      return res.json({
        success: true,
        chapters: cachedChapters
      });
    }

    // 🔥 CACHE MISS
    console.log('⚠️ Cache miss - fetching chapters from database');

    const chapters = await Question.distinct('chapter', {
      examType,
      subject: new RegExp(subject, 'i')
    });

    // 🔥 CACHE IT
    await cacheService.setChapters(examType, subject, chapters, 7200); // 2 hours
    console.log('✅ Chapters cached successfully');

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

// Get topics for chapter (WITH REDIS CACHING)
router.get('/topics/:subject/:chapter', authenticate, async (req, res) => {
  try {
    const { subject, chapter } = req.params;
    const { examType } = req.query;

    // 🔥 TRY CACHE FIRST
    const cachedTopics = await cacheService.getTopics(examType, subject, chapter);
    
    if (cachedTopics) {
      console.log('✅ Serving topics from cache');
      return res.json({
        success: true,
        topics: cachedTopics
      });
    }

    // 🔥 CACHE MISS
    console.log('⚠️ Cache miss - fetching topics from database');

    const topics = await Question.distinct('topic', {
      examType,
      subject: new RegExp(subject, 'i'),
      chapter: new RegExp(chapter, 'i')
    });

    // 🔥 CACHE IT
    await cacheService.setTopics(examType, subject, chapter, topics, 7200); // 2 hours
    console.log('✅ Topics cached successfully');

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

// Get questions list with attempt status (WITH REDIS CACHING - NO OPTIONS)
router.get('/list', authenticate, questionLimiter, async (req, res) => {
  try {
    const { examType, subject, chapter, topic, page = 1, limit = 20 } = req.query;

    console.log('📚 Loading question list:', { examType, subject, chapter, topic, page });

    // 🔥 TRY CACHE FIRST (without options)
    const cacheKey = `${examType}:${subject}:${chapter}:${topic}:${page}`;
    const cachedList = await cacheService.getQuestionList(examType, subject, chapter, topic, page);

    if (cachedList) {
      console.log('✅ Serving question list from cache');
      
      // Still need to get attempt status from DB (not cached because it changes frequently)
      const questionIds = cachedList.questions.map(q => q.questionId);
      const attempts = await QuestionAttempt.find({
        userId: req.user.userId,
        questionId: { $in: questionIds }
      }).select('questionId userAnswer');

      const attemptsMap = new Map(attempts.map(a => [a.questionId, a.userAnswer]));

      const questionsWithStatus = cachedList.questions.map(q => ({
        ...q,
        status: attemptsMap.has(q.questionId) ? 'attempted' : 'unattempted',
        userAnswer: attemptsMap.get(q.questionId) || null
      }));

      return res.json({
        success: true,
        count: questionsWithStatus.length,
        total: cachedList.total,
        page: parseInt(page),
        totalPages: cachedList.totalPages,
        questions: questionsWithStatus
      });
    }

    // 🔥 CACHE MISS
    console.log('⚠️ Cache miss - fetching question list from database');

    const query = { examType };
    if (subject) query.subject = new RegExp(subject, 'i');
    if (chapter) query.chapter = new RegExp(chapter, 'i');
    if (topic) query.topic = new RegExp(topic, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔥 ONLY SELECT MINIMAL FIELDS (no options, no answers)
    const questions = await Question.find(query)
      .select('questionId serialNumber questionType question subject chapter topic questionImageUrl')
      .sort({ serialNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    const total = await Question.countDocuments(query);

    // Get attempt status
    const questionIds = questions.map(q => q.questionId);
    const attempts = await QuestionAttempt.find({
      userId: req.user.userId,
      questionId: { $in: questionIds }
    }).select('questionId userAnswer');

    const attemptsMap = new Map(attempts.map(a => [a.questionId, a.userAnswer]));

    const questionsWithStatus = questions.map(q => ({
      ...q,
      status: attemptsMap.has(q.questionId) ? 'attempted' : 'unattempted',
      userAnswer: attemptsMap.get(q.questionId) || null
    }));

    const totalPages = Math.ceil(total / parseInt(limit));

    // 🔥 CACHE THE LIST (without attempt status)
    const cacheData = {
      questions,
      total,
      totalPages
    };
    await cacheService.setQuestionList(examType, subject, chapter, topic, page, cacheData, 7200);
    console.log('✅ Question list cached successfully');

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

// Get single FULL question with attempt data (WITH REDIS CACHING + RATE LIMITING)
router.get('/:questionId', authenticate, questionLimiter, async (req, res) => {
  try {
    const { questionId } = req.params;

    console.log('📝 Loading full question:', questionId);

    // 🔥 TRY CACHE FIRST (full question with options)
    const cachedQuestion = await cacheService.getFullQuestion(questionId);

    if (cachedQuestion) {
      console.log('✅ Serving full question from cache');
      
      // Still check attempt status from DB
      const attempt = await QuestionAttempt.findOne({
        userId: req.user.userId,
        questionId: questionId
      });

      // Check limits (always fresh)
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

        // 🔥 INVALIDATE LIMITS CACHE
        await cacheService.invalidateLimits(req.user.userId);
      }

      const limitStatus = limits.checkLimits();
      if (limitStatus.questions.reached) {
        return res.status(403).json({
          success: false,
          message: 'Daily question limit reached',
          limit: limitStatus.questions
        });
      }

      // Increment count
      limits.questionCount += 1;
      await limits.save();

      // 🔥 INVALIDATE LIMITS CACHE
      await cacheService.invalidateLimits(req.user.userId);

      console.log(`📊 Question count incremented: ${limits.questionCount}`);

      return res.json({
        success: true,
        question: {
          ...cachedQuestion,
          attempted: !!attempt,
          userAnswer: attempt?.userAnswer || null
        }
      });
    }

    // 🔥 CACHE MISS - FETCH FULL QUESTION
    console.log('⚠️ Cache miss - fetching full question from database');

    const question = await Question.findOne({ questionId: questionId }).lean();

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

    // Check and update limits
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

      // 🔥 INVALIDATE LIMITS CACHE
      await cacheService.invalidateLimits(req.user.userId);
    }

    const limitStatus = limits.checkLimits();
    if (limitStatus.questions.reached) {
      return res.status(403).json({
        success: false,
        message: 'Daily question limit reached',
        limit: limitStatus.questions
      });
    }

    // Increment count
    limits.questionCount += 1;
    await limits.save();

    // 🔥 INVALIDATE LIMITS CACHE (since count changed)
    await cacheService.invalidateLimits(req.user.userId);

    console.log(`📊 Question count incremented: ${limits.questionCount}`);

    // 🔥 CACHE THE FULL QUESTION
    await cacheService.setFullQuestion(questionId, question, 7200); // 2 hours
    console.log('✅ Full question cached successfully');

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

// Submit answer (NO CACHING - Always fresh write)
router.post('/submit-answer', authenticate, questionLimiter, async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;

    console.log('📝 Submitting answer:', { questionId, userAnswer });

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

      // 🔥 INVALIDATE ANALYTICS CACHE
      await cacheService.invalidateAnalytics(req.user.userId);
      console.log('✅ Analytics cache invalidated after answer submission');
    }

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