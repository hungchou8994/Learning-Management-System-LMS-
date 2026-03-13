const { Sequelize } = require("sequelize");
const dbConfig = require("../config/database");

// Get the current environment
const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    dialectOptions: config.dialectOptions,
    pool: config.pool,
  }
);

const Permission = require("./permission.model")(sequelize);
const Role = require("./role.model")(sequelize);

// Define relationships
Role.hasMany(Permission);
Permission.belongsTo(Role);

module.exports = {
  sequelize,
  Permission,
  Role,
};
