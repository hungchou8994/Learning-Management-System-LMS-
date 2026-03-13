const Attempt = require("../models/Attempt");
const User = require("../models/User");
const logger = require("../config/logger");
const { decodeToken } = require("../utils/jwt.utils");

/**
 * Create a new attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createAttempt = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const { courseId, sessionId, answers } = req.body;

    const attempt = new Attempt({
      username,
      courseId,
      sessionId,
      answers,
    });

    await attempt.save();

    return res.status(201).json({
      status: "success",
      message: "Attempt created successfully",
      data: attempt,
    });
  } catch (error) {
    logger.error(`Error creating attempt: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error creating attempt",
      error: error.message,
    });
  }
};

/**
 * Update an attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateAttempt = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const attempt = await Attempt.findOneAndUpdate(
      { _id: req.params.id, username },
      { $set: req.body },
      { new: true }
    );

    if (!attempt) {
      return res.status(404).json({
        status: "error",
        message: "Attempt not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Attempt updated successfully",
      data: attempt,
    });
  } catch (error) {
    logger.error(`Error updating attempt: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating attempt",
      error: error.message,
    });
  }
};

/**
 * Delete an attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteAttempt = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const attempt = await Attempt.findOneAndDelete({
      _id: req.params.id,
      username,
    });

    if (!attempt) {
      return res.status(404).json({
        status: "error",
        message: "Attempt not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Attempt deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting attempt: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error deleting attempt",
      error: error.message,
    });
  }
};

/**
 * Get all attempts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAttempts = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const { courseId, sessionId } = req.query;
    const query = { username };
    if (courseId) query.courseId = courseId;
    if (sessionId) query.sessionId = sessionId;

    const attempts = await Attempt.find(query);

    return res.status(200).json({
      status: "success",
      data: attempts,
    });
  } catch (error) {
    logger.error(`Error getting attempts: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error getting attempts",
      error: error.message,
    });
  }
};

/**
 * Get a single attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAttempt = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const attempt = await Attempt.findOne({
      _id: req.params.id,
      username,
    });

    if (!attempt) {
      return res.status(404).json({
        status: "error",
        message: "Attempt not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: "success",
      data: attempt,
    });
  } catch (error) {
    logger.error(`Error getting attempt: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error getting attempt",
      error: error.message,
    });
  }
};
