// backend/services/cacheService.js - PERFORMANCE ENHANCED
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

  // 🔥 PERFORMANCE: Safe get with fallback
  async safeGet(key) {
    if (!this.isAvailable()) return null;
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error(`Redis GET error for ${key}:`, error.message);
      return null;
    }
  }

  // 🔥 PERFORMANCE: Safe set with fallback
  async safeSet(key, value, ttl) {
    if (!this.isAvailable()) return false;
    try {
      await this.redis.setex(key, ttl, value);
      return true;
    } catch (error) {
      console.error(`Redis SET error for ${key}:`, error.message);
      return false;
    }
  }

  // ==========================================
  // LIMITS CACHING (Most Critical)
  // ==========================================
  
  async getLimits(userId) {
    const cached = await this.safeGet(`limits:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setLimits(userId, limits, ttl = 3600) {
    return await this.safeSet(`limits:${userId}`, JSON.stringify(limits), ttl);
  }

  async invalidateLimits(userId) {
    if (!this.isAvailable()) return false;
    try {
      await this.redis.del(`limits:${userId}`);
      return true;
    } catch (error) {
      console.error('Redis invalidateLimits error:', error.message);
      return false;
    }
  }

  // ==========================================
  // USER PROFILE CACHING
  // ==========================================
  
  async getUserProfile(userId) {
    const cached = await this.safeGet(`profile:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setUserProfile(userId, profile, ttl = 1800) {
    return await this.safeSet(`profile:${userId}`, JSON.stringify(profile), ttl);
  }

  async invalidateUserProfile(userId) {
    if (!this.isAvailable()) return false;
    try {
      await this.redis.del(`profile:${userId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==========================================
  // SUBSCRIPTION CACHING
  // ==========================================
  
  async getSubscription(userId) {
    const cached = await this.safeGet(`subscription:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setSubscription(userId, subscription, ttl = 3600) {
    return await this.safeSet(`subscription:${userId}`, JSON.stringify(subscription), ttl);
  }

  async invalidateSubscription(userId) {
    if (!this.isAvailable()) return false;
    try {
      await this.redis.del(`subscription:${userId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==========================================
  // QUESTION LIST CACHING
  // ==========================================
  
  async getQuestionList(examType, subject, chapter, topic, page) {
    const key = `questions:list:${examType}:${subject}:${chapter}:${topic}:${page}`;
    const cached = await this.safeGet(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setQuestionList(examType, subject, chapter, topic, page, questions, ttl = 7200) {
    const key = `questions:list:${examType}:${subject}:${chapter}:${topic}:${page}`;
    return await this.safeSet(key, JSON.stringify(questions), ttl);
  }

  // ==========================================
  // FULL QUESTION CACHING
  // ==========================================
  
  async getFullQuestion(questionId) {
    const cached = await this.safeGet(`question:full:${questionId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setFullQuestion(questionId, question, ttl = 7200) {
    return await this.safeSet(`question:full:${questionId}`, JSON.stringify(question), ttl);
  }

  // ==========================================
  // ANALYTICS CACHING
  // ==========================================
  
  async getAnalytics(userId) {
    const cached = await this.safeGet(`analytics:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setAnalytics(userId, analytics, ttl = 300) {
    return await this.safeSet(`analytics:${userId}`, JSON.stringify(analytics), ttl);
  }

  async invalidateAnalytics(userId) {
    if (!this.isAvailable()) return false;
    try {
      await this.redis.del(`analytics:${userId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==========================================
  // CHAPTER/TOPIC LIST CACHING
  // ==========================================
  
  async getChapters(examType, subject) {
    const cached = await this.safeGet(`chapters:${examType}:${subject}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setChapters(examType, subject, chapters, ttl = 7200) {
    return await this.safeSet(`chapters:${examType}:${subject}`, JSON.stringify(chapters), ttl);
  }

  async getTopics(examType, subject, chapter) {
    const cached = await this.safeGet(`topics:${examType}:${subject}:${chapter}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setTopics(examType, subject, chapter, topics, ttl = 7200) {
    return await this.safeSet(`topics:${examType}:${subject}:${chapter}`, JSON.stringify(topics), ttl);
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
      console.error('Redis checkRateLimit error:', error.message);
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
      return true;
    } catch (error) {
      console.error('Redis invalidateUserCache error:', error.message);
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
      console.error('Redis getCacheStats error:', error.message);
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
      console.error('Redis clearAllCache error:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
module.exports = cacheService;