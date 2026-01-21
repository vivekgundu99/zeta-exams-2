const express = require('express');
const router = express.Router();
const Formula = require('../models/Formula');
const { authenticate, checkSubscription } = require('../middleware/auth');

// @route   GET /api/formulas/list
// @desc    Get all formulas for user's exam
// @access  Private (Gold only)
router.get('/list', authenticate, checkSubscription('gold'), async (req, res) => {
  try {
    const { examType, subject, chapter } = req.query;

    console.log('📖 Loading formulas:', { examType, subject, chapter });

    const query = {};
    if (examType) query.examType = examType;
    if (subject) query.subject = new RegExp(subject, 'i');
    if (chapter) query.chapter = new RegExp(chapter, 'i');

    const formulas = await Formula.find(query).sort({ subject: 1, chapter: 1 });

    console.log('✅ Found formulas:', formulas.length);

    res.json({
      success: true,
      count: formulas.length,
      formulas
    });

  } catch (error) {
    console.error('💥 Get formulas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/formulas/:examType/:subject/:chapter
// @desc    Get formulas for specific subject and chapter
// @access  Private (Gold only)
router.get('/:examType/:subject/:chapter', authenticate, checkSubscription('gold'), async (req, res) => {
  try {
    const { examType, subject, chapter } = req.params;

    const formulas = await Formula.find({
      examType,
      subject: new RegExp(subject, 'i'),
      chapter: new RegExp(chapter, 'i')
    });

    res.json({
      success: true,
      count: formulas.length,
      formulas
    });

  } catch (error) {
    console.error('Get formulas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;