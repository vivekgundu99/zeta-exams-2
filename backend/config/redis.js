// backend/config/redis.js - UPSTASH REDIS CONFIGURATION
const Redis = require('ioredis');

let redisClient = null;

const connectRedis = () => {
  try {
    // Upstash Redis connection
    redisClient = new Redis(process.env.UPSTASH_REDIS_URL, {
      tls: {
        rejectUnauthorized: false
      },
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Connected (Upstash)');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Ready');
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error);
    return null;
  }
};

// Get Redis client instance
const getRedisClient = () => {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
};

// Check if Redis is available
const isRedisAvailable = () => {
  return redisClient && redisClient.status === 'ready';
};

// Close Redis connection
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('✅ Redis Connection Closed');
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisAvailable,
  closeRedis
};