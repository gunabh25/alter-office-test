const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("❌ REDIS_URL is missing in environment variables");
}

const client = new Redis(redisUrl, {
  // Railway Redis uses TLS (rediss://) — enable secure connection
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
  retryStrategy: (times) => {
    // Reconnect every 2 seconds if connection fails
    return Math.min(times * 2000, 2000);
  }
});

// Logs
client.on("connect", () => console.log("🟢 Redis connected successfully"));
client.on("error", (err) => console.error("🔴 Redis error:", err));

module.exports = {
  get: async (key) => client.get(key),

  set: async (key, value, ttlSeconds) => {
    if (ttlSeconds) {
      return client.set(key, value, "EX", ttlSeconds);
    }
    return client.set(key, value);
  },

  del: async (key) => client.del(key),

  client
};
