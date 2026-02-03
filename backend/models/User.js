// backend/models/User.js - FIXED DUPLICATE INDEX WARNING
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
    // REMOVED: index: true (using schema.index() instead)
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
    // REMOVED: index: true (using schema.index() instead)
  },
  phoneNumber: {
    type: String,
    required: true
    // REMOVED: index: true (using schema.index() instead)
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

// 🔥 FIX: Create indexes only once using schema.index()
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);