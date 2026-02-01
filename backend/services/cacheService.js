// backend/services/cacheService.js - COMPREHENSIVE REDIS CACHE SERVICE
const { getRedisClient, isRedisAvailable } = require('../config/redis');

class CacheService {
  constructor() {
    this.redis = null;
    this.defaultTTL = 3600; // 1 hour
  }

  // Initialize Redis client
  init() {
    this.redis = getRedisClient();
  }

  // Check if cache is available
  isAvailable() {
    return isRedisAvailable();
  }

  // ==========================================
  // LIMITS CACHING (Most Critical)
  // ==========================================
  
  async getLimits(userId) {
    if (!this.isAvailable()) return null;
    
    try {
      const key = `limits:${userId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: Limits for ${userId}`);
        return JSON.parse(cached);
      }
      
      console.log(`⚠️ Cache MISS: Limits for ${userId}`);
      return null;
    } catch (error) {
      console.error('Redis getLimits error:', error);
      return null;
    }
  }

  async setLimits(userId, limits, ttl = 3600) {
    if (!this.isAvailable()) return false;
    
    try {
      const key = `limits:${userId}`;
      await this.redis.setex(key, ttl, JSON.stringify(limits));
      console.log(`✅ Cache SET: Limits for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis setLimits error:', error);
      return false;
    }
  }

  async invalidateLimits(userId) {
    if (!this.isAvailable()) return false;
    
    try {
      const key = `limits:${userId}`;
      await this.redis.del(key);
      console.log(`✅ Cache INVALIDATE: Limits for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis invalidateLimits error:', error);
      return false;
    }
  }

  // ==========================================
  // USER PROFILE CACHING
  // ==========================================
  
  async getUserProfile(userId) {
    if (!this.isAvailable()) return null;
    
    try {
      const key = `profile:${userId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: Profile for ${userId}`);
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Redis getUserProfile error:', error);
      return null;
    }
  }

  async setUserProfile(userId, profile, ttl = 1800) { // 30 minutes
    if (!this.isAvailable()) return false;
    
    try {
      const key = `profile:${userId}`;
      await this.redis.setex(key, ttl, JSON.stringify(profile));
      console.log(`✅ Cache SET: Profile for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis setUserProfile error:', error);
      return false;
    }
  }

  async invalidateUserProfile(userId) {
    if (!this.isAvailable()) return false;
    
    try {
      const key = `profile:${userId}`;
      await this.redis.del(key);
      console.log(`✅ Cache INVALIDATE: Profile for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis invalidateUserProfile error:', error);
      return false;
    }
  }

  // ==========================================
  // SUBSCRIPTION CACHING
  // ==========================================
  
  async getSubscription(userId) {
    if (!this.isAvailable()) return null;
    
    try {
      const key = `subscription:${userId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: Subscription for ${userId}`);
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Redis getSubscription error:', error);
      return null;
    }
  }

  async setSubscription(userId, subscription, ttl = 3600) { // 1 hour
    if (!this.isAvailable()) return false;
    
    try {
      const key = `subscription:${userId}`;
      await this.redis.setex(key, ttl, JSON.stringify(subscription));
      console.log(`✅ Cache SET: Subscription for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis setSubscription error:', error);
      return false;
    }
  }

  async invalidateSubscription(userId) {
    if (!this.isAvailable()) return false;
    
    try {
      const key = `subscription:${userId}`;
      await this.redis.del(key);
      console.log(`✅ Cache INVALIDATE: Subscription for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis invalidateSubscription error:', error);
      return false;
    }
  }

  // ==========================================
  // QUESTION LIST CACHING (without options)
  // ==========================================
  
  async getQuestionList(examType, subject, chapter, topic, page) {
    if (!this.isAvailable()) return null;
    
    try {
      const key = `questions:list:${examType}:${subject}:${chapter}:${topic}:${page}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: Question list`);
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Redis getQuestionList error:', error);
      return null;
    }
  }

  async setQuestionList(examType, subject, chapter, topic, page, questions, ttl = 7200) { // 2 hours
    if (!this.isAvailable()) return false;
    
    try {
      const key = `questions:list:${examType}:${subject}:${chapter}:${topic}:${page}`;
      await this.redis.setex(key, ttl, JSON.stringify(questions));
      console.log(`✅ Cache SET: Question list`);
      return true;
    } catch (error) {
      console.error('Redis setQuestionList error:', error);
      return false;
    }
  }

  // ==========================================
  // FULL QUESTION CACHING (with options)
  // ==========================================
  
  async getFullQuestion(questionId) {
    if (!this.isAvailable()) return null;
    
    try {
      const key = `question:full:${questionId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: Full question ${questionId}`);
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Redis getFullQuestion error:', error);
      return null;
    }
  }

  async setFullQuestion(questionId, question, ttl = 7200) { // 2 hours
    if (!this.isAvailable()) return false;
    
    try {
      const key = `question:full:${questionId}`;
      await this.redis.setex(key, ttl, JSON.stringify(question));
      console.log(`✅ Cache SET: Full question ${questionId}`);
      return true;
    } catch (error) {
      console.error('Redis setFullQuestion error:', error);
      return false;
    }
  }

  // ==========================================
  // ANALYTICS CACHING (Gold users)
  // ==========================================
  
  async getAnalytics(userId) {
    if (!this.isAvailable()) return null;
    
    try {
      const key = `analytics:${userId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: Analytics for ${userId}`);
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Redis getAnalytics error:', error);
      return null;
    }
  }

  async setAnalytics(userId, analytics, ttl = 300) { // 5 minutes
    if (!this.isAvailable()) return false;
    
    try {
      const key = `analytics:${userId}`;
      await this.redis.setex(key, ttl, JSON.stringify(analytics));
      console.log(`✅ Cache SET: Analytics for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis setAnalytics error:', error);
      return false;
    }
  }

  async invalidateAnalytics(userId) {
    if (!this.isAvailable()) return false;
    
    try {
      const key = `analytics:${userId}`;
      await this.redis.del(key);
      console.log(`✅ Cache INVALIDATE: Analytics for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis invalidateAnalytics error:', error);
      return false;
    }
  }

  // ==========================================
  // CHAPTER/TOPIC LIST CACHING
  // ==========================================
  
  async getChapters(examType, subject) {
    if (!this.isAvailable()) return null;
    
    try {
      const key = `chapters:${examType}:${subject}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: Chapters`);
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Redis getChapters error:', error);
      return null;
    }
  }

  async setChapters(examType, subject, chapters, ttl = 7200) { // 2 hours
    if (!this.isAvailable()) return false;
    
    try {
      const key = `chapters:${examType}:${subject}`;
      await this.redis.setex(key, ttl, JSON.stringify(chapters));
      console.log(`✅ Cache SET: Chapters`);
      return true;
    } catch (error) {
      console.error('Redis setChapters error:', error);
      return false;
    }
  }

  async getTopics(examType, subject, chapter) {
    if (!this.isAvailable()) return null;
    
    try {
      const key = `topics:${examType}:${subject}:${chapter}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: Topics`);
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Redis getTopics error:', error);
      return null;
    }
  }

  async setTopics(examType, subject, chapter, topics, ttl = 7200) { // 2 hours
    if (!this.isAvailable()) return false;
    
    try {
      const key = `topics:${examType}:${subject}:${chapter}`;
      await this.redis.setex(key, ttl, JSON.stringify(topics));
      console.log(`✅ Cache SET: Topics`);
      return true;
    } catch (error) {
      console.error('Redis setTopics error:', error);
      return false;
    }
  }

  // ==========================================
  // RATE LIMITING
  // ==========================================
  
  async checkRateLimit(key, limit, window) {
    if (!this.isAvailable()) return { allowed: true };
    
    try {
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        await this.redis.expire(key, window);
      }
      
      const ttl = await this.redis.ttl(key);
      
      return {
        allowed: current <= limit,
        current,
        limit,
        resetIn: ttl
      };
    } catch (error) {
      console.error('Redis checkRateLimit error:', error);
      return { allowed: true };
    }
  }

  // ==========================================
  // BULK INVALIDATION
  // ==========================================
  
  async invalidateUserCache(userId) {
    if (!this.isAvailable()) return false;
    
    try {
      const keys = [
        `limits:${userId}`,
        `profile:${userId}`,
        `subscription:${userId}`,
        `analytics:${userId}`
      ];
      
      await this.redis.del(...keys);
      console.log(`✅ Cache INVALIDATE: All cache for ${userId}`);
      return true;
    } catch (error) {
      console.error('Redis invalidateUserCache error:', error);
      return false;
    }
  }

  // ==========================================
  // CACHE STATISTICS
  // ==========================================
  
  async getCacheStats() {
    if (!this.isAvailable()) return null;
    
    try {
      const info = await this.redis.info('stats');
      const dbsize = await this.redis.dbsize();
      
      return {
        connected: true,
        dbsize,
        info
      };
    } catch (error) {
      console.error('Redis getCacheStats error:', error);
      return null;
    }
  }

  // ==========================================
  // CLEAR ALL CACHE (Admin only)
  // ==========================================
  
  async clearAllCache() {
    if (!this.isAvailable()) return false;
    
    try {
      await this.redis.flushdb();
      console.log(`✅ Cache CLEARED: All cache cleared`);
      return true;
    } catch (error) {
      console.error('Redis clearAllCache error:', error);
      return false;
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
module.exports = cacheService;