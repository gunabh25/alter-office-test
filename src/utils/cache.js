const Redis = require('ioredis');
const { redisUrl } = require('../config');
const client = new Redis(redisUrl);

module.exports = {
  get: async (key) => await client.get(key),
  set: async (key, value, ttlSeconds) => {
    if (ttlSeconds) return await client.set(key, value, 'EX', ttlSeconds);
    return await client.set(key, value);
  },
  del: async (key) => await client.del(key)
};
