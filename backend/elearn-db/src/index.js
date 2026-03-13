require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const logger = require("./config/logger");
const routes = require("./routes");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3010;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory at: ${uploadsDir}`);
}

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000", // API Gateway in development
      "http://localhost:3004", // elearn-fe (direct calls in dev)
      "http://localhost:3005", // manage-fe (direct calls in dev)
      "http://localhost:3006", // center-fe (direct calls in dev)
      "http://localhost:3007", // meeting-fe (direct calls in dev)
      "http://localhost:3008", // messenger-fe (direct calls in dev)
      "http://localhost:3009", // forum-fe (direct calls in dev)
      process.env.API_GATEWAY_URL, // API Gateway in production
    ].filter(Boolean), // Remove any undefined values
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`E-Learn DB Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
