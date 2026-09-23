import Redis from 'ioredis';

let client = null;
let available = false;

export const getRedis = () => client;
export const isRedisAvailable = () => available;

export const initRedis = async () => {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('Redis disabled — REDIS_URL not set (using in-memory fallbacks)');
    return null;
  }
  try {
    client = new Redis(url, { maxRetriesPerRequest: 2, enableReadyCheck: true, lazyConnect: false });
    client.on('error', (e) => console.warn('Redis error:', e.message));
    client.on('connect', () => console.log('Redis connected'));
    await client.ping();
    available = true;
    console.log('Redis ready');
    return client;
  } catch (e) {
    console.warn('Redis unavailable, falling back to memory:', e.message);
    client = null;
    available = false;
    return null;
  }
};

export const redisRateLimitStore = () => {
  if (!client || !available) return undefined;
  // Simple store for express-rate-limit backed by Redis
  return {
    async increment(key) {
      const ttl = 15 * 60;
      const count = await client.incr(`rl:${key}`);
      if (count === 1) await client.expire(`rl:${key}`, ttl);
      const resetTime = new Date(Date.now() + ttl * 1000);
      return { totalHits: count, resetTime };
    },
    async decrement(key) { await client.decr(`rl:${key}`); },
    async resetKey(key) { await client.del(`rl:${key}`); },
  };
};
