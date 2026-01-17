const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 150
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  issue: {
    type: String,
    required: true,
    maxlength: 150
  },
  conversation: [messageSchema],
  userMessageCount: {
    type: Number,
    default: 1  // Starts at 1 because issue is first message
  },
  maxUserMessages: {
    type: Number,
    default: 10
  },
  refundRequested: {
    type: Boolean,
    default: false
  },
  refundEligible: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ userId: 1 });
ticketSchema.index({ status: 1 });

// Method to check if user can add more messages
ticketSchema.methods.canAddUserMessage = function() {
  return this.userMessageCount < this.maxUserMessages;
};

module.exports = mongoose.model('Ticket', ticketSchema);