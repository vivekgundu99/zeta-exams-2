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
  attemptedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for faster queries
questionAttemptSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('QuestionAttempt', questionAttemptSchema);