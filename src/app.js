const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

// Routes
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
const errorHandler = require("./middleware/errorHandler");

const app = express();

/* -------------------------------------------
   Security, Logging, API Hardening
--------------------------------------------*/
app.use(helmet());
app.use(
  cors({
    origin: "*", // Allow all apps to send analytics
    methods: "GET,POST",
  })
);
app.use(morgan("tiny"));

/* -------------------------------------------
   Body Parsing (Safe Limits)
--------------------------------------------*/
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* -------------------------------------------
   Swagger Documentation
--------------------------------------------*/
let swaggerDocument;
try {
  swaggerDocument = YAML.load("./openapi.yaml");
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.error("⚠️  Failed to load Swagger:", err.message);
}

/* -------------------------------------------
   API Routes
--------------------------------------------*/
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);

/* -------------------------------------------
   Health Check
--------------------------------------------*/
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

/* -------------------------------------------
   404 Handler
--------------------------------------------*/
app.use((req, res, next) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

/* -------------------------------------------
   Global Error Handler
--------------------------------------------*/
app.use(errorHandler);

module.exports = app;
