const Redis = require("redis");
const { promisify } = require("util");
const logger = require("../utils/logger");

class RedisClient {
  constructor() {
    if (RedisClient.instance) {
      return RedisClient.instance;
    }

    this.client = Redis.createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error("Max retries reached");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.setupEventListeners();
    this.connect();

    RedisClient.instance = this;
  }

  setupEventListeners() {
    this.client.on("error", (err) => {
      logger.error("Redis Client Error:", err);
    });

    this.client.on("connect", () => {
      logger.info("Connected to Redis");
    });

    this.client.on("ready", () => {
      logger.info("Redis client is ready");
    });

    this.client.on("end", () => {
      logger.warn("Redis connection ended");
    });
  }

  async connect() {
    try {
      if (!this.client.isOpen) {
        logger.info("Attempting to connect to Redis...");
        await this.client.connect();
        logger.info("Successfully connected to Redis");
      }
    } catch (error) {
      logger.error("Redis connection failed:", error);
      throw error;
    }
  }

  async get(key) {
    try {
      if (!this.client.isOpen) {
        await this.connect();
      }
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async set(key, value, options = {}) {
    try {
      if (!this.client.isOpen) {
        await this.connect();
      }
      return await this.client.set(key, value, options);
    } catch (error) {
      logger.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  async del(key) {
    try {
      if (!this.client.isOpen) {
        await this.connect();
      }
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  }

  async hSet(key, field, value) {
    try {
      if (!this.client.isOpen) {
        await this.connect();
      }
      return await this.client.hSet(key, field, value);
    } catch (error) {
      logger.error(`Error setting hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }

  async hGet(key, field) {
    try {
      if (!this.client.isOpen) {
        await this.connect();
      }
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error(`Error getting hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }

  async hDel(key, field) {
    try {
      if (!this.client.isOpen) {
        await this.connect();
      }
      return await this.client.hDel(key, field);
    } catch (error) {
      logger.error(`Error deleting hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }

  async expire(key, seconds) {
    try {
      if (!this.client.isOpen) {
        await this.connect();
      }
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`Error setting expiration for key ${key}:`, error);
      throw error;
    }
  }

  async sendCommand(args) {
    try {
      if (!this.client.isOpen) {
        await this.connect();
      }
      logger.debug(`Sending Redis command: ${args[0]}`);
      return await this.client.sendCommand(args);
    } catch (error) {
      logger.error(`Error sending Redis command ${args[0]}:`, error);
      throw error;
    }
  }
}

const redisClient = new RedisClient();

module.exports = {
  redisClient,
  getAsync: redisClient.get.bind(redisClient),
  setAsync: redisClient.set.bind(redisClient),
  delAsync: redisClient.del.bind(redisClient),
  hSetAsync: redisClient.hSet.bind(redisClient),
  hGetAsync: redisClient.hGet.bind(redisClient),
  hDelAsync: redisClient.hDel.bind(redisClient),
  expireAsync: redisClient.expire.bind(redisClient),
};
