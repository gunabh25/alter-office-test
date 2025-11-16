require("dotenv").config();
const app = require("./app");
const { port } = require("./config");
const { PrismaClient } = require("@prisma/client");
const redis = require("./utils/redis");

const prisma = new PrismaClient();

async function startServer() {
  try {
    // PostgreSQL connection
    console.log("Connecting to PostgreSQL...");
    await prisma.$connect();
    console.log("🟢 PostgreSQL connected");

    // Redis test using ioredis
    console.log("Checking Redis connection...");
    const pong = await redis.ping();
    console.log("🟢 Redis PING:", pong);

    // Attach Prisma
    app.locals.prisma = prisma;

    // Start API Server
    app.listen(port, () => {
      console.log(`🚀 Server listening on port ${port}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// --------------------------------------
// Graceful Shutdown - Required for Railway
// --------------------------------------
const shutdown = async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();

  try {
    redis.disconnect();
  } catch (_) {}

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// --------------------------------------
// Global Error Handler for Unexpected Promises
// --------------------------------------
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
});
