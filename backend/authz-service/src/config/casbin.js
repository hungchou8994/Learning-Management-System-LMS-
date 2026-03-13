const { newEnforcer } = require("casbin");
const { SequelizeAdapter } = require("casbin-sequelize-adapter");
const path = require("path");
const logger = require("../utils/logger");
const dbConfig = require("./database");

async function initializeEnforcer() {
  try {
    // Get the current environment
    const env = process.env.NODE_ENV || "development";
    const config = dbConfig[env];

    // Initialize Sequelize adapter
    const adapter = await SequelizeAdapter.newAdapter({
      database: config.database,
      username: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      dialect: config.dialect,
    });

    // Create enforcer
    const enforcer = await newEnforcer(
      path.resolve(__dirname, "../config/rbac_model.conf"),
      adapter
    );

    // Load default policies
    await loadDefaultPolicies(enforcer);

    return enforcer;
  } catch (error) {
    logger.error("Failed to initialize Casbin enforcer:", error);
    throw error;
  }
}

async function loadDefaultPolicies(enforcer) {
  // Clear existing policies
  await enforcer.clearPolicy();

  // Add role inheritance
  await enforcer.addRoleForUser("admin", "manager");
  await enforcer.addRoleForUser("manager", "editor");
  await enforcer.addRoleForUser("editor", "viewer");

  // Add basic policies
  const policies = [
    ["admin", "*", "*"],
    ["manager", "resources", "*"],
    ["editor", "resources", "write"],
    ["editor", "resources", "read"],
    ["viewer", "resources", "read"],
    ["support", "resources", "read"],
    ["user", "resources", "read"],
  ];

  for (const [role, resource, action] of policies) {
    await enforcer.addPolicy(role, resource, action);
  }

  await enforcer.savePolicy();
}

module.exports = {
  initializeEnforcer,
};
