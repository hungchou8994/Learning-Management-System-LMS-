const Lesson = require("../models/Lesson");
const Session = require("../models/Session");
const Assignment = require("../models/Assignment");
const logger = require("../config/logger");

/**
 * Create a new lesson
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createLesson = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const lessonData = {
      ...req.body,
      sessionId: req.params.sessionId,
    };

    const lesson = new Lesson(lessonData);
    await lesson.save();

    // Add lesson to session's lessons array
    await Session.findByIdAndUpdate(req.params.sessionId, {
      $push: { lessons: lesson._id },
    });

    return res.status(201).json({
      status: "success",
      message: "Lesson created successfully",
      data: {
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        order_index: lesson.order_index,
        video_url: lesson.video_url,
        subtitle: lesson.subtitle,
        description: lesson.description,
        sessionId: lesson.sessionId,
        locked: lesson.locked,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error creating lesson:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create lesson",
      error: error.message,
    });
  }
};

/**
 * Update lesson information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateLesson = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.lessonId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!lesson) {
      return res.status(404).json({
        status: "error",
        message: "Lesson not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lesson updated successfully",
      data: {
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        order_index: lesson.order_index,
        video_url: lesson.video_url,
        subtitle: lesson.subtitle,
        description: lesson.description,
        sessionId: lesson.sessionId,
        locked: lesson.locked,
        updatedAt: lesson.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error updating lesson:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update lesson",
      error: error.message,
    });
  }
};

/**
 * Delete a lesson
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteLesson = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const lesson = await Lesson.findByIdAndDelete(req.params.lessonId);

    if (!lesson) {
      return res.status(404).json({
        status: "error",
        message: "Lesson not found",
      });
    }

    // Remove lesson from session's lessons array
    await Session.findByIdAndUpdate(lesson.sessionId, {
      $pull: { lessons: lesson._id },
    });

    // Delete associated assignment
    await Assignment.findOneAndDelete({ lessonId: req.params.lessonId });

    return res.status(200).json({
      status: "success",
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting lesson:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete lesson",
      error: error.message,
    });
  }
};

/**
 * Get lesson details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLesson = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const lesson = await Lesson.findById(req.params.lessonId);

    if (!lesson) {
      return res.status(404).json({
        status: "error",
        message: "Lesson not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        order_index: lesson.order_index,
        video_url: lesson.video_url,
        subtitle: lesson.subtitle,
        description: lesson.description,
        sessionId: lesson.sessionId,
        locked: lesson.locked,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error getting lesson:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get lesson",
      error: error.message,
    });
  }
};

/**
 * Create a new assignment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createAssignment = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const assignmentData = {
      ...req.body,
      lessonId: req.params.lessonId,
    };

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    return res.status(201).json({
      status: "success",
      message: "Assignment created successfully",
      data: {
        id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        ratio: assignment.ratio,
        questions: assignment.questions,
        lessonId: assignment.lessonId,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error creating assignment:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create assignment",
      error: error.message,
    });
  }
};

/**
 * Update assignment information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateAssignment = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.assignmentId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({
        status: "error",
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Assignment updated successfully",
      data: {
        id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        ratio: assignment.ratio,
        questions: assignment.questions,
        lessonId: assignment.lessonId,
        updatedAt: assignment.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error updating assignment:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update assignment",
      error: error.message,
    });
  }
};

/**
 * Delete an assignment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteAssignment = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const assignment = await Assignment.findByIdAndDelete(
      req.params.assignmentId
    );

    if (!assignment) {
      return res.status(404).json({
        status: "error",
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting assignment:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete assignment",
      error: error.message,
    });
  }
};

/**
 * Get all lessons for a session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSessionLessons = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const lessons = await Lesson.find({ sessionId: req.params.sessionId });

    return res.status(200).json({
      status: "success",
      data: lessons.map((lesson) => ({
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        order_index: lesson.order_index,
        video_url: lesson.video_url,
        subtitle: lesson.subtitle,
        description: lesson.description,
        sessionId: lesson.sessionId,
        locked: lesson.locked,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      })),
    });
  } catch (error) {
    logger.error("Error getting session lessons:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get session lessons",
      error: error.message,
    });
  }
};
