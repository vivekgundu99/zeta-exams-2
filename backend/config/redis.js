// backend/config/redis.js - UPSTASH-OPTIMIZED FOR SERVERLESS
const Redis = require('ioredis');

let redisClient = null;
let connectionAttempted = false;
let isConnecting = false;

const connectRedis = () => {
  // Prevent multiple connection attempts
  if (connectionAttempted) {
    return redisClient;
  }
  
  connectionAttempted = true;
  isConnecting = true;
  
  try {
    console.log('🔄 Connecting to Upstash Redis...');
    
    if (!process.env.UPSTASH_REDIS_URL) {
      console.log('⚠️ UPSTASH_REDIS_URL not set - skipping Redis');
      isConnecting = false;
      return null;
    }
    
    // Parse Upstash URL (format: rediss://default:password@host:port)
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    
    // 🔥 UPSTASH-SPECIFIC: Ultra-aggressive settings for serverless
    redisClient = new Redis(redisUrl, {
      // Connection settings
      connectTimeout: 5000, // 5 seconds for initial connection
      maxRetriesPerRequest: 2, // Try twice per request
      enableReadyCheck: true, // Wait for ready
      enableAutoPipelining: true, // Better performance
      
      // TLS settings for Upstash
      tls: {
        rejectUnauthorized: false
      },
      
      // Retry strategy - give up faster
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('❌ Redis retry limit reached - giving up');
          isConnecting = false;
          return null;
        }
        const delay = Math.min(times * 200, 1000);
        console.log(`🔄 Redis retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      
      // Don't reconnect in serverless
      reconnectOnError: () => false,
      
      // Connection pool
      lazyConnect: false, // Connect immediately
      enableOfflineQueue: false, // Don't queue when offline
      
      // Timeouts
      commandTimeout: 3000, // 3 second command timeout
      keepAlive: 30000, // 30 seconds
      
      // Family
      family: 4 // IPv4 only
    });

    // Connection events
    redisClient.on('connect', () => {
      console.log('🔗 Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Connected and Ready (Upstash)');
      isConnecting = false;
    });

    redisClient.on('error', (err) => {
      isConnecting = false;
      
      if (err.message.includes('ETIMEDOUT')) {
        console.log('⚠️ Redis timeout - check Upstash configuration');
      } else if (err.message.includes('ECONNREFUSED')) {
        console.log('⚠️ Redis connection refused - verify Upstash URL');
      } else if (err.message.includes('WRONGPASS')) {
        console.log('❌ Redis authentication failed - check password');
      } else {
        console.log('❌ Redis error:', err.message);
      }
      
      // Mark as failed
      redisClient = null;
    });

    redisClient.on('close', () => {
      console.log('⚠️ Redis connection closed');
      isConnecting = false;
      redisClient = null;
    });

    redisClient.on('end', () => {
      console.log('⚠️ Redis connection ended');
      isConnecting = false;
      redisClient = null;
    });

    // Test connection immediately
    redisClient.ping()
      .then(() => {
        console.log('✅ Redis PING successful');
      })
      .catch((err) => {
        console.log('❌ Redis PING failed:', err.message);
        redisClient = null;
        isConnecting = false;
      });

    return redisClient;
    
  } catch (error) {
    console.error('❌ Redis initialization failed:', error.message);
    redisClient = null;
    isConnecting = false;
    return null;
  }
};

// Get Redis client instance
const getRedisClient = () => {
  if (!redisClient && !isConnecting) {
    return connectRedis();
  }
  return redisClient;
};

// Check if Redis is available (synchronous check)
const isRedisAvailable = () => {
  try {
    return redisClient && redisClient.status === 'ready';
  } catch (error) {
    return false;
  }
};

// Close Redis connection
const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis Connection Closed');
    } catch (error) {
      console.log('⚠️ Redis close error (ignored)');
    }
    redisClient = null;
    isConnecting = false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisAvailable,
  closeRedis
};