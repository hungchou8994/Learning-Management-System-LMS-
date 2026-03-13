require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const { initializeEnforcer } = require("./config/casbin");
const authzRoutes = require("./routes/authz.routes");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(
  cors({
    // Use allowlist for both dev/prod (docker env may set NODE_ENV=production in local).
    origin: (origin, callback) => {
      const allowlist = [
        process.env.API_GATEWAY_URL,
        "http://localhost:3000",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:3006",
        "http://localhost:3007",
        "http://localhost:3008",
        "http://localhost:3009",
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

// Initialize Casbin enforcer
let enforcer;
(async () => {
  try {
    enforcer = await initializeEnforcer();
  } catch (error) {
    logger.error(
      "Failed to initialize Casbin enforcer. Will retry later:",
      error
    );
  }
})();

// Middleware to attach enforcer to request
app.use((req, res, next) => {
  req.enforcer = enforcer;
  next();
});

// Routes
app.use("/api/authz", authzRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
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

    if (service !== "authz") {
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

    // Check database and enforcer
    try {
      await sequelize.authenticate();
      res.json({
        status: "OK",
        data: "ok",
        timestamp: now,
        service: "authz",
        database: true,
        enforcer: !!enforcer,
      });
    } catch (error) {
      res.status(503).json({
        status: "ERROR",
        message: "Database connection failed",
        timestamp: now,
        service: "authz",
        database: false,
        enforcer: !!enforcer,
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
  logger.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
});

// Connect to database with retries
async function connectToDatabase(retries = 5, interval = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`Database connection attempt ${attempt} of ${retries}...`);
      await sequelize.authenticate();
      logger.info("Database connection established successfully.");

      await sequelize.sync();
      logger.info("Database synchronized successfully.");

      return true;
    } catch (error) {
      logger.error(`Database connection attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        logger.error("All database connection attempts failed.");
        return false;
      }

      logger.info(`Retrying in ${interval / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
  return false;
}

// Database connection and server start
async function startServer() {
  try {
    // Connect to Database
    const dbConnected = await connectToDatabase();

    // Start the server even if the database connection failed
    app.listen(PORT, () => {
      logger.info(`Authorization service running on port ${PORT}`);
      if (!dbConnected) {
        logger.warn(
          "Server started without database connection. Some features may not work properly."
        );
      }
    });

    // Retry database connection if it failed initially
    if (!dbConnected) {
      setInterval(async () => {
        try {
          if (!dbConnected) {
            logger.info("Attempting to reconnect to database...");
            const success = await connectToDatabase(1);
            if (success) {
              dbConnected = true;

              // Try to initialize Casbin enforcer again if it failed earlier
              if (!enforcer) {
                try {
                  enforcer = await initializeEnforcer();
                  logger.info(
                    "Casbin enforcer initialized successfully after retry."
                  );
                } catch (error) {
                  logger.error(
                    "Casbin enforcer initialization failed after retry:",
                    error
                  );
                }
              }
            }
          }
        } catch (error) {
          logger.error("Database reconnection failed:", error);
        }
      }, 10000); // Retry every 10 seconds
    }

    // Try to initialize Casbin enforcer if it failed earlier
    if (!enforcer && dbConnected) {
      try {
        enforcer = await initializeEnforcer();
        logger.info("Casbin enforcer initialized successfully.");
      } catch (error) {
        logger.error("Casbin enforcer initialization failed:", error);

        // Retry Casbin enforcer initialization
        setInterval(async () => {
          try {
            if (!enforcer) {
              logger.info("Attempting to initialize Casbin enforcer...");
              enforcer = await initializeEnforcer();
              logger.info(
                "Casbin enforcer initialized successfully after retry."
              );
            }
          } catch (error) {
            logger.error("Casbin enforcer initialization failed:", error);
          }
        }, 5000); // Retry every 5 seconds
      }
    }
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received.");
  await sequelize.close();
  process.exit(0);
});

startServer();
