const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

/**
 * Decode JWT token from Authorization header
 * @param {string} authHeader - Authorization header value (Bearer token)
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
const decodeToken = (authHeader) => {
  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error(`Error decoding token: ${error.message}`);
    return null;
  }
};

module.exports = {
  decodeToken,
};
