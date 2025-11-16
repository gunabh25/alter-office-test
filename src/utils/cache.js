const Redis = require('ioredis');
const client = new Redis(process.env.REDIS_URL);

module.exports = {
  get: (key) => client.get(key),
  set: (key, value, ttlSeconds) => {
    if (ttlSeconds) {
      return client.set(key, value, 'EX', ttlSeconds);
    }
    return client.set(key, value);
  },
  del: (key) => client.del(key)
};
