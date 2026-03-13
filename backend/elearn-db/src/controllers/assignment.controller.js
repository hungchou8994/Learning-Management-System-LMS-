const Assignment = require("../models/Assignment");
const logger = require("../config/logger");
const Attempt = require("../models/Attempt");
const Session = require("../models/Session");
const Course = require("../models/Course");

function isTeacherRole(role) {
  return role === "teacher" || role === "admin" || role === "manager";
}

function sanitizeQuestions(questions, canSeeAnswerKey) {
  return (questions || []).map((q) => {
    const obj = q?.toObject ? q.toObject() : q;
    if (!canSeeAnswerKey && obj && typeof obj === "object") {
      const { correctAnswer, ...rest } = obj;
      return rest;
    }
    return obj;
  });
}

function computeAutoMcqGrade(assignment, answers) {
  const questions = assignment?.questions || [];
  // Get all questions (both multi_choice and assignment) that have correctAnswer
  const allQuestions = questions.filter(
    (q) => q.type === "multi_choice" || q.type === "assignment"
  );
  const total = allQuestions.length;
  if (!total) return { grade: null, correct: 0, total: 0, missingKey: false };

  // answers are array of { questionIndex, answer }, as stored by elearn-fe.
  let correct = 0;
  let missingKey = false;

  allQuestions.forEach((q, idx) => {
    // Map back to the original index in questions array by orderIndex position
    const qIndexInArray = questions.findIndex((x) => String(x._id) === String(q._id));
    const qIdx = qIndexInArray >= 0 ? qIndexInArray : idx;

    const expected = String(q.correctAnswer || "").trim();
    if (!expected) {
      missingKey = true;
      return;
    }
    
    const a = (answers || []).find((x) => Number(x?.questionIndex) === Number(qIdx));
    const actual = a
      ? Array.isArray(a.answer)
        ? String(a.answer[0] ?? "")
        : String(a.answer ?? "")
      : "";
    
    const actualNormalized = actual.trim().toLowerCase();
    const expectedNormalized = expected.trim().toLowerCase();
    
    // For both multi_choice and assignment: exact match (case-insensitive)
    if (actualNormalized && actualNormalized === expectedNormalized) {
      correct += 1;
    }
  });

  const grade = missingKey ? null : Math.round((correct / total) * 100);
  return { grade, correct, total, missingKey };
}

/**
 * Create a new assignment for a session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createAssignment = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const assignmentData = {
      ...req.body,
      sessionId: req.params.sessionId,
    };

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    return res.status(201).json({
      status: "success",
      message: "Assignment created successfully",
      data: {
        _id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        gradingMode: assignment.gradingMode,
        ratio: assignment.ratio,
        duration: assignment.duration,
        deadline: assignment.deadline,
        questions: assignment.questions,
        sessionId: assignment.sessionId,
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
const updateAssignment = async (req, res) => {
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
        _id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        gradingMode: assignment.gradingMode,
        ratio: assignment.ratio,
        duration: assignment.duration,
        deadline: assignment.deadline,
        questions: assignment.questions,
        sessionId: assignment.sessionId,
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
const deleteAssignment = async (req, res) => {
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
 * Get assignment details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAssignment = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const assignment = await Assignment.findById(
      req.params.assignmentId
    ).populate({
      path: "sessionId",
      select: "courseId",
    });

    if (!assignment) {
      return res.status(404).json({
        status: "error",
        message: "Assignment not found",
      });
    }

    const canSeeAnswerKey = isTeacherRole(req.user?.role);

    return res.status(200).json({
      status: "success",
      data: {
        _id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        gradingMode: assignment.gradingMode,
        ratio: assignment.ratio,
        duration: assignment.duration,
        deadline: assignment.deadline,
        questions: sanitizeQuestions(assignment.questions, canSeeAnswerKey),
        sessionId: assignment.sessionId._id,
        courseId: assignment.sessionId.courseId,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error getting assignment:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get assignment",
      error: error.message,
    });
  }
};

/**
 * Get assignment for a session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSessionAssignment = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const assignment = await Assignment.findOne({
      sessionId: req.params.sessionId,
    });

    if (!assignment) {
      return res.status(404).json({
        status: "error",
        message: "Assignment not found for this session",
      });
    }

    const canSeeAnswerKey = isTeacherRole(req.user?.role);

    return res.status(200).json({
      status: "success",
      data: {
        _id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        gradingMode: assignment.gradingMode,
        ratio: assignment.ratio,
        duration: assignment.duration,
        deadline: assignment.deadline,
        questions: sanitizeQuestions(assignment.questions, canSeeAnswerKey),
        sessionId: assignment.sessionId,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error getting session assignment:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get session assignment",
      error: error.message,
    });
  }
};

/**
 * Submit assignment answers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitAssignment = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const { assignmentId } = req.params;
    const { answers } = req.body;

    // Get the assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        status: "error",
        message: "Assignment not found",
      });
    }

    // Create a new attempt
    const attempt = new Attempt({
      username: req.user.username,
      assignmentId,
      answers,
    });

    // Auto-grade multiple choice when the assignment is configured for it.
    if (assignment.gradingMode === "auto") {
      const auto = computeAutoMcqGrade(assignment, answers);
      if (auto.grade !== null) {
        attempt.grade = auto.grade;
        attempt.gradingMode = "auto";
        attempt.gradedAt = new Date();
        attempt.autoSummary = { correct: auto.correct, total: auto.total };
        attempt.feedback = `Tự chấm trắc nghiệm: đúng ${auto.correct}/${auto.total}.`;
      } else if (auto.missingKey) {
        // Keep ungraded; teacher can grade manually later.
        attempt.feedback = "Bài này bật chấm tự động nhưng thiếu đáp án đúng cho một số câu trắc nghiệm.";
      }
    }

    await attempt.save();

    return res.status(200).json({
      status: "success",
      message: "Assignment submitted successfully",
      data: {
        id: attempt._id,
        assignmentId: attempt.assignmentId,
        submittedAt: attempt.createdAt,
        grade: attempt.grade ?? null,
      },
    });
  } catch (error) {
    logger.error("Error submitting assignment:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to submit assignment",
      error: error.message,
    });
  }
};

/**
 * Get all assignments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllAssignments = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const assignments = await Assignment.find();

    return res.status(200).json({
      status: "success",
      data: assignments.map((assignment) => ({
        id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        ratio: assignment.ratio,
        duration: assignment.duration,
        deadline: assignment.deadline,
        questions: assignment.questions,
        sessionId: assignment.sessionId,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      })),
    });
  } catch (error) {
    logger.error("Error getting all assignments:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get assignments",
      error: error.message,
    });
  }
};

/**
 * Get assignments for a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCourseAssignments = async (req, res) => {
  try {
    // Auth is already verified by middleware, user info is in req.user
    const username = req.user.username;
    const { courseId } = req.params;

    // Get the course's sessions
    const course = await Course.findById(courseId).populate({
      path: "sessions",
      select: "_id name",
    });

    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found",
      });
    }

    // Get all assignments for the course's sessions
    const assignments = await Assignment.find({
      sessionId: { $in: course.sessions.map((s) => s._id) },
    }).select(
      "_id name description ratio duration deadline questions sessionId createdAt updatedAt"
    );

    logger.info(
      `Found ${assignments.length} assignments for course ${courseId}`
    );

    // Get all attempts for these assignments by this user
    const attempts = await Attempt.find({
      username,
      assignmentId: { $in: assignments.map((a) => a._id) },
    });

    logger.info(`Found ${attempts.length} attempts for user ${username}`);

    // Map assignments with attempt information
    const assignmentsWithAttempts = assignments.map((assignment) => {
      const attempt = attempts.find(
        (a) => a.assignmentId.toString() === assignment._id.toString()
      );
      const session = course.sessions.find(
        (s) => s._id.toString() === assignment.sessionId.toString()
      );

      // Log attempt information for debugging
      if (attempt) {
        logger.info(`Assignment ${assignment._id} has attempt:`, {
          status: attempt.status,
          grade: attempt.grade,
          submittedAt: attempt.createdAt,
        });
      }

      return {
        id: assignment._id,
        name: assignment.name,
        description: assignment.description,
        ratio: assignment.ratio,
        duration: assignment.duration,
        deadline: assignment.deadline,
        questions: assignment.questions || [],
        sessionId: assignment.sessionId,
        sessionName: session ? session.name : "Unknown Session",
        status: attempt ? (attempt.grade ? "graded" : "completed") : "pending",
        grade: attempt ? attempt.grade : null,
        submittedAt: attempt ? attempt.createdAt : null,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      };
    });

    return res.status(200).json({
      status: "success",
      data: assignmentsWithAttempts,
    });
  } catch (error) {
    logger.error("Error getting course assignments:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get course assignments",
      error: error.message,
    });
  }
};

// Export all controller functions
module.exports = {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignment,
  getSessionAssignment,
  submitAssignment,
  getAllAssignments,
  getCourseAssignments,
};
