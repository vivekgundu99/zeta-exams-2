const mongoose = require('mongoose');

const mockTestQuestionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ['S', 'N'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  chapter: String,
  topic: String,
  question: {
    type: String,
    required: true
  },
  optionA: String,
  optionB: String,
  optionC: String,
  optionD: String,
  answer: {
    type: String,
    required: true
  },
  questionImageUrl: String,
  optionAImageUrl: String,
  optionBImageUrl: String,
  optionCImageUrl: String,
  optionDImageUrl: String,
  explanation: String,
  explanationImageUrl: String
}, { _id: false });

const mockTestSchema = new mongoose.Schema({
  testId: {
    type: String,
    required: true,
    unique: true
  },
  examType: {
    type: String,
    enum: ['jee', 'neet'],
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 180 // minutes
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  questions: [mockTestQuestionSchema],
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Index for faster queries
mockTestSchema.index({ testId: 1 });
mockTestSchema.index({ examType: 1 });

module.exports = mongoose.model('MockTest', mockTestSchema);