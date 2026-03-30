import { Redis } from '@upstash/redis';

let redis = null;

export const connectRedis = async () => {
  try {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;

    if (!url || !token) {
      console.warn('⚠️ Upstash Redis not configured, running without cache');
      return;
    }

    redis = new Redis({ url, token });

    // Test connection
    await redis.set('testnova_ping', 'pong');
    const result = await redis.get('testnova_ping');
    if (result === 'pong') {
      console.log('🔴 Upstash Redis connected ✓');
    }
  } catch (error) {
    console.warn('⚠️ Redis connection failed:', error.message);
    redis = null;
  }
};

export const getRedis = () => redis;
