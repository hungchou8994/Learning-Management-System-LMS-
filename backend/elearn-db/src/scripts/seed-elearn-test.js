/* eslint-disable no-console */
/**
 * Script wrapper to seed elearn-test.
 *
 * Usage:
 *   node src/scripts/seed-elearn-test.js --mongo mongodb://127.18.0.2:27017/elearn-test --users ../../seed-users.json --courses 20
 */

require("dotenv").config();

const path = require("path");
const { parseArgs, applyMongoEnvFromArgs } = require("./_args");

function main() {
  const args = parseArgs(process.argv);
  applyMongoEnvFromArgs(args);

  // Forward args to seeder by re-invoking it with same process.argv
  // eslint-disable-next-line global-require
  require(path.resolve(__dirname, "..", "seeders", "seed-elearn-test.js"));
}

main();


