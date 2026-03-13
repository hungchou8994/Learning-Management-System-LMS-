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

function applyAuthDbEnvFromArgs(args) {
  const host = args.host || args.dbHost;
  const port = args.port || args.dbPort;
  const user = args.user || args.dbUser;
  const password = args.password || args.dbPassword;
  const db = args.db || args.dbName;

  if (host) process.env.DB_HOST = String(host);
  if (port) process.env.DB_PORT = String(port);
  if (user) process.env.DB_USER = String(user);
  if (password) process.env.DB_PASSWORD = String(password);
  if (db) process.env.DB_NAME = String(db);
}

function defaultRepoRoot() {
  // __dirname = backend/auth-service/src/scripts
  return path.resolve(__dirname, "..", "..", "..", "..");
}

module.exports = { parseArgs, applyAuthDbEnvFromArgs, defaultRepoRoot };


