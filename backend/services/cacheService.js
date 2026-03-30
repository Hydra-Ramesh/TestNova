import { getRedis } from '../config/redis.js';

const DEFAULT_TTL = 6 * 60 * 60; // 6 hours

export const cacheGet = async (key) => {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const data = await redis.get(key);
    return data || null;
  } catch (error) {
    console.warn('Cache get error:', error.message);
    return null;
  }
};

export const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), { ex: ttl });
  } catch (error) {
    console.warn('Cache set error:', error.message);
  }
};

export const cacheDel = async (key) => {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.del(key);
  } catch (error) {
    console.warn('Cache delete error:', error.message);
  }
};

export const cacheFlushPattern = async (pattern) => {
  try {
    const redis = getRedis();
    if (!redis) return;
    // Upstash supports SCAN-based key deletion
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0);
  } catch (error) {
    console.warn('Cache flush error:', error.message);
  }
};
