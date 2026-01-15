const mongoose = require('mongoose');

const chapterStatsSchema = new mongoose.Schema({
  chapterId: String, // e.g., JM1, NP2
  chapterName: String,
  totalAttempted: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }
}, { _id: false });

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  subscription: {
    type: String,
    enum: ['gold'],
    required: true
  },
  exam: {
    type: String,
    enum: ['jee', 'neet'],
    required: true
  },
  // Subject-wise Analytics
  physics: {
    totalAttempted: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    chapters: [chapterStatsSchema]
  },
  chemistry: {
    totalAttempted: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    chapters: [chapterStatsSchema]
  },
  mathematics: {
    totalAttempted: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    chapters: [chapterStatsSchema]
  },
  biology: {
    totalAttempted: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    chapters: [chapterStatsSchema]
  },
  // Overall Stats
  overallStats: {
    totalQuestions: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    overallAccuracy: { type: Number, default: 0 },
    totalChapterTests: { type: Number, default: 0 },
    totalMockTests: { type: Number, default: 0 }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
analyticsSchema.index({ userId: 1 });

// Method to update chapter statistics
analyticsSchema.methods.updateChapterStats = function(subject, chapterId, chapterName, isCorrect) {
  if (!this[subject]) return;
  
  // Update overall subject stats
  this[subject].totalAttempted += 1;
  if (isCorrect) this[subject].correctAnswers += 1;
  this[subject].accuracy = (this[subject].correctAnswers / this[subject].totalAttempted * 100).toFixed(2);
  
  // Update chapter stats
  let chapter = this[subject].chapters.find(c => c.chapterId === chapterId);
  if (!chapter) {
    chapter = {
      chapterId,
      chapterName,
      totalAttempted: 0,
      correctAnswers: 0,
      accuracy: 0
    };
    this[subject].chapters.push(chapter);
  }
  
  chapter.totalAttempted += 1;
  if (isCorrect) chapter.correctAnswers += 1;
  chapter.accuracy = (chapter.correctAnswers / chapter.totalAttempted * 100).toFixed(2);
  
  // Update overall stats
  this.overallStats.totalQuestions += 1;
  if (isCorrect) this.overallStats.totalCorrect += 1;
  this.overallStats.overallAccuracy = (this.overallStats.totalCorrect / this.overallStats.totalQuestions * 100).toFixed(2);
  
  this.lastUpdated = Date.now();
};

// Method to get top/bottom chapters
analyticsSchema.methods.getTopChapters = function(subject, limit = 5) {
  if (!this[subject] || !this[subject].chapters) return [];
  
  return this[subject].chapters
    .filter(c => c.totalAttempted > 0)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);
};

analyticsSchema.methods.getWeakChapters = function(subject, limit = 5) {
  if (!this[subject] || !this[subject].chapters) return [];
  
  return this[subject].chapters
    .filter(c => c.totalAttempted > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
};

module.exports = mongoose.model('Analytics', analyticsSchema);