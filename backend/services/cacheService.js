// backend/services/cacheService.js - ASYNC-SAFE FOR SERVERLESS
const { getRedisClient, isRedisAvailable } = require('../config/redis');

class CacheService {
  constructor() {
    this.redis = null;
    this.defaultTTL = 3600;
    this.initialized = false;
  }

  // 🔥 ASYNC INIT - Don't connect immediately
  async init() {
    try {
      console.log('🔧 CacheService: Lazy initialization mode');
      this.initialized = true;
    } catch (error) {
      console.log('⚠️ CacheService init warning:', error.message);
    }
  }

  // 🔥 Get client on-demand
  async getClient() {
    if (this.redis && isRedisAvailable()) {
      return this.redis;
    }
    
    try {
      this.redis = await getRedisClient();
      return this.redis;
    } catch (error) {
      return null;
    }
  }

  // Check availability
  async isAvailable() {
    const client = await this.getClient();
    return client !== null && isRedisAvailable();
  }

  // 🔥 SAFE GET with async client fetch
  async safeGet(key) {
    try {
      const client = await this.getClient();
      if (!client) return null;
      
      const result = await Promise.race([
        client.get(key),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      return result;
    } catch (error) {
      return null;
    }
  }

  // 🔥 SAFE SET with async client fetch
  async safeSet(key, value, ttl) {
    try {
      const client = await this.getClient();
      if (!client) return false;
      
      await Promise.race([
        client.setex(key, ttl, value),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 🔥 SAFE DEL with async client fetch
  async safeDel(key) {
    try {
      const client = await this.getClient();
      if (!client) return false;
      
      await Promise.race([
        client.del(key),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }

  // LIMITS CACHING
  async getLimits(userId) {
    const cached = await this.safeGet(`limits:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setLimits(userId, limits, ttl = 3600) {
    return await this.safeSet(`limits:${userId}`, JSON.stringify(limits), ttl);
  }

  async invalidateLimits(userId) {
    return await this.safeDel(`limits:${userId}`);
  }

  // USER PROFILE CACHING
  async getUserProfile(userId) {
    const cached = await this.safeGet(`profile:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setUserProfile(userId, profile, ttl = 1800) {
    return await this.safeSet(`profile:${userId}`, JSON.stringify(profile), ttl);
  }

  async invalidateUserProfile(userId) {
    return await this.safeDel(`profile:${userId}`);
  }

  // SUBSCRIPTION CACHING
  async getSubscription(userId) {
    const cached = await this.safeGet(`subscription:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setSubscription(userId, subscription, ttl = 3600) {
    return await this.safeSet(`subscription:${userId}`, JSON.stringify(subscription), ttl);
  }

  async invalidateSubscription(userId) {
    return await this.safeDel(`subscription:${userId}`);
  }

  // QUESTION CACHING
  async getFullQuestion(questionId) {
    const cached = await this.safeGet(`question:full:${questionId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setFullQuestion(questionId, question, ttl = 7200) {
    return await this.safeSet(`question:full:${questionId}`, JSON.stringify(question), ttl);
  }

  // ANALYTICS CACHING
  async getAnalytics(userId) {
    const cached = await this.safeGet(`analytics:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setAnalytics(userId, analytics, ttl = 300) {
    return await this.safeSet(`analytics:${userId}`, JSON.stringify(analytics), ttl);
  }

  async invalidateAnalytics(userId) {
    return await this.safeDel(`analytics:${userId}`);
  }

  // CHAPTER/TOPIC CACHING
  async getChapters(examType, subject) {
    const cached = await this.safeGet(`chapters:${examType}:${subject}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setChapters(examType, subject, chapters, ttl = 7200) {
    return await this.safeSet(`chapters:${examType}:${subject}`, JSON.stringify(chapters), ttl);
  }

  async getTopics(examType, subject, chapter) {
    const cached = await this.safeGet(`topics:${examType}:${subject}:${chapter}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setTopics(examType, subject, chapter, topics, ttl = 7200) {
    return await this.safeSet(`topics:${examType}:${subject}:${chapter}`, JSON.stringify(topics), ttl);
  }

  // RATE LIMITING
  async checkRateLimit(key, limit, window) {
    try {
      const client = await this.getClient();
      if (!client) return { allowed: true }; // Fail open
      
      const current = await Promise.race([
        client.incr(key),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      if (current === 1) {
        await client.expire(key, window);
      }
      
      const ttl = await client.ttl(key);
      
      return {
        allowed: current <= limit,
        current,
        limit,
        resetIn: ttl
      };
    } catch (error) {
      return { allowed: true }; // Fail open
    }
  }

  // BULK INVALIDATION
  async invalidateUserCache(userId) {
    try {
      const client = await this.getClient();
      if (!client) return false;
      
      const keys = [
        `limits:${userId}`,
        `profile:${userId}`,
        `subscription:${userId}`,
        `analytics:${userId}`
      ];
      
      await Promise.race([
        client.del(...keys),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }

  // CACHE STATS
  async getCacheStats() {
    try {
      const client = await this.getClient();
      if (!client) {
        return { status: 'disconnected' };
      }
      
      const info = await Promise.race([
        client.info('stats'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      const dbsize = await Promise.race([
        client.dbsize(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      ]);
      
      return {
        connected: true,
        status: client.status,
        dbsize,
        info
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // CLEAR ALL CACHE
  async clearAllCache() {
    try {
      const client = await this.getClient();
      if (!client) return false;
      
      await client.flushdb();
      console.log('✅ Cache cleared');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error.message);
      return false;
    }
  }
}

// Export singleton
const cacheService = new CacheService();
module.exports = cacheService;