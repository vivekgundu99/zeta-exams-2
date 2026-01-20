const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Limits = require('../models/Limits');
const Analytics = require('../models/Analytics');
const Subscription = require('../models/Subscription');
const { authenticate } = require('../middleware/auth');
const { needsLimitReset, getNextResetTime } = require('../utils/helpers');

// @route   POST /api/tests/generate-chapter-test
// @desc    Generate a chapter test with 10 random questions
// @access  Private
router.post('/generate-chapter-test', authenticate, async (req, res) => {
  try {
    const { examType, subject, chapter } = req.body;

    console.log('🎯 Generate chapter test:', { examType, subject, chapter });

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

    // Get questions
    const questions = await Question.find({
      examType,
      subject: new RegExp(`^${subject}$`, 'i'),
      chapter: new RegExp(`^${chapter}$`, 'i')
    });

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
        chapter
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

// @route   POST /api/tests/submit-chapter-test
// @desc    Submit chapter test and get results
// @access  Private
router.post('/submit-chapter-test', authenticate, async (req, res) => {
  try {
    const { answers } = req.body;

    console.log('📝 Submit chapter test:', { answersCount: answers?.length });

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