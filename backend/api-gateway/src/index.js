require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const fetch = require("node-fetch");
const logger = require("./utils/logger");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Configure rate limiter based on environment
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 100 requests per IP in production, 1000 in development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
    retryAfter: Math.ceil((15 * 60) / 60), // minutes
  },
  skip: (req) => {
    // Skip rate limiting for development environment local requests
    return (
      process.env.NODE_ENV !== "production" &&
      (req.ip === "127.0.0.1" || req.ip === "::1" || req.ip.startsWith("172."))
    );
  },
});

// CORS configuration
app.use(
  cors({
    // Use an explicit allowlist for both dev/prod.
    // Note: docker env may set NODE_ENV=production even in local development.
    origin: (origin, callback) => {
      const allowlist = [
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:3006",
        "http://localhost:3007",
        "http://localhost:3008",
        "http://localhost:3009",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      // Allow same-origin / server-to-server / curl (no Origin header)
      if (!origin) return callback(null, true);

      if (allowlist.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Device-ID",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["set-cookie"],
  })
);

app.use(apiLimiter); // Apply rate limiting after CORS

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  logger.debug(`Request headers: ${JSON.stringify(req.headers)}`);
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  }

  // Track response
  const originalSend = res.send;
  res.send = function (data) {
    logger.info(`Response status: ${res.statusCode}`);
    if (data) {
      const logData = data.toString().substring(0, 200); // truncate long responses
      logger.debug(
        `Response body: ${logData}${data.length > 200 ? "..." : ""}`
      );
    }
    return originalSend.apply(res, arguments);
  };

  next();
});

// Middleware
app.use(helmet());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Add cookie parser middleware
app.use(cookieParser());

// Log cookies for debugging
app.use((req, res, next) => {
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    logger.debug(`Incoming request cookies: ${JSON.stringify(req.cookies)}`);
  }
  next();
});

// Configure auth service proxy
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || "http://auth-service:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/auth": "/",
    },
    onProxyReq: (proxyReq, req, res) => {
      // Log the incoming request for debugging
      logger.debug(
        `Proxying request to Auth Service: ${req.method} ${req.originalUrl}`
      );
      logger.debug(`Raw cookie header: ${req.headers.cookie || "none"}`);
      logger.debug(`Parsed cookies: ${JSON.stringify(req.cookies || {})}`);
      logger.debug(
        `Request authorization: ${req.headers.authorization || "none"}`
      );

      // Ensure cookies are properly forwarded
      if (req.headers.cookie) {
        proxyReq.setHeader("Cookie", req.headers.cookie);
        logger.debug(`Forwarding cookie header: ${req.headers.cookie}`);
      }

      // Ensure authorization header is forwarded
      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
        logger.debug(
          `Forwarding authorization header: ${req.headers.authorization}`
        );
      }

      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);

        logger.debug(`Forwarding body to Auth Service: ${bodyData}`);

        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.debug(
        `Received response from Auth Service for: ${req.method} ${req.originalUrl} - Status: ${proxyRes.statusCode}`
      );

      // Log response cookies
      const cookies = proxyRes.headers["set-cookie"];
      if (cookies) {
        logger.debug(
          `Received cookies from Auth Service: ${JSON.stringify(cookies)}`
        );
      }
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error: ${err.message}`);
      res.status(500).json({
        status: "error",
        message: "Auth service unavailable",
        details: err.message,
      });
    },
  })
);

const authzServiceProxy = createProxyMiddleware({
  target: process.env.AUTHZ_SERVICE_URL || "http://authz-service:3002",
  changeOrigin: true,
  pathRewrite: {
    "^/api/authz/health/check": "/health/check",
    "^/api/authz": "/api/authz",
  },
  onError: (err, req, res) => {
    logger.error("Authz Service Proxy Error:", err);
    res
      .status(500)
      .json({ error: "Authz Service Error", message: err.message });
  },
  onProxyReq: (proxyReq, req) => {
    if (!req.body || !Object.keys(req.body).length) {
      return;
    }

    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Type", "application/json");
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
    proxyReq.end();
  },
  proxyTimeout: 60000,
  timeout: 60000,
});

const processingServiceProxy = createProxyMiddleware({
  target:
    process.env.PROCESSING_SERVICE_URL || "http://processing-service:3003",
  changeOrigin: true,
  pathRewrite: {
    "^/api/process/health/check": "/health/check",
    "^/api/process": "/api/process",
  },
  onError: (err, req, res) => {
    logger.error("Processing Service Proxy Error:", err);
    res
      .status(500)
      .json({ error: "Processing Service Error", message: err.message });
  },
  onProxyReq: (proxyReq, req) => {
    if (!req.body || !Object.keys(req.body).length) {
      return;
    }

    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Type", "application/json");
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
    proxyReq.end();
  },
  proxyTimeout: 60000,
  timeout: 60000,
});

// Add Elearn DB Service Proxy for user management
const elearnDbServiceProxy = createProxyMiddleware({
  target: process.env.ELEARN_DB_SERVICE_URL || "http://elearn-db:3010",
  changeOrigin: true,
  pathRewrite: {
    "^/api/elearn": "/api",
  },
  onError: (err, req, res) => {
    logger.error("Elearn DB Service Proxy Error:", err);
    res
      .status(500)
      .json({ error: "Elearn DB Service Error", message: err.message });
  },
  onProxyReq: (proxyReq, req) => {
    logger.debug(
      `Proxying request to Elearn DB Service: ${req.method} ${req.originalUrl}`
    );

    // Forward cookies if present
    if (req.headers.cookie) {
      proxyReq.setHeader("Cookie", req.headers.cookie);
      logger.debug(`Forwarding cookie header: ${req.headers.cookie}`);
    }

    // Extract token from cookies and set Authorization header
    const cookies = req.cookies || {};
    const accessToken = cookies.access_token;
    if (accessToken) {
      proxyReq.setHeader("Authorization", `Bearer ${accessToken}`);
      logger.debug(
        `Setting Authorization header from cookie: Bearer ${accessToken}`
      );
    }
    // Also forward any existing Authorization header
    else if (req.headers.authorization) {
      proxyReq.setHeader("Authorization", req.headers.authorization);
      logger.debug(
        `Forwarding authorization header: ${req.headers.authorization}`
      );
    }

    // Forward request body if present
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      logger.debug(`Forwarding body to Elearn DB Service: ${bodyData}`);

      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.debug(
      `Received response from Elearn DB Service for: ${req.method} ${req.originalUrl} - Status: ${proxyRes.statusCode}`
    );
  },
  proxyTimeout: 60000,
  timeout: 60000,
});

// Add proxy for uploads
const uploadsProxy = createProxyMiddleware({
  target: process.env.ELEARN_DB_SERVICE_URL || "http://elearn-db:3010",
  changeOrigin: true,
  pathRewrite: {
    "^/elearn/uploads": "/uploads", // Rewrite /elearn/uploads to /uploads
  },
});

// Public routes that don't require authentication
app.get("/api/elearn/courses", (req, res, next) => {
  // Backward-compatible alias:
  // elearn-db exposes /api/course, but some callers might use /api/elearn/courses.
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  return res.redirect(307, `/api/elearn/course${qs}`);
});

// Routes
app.get("/health", async (req, res) => {
  try {
    const services = {
      gateway: "OK",
      auth: "UNKNOWN",
      authz: "UNKNOWN",
      processing: "UNKNOWN",
    };

    try {
      const response = await fetch("http://auth-service:3001/health");
      const data = await response.json();
      services.auth = data.status;
    } catch (error) {
      services.auth = "ERROR";
      logger.error("Auth service health check failed:", error);
    }

    try {
      const processingResponse = await fetch(
        "http://processing-service:3003/health"
      );
      const processingData = await processingResponse.json();
      services.processing = processingData.status;
    } catch (error) {
      services.processing = "ERROR";
      logger.error("Processing service health check failed:", error);
    }

    res.json({
      status: "OK",
      services,
    });
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
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

    if (service !== "gateway") {
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

    // Check all services
    const services = {
      gateway: { status: "OK", data: "ok" },
      auth: { status: "UNKNOWN" },
      authz: { status: "UNKNOWN" },
      processing: { status: "UNKNOWN" },
      elearn: { status: "UNKNOWN" },
    };

    try {
      const authResponse = await fetch(
        "http://auth-service:3001/health/check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service: "auth", timestamp: now }),
        }
      );
      services.auth = await authResponse.json();
    } catch (error) {
      services.auth = { status: "ERROR", message: error.message };
      logger.error("Auth service health check failed:", error);
    }

    try {
      const authzResponse = await fetch(
        "http://authz-service:3002/health/check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service: "authz", timestamp: now }),
        }
      );
      services.authz = await authzResponse.json();
    } catch (error) {
      services.authz = { status: "ERROR", message: error.message };
      logger.error("Authz service health check failed:", error);
    }

    try {
      const processingResponse = await fetch(
        "http://processing-service:3003/health/check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service: "processing", timestamp: now }),
        }
      );
      services.processing = await processingResponse.json();
    } catch (error) {
      services.processing = { status: "ERROR", message: error.message };
      logger.error("Processing service health check failed:", error);
    }

    try {
      const elearnResponse = await fetch(
        "http://elearn-service:3004/health/check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service: "elearn", timestamp: now }),
        }
      );
      services.elearn = await elearnResponse.json();
    } catch (error) {
      services.elearn = { status: "ERROR", message: error.message };
      logger.error("Elearn service health check failed:", error);
    }

    res.json({
      status: "OK",
      timestamp: now,
      service: "gateway",
      services,
    });
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

// Apply proxy middleware
app.use("/api/authz", authzServiceProxy);
app.use("/api/process", processingServiceProxy);
app.use("/api/elearn", elearnDbServiceProxy);
app.use("/elearn/uploads", uploadsProxy); // Add the uploads proxy

// Serve static files from the shared uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Gateway Error:", err);
  res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info("Available routes:");
  logger.info("- /api/auth/* -> Auth Service");
  logger.info("- /api/authz/* -> Authz Service");
  logger.info("- /api/process/* -> Processing Service");
  logger.info("- /api/elearn/* -> Elearn DB Service");
});
