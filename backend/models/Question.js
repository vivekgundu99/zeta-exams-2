// backend/models/Question.js - FIXED DUPLICATE INDEX WARNINGS
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    enum: ['jee', 'neet'],
    required: true
  },
  questionType: {
    type: String,
    enum: ['S', 'N'], // S = Single Correct MCQ, N = Numerical
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  chapter: {
    type: String,
    required: true
  },
  chapterId: {
    type: String,
    required: true // e.g., JM1, JP2, NC3
  },
  topic: {
    type: String,
    required: true
  },
  topicId: {
    type: String,
    required: true // e.g., A, B, C
  },
  question: {
    type: String,
    required: true
  },
  // For MCQ Questions
  optionA: {
    type: String,
    default: null
  },
  optionB: {
    type: String,
    default: null
  },
  optionC: {
    type: String,
    default: null
  },
  optionD: {
    type: String,
    default: null
  },
  // Answer
  answer: {
    type: String,
    required: true
  },
  // Image URLs (CloudFront)
  questionImageUrl: {
    type: String,
    default: null
  },
  optionAImageUrl: {
    type: String,
    default: null
  },
  optionBImageUrl: {
    type: String,
    default: null
  },
  optionCImageUrl: {
    type: String,
    default: null
  },
  optionDImageUrl: {
    type: String,
    default: null
  },
  explanation: {
    type: String,
    default: null
  },
  explanationImageUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// 🔥 FIX: Create indexes only once using schema.index()
questionSchema.index({ questionId: 1 }, { unique: true });
questionSchema.index({ serialNumber: 1 });
questionSchema.index({ examType: 1, subject: 1, chapter: 1, topic: 1 });
questionSchema.index({ chapterId: 1 });

module.exports = mongoose.model('Question', questionSchema);