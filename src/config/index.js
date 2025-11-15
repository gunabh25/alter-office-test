module.exports = {
  port: process.env.PORT || 4000,
  redisUrl: process.env.REDIS_URL,
  dbUrl: process.env.DATABASE_URL,
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 1000)
  }
}
