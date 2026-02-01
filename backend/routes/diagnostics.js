// backend/routes/diagnostics.js - REDIS DIAGNOSTICS
const express = require('express');
const router = express.Router();
const Redis = require('ioredis');

// Test Upstash Redis connection
router.get('/redis-test', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: []
  };

  // Test 1: Check if URL is set
  results.tests.push({
    name: 'Environment Variable Check',
    status: process.env.UPSTASH_REDIS_URL ? 'PASS' : 'FAIL',
    message: process.env.UPSTASH_REDIS_URL 
      ? 'UPSTASH_REDIS_URL is configured' 
      : 'UPSTASH_REDIS_URL is missing',
    details: process.env.UPSTASH_REDIS_URL 
      ? { 
          protocol: process.env.UPSTASH_REDIS_URL.split('://')[0],
          hasPassword: process.env.UPSTASH_REDIS_URL.includes('@')
        }
      : null
  });

  // Test 2: Try direct connection
  if (process.env.UPSTASH_REDIS_URL) {
    try {
      console.log('🧪 Testing Redis connection...');
      
      const testClient = new Redis(process.env.UPSTASH_REDIS_URL, {
        connectTimeout: 10000, // 10 seconds for testing
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        tls: {
          rejectUnauthorized: false
        },
        retryStrategy: (times) => {
          if (times > 2) return null;
          return 1000;
        }
      });

      // Test PING
      const pingStart = Date.now();
      await testClient.ping();
      const pingTime = Date.now() - pingStart;

      results.tests.push({
        name: 'Redis PING',
        status: 'PASS',
        message: 'Successfully connected to Redis',
        details: {
          latency: `${pingTime}ms`,
          redisVersion: await testClient.info('server').then(info => {
            const match = info.match(/redis_version:([^\r\n]+)/);
            return match ? match[1] : 'unknown';
          })
        }
      });

      // Test SET/GET
      const testKey = `test:${Date.now()}`;
      const testValue = 'Hello from Zeta Exams';
      
      await testClient.set(testKey, testValue, 'EX', 60);
      const getValue = await testClient.get(testKey);
      await testClient.del(testKey);

      results.tests.push({
        name: 'Redis SET/GET/DELETE',
        status: getValue === testValue ? 'PASS' : 'FAIL',
        message: getValue === testValue 
          ? 'Successfully wrote and read data'
          : 'Data mismatch',
        details: {
          setValue: testValue,
          getValue: getValue
        }
      });

      // Test INFO
      const info = await testClient.info('stats');
      results.tests.push({
        name: 'Redis INFO',
        status: 'PASS',
        message: 'Successfully retrieved Redis stats',
        details: {
          connected_clients: info.match(/connected_clients:(\d+)/)?.[1],
          total_commands_processed: info.match(/total_commands_processed:(\d+)/)?.[1]
        }
      });

      await testClient.quit();
      
    } catch (error) {
      results.tests.push({
        name: 'Redis Connection Test',
        status: 'FAIL',
        message: error.message,
        details: {
          errorType: error.name,
          code: error.code,
          suggestion: getErrorSuggestion(error)
        }
      });
    }
  }

  // Summary
  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const failed = results.tests.filter(t => t.status === 'FAIL').length;

  results.summary = {
    total: results.tests.length,
    passed,
    failed,
    overall: failed === 0 ? 'ALL TESTS PASSED ✅' : `${failed} TEST(S) FAILED ❌`
  };

  res.json(results);
});

function getErrorSuggestion(error) {
  if (error.message.includes('ETIMEDOUT')) {
    return 'Connection timeout. Check: 1) Upstash URL is correct, 2) Firewall/network allows connection, 3) Upstash instance is active';
  }
  if (error.message.includes('ECONNREFUSED')) {
    return 'Connection refused. Check: 1) Redis host and port in URL, 2) Upstash instance is running';
  }
  if (error.message.includes('WRONGPASS') || error.message.includes('NOAUTH')) {
    return 'Authentication failed. Check: 1) Password in UPSTASH_REDIS_URL is correct, 2) URL format: rediss://default:PASSWORD@HOST:PORT';
  }
  if (error.message.includes('getaddrinfo')) {
    return 'DNS resolution failed. Check: 1) Upstash hostname is correct, 2) Network can resolve DNS';
  }
  return 'Check Upstash dashboard and verify your Redis instance is active and URL is correct';
}

module.exports = router;