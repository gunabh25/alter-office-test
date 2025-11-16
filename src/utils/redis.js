const Redis = require("ioredis");

let url = process.env.REDIS_URL;

if (!url) {
  console.error("❌ REDIS_URL missing!");
}

const client = new Redis(url, {
  tls: url.startsWith("rediss://") ? {} : undefined,
});

client.on("connect", () => console.log("🟢 Redis connected successfully"));
client.on("error", (err) => console.error("🔴 Redis error", err));

module.exports = client;
