const { createClient } = require("redis");
const logger = require("../utils/logger");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  logger.info("Redis Client Connected");
});

function cacheMiddleware(key, ttl = 3600) {
  return (req, res, next) => {
    const cacheKey = `${key}-${req.params.taskId || req.params.id || "all"}`;

    redisClient
      .get(cacheKey)
      .then((cachedData) => {
        if (cachedData) {
          return res.json({
            status: "success",
            data: JSON.parse(cachedData),
            source: "cache",
          });
        }

        // Attach cache functions to response object
        res.setCache = (data) => {
          return redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
        };

        next();
      })
      .catch((error) => {
        logger.error("Cache middleware error:", error);
        // Attach a dummy cache function that returns a resolved promise in case of Redis errors
        res.setCache = () => Promise.resolve();
        next();
      });
  };
}

module.exports = {
  redisClient,
  cacheMiddleware,
};
