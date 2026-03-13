const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const authMiddleware = (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        message: "No authorization header provided",
      });
    }

    // Check if the token is in the correct format (Bearer <token>)
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token format",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add the decoded user info to the request
    req.user = decoded;

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
