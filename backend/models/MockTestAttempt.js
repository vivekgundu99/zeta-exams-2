const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  timeTaken: Number, // seconds
  flagged: { type: Boolean, default: false }
}, { _id: false });

const mockTestAttemptSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  testId: {
    type: String,
    required: true,
    ref: 'MockTest'
  },
  examType: {
    type: String,
    enum: ['jee', 'neet'],
    required: true
  },
  testName: String,
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'abandoned'],
    default: 'ongoing'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  timeTaken: {
    type: Number,
    default: 0 // minutes
  },
  answers: [answerSchema],
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  attemptedQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  unanswered: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
mockTestAttemptSchema.index({ userId: 1, testId: 1 });
mockTestAttemptSchema.index({ status: 1 });

// Method to calculate results
mockTestAttemptSchema.methods.calculateResults = function() {
  this.attemptedQuestions = this.answers.filter(a => a.userAnswer).length;
  this.correctAnswers = this.answers.filter(a => a.isCorrect).length;
  this.incorrectAnswers = this.attemptedQuestions - this.correctAnswers;
  this.unanswered = this.totalQuestions - this.attemptedQuestions;
  this.accuracy = this.attemptedQuestions > 0 
    ? (this.correctAnswers / this.attemptedQuestions * 100).toFixed(2) 
    : 0;
  
  // Calculate score (for JEE: +4 for correct, -1 for wrong)
  this.score = (this.correctAnswers * 4) - this.incorrectAnswers;
};

module.exports = mongoose.model('MockTestAttempt', mockTestAttemptSchema);