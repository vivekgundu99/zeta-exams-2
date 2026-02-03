// backend/routes/tests.js - WITH FAVORITE FILTER AND TIMER
const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const QuestionAttempt = require('../models/QuestionAttempt');
const Limits = require('../models/Limits');
const Analytics = require('../models/Analytics');
const Subscription = require('../models/Subscription');
const { authenticate } = require('../middleware/auth');
const { needsLimitReset, getNextResetTime } = require('../utils/helpers');

// 🔥 UPDATED: Generate chapter test with favorite filter
router.post('/generate-chapter-test', authenticate, async (req, res) => {
  try {
    const { examType, subject, chapter, filter } = req.body; // 🔥 NEW: filter param

    console.log('🎯 Generate chapter test:', { examType, subject, chapter, filter });

    if (!examType || !subject || !chapter) {
      return res.status(400).json({
        success: false,
        message: 'Exam type, subject, and chapter are required'
      });
    }

    // Check limits
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

    if (needsLimitReset(limits.limitResetTime)) {
      limits.chapterTestCount = 0;
      limits.chapterTestCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
    }

    const limitStatus = limits.checkLimits();
    if (limitStatus.chapterTests.reached) {
      return res.status(403).json({
        success: false,
        message: 'Daily chapter test limit reached',
        limit: limitStatus.chapterTests
      });
    }

    // Build query
    let query = {
      examType,
      subject: new RegExp(`^${subject}$`, 'i')
    };

    // If NOT "ALL_CHAPTERS", filter by specific chapter
    if (chapter !== 'ALL_CHAPTERS') {
      query.chapter = new RegExp(`^${chapter}$`, 'i');
    }

    // 🔥 NEW: Filter by favorites
    if (filter === 'favorites') {
      const favoriteAttempts = await QuestionAttempt.find({
        userId: req.user.userId,
        isFavorite: true
      }).select('questionId').lean();

      const favoriteQuestionIds = favoriteAttempts.map(a => a.questionId);

      if (favoriteQuestionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No favorite questions found in this chapter'
        });
      }

      query.questionId = { $in: favoriteQuestionIds };
    }

    console.log('📚 Query:', query);

    const questions = await Question.find(query);

    console.log(`📚 Found ${questions.length} questions`);

    if (questions.length < 10) {
      return res.status(400).json({
        success: false,
        message: `Not enough questions. Found ${questions.length}, need 10`
      });
    }

    // Shuffle and pick 10
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const testQuestions = shuffled.slice(0, 10);

    // Increment counter
    limits.chapterTestCount += 1;
    await limits.save();

    console.log('✅ Test generated successfully');

    res.json({
      success: true,
      test: {
        questions: testQuestions,
        totalQuestions: 10,
        subject,
        chapter: chapter === 'ALL_CHAPTERS' ? 'All Chapters' : chapter,
        // 🔥 NEW: Add start time for timer
        startTime: new Date()
      }
    });

  } catch (error) {
    console.error('💥 Generate test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// 🔥 UPDATED: Submit with duration
router.post('/submit-chapter-test', authenticate, async (req, res) => {
  try {
    const { answers, duration } = req.body; // 🔥 NEW: duration param

    console.log('📝 Submit chapter test:', { answersCount: answers?.length, duration });

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required'
      });
    }

    let correctCount = 0;
    const results = [];

    for (const answer of answers) {
      const question = await Question.findOne({ questionId: answer.questionId });
      
      if (question) {
        const isCorrect = answer.userAnswer === question.answer;
        if (isCorrect) correctCount++;

        results.push({
          questionId: question.questionId,
          question: question.question,
          userAnswer: answer.userAnswer,
          correctAnswer: question.answer,
          isCorrect,
          explanation: question.explanation,
          explanationImageUrl: question.explanationImageUrl
        });

        // Update analytics
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
          
          analytics.overallStats.totalChapterTests += 1;
          await analytics.save();
        }
      }
    }

    const score = correctCount;
    const accuracy = ((correctCount / answers.length) * 100).toFixed(2);

    console.log('✅ Test submitted:', { score, accuracy });

    res.json({
      success: true,
      results: {
        score,
        totalQuestions: answers.length,
        accuracy,
        correctAnswers: correctCount,
        incorrectAnswers: answers.length - correctCount,
        duration, // 🔥 NEW: Return duration
        details: results
      }
    });

  } catch (error) {
    console.error('💥 Submit test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;