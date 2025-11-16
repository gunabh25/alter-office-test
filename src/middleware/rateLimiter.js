const rateLimit = require("express-rate-limit");
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined
});

const store = {
  increment: async (key) => {
    const now = Date.now();

    const res = await redis.multi()
      .incr(key)
      .pexpire(key, 60_000) // 1 minute window
      .exec();

    return {
      totalHits: res[0][1],
      resetTime: new Date(now + 60_000),
    };
  },

  decrement: async (key) => {
    await redis.decr(key);
  },

  resetKey: async (key) => {
    await redis.del(key);
  }
};

module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store,
});
