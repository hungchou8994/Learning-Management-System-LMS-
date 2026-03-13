const Feedback = require("../models/Feedback");
const User = require("../models/User");
const Enroll = require("../models/Enroll");
const logger = require("../config/logger");
const { decodeToken } = require("../utils/jwt.utils");
const { updateCourseRating } = require("./course.controller");

async function getAuthedUser(req, res) {
  const decodedToken = decodeToken(req.headers.authorization);
  if (!decodedToken) {
    res.status(401).json({
      status: "error",
      message: "Invalid or missing token",
    });
    return null;
  }

  const username = decodedToken.username;
  const user = await User.findOne({ username });
  if (!user) {
    res.status(404).json({
      status: "error",
      message: "User not found",
    });
    return null;
  }

  return { username, user };
}

async function ensureEnrolled(username, courseId) {
  // Only allow reviews for paid enrollments to match product behavior
  const enroll = await Enroll.findOne({ username, courseId, status: "paid" });
  return !!enroll;
}

/**
 * Create a new feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createFeedback = async (req, res) => {
  try {
    const authed = await getAuthedUser(req, res);
    if (!authed) return;
    const { username, user } = authed;

    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      return res.status(400).json({
        status: "error",
        message: "courseId is required",
      });
    }

    // Enrolled users only
    const enrolled = await ensureEnrolled(username, courseId);
    if (!enrolled) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You must be enrolled in this course to review.",
      });
    }

    const feedback = new Feedback({
      ...req.body,
      userId: user._id,
      courseId,
    });

    await feedback.save();

    // Update course rating
    await updateCourseRating(courseId);

    res.status(201).json({
      status: "success",
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    logger.error("Error creating feedback:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create feedback",
      error: error.message,
    });
  }
};

/**
 * Create or update feedback for a course (upsert by userId+courseId)
 * Route: POST /feedback/course/:courseId
 */
exports.createOrUpdateFeedbackForCourse = async (req, res) => {
  try {
    const authed = await getAuthedUser(req, res);
    if (!authed) return;
    const { username, user } = authed;

    const courseId = String(req.params.courseId || "").trim();
    if (!courseId) {
      return res.status(400).json({ status: "error", message: "Invalid courseId" });
    }

    const enrolled = await ensureEnrolled(username, courseId);
    if (!enrolled) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You must be enrolled in this course to review.",
      });
    }

    const payload = {
      rate: req.body?.rate,
      title: req.body?.title,
      comment: req.body?.comment,
      date: new Date(),
    };

    const feedback = await Feedback.findOneAndUpdate(
      { courseId, userId: user._id },
      { $set: payload, $setOnInsert: { courseId, userId: user._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await updateCourseRating(courseId);

    const populated = await Feedback.findById(feedback._id).populate({
      path: "userId",
      select: "username firstName lastName avatarUrl",
    });

    return res.status(200).json({
      status: "success",
      message: "Feedback saved successfully",
      data: populated || feedback,
    });
  } catch (error) {
    logger.error("Error create/update feedback:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to save feedback",
      error: error.message,
    });
  }
};

/**
 * Update a feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateFeedback = async (req, res) => {
  try {
    const authed = await getAuthedUser(req, res);
    if (!authed) return;
    const { user } = authed;

    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.feedbackId, userId: user._id },
      { $set: req.body },
      { new: true }
    ).populate({
      path: "userId",
      select: "username firstName lastName avatarUrl",
    });

    if (!feedback) {
      return res.status(404).json({
        status: "error",
        message: "Feedback not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Feedback updated successfully",
      data: feedback,
    });
  } catch (error) {
    logger.error(`Error updating feedback: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating feedback",
      error: error.message,
    });
  }
};

/**
 * Delete a feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const authed = await getAuthedUser(req, res);
    if (!authed) return;
    const { user } = authed;

    const feedback = await Feedback.findOneAndDelete({
      _id: req.params.feedbackId,
      userId: user._id,
    });

    if (!feedback) {
      return res.status(404).json({
        status: "error",
        message: "Feedback not found or unauthorized",
      });
    }

    await updateCourseRating(String(feedback.courseId));

    return res.status(200).json({
      status: "success",
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting feedback: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error deleting feedback",
      error: error.message,
    });
  }
};

/**
 * Get all feedbacks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFeedbacks = async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = courseId ? { courseId } : {};

    const feedbacks = await Feedback.find(query);

    return res.status(200).json({
      status: "success",
      data: feedbacks,
    });
  } catch (error) {
    logger.error(`Error getting feedbacks: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error getting feedbacks",
      error: error.message,
    });
  }
};

/**
 * Get a single feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ courseId: req.params.courseId })
      .populate({
        path: "userId",
        select: "username firstName lastName avatarUrl",
      })
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: feedback,
    });
  } catch (error) {
    logger.error("Error getting feedback:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get feedback",
      error: error.message,
    });
  }
};

/**
 * Get feedbacks written by the authenticated user
 * Route: GET /feedback/mine (protected)
 */
exports.getMyFeedbacks = async (req, res) => {
  try {
    const authed = await getAuthedUser(req, res);
    if (!authed) return;
    const { user } = authed;

    const feedbacks = await Feedback.find({ userId: user._id })
      .populate({ path: "courseId", select: "name thumbnail" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      data: feedbacks,
    });
  } catch (error) {
    logger.error("Error getting my feedbacks:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get user feedbacks",
      error: error.message,
    });
  }
};
