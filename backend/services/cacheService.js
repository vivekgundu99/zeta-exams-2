// backend/services/cacheService.js - SERVERLESS-SAFE WITH GRACEFUL DEGRADATION
const { getRedisClient, isRedisAvailable } = require('../config/redis');

class CacheService {
  constructor() {
    this.redis = null;
    this.defaultTTL = 3600; // 1 hour
  }

  // Initialize Redis client
  init() {
    try {
      this.redis = getRedisClient();
      console.log('🔧 CacheService initialized');
    } catch (error) {
      console.log('⚠️ CacheService init warning:', error.message);
      this.redis = null;
    }
  }

  // Check if cache is available
  isAvailable() {
    try {
      return isRedisAvailable();
    } catch (error) {
      return false;
    }
  }

  // 🔥 SAFE: Get with automatic fallback
  async safeGet(key) {
    if (!this.isAvailable()) return null;
    try {
      const result = await Promise.race([
        this.redis.get(key),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
      ]);
      return result;
    } catch (error) {
      // Silent fail - return null
      return null;
    }
  }

  // 🔥 SAFE: Set with automatic fallback
  async safeSet(key, value, ttl) {
    if (!this.isAvailable()) return false;
    try {
      await Promise.race([
        this.redis.setex(key, ttl, value),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
      ]);
      return true;
    } catch (error) {
      // Silent fail
      return false;
    }
  }

  // 🔥 SAFE: Delete with automatic fallback
  async safeDel(key) {
    if (!this.isAvailable()) return false;
    try {
      await Promise.race([
        this.redis.del(key),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
      ]);
      return true;
    } catch (error) {
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
    return await this.safeDel(`limits:${userId}`);
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
    return await this.safeDel(`profile:${userId}`);
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
    return await this.safeDel(`subscription:${userId}`);
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
    return await this.safeDel(`analytics:${userId}`);
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
      const current = await Promise.race([
        this.redis.incr(key),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
      ]);
      
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
      // Fail open - allow request if Redis is down
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
      
      await Promise.race([
        this.redis.del(...keys),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==========================================
  // CACHE STATISTICS
  // ==========================================
  
  async getCacheStats() {
    if (!this.isAvailable()) return { status: 'disconnected' };
    
    try {
      const info = await Promise.race([
        this.redis.info('stats'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      ]);
      
      const dbsize = await Promise.race([
        this.redis.dbsize(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
      ]);
      
      return {
        connected: true,
        dbsize,
        info
      };
    } catch (error) {
      return { status: 'timeout' };
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