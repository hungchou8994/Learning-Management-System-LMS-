require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models");
const authRoutes = require("./routes/auth.routes");
const logger = require("./utils/logger");
const limiter = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.API_GATEWAY_URL,
        "http://localhost:3000",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:3006",
        "http://localhost:3007",
        "http://localhost:3008",
        "http://localhost:3009",
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
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

// Rate limiting
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parsing
app.use(cookieParser());

// Log cookies for debugging
app.use((req, res, next) => {
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    logger.debug(`Incoming request cookies: ${JSON.stringify(req.cookies)}`);
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes.router);
// Re-map the base path for direct API gateway access
app.use("/", authRoutes.router);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    database: sequelize
      .authenticate()
      .then(() => true)
      .catch(() => false),
  });
});

// New health check endpoint with body validation
app.post("/health/check", async (req, res) => {
  try {
    const { service, timestamp } = req.body;

    if (!service || !timestamp) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid request body. Required: service, timestamp",
      });
    }

    if (service !== "auth") {
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

    // Check database connection
    try {
      await sequelize.authenticate();
      res.json({
        status: "OK",
        data: "ok",
        timestamp: now,
        service: "auth",
        database: true,
      });
    } catch (error) {
      res.status(503).json({
        status: "ERROR",
        message: "Database connection failed",
        timestamp: now,
        service: "auth",
        database: false,
      });
    }
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Error:", err);
  res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

// Database connection and server start
async function startServer() {
  let retries = 5;

  while (retries) {
    try {
      logger.info("Attempting to connect to database...");
      await sequelize.authenticate();
      logger.info("Database connection established successfully.");

      logger.info("Synchronizing database models...");
      await sequelize.sync();
      logger.info("Database synchronized successfully.");

      app.listen(PORT, "0.0.0.0", () => {
        logger.info(`Auth service running on port ${PORT}`);
        logger.info("Service is ready to accept connections");
      });

      return;
    } catch (error) {
      logger.error(
        `Failed to connect to database (${retries} retries left):`,
        error
      );
      retries -= 1;
      if (retries === 0) {
        logger.error(
          "Unable to connect to the database after multiple retries"
        );
        process.exit(1);
      }
      // Wait 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

startServer();
