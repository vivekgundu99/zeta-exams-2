const mongoose = require('mongoose');

const formulaSchema = new mongoose.Schema({
  examType: {
    type: String,
    enum: ['jee', 'neet'],
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
  topicName: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
formulaSchema.index({ examType: 1, subject: 1, chapter: 1 });

module.exports = mongoose.model('Formula', formulaSchema);