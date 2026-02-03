// backend/models/UserData.js - FIXED DUPLICATE INDEX WARNING
const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
    // REMOVED: index: true (using schema.index() instead)
  },
  password: {
    type: String,
    required: true
  },
  userDetails: {
    type: Boolean,
    default: false
  },
  exam: {
    type: String,
    enum: ['jee', 'neet', null],
    default: null
  },
  // User Profile Details
  name: {
    type: String,
    maxlength: 50,
    default: null
  },
  profession: {
    type: String,
    enum: ['student', 'teacher', null],
    default: null
  },
  grade: {
    type: String,
    enum: ['9th', '10th', '11th', '12th', '12th passout', 'other', null],
    default: null
  },
  collegeName: {
    type: String,
    maxlength: 50,
    default: null
  },
  state: {
    type: String,
    default: null
  },
  lifeAmbition: {
    type: String,
    maxlength: 50,
    default: null
  },
  // Ticket System
  ticketNumber: {
    type: String,
    default: null
  },
  ticketStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  }
}, {
  timestamps: true
});

// 🔥 FIX: Create index only once using schema.index()
userDataSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('UserData', userDataSchema);