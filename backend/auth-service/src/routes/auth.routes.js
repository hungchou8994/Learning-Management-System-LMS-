const express = require("express");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const {
  validateLogin,
  validateRegistration,
  validatePasswordChange,
  validateProfileUpdate,
  validateForgotPassword,
  validateResetPassword,
} = require("../validators/auth.validator");
const { User } = require("../models");
const logger = require("../utils/logger");
const { redisClient } = require("../config/redis");

const router = express.Router();

const maskEmail = (email) => {
  const e = String(email || "").trim();
  const at = e.indexOf("@");
  if (at <= 0) return "";
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);

  const localMasked =
    local.length <= 1 ? `${local}***` : `${local[0]}***${local[local.length - 1]}`;

  const parts = domain.split(".");
  const domainMasked = parts
    .map((p) => {
      const s = String(p || "");
      if (!s) return "";
      if (s.length <= 2) return `${s[0]}*`;
      return `${s[0]}***${s[s.length - 1]}`;
    })
    .filter(Boolean)
    .join(".");

  return `${localMasked}@${domainMasked}`;
};

// Helpers: authz for manager/admin endpoints
const extractAccessToken = (req) => {
  const cookies = req.cookies || {};
  let token = cookies.access_token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7);
  }
  if (!token && req.headers.cookie) {
    const parts = req.headers.cookie.split(";").map((c) => c.trim());
    for (const p of parts) {
      if (p.startsWith("access_token=")) {
        token = p.substring("access_token=".length);
        break;
      }
    }
  }
  return token;
};

const requireManagerOrAdmin = async (req, res) => {
  const token = extractAccessToken(req);
  if (!token) {
    res.status(401).json({ status: "error", message: "Authentication required" });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const me = await User.findByPk(decoded.id, { attributes: ["id", "role", "username", "email"] });
    if (!me) {
      res.status(401).json({ status: "error", message: "User not found" });
      return null;
    }
    if (me.role !== "manager" && me.role !== "admin") {
      res.status(403).json({ status: "error", message: "Forbidden" });
      return null;
    }
    return me;
  } catch (e) {
    res.status(401).json({ status: "error", message: "Invalid or expired token" });
    return null;
  }
};

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1d" }
  );

  const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });

  return { accessToken, refreshToken };
};

// Helper function to track user session
const trackUserSession = async (userId, ip, deviceId = "default") => {
  try {
    const sessionKey = `user:${userId}:sessions`;
    await redisClient.hSet(sessionKey, `${deviceId}:${ip}`, Date.now());
    await redisClient.expire(sessionKey, 7 * 24 * 60 * 60); // 7 days
    logger.info(`Session tracked for user ${userId} on device ${deviceId}`);
  } catch (error) {
    logger.error(`Error tracking user session: ${error.message}`);
  }
};

// Store refresh token in Redis with device support
const storeRefreshToken = async (
  userId,
  refreshToken,
  deviceId = "default"
) => {
  try {
    const tokenKey = `user:${userId}:tokens`;
    logger.debug(
      `Storing refresh token for user ${userId} on device ${deviceId}`
    );
    logger.debug(
      `Token key: ${tokenKey}, Token length: ${refreshToken.length}`
    );

    await redisClient.hSet(tokenKey, deviceId, refreshToken);
    await redisClient.expire(tokenKey, 7 * 24 * 60 * 60); // 7 days to match JWT expiry

    // Verify the token was stored
    const storedToken = await redisClient.hGet(tokenKey, deviceId);
    if (storedToken) {
      logger.debug(`Verified token storage: token retrieved successfully`);
    } else {
      logger.warn(`Failed to verify token storage: could not retrieve token`);
    }

    logger.info(
      `Refresh token stored for user ${userId} on device ${deviceId}`
    );
    return true;
  } catch (error) {
    logger.error(`Error storing refresh token: ${error.message}`);
    throw error;
  }
};

// Get refresh token from Redis with device support
const getRefreshToken = async (userId, deviceId = "default") => {
  try {
    const tokenKey = `user:${userId}:tokens`;
    logger.debug(
      `Getting refresh token for user ${userId} on device ${deviceId}`
    );
    logger.debug(`Token key: ${tokenKey}`);

    const refreshToken = await redisClient.hGet(tokenKey, deviceId);
    if (!refreshToken) {
      logger.warn(
        `No refresh token found for user ${userId} on device ${deviceId}`
      );

      // Try to check if there are any tokens for this user
      try {
        const allTokens = await redisClient.client.hGetAll(
          `user:${userId}:tokens`
        );
        if (allTokens && Object.keys(allTokens).length > 0) {
          logger.warn(
            `User ${userId} has tokens for other devices: ${Object.keys(
              allTokens
            ).join(", ")}`
          );
        } else {
          logger.warn(`No tokens found for user ${userId} on any device`);
        }
      } catch (redisError) {
        logger.error(`Error checking all tokens: ${redisError.message}`);
      }

      return null;
    }

    logger.debug(`Retrieved refresh token (length: ${refreshToken.length})`);
    return refreshToken;
  } catch (error) {
    logger.error(`Error getting refresh token: ${error.message}`);
    throw error;
  }
};

// Delete specific refresh token
const deleteRefreshToken = async (userId, deviceId = "default") => {
  try {
    const tokenKey = `user:${userId}:tokens`;
    await redisClient.hDel(tokenKey, deviceId);
    logger.info(
      `Refresh token deleted for user ${userId} on device ${deviceId}`
    );
    return true;
  } catch (error) {
    logger.error(`Error deleting refresh token: ${error.message}`);
    throw error;
  }
};

// Delete all refresh tokens for a user
const deleteAllRefreshTokens = async (userId) => {
  try {
    const tokenKey = `user:${userId}:tokens`;
    await redisClient.del(tokenKey);
    logger.info(`All refresh tokens deleted for user ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting all refresh tokens: ${error.message}`);
    throw error;
  }
};

// Register new user
router.post("/register", async (req, res) => {
  try {
    // Validate request body
    const { error } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username or email already exists",
      });
    }

    // Create new user with validated role
    const user = await User.create({
      username,
      email,
      password,
      role, // Allow student role
    });

    const { accessToken, refreshToken } = generateTokens(user);

    // Get device ID from header or generate one
    const deviceId = req.headers["x-device-id"] || `device_${Date.now()}`;

    // Store refresh token with device ID
    await storeRefreshToken(user.id, refreshToken, deviceId);

    // Track session with device ID
    await trackUserSession(user.id, req.ip, deviceId);

    logger.info(`User registered successfully: ${username}`);

    res
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .cookie("device_id", deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      })
      .json({
        status: "success",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          deviceId: deviceId,
        },
      });
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during registration",
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    // Validate request body
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { username },
    });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);

    // Get device ID from cookie, header, or generate a new one
    let deviceId = req.cookies.device_id || req.headers["x-device-id"];
    if (!deviceId) {
      deviceId = `device_${Date.now()}`;
    }

    // Store refresh token with device ID
    await storeRefreshToken(user.id, refreshToken, deviceId);

    // Track session with device ID
    await trackUserSession(user.id, req.ip, deviceId);

    res
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .cookie("device_id", deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      })
      .json({
        status: "success",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          deviceId: deviceId,
        },
      });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    // Try to get the refresh token from different sources
    let refreshToken = req.cookies?.refresh_token;

    // If not in cookies, check request body
    if (!refreshToken && req.body?.refreshToken) {
      refreshToken = req.body.refreshToken;
      logger.info(`Using refresh token from request body`);
    }

    logger.info(
      `Refresh token request received: ${
        refreshToken ? "Token present" : "No token"
      }`
    );

    if (!refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "No refresh token provided",
      });
    }

    // Get device ID from various sources
    const deviceId =
      req.cookies?.device_id ||
      req.headers["x-device-id"] ||
      req.body?.deviceId ||
      "default";
    logger.info(`Initial device ID for refresh: ${deviceId}`);

    try {
      // First verify the token is valid
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      logger.info(`Token decoded for user ID: ${decoded.id}`);

      // Get stored token for this device
      let storedToken = await getRefreshToken(decoded.id, deviceId);

      // If no token with the provided device ID, try with "default"
      if (!storedToken && deviceId !== "default") {
        logger.info(
          `Trying to get token with default device ID instead of ${deviceId}`
        );
        storedToken = await getRefreshToken(decoded.id, "default");

        if (storedToken) {
          logger.info(`Found token with default device ID`);
        }
      }

      // If still no token, try to scan all devices for this user
      if (!storedToken) {
        try {
          const allTokens = await redisClient.client.hGetAll(
            `user:${decoded.id}:tokens`
          );
          const availableDevices = Object.keys(allTokens);

          if (availableDevices.length > 0) {
            logger.info(
              `User has tokens for these devices: ${availableDevices.join(
                ", "
              )}`
            );

            // Try the first available device
            const firstDevice = availableDevices[0];
            storedToken = allTokens[firstDevice];

            if (storedToken === refreshToken) {
              logger.info(`Found matching token on device: ${firstDevice}`);
            } else {
              storedToken = null;
              logger.warn(
                `Token on device ${firstDevice} doesn't match the provided token`
              );
            }
          }
        } catch (scanError) {
          logger.error(`Error scanning for tokens: ${scanError.message}`);
        }
      }

      if (!storedToken) {
        logger.warn(`No stored token found for user ${decoded.id}`);
        return res.status(401).json({
          status: "error",
          message: "No stored refresh token",
        });
      }

      if (storedToken !== refreshToken) {
        logger.warn(
          `Token mismatch for user ${decoded.id} on device ${deviceId}`
        );
        return res.status(401).json({
          status: "error",
          message: "Invalid refresh token",
        });
      }

      const user = await User.findByPk(decoded.id);
      if (!user) {
        logger.warn(`User ${decoded.id} not found in database`);
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      // Generate new tokens instead of reusing the old ones
      logger.info(`Generating new tokens for user: ${user.username}`);
      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(user);

      // Update the stored refresh token - use the original device ID that worked
      const effectiveDeviceId = deviceId;
      logger.info(
        `Storing new refresh token for user ${user.id} on device ${effectiveDeviceId}`
      );
      await storeRefreshToken(user.id, newRefreshToken, effectiveDeviceId);

      // Track session renewal
      logger.info(
        `Tracking session for user ${user.id} on device ${effectiveDeviceId}`
      );
      await trackUserSession(user.id, req.ip, effectiveDeviceId);

      // Also include tokens in response body for API clients that don't handle cookies well
      const responseBody = {
        status: "success",
        message: "Tokens refreshed successfully",
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
          },
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      };

      logger.info(`Setting new token cookies for user ${user.id}`);
      res
        .cookie("access_token", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 24 * 60 * 60 * 1000, // 1 day
          path: "/",
        })
        .cookie("refresh_token", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        })
        .cookie("device_id", effectiveDeviceId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
          path: "/",
        })
        .json(responseBody);

      logger.info(`Token refresh completed successfully for user ${user.id}`);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        logger.warn(`Refresh token expired: ${jwtError.message}`);
        return res.status(401).json({
          status: "error",
          message: "Refresh token has expired",
        });
      }

      logger.error(`JWT verification error: ${jwtError.message}`);
      return res.status(401).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`, error.stack);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const deviceId =
      req.cookies.device_id || req.headers["x-device-id"] || "default";

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        // Only delete the token for this device
        await deleteRefreshToken(decoded.id, deviceId);
      } catch (error) {
        // If token is invalid, just continue with logout
        logger.warn("Invalid refresh token during logout:", error.message);
      }
    }

    res.clearCookie("access_token").clearCookie("refresh_token").json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// Logout from all devices
router.post("/logout-all", async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        // Delete all tokens for this user
        await deleteAllRefreshTokens(decoded.id);
      } catch (error) {
        // If token is invalid, just continue with logout
        logger.warn("Invalid refresh token during logout-all:", error.message);
      }
    }

    res.clearCookie("access_token").clearCookie("refresh_token").json({
      status: "success",
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    logger.error("Logout from all devices error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// Get current user data
router.get("/me", async (req, res) => {
  try {
    logger.info(`/me endpoint accessed from IP: ${req.ip}`);
    logger.debug(`Request headers: ${JSON.stringify(req.headers)}`);
    logger.debug(`Raw cookie header: ${req.headers.cookie || "none"}`);

    // Handle case where req.cookies might be undefined
    const cookies = req.cookies || {};
    logger.debug(`Parsed cookies: ${JSON.stringify(cookies)}`);

    // Extract token from cookies or Authorization header
    let token = cookies.access_token;
    logger.debug(`Token from cookies: ${token ? "present" : "not found"}`);

    // If token not in cookies, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      logger.debug(`Authorization header: ${authHeader}`);

      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        logger.debug(
          `Token extracted from Authorization header: ${token.substring(
            0,
            10
          )}...`
        );
      }
    } else if (!token && req.headers.cookie) {
      // Try to manually parse cookies if cookie-parser middleware failed
      const cookieHeader = req.headers.cookie;
      const cookieParts = cookieHeader.split(";").map((c) => c.trim());

      for (const part of cookieParts) {
        if (part.startsWith("access_token=")) {
          token = part.substring("access_token=".length);
          logger.debug(
            `Token manually extracted from cookie header: ${token.substring(
              0,
              10
            )}...`
          );
          break;
        }
      }
    }

    if (!token) {
      logger.warn("No access token found in cookies or Authorization header");
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
        details: "No access token provided",
      });
    }

    logger.debug(`Token extracted: ${token.substring(0, 10)}...`);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug(`Token verified successfully for user ID: ${decoded.id}`);

    // Get user data - using Sequelize methods
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      logger.warn(`User not found for ID: ${decoded.id}`);
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Get the device ID from cookies or request
    const deviceId = cookies.device_id || req.body.deviceId;

    // Track session activity if device ID is available
    if (deviceId) {
      try {
        await trackUserSession(user.id, req.ip, deviceId);
        logger.debug(
          `Updated session activity for user: ${user.id}, device: ${deviceId}`
        );
      } catch (sessionErr) {
        logger.error(`Error updating session activity: ${sessionErr.message}`);
      }
    }

    logger.info(`User data retrieved successfully for: ${user.email}`);
    return res.status(200).json({
      status: "success",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logger.warn("Token expired");
      return res.status(401).json({
        status: "error",
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      logger.warn(`Invalid token: ${error.message}`);
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
        details: error.message,
      });
    }

    logger.error(`Error in /me endpoint: ${error.message}`, error.stack);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Change password
router.put("/password", async (req, res) => {
  try {
    // Get user from token
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Validate request body
    const { error } = validatePasswordChange(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens for security
    await deleteAllRefreshTokens(userId);

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Get device ID
    const deviceId =
      req.cookies.device_id ||
      req.headers["x-device-id"] ||
      `device_${Date.now()}`;

    // Store new refresh token
    await storeRefreshToken(userId, refreshToken, deviceId);

    // Send new tokens in cookies
    res
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
        status: "success",
        message: "Password updated successfully",
      });

    logger.info(`Password updated successfully for user ${userId}`);
  } catch (error) {
    logger.error("Password change error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }
    res.status(500).json({
      status: "error",
      message: "Internal server error during password change",
    });
  }
});

// Update profile (currently: email)
router.put("/profile", async (req, res) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { error } = validateProfileUpdate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { email } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const existing = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: userId },
      },
    });
    if (existing) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }

    user.email = email;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("Profile update error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Internal server error during profile update",
    });
  }
});

// Manager/Admin: list users (for center-fe)
router.get("/users", async (req, res) => {
  try {
    const me = await requireManagerOrAdmin(req, res);
    if (!me) return;

    const { role, q } = req.query;
    const where = {};
    if (role && typeof role === "string") where.role = role;
    if (q && typeof q === "string" && q.trim()) {
      where[Op.or] = [
        { username: { [Op.like]: `%${q.trim()}%` } },
        { email: { [Op.like]: `%${q.trim()}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: 500,
    });

    return res.status(200).json({
      status: "success",
      data: {
        requester: { id: me.id, role: me.role, username: me.username },
        users: users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
      },
    });
  } catch (error) {
    logger.error("List users error:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// Admin: update user by id (email/role) - for center-fe staff management
router.patch("/users/:id", async (req, res) => {
  try {
    const me = await requireManagerOrAdmin(req, res);
    if (!me) return;
    if (me.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ status: "error", message: "Invalid user id" });
    }

    const target = await User.findByPk(id);
    if (!target) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const nextEmail = typeof req.body?.email === "string" ? req.body.email.trim() : undefined;
    const nextRole = typeof req.body?.role === "string" ? req.body.role : undefined;

    if (nextEmail !== undefined) {
      // Basic email validation via sequelize model constraints; also prevent duplicates
      const existing = await User.findOne({
        where: { email: nextEmail, id: { [Op.ne]: id } },
      });
      if (existing) {
        return res.status(400).json({ status: "error", message: "Email already exists" });
      }
      target.email = nextEmail;
    }

    if (nextRole !== undefined) {
      const allowed = ["admin", "teacher", "student", "recruiter", "parent", "accountant", "manager"];
      if (!allowed.includes(nextRole)) {
        return res.status(400).json({ status: "error", message: "Invalid role" });
      }
      target.role = nextRole;
    }

    await target.save();

    return res.status(200).json({
      status: "success",
      data: {
        user: {
          id: target.id,
          username: target.username,
          email: target.email,
          role: target.role,
          createdAt: target.createdAt,
          updatedAt: target.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("Update user (admin) error:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// Manager/Admin: delete user by id (with guard rules)
router.delete("/users/:id", async (req, res) => {
  try {
    const me = await requireManagerOrAdmin(req, res);
    if (!me) return;

    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ status: "error", message: "Invalid user id" });
    }

    if (id === me.id) {
      return res.status(400).json({ status: "error", message: "Bạn không thể tự xóa tài khoản của mình." });
    }

    const target = await User.findByPk(id);
    if (!target) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // Authorization rules
    if (target.role === "admin" && me.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Chỉ admin mới có thể xóa admin." });
    }
    if (target.role === "manager" && me.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Chỉ admin mới có thể xóa manager." });
    }

    // Invalidate all tokens for the user
    try {
      await deleteAllRefreshTokens(target.id);
    } catch (e) {
      logger.warn("Failed to delete refresh tokens for user:", e.message);
    }

    await target.destroy();

    return res.status(200).json({
      status: "success",
      message: "User deleted",
      data: { id },
    });
  } catch (error) {
    logger.error("Delete user error:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// Forgot password - returns fake OTP (123456)
router.post("/forgot-password", async (req, res) => {
  try {
    const { error } = validateForgotPassword(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { username } = req.body;

    // Find user
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Username not found",
      });
    }

    // Return fake OTP (always 123456)
    logger.info(`Forgot password requested for user: ${username}`);
    return res.status(200).json({
      status: "success",
      message: "OTP has been sent",
      data: {
        otp: "123456", // Fake OTP - always the same
        emailMasked: maskEmail(user.email),
      },
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during forgot password",
    });
  }
});

// Reset password with OTP
router.post("/reset-password", async (req, res) => {
  try {
    const { error } = validateResetPassword(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { username, otp, newPassword } = req.body;

    // Validate fake OTP (always 123456)
    if (otp !== "123456") {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }

    // Find user
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens for security
    await deleteAllRefreshTokens(user.id);

    logger.info(`Password reset successfully for user: ${username}`);
    return res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    logger.error("Reset password error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during password reset",
    });
  }
});

module.exports = {
  router,
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
};
