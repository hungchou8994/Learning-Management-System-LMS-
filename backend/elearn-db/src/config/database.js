const mongoose = require("mongoose");
const logger = require("./logger");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/elearn?directConnection=true";

const connectionOptions = {
  // Connection settings
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 3000,
  socketTimeoutMS: 45000,

  // Write and read preferences
  retryWrites: true,
  w: "majority",

  // Security and performance
  autoIndex: false,
  ssl: false,

  // Additional options
  // IMPORTANT: Do NOT force IPv4 by default.
  // On some Windows setups, data may be accessible via IPv6 (::1) while IPv4 (127.0.0.1) points to a different Mongo instance/volume.
  // If you need to force a family, set MONGODB_FAMILY=4 or 6.
  ...(process.env.MONGODB_FAMILY && Number.isFinite(Number(process.env.MONGODB_FAMILY))
    ? { family: Number(process.env.MONGODB_FAMILY) }
    : {}),
  maxIdleTimeMS: 30000,
};

const connectDB = async () => {
  try {
    // Set up connection monitoring before connecting
    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connection established");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB connection disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB connection reestablished");
    });

    // Connect to MongoDB
    const connection = await mongoose.connect(MONGODB_URI, connectionOptions);

    logger.info("MongoDB connected successfully");
    logger.info(`Connected to database: ${mongoose.connection.name}`);

    return connection;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
