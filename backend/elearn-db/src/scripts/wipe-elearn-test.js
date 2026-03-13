/* eslint-disable no-console */
/**
 * 2) Wipe ALL data in elearn-db for database "elearn-test"
 *
 * Usage:
 *   node src/scripts/wipe-elearn-test.js --confirm --mongo mongodb://127.18.0.2:27017/elearn-test
 */

require("dotenv").config();

const mongoose = require("mongoose");
const { parseArgs, applyMongoEnvFromArgs } = require("./_args");

async function main() {
  const args = parseArgs(process.argv);
  const confirmed = !!args.confirm || !!args.yes;

  if (process.env.NODE_ENV === "production") {
    console.error("Refuse to wipe mongo in production (NODE_ENV=production).");
    process.exit(1);
  }

  if (!confirmed) {
    console.error("Refuse to wipe without --confirm.");
    console.error("Example:");
    console.error(
      "  node src/scripts/wipe-elearn-test.js --confirm --mongo mongodb://127.18.0.2:27017/elearn-test"
    );
    process.exit(1);
  }

  applyMongoEnvFromArgs(args);
  const mongoUri =
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/elearn-test?directConnection=true";

  try {
    console.log("Connecting to MongoDB...");
    console.log("URI:", mongoUri);
    await mongoose.connect(mongoUri);

    const dbName = mongoose.connection.db.databaseName;
    if (dbName !== "elearn-test") {
      console.error(`Refuse to drop db="${dbName}". Expected "elearn-test".`);
      process.exit(1);
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map((c) => c.name).join(", ") || "(none)");

    console.log("Dropping database...");
    await mongoose.connection.dropDatabase();
    console.log("Done. Dropped elearn-test.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("Wipe failed:", e?.message || String(e));
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}

main();


