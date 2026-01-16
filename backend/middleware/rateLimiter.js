const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // FIX: Use simpler key generator for Vercel
  keyGenerator: (req) => {
    return req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  },
  skipFailedRequests: true,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Strict rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // FIX: Use simpler key generator for Vercel
  keyGenerator: (req) => {
    return req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  },
  skipFailedRequests: true,
});

// OTP rate limiter
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 OTP requests per 10 minutes
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  },
  skipFailedRequests: true,
});

// Payment rate limiter
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 payment requests per hour
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  },
  skipFailedRequests: true,
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  paymentLimiter
};