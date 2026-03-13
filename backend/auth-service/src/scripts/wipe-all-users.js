/* eslint-disable no-console */
/**
 * 1) Wipe all accounts on auth-service (Postgres)
 *
 * Usage:
 *   node src/scripts/wipe-all-users.js --confirm --host localhost --port 5435 --user auth_user --password auth_password --db auth_db
 *
 * NOTE:
 * - Run from host against docker-compose Postgres (port 5435) OR inside compose network (host=auth-db port=5432).
 */

require("dotenv").config();

const { parseArgs, applyAuthDbEnvFromArgs } = require("./_args");

async function main() {
  const args = parseArgs(process.argv);
  const confirmed = !!args.confirm || !!args.yes;

  if (process.env.NODE_ENV === "production") {
    console.error("Refuse to wipe users in production (NODE_ENV=production).");
    process.exit(1);
  }

  if (!confirmed) {
    console.error("Refuse to wipe users without --confirm.");
    console.error("Example:");
    console.error(
      "  node src/scripts/wipe-all-users.js --confirm --host localhost --port 5435 --user auth_user --password auth_password --db auth_db"
    );
    process.exit(1);
  }

  // Apply DB overrides BEFORE requiring sequelize config/models (they read env at require-time).
  applyAuthDbEnvFromArgs(args);

  // eslint-disable-next-line global-require
  const { sequelize, User } = require("../models");

  try {
    console.log("Connecting to auth-service DB...");
    await sequelize.authenticate();
    console.log("Connected.");

    const before = await User.count();
    console.log("Users before:", before);

    await User.destroy({ where: {}, truncate: true, cascade: true });

    const after = await User.count();
    console.log("Users after:", after);

    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error("Wipe failed:", e?.message || String(e));
    try {
      await sequelize.close();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}

main();


