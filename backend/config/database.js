// backend/config/database.js - PERFORMANCE OPTIMIZED
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // 🔥 PERFORMANCE: Optimized connection settings
      maxPoolSize: 10, // Increased pool size
      minPoolSize: 2,  // Maintain minimum connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      
      // 🔥 PERFORMANCE: Read preference
      readPreference: 'primaryPreferred',
      
      // 🔥 PERFORMANCE: Write concern
      w: 'majority',
      wtimeoutMS: 5000,
      
      // 🔥 PERFORMANCE: Retry writes
      retryWrites: true,
      retryReads: true,
      
      // 🔥 PERFORMANCE: Compression
      compressors: ['zlib'],
      zlibCompressionLevel: 6
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // 🔥 PERFORMANCE: Enable query logging in development only
    if (process.env.NODE_ENV !== 'production') {
      mongoose.set('debug', true);
    }
    
    // 🔥 PERFORMANCE: Set default lean behavior for better performance
    mongoose.Query.prototype.setOptions({
      lean: false // Keep normal for compatibility, but use .lean() in queries
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // 🔥 PERFORMANCE: Monitor slow queries
    mongoose.connection.on('slow', (event) => {
      console.warn('⚠️ Slow query detected:', {
        duration: event.duration,
        op: event.op,
        collection: event.collection
      });
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;