// backend/models/Wallet.js - WALLET SYSTEM
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['topup', 'debit', 'admin_credit', 'admin_debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  adminNote: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: {
    type: [transactionSchema],
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
walletSchema.index({ userId: 1 });

// Method to add money (top-up)
walletSchema.methods.addMoney = function(amount, razorpayOrderId, razorpayPaymentId) {
  this.balance += amount;
  this.transactions.unshift({
    type: 'topup',
    amount: amount,
    description: `Wallet top-up of ₹${amount}`,
    razorpayOrderId,
    razorpayPaymentId,
    timestamp: new Date()
  });
  this.lastUpdated = new Date();
  return this.save();
};

// Method to deduct money (for subscription purchase)
walletSchema.methods.deductMoney = function(amount, description) {
  if (this.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  
  this.balance -= amount;
  this.transactions.unshift({
    type: 'debit',
    amount: amount,
    description: description,
    timestamp: new Date()
  });
  this.lastUpdated = new Date();
  return this.save();
};

// Method for admin to add money
walletSchema.methods.adminAddMoney = function(amount, adminNote) {
  this.balance += amount;
  this.transactions.unshift({
    type: 'admin_credit',
    amount: amount,
    description: `Admin credit of ₹${amount}`,
    adminNote: adminNote || 'Manual credit by admin',
    timestamp: new Date()
  });
  this.lastUpdated = new Date();
  return this.save();
};

// Method for admin to deduct money
walletSchema.methods.adminDeductMoney = function(amount, adminNote) {
  if (this.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  
  this.balance -= amount;
  this.transactions.unshift({
    type: 'admin_debit',
    amount: amount,
    description: `Admin debit of ₹${amount}`,
    adminNote: adminNote || 'Manual debit by admin',
    timestamp: new Date()
  });
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get or create wallet
walletSchema.statics.getOrCreateWallet = async function(userId) {
  let wallet = await this.findOne({ userId });
  
  if (!wallet) {
    wallet = await this.create({
      userId,
      balance: 0,
      transactions: []
    });
  }
  
  return wallet;
};

module.exports = mongoose.model('Wallet', walletSchema);