const rateLimit = require("express-rate-limit");
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

const RedisStore = require("rate-limit-redis");

module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});
