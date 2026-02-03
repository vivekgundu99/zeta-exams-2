// backend/models/QuestionAttempt.js - UPDATED WITH FAVORITE
const mongoose = require('mongoose');

const questionAttemptSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  questionId: {
    type: String,
    required: true,
    ref: 'Question'
  },
  userAnswer: {
    type: String,
    required: true
  },
  // 🔥 NEW: Favorite feature
  isFavorite: {
    type: Boolean,
    default: false
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for faster queries
questionAttemptSchema.index({ userId: 1, questionId: 1 }, { unique: true });
// 🔥 NEW: Index for favorite queries
questionAttemptSchema.index({ userId: 1, isFavorite: 1 });

module.exports = mongoose.model('QuestionAttempt', questionAttemptSchema);