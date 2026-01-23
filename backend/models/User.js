// backend/models/User.js - UPDATED WITH SESSION VERSION
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // 🔥 SESSION VERSION - KEY FIELD FOR SINGLE DEVICE LOGIN
  sessionVersion: {
    type: Number,
    default: 0,
    required: true
  },
  
  // Deprecated - no longer used for login control
  loginStatus: {
    type: Boolean,
    default: false
  },
  
  lastLoginTime: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model('User', userSchema);