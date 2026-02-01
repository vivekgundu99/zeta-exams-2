// backend/middleware/redisRateLimiter.js - REDIS-BASED RATE LIMITER
const cacheService = require('../services/cacheService');

// Generic rate limiter
const createRateLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      const windowSeconds = Math.floor(windowMs / 1000);
      
      const result = await cacheService.checkRateLimit(key, max, windowSeconds);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit || max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, (result.limit || max) - (result.current || 0)));
      res.setHeader('X-RateLimit-Reset', result.resetIn || windowSeconds);
      
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          message,
          retryAfter: result.resetIn
        });
      }
      
      // Track response for skip options
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(data) {
          const shouldSkip = 
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);
          
          if (shouldSkip) {
            // Decrement counter if we should skip
            cacheService.redis.decr(key).catch(err => console.error('Decr error:', err));
          }
          
          return originalSend.call(this, data);
        };
      }
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if Redis is down
      next();
    }
  };
};

// API rate limiter (General)
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  skipFailedRequests: true
});

// Auth rate limiter (Strict)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts, please try again after 15 minutes',
  skipFailedRequests: true
});

// OTP rate limiter (Very strict)
const otpLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: 'Too many OTP requests. Please try again after 10 minutes'
});

// Payment rate limiter
const paymentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many payment requests. Please try again later',
  skipFailedRequests: true
});

// Question rate limiter (Per user)
const questionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 questions per minute (0.5 per second)
  message: 'You are accessing questions too quickly. Please slow down',
  keyGenerator: (req) => `user:${req.user?.userId || 'anonymous'}`,
  skipFailedRequests: true
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  otpLimiter,
  paymentLimiter,
  questionLimiter
};