require("dotenv").config();
const express = require("express");
const cors = require("cors");
const processRoutes = require("./routes/process.routes");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(
  cors({
    // Use allowlist for both dev/prod (docker env may set NODE_ENV=production in local).
    origin: (origin, callback) => {
      const allowlist = [
        process.env.API_GATEWAY_URL,
        "http://localhost:3000", // API Gateway
        "http://localhost:3004", // elearn-fe
        "http://localhost:3005", // manage-fe
        "http://localhost:3006", // center-fe
        "http://localhost:3007", // meeting-fe
        "http://localhost:3008", // messenger-fe
        "http://localhost:3009", // forum-fe
      ].filter(Boolean);

      if (!origin) return callback(null, true);
      if (allowlist.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600,
  })
);
app.use(express.json());

// Routes
app.use("/api/process", processRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "processing-service",
    details: {
      status: "OK",
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Health check endpoint for API gateway
app.post("/health/check", (req, res) => {
  const { service, timestamp } = req.body;

  if (!service || !timestamp) {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid request body. Required: service, timestamp",
    });
  }

  if (service !== "processing") {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid service identifier",
    });
  }

  // Check if timestamp is within last 30 seconds
  const now = Date.now();
  if (Math.abs(now - timestamp) > 30000) {
    return res.status(400).json({
      status: "ERROR",
      message: "Request timestamp too old",
    });
  }

  res.json({
    status: "OK",
    timestamp: now,
    service: "processing",
    data: {
      version: "1.0.0",
      uptime: process.uptime(),
    },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Processing service running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received.");
  process.exit(0);
});
