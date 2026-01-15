const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const { authenticate, checkSubscription } = require('../middleware/auth');

// @route   GET /api/analytics/overview
// @desc    Get overall analytics for Gold user
// @access  Private (Gold only)
router.get('/overview', authenticate, checkSubscription('gold'), async (req, res) => {
  try {
    let analytics = await Analytics.findOne({ userId: req.user.userId });

    if (!analytics) {
      // Create new analytics if doesn't exist
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({ userId: req.user.userId });

      analytics = await Analytics.create({
        userId: req.user.userId,
        subscription: 'gold',
        exam: subscription.exam
      });
    }

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/analytics/subject/:subject
// @desc    Get subject-wise analytics
// @access  Private (Gold only)
router.get('/subject/:subject', authenticate, checkSubscription('gold'), async (req, res) => {
  try {
    const { subject } = req.params;
    const analytics = await Analytics.findOne({ userId: req.user.userId });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics not found'
      });
    }

    const subjectData = analytics[subject.toLowerCase()];

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: 'Subject data not found'
      });
    }

    // Get top and weak chapters
    const topChapters = analytics.getTopChapters(subject.toLowerCase(), 5);
    const weakChapters = analytics.getWeakChapters(subject.toLowerCase(), 5);

    res.json({
      success: true,
      subject: subject,
      data: subjectData,
      topChapters,
      weakChapters
    });

  } catch (error) {
    console.error('Get subject analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/analytics/update
// @desc    Update analytics (called after answering questions)
// @access  Private (Gold only)
router.post('/update', authenticate, checkSubscription('gold'), async (req, res) => {
  try {
    const { subject, chapterId, chapterName, isCorrect } = req.body;

    let analytics = await Analytics.findOne({ userId: req.user.userId });

    if (!analytics) {
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({ userId: req.user.userId });

      analytics = await Analytics.create({
        userId: req.user.userId,
        subscription: 'gold',
        exam: subscription.exam
      });
    }

    // Update chapter stats
    analytics.updateChapterStats(
      subject.toLowerCase(),
      chapterId,
      chapterName,
      isCorrect
    );

    await analytics.save();

    res.json({
      success: true,
      message: 'Analytics updated successfully'
    });

  } catch (error) {
    console.error('Update analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;