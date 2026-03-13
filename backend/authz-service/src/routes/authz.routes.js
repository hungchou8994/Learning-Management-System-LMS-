const express = require("express");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
};

// Check permission
router.post("/check", verifyToken, async (req, res) => {
  try {
    const { resource, action } = req.body;
    const { role } = req.user;

    if (!resource || !action) {
      return res.status(400).json({
        status: "error",
        message: "Resource and action are required",
      });
    }

    const allowed = await req.enforcer.enforce(role, resource, action);

    res.json({
      status: "success",
      data: {
        allowed,
      },
    });
  } catch (error) {
    logger.error("Permission check error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// Get user permissions
router.get("/permissions", verifyToken, async (req, res) => {
  try {
    const { role } = req.user;
    const permissions = await req.enforcer.getImplicitPermissionsForUser(role);

    res.json({
      status: "success",
      data: {
        permissions,
      },
    });
  } catch (error) {
    logger.error("Get permissions error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// Add policy
router.post("/policies", verifyToken, async (req, res) => {
  try {
    const { role } = req.user;

    // Only admin can add policies
    const isAdmin = await req.enforcer.hasRoleForUser(role, "admin");
    if (!isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "Insufficient permissions",
      });
    }

    const { subject, object, action } = req.body;
    await req.enforcer.addPolicy(subject, object, action);
    await req.enforcer.savePolicy();

    res.status(201).json({
      status: "success",
      message: "Policy added successfully",
    });
  } catch (error) {
    logger.error("Add policy error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
