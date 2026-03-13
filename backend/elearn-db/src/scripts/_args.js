/* eslint-disable no-console */
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const eqIdx = raw.indexOf("=");
    if (eqIdx > 0) {
      const k = raw.slice(2, eqIdx);
      const v = raw.slice(eqIdx + 1);
      args[k] = v === "" ? true : v;
      continue;
    }
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function applyMongoEnvFromArgs(args) {
  const mongo = args.mongo || args.uri || args.mongodb;
  if (mongo) process.env.MONGODB_URI = String(mongo);
}

function repoRootFromHere() {
  // __dirname = backend/elearn-db/src/scripts
  return path.resolve(__dirname, "..", "..", "..");
}

module.exports = { parseArgs, applyMongoEnvFromArgs, repoRootFromHere };


