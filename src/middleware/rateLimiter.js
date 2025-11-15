const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { rateLimit: rlConfig, redisUrl } = require('../config');

const redisClient = new Redis(redisUrl);

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args)
  }),
  windowMs: rlConfig.windowMs,
  max: rlConfig.max,
  keyGenerator: (req) => {
    // use API key or IP as key
    return req.get('x-api-key') || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests' });
  }
});

module.exports = limiter;
