// backend/config/redis.js - SERVERLESS-OPTIMIZED WITH LAZY CONNECTION
const Redis = require('ioredis');

let redisClient = null;
let connectionPromise = null;
let connectionFailed = false;

// 🔥 LAZY CONNECTION - Only connect when actually needed
const connectRedis = async () => {
  // Return existing connection if available
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }
  
  // Return existing connection promise if connecting
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Don't retry if previously failed
  if (connectionFailed) {
    return null;
  }
  
  // Check if URL is set
  if (!process.env.UPSTASH_REDIS_URL) {
    console.log('⚠️ UPSTASH_REDIS_URL not set - Redis disabled');
    connectionFailed = true;
    return null;
  }
  
  // Create connection promise
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('🔄 Connecting to Upstash Redis...');
      
      const client = new Redis(process.env.UPSTASH_REDIS_URL, {
        // 🔥 CRITICAL: Enable offline queue for serverless
        enableOfflineQueue: true, // CHANGED: Allow commands while connecting
        lazyConnect: false,
        
        // Connection settings
        connectTimeout: 10000, // 10 seconds
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableAutoPipelining: true,
        
        // TLS for Upstash
        tls: {
          rejectUnauthorized: false
        },
        
        // Retry strategy
        retryStrategy: (times) => {
          if (times > 3) {
            console.log('❌ Redis retry limit reached');
            connectionFailed = true;
            return null;
          }
          const delay = Math.min(times * 500, 2000);
          console.log(`🔄 Redis retry ${times}, delay: ${delay}ms`);
          return delay;
        },
        
        // Reconnect
        reconnectOnError: (err) => {
          console.log('🔄 Redis reconnect on error:', err.message);
          return true;
        },
        
        // Timeouts
        commandTimeout: 5000,
        keepAlive: 30000,
        family: 4
      });
      
      // Wait for ready or error
      const readyPromise = new Promise((res, rej) => {
        client.once('ready', () => {
          console.log('✅ Redis connected successfully');
          res(client);
        });
        
        client.once('error', (err) => {
          console.log('❌ Redis connection error:', err.message);
          rej(err);
        });
      });
      
      // Timeout after 10 seconds
      const timeoutPromise = new Promise((_, rej) => {
        setTimeout(() => rej(new Error('Connection timeout')), 10000);
      });
      
      redisClient = await Promise.race([readyPromise, timeoutPromise]);
      connectionPromise = null;
      resolve(redisClient);
      
    } catch (error) {
      console.log('❌ Redis connection failed:', error.message);
      connectionPromise = null;
      connectionFailed = true;
      redisClient = null;
      resolve(null); // Resolve with null instead of rejecting
    }
  });
  
  return connectionPromise;
};

// Get Redis client (with lazy connection)
const getRedisClient = async () => {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }
  
  return await connectRedis();
};

// Synchronous availability check
const isRedisAvailable = () => {
  try {
    if (!redisClient) return false;
    
    // Accept multiple states
    const validStates = ['ready', 'connect', 'connecting'];
    return validStates.includes(redisClient.status);
  } catch (error) {
    return false;
  }
};

// Close connection
const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis connection closed');
    } catch (error) {
      console.log('⚠️ Redis close error (ignored)');
    }
    redisClient = null;
    connectionPromise = null;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisAvailable,
  closeRedis
};