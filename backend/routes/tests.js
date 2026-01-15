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

    if (!examType || !subject || !chapter) {
      return res.status(400).json({
        success: false,
        message: 'Exam type, subject, and chapter are required'
      });
    }

    // Check and reset limits if needed
    const limits = await Limits.findOne({ userId: req.user.userId });
    
    if (limits && needsLimitReset(limits.limitResetTime)) {
      limits.chapterTestCount = 0;
      limits.chapterTestCountLimitReached = false;
      limits.limitResetTime = getNextResetTime();
      await limits.save();
    }

    // Check chapter test limit
    const limitStatus = limits.checkLimits();
    if (limitStatus.chapterTests.reached) {
      return res.status(403).json({
        success: false,
        message: 'Daily chapter test limit reached',
        limit: limitStatus.chapterTests
      });
    }

    // Get all questions from the chapter
    const questions = await Question.find({
      examType,
      subject: new RegExp(subject, 'i'),
      chapter: new RegExp(chapter, 'i')
    });

    if (questions.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Not enough questions in this chapter to generate a test'
      });
    }

    // Shuffle and pick 10 random questions
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const testQuestions = shuffled.slice(0, 10);

    // Increment chapter test count
    limits.chapterTestCount += 1;
    await limits.save();

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
    console.error('Generate chapter test error:', error);
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

        // Update analytics for Gold users
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
      }
    }

    const score = correctCount;
    const accuracy = ((correctCount / answers.length) * 100).toFixed(2);

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
    console.error('Submit chapter test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;