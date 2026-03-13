const rateLimit = require("express-rate-limit");
const  RedisStore  = require("rate-limit-redis");
const { redisClient } = require("../config/redis");
const logger = require("../utils/logger");

function isLikelyLocalIp(ip) {
  if (!ip) return false;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("::ffff:192.168.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.") ||
    ip.startsWith("::ffff:172.")
  );
}

// Ensure Redis client is connected
(async () => {
  try {
    await redisClient.connect();
    logger.info("Redis client connected for rate limiter");
  } catch (err) {
    logger.error("Failed to connect Redis for rate limiter:", err);
  }
})();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 5000, // dev: avoid blocking local iteration
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    // Use a simpler approach that works with both redis v4 client and rate-limit-redis v3
    sendCommand: async (...args) => {
      try {
        return await redisClient.client.sendCommand(args);
      } catch (err) {
        logger.error("Rate limiter Redis command failed:", err);
        return null;
      }
    },
    prefix: "rate-limit:",
  }),
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many requests",
      message: "Please try again later",
      retryAfter: Math.ceil((15 * 60) / 60), // minutes
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === "/health" || req.path === "/health/check") return true;

    // In development, skip rate limiting for local/internal traffic.
    if (process.env.NODE_ENV !== "production" && isLikelyLocalIp(req.ip)) {
      return true;
    }

    return false;
  },
});

module.exports = limiter;
