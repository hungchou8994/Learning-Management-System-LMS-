const { Sequelize } = require("sequelize");
const logger = require("../utils/logger");

const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || "auth_user",
  password: process.env.DB_PASSWORD || "auth_password",
  database: process.env.DB_NAME || "auth_db",
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 5,
    timeout: 3000,
  },
});

module.exports = { sequelize };
