📊 Alter Office Test - Analytics Backend

A production-ready Analytics + Authentication API backend built with:

Node.js + Express

PostgreSQL (Prisma ORM)

Railway Deployment

Redis (Caching & Rate Limiting)

API Key Authentication

Event Tracking System

Swagger API Documentation

This README contains a complete setup guide, explanation of every file, and deployment instructions.

📁 Project Structure
alter-office-test/
 ├── prisma/
 │   ├── schema.prisma
 ├── src/
 │   ├── app.js
 │   ├── server.js
 │   ├── config.js
 │   ├── utils/
 │   │    ├── redis.js
 │   ├── routes/
 │   │    ├── auth.js
 │   │    ├── analytics.js
 │   ├── controllers/
 │   │    ├── authController.js
 │   │    ├── analyticsController.js
 │   ├── middleware/
 │   │    ├── apiKeyAuth.js
 │   │    ├── rateLimiter.js
 │   │    ├── errorHandler.js
 ├── openapi.yaml
 ├── Dockerfile
 ├── package.json
 ├── README.md

🚀 Features
✅ User Authentication

Users can create an application and receive API keys to track analytics.

🎟️ Hashed API Keys

Stores only hashed API keys (bcrypt)

Raw API key shown only once on creation

📊 Analytics Tracking

Track:

events

device

referrer

metadata

URL

userId

🚦 Rate Limiting

Redis-backed rate limiter:

prevents abuse

high-performance

distributed-safe

🚨 Error Handling Middlewares

Global error wrapper to ensure safe JSON responses.

🧪 Swagger Documentation

Live docs at:

/docs

🛠️ Installation
1️⃣ Clone Repo
git clone https://github.com/gunabh25/alter-office-test
cd alter-office-test

2️⃣ Install Dependencies
npm install

3️⃣ Setup Environment Variables

Create .env:

PORT=3000

# PostgreSQL (Railway gives full URL)
DATABASE_URL=your_postgres_url_here

# Redis (Railway Redis)
REDIS_URL=redis://default:password@redis.railway.internal:6379

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

🧩 Database Setup (Prisma)
Pull environment
npx prisma generate

Apply migrations
npx prisma migrate deploy

Prisma Studio (Optional)
npx prisma studio

🗄️ Prisma Schema Explanation
App

Represents apps created by users.

ApiKey

Stores hashed API keys + prefixes.

Event

Represents all analytics events.

Full schema:

model App {
  id          String   @id @default(cuid())
  name        String
  ownerEmail  String?
  createdAt   DateTime @default(now())
  apiKeys     ApiKey[]
  events      Event[]
}

model ApiKey {
  id         String   @id @default(cuid())
  keyHash    String   
  rawPrefix  String   
  app        App      @relation(fields: [appId], references: [id])
  appId      String
  revoked    Boolean  @default(false)
  expiresAt  DateTime?
  createdAt  DateTime @default(now())
}

model Event {
  id         String   @id @default(cuid())
  event      String
  url        String?
  referrer   String?
  device     String?
  ipAddress  String?
  timestamp  DateTime @default(now())
  metadata   Json?
  app        App      @relation(fields: [appId], references: [id])
  appId      String
  userId     String?
  createdAt  DateTime @default(now())

  @@index([appId, event, timestamp])
  @@index([userId])
}

🔥 Redis Setup
src/utils/redis.js
const Redis = require("ioredis");

const client = new Redis(process.env.REDIS_URL);

client.on("connect", () => console.log("🟢 Redis connected successfully"));
client.on("error", err => console.error("🔴 Redis Error:", err));

module.exports = client;

🌐 Express App Overview
src/app.js

Contains:

security middleware

swagger docs

routes

error handling

🚀 Server Startup Flow
src/server.js
console.log("Connecting to PostgreSQL...");
await prisma.$connect();

console.log("Checking Redis...");
await redis.ping();

console.log("Server started...");

🔐 API Key Authentication

Middleware:
src/middleware/apiKeyAuth.js

Workflow:

Read x-api-key header

Extract prefix

Find matching ApiKey row

Compare hash

Attach req.appId

🚦 Rate Limiting
Uses Redis for distributed rate limiting.

Limit request if above threshold.

🧪 Testing APIs
Using Postman / Thunder Client
1. Health Check
GET /health

2. Create App + API Key
POST /api/auth/register


Body:

{
  "email": "test@example.com",
  "password": "123456",
  "appName": "My New App"
}


Returns:

{
  "apiKey": "raw-key-only-once"
}

📊 Track an Analytics Event
POST /api/analytics/event
x-api-key: <your_api_key>


Body:

{
  "event": "page_view",
  "url": "https://mysite.com",
  "metadata": { "role": "user" }
}

📈 Get Analytics Stats
GET /api/analytics/stats?page=1
x-api-key: <your_api_key>

📜 Swagger Docs
/docs

🚀 Railway Deployment
1. Create New Railway Project

Choose "Deploy from GitHub Repo".

2. Add Services

✔ PostgreSQL
✔ Redis
✔ Web Service (Node)

3. Set Environment Variables

Go to Variables tab and add:

PORT=3000
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>

4. Deploy

Railway automatically builds with the Dockerfile.

🐳 Dockerfile (ready for Railway)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npx prisma generate

EXPOSE 3000
CMD ["node", "src/server.js"]

🩹 Error Handling

All errors go through:

src/middleware/errorHandler.js


Ensures consistent JSON response.

🛑 Common Issues
❌ Redis connection refused

Means REDIS_URL is incorrect.

❌ PostgreSQL database does not exist

Run:

npx prisma migrate deploy

❌ API Key invalid

Ensure x-api-key header is passed.

❤️ Contributing

PRs and issues welcome!
