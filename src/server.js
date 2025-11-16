require("dotenv").config();
const app = require("./app");
const { port } = require("./config");
const { PrismaClient } = require("@prisma/client");
const redis = require("./utils/redis"); // ensure redis client loads

const prisma = new PrismaClient();

async function startServer() {
  try {
    console.log("Connecting to PostgreSQL...");
    await prisma.$connect();
    console.log("PostgreSQL connected");

    console.log("Checking Redis connection...");
    await redis.client.ping();
    console.log("Redis connected");

    // Attach db instance to app
    app.locals.prisma = prisma;

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// ------------------------------
// Graceful Shutdown (Railway safe)
// ------------------------------
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Catch async errors
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});
