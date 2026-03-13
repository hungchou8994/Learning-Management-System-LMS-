const Course = require("../models/Course");
const Session = require("../models/Session");
const User = require("../models/User");
const Feedback = require("../models/Feedback");
const Enroll = require("../models/Enroll");
const logger = require("../config/logger");
const { decodeToken } = require("../utils/jwt.utils");
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Attempt = require("../models/Attempt");

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;

    // Find the user by username to get their ObjectId
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const course = new Course({
      ...req.body,
      instructorId: user._id, // Use the user's ObjectId
      createdBy: username, // Keep createdBy for tracking
    });

    await course.save();

    return res.status(201).json({
      status: "success",
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    logger.error(`Error creating course: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error creating course",
      error: error.message,
    });
  }
};

// Update course information
exports.updateCourse = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;

    // Find the user by username to get their ObjectId
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const course = await Course.findOneAndUpdate(
      { _id: req.params.courseId, instructorId: user._id },
      {
        $set: {
          ...req.body,
          instructorId: user._id, // Update instructorId to match the current user's ObjectId
        },
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    logger.error(`Error updating course: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating course",
      error: error.message,
    });
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;

    // Find the user by username to get their ObjectId
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const course = await Course.findOneAndDelete({
      _id: req.params.courseId,
      instructorId: user._id,
    });

    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found or unauthorized",
      });
    }

    // Delete associated sessions
    await Session.deleteMany({ courseId: req.params.courseId });

    return res.status(200).json({
      status: "success",
      message: "Course deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting course: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error deleting course",
      error: error.message,
    });
  }
};

// Get all courses with optional filtering
exports.getAllCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const q = String(req.query.q || "").trim();

    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const query = {};
    if (q) {
      const re = new RegExp(escapeRegex(q), "i");
      query.$or = [
        { name: re },
        { shortDescription: re },
        { description: re },
        { tag: re },
      ];
    }

    const totalCourses = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate("instructorId", "username firstName lastName")
      .populate("sessions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      status: "success",
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCourses / limit),
          totalCourses,
          hasNextPage: page < Math.ceil(totalCourses / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting courses:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get courses",
    });
  }
};

// Get instructor's courses (courses created by the current instructor)
exports.getInstructorCourses = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;

    // Find user to get instructor ID
    const instructor = await User.findOne({ username });
    if (!instructor) {
      return res.status(404).json({
        status: "error",
        message: "Instructor not found",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCourses = await Course.countDocuments({
      instructorId: instructor._id,
    });
    const courses = await Course.find({ instructorId: instructor._id })
      .populate("sessions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      status: "success",
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCourses / limit),
          totalCourses,
          hasNextPage: page < Math.ceil(totalCourses / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting instructor courses:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get instructor courses",
    });
  }
};

// Get grading statistics for instructor courses
exports.getInstructorCoursesWithGradingStats = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;

    // Find user to get instructor ID
    const instructor = await User.findOne({ username });
    if (!instructor) {
      return res.status(404).json({
        status: "error",
        message: "Instructor not found",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCourses = await Course.countDocuments({
      instructorId: instructor._id,
    });
    const courses = await Course.find({ instructorId: instructor._id })
      .populate("sessions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get grading statistics for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        // Get all sessions for this course
        const sessions = await Session.find({ courseId: course._id });
        const sessionIds = sessions.map((s) => s._id);

        // Get all assignments for these sessions
        const assignments = await Assignment.find({
          sessionId: { $in: sessionIds },
        });
        const assignmentIds = assignments.map((a) => a._id);

        // Get all attempts for these assignments
        const allAttempts = await Attempt.find({
          assignmentId: { $in: assignmentIds },
        });

        // Calculate grading statistics
        const totalAttempts = allAttempts.length;
        const gradedAttempts = allAttempts.filter(
          (attempt) => attempt.grade !== undefined && attempt.grade !== null
        ).length;
        const pendingAttempts = totalAttempts - gradedAttempts;

        return {
          ...course.toObject(),
          gradingStats: {
            totalSessions: sessions.length,
            totalAssignments: assignments.length,
            totalAttempts,
            pendingAttempts,
            gradedAttempts,
            gradingProgress:
              totalAttempts > 0
                ? Math.round((gradedAttempts / totalAttempts) * 100)
                : 0,
          },
        };
      })
    );

    res.json({
      status: "success",
      data: {
        courses: coursesWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCourses / limit),
          totalCourses,
          hasNextPage: page < Math.ceil(totalCourses / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting instructor courses with grading stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get instructor courses with grading statistics",
    });
  }
};

// Get course details with populated data
exports.getCourseDetails = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate({
        path: "sessions",
        populate: {
          path: "lessons",
          model: "Lesson",
          options: { sort: { order_index: 1 } },
        },
      })
      .populate({
        path: "instructorId",
        select: "username firstName lastName avatarUrl bio skill",
      });

    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found",
      });
    }

    // Get feedback for the course
    const feedback = await Feedback.find({ courseId: course._id })
      .populate({
        path: "userId",
        select: "username firstName lastName avatarUrl",
      })
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: {
        ...course.toObject(),
        feedback,
      },
    });
  } catch (error) {
    logger.error("Error getting course details:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get course details",
      error: error.message,
    });
  }
};

// Create a new session
exports.createSession = async (req, res) => {
  try {
    const sessionData = {
      ...req.body,
      courseId: req.params.courseId,
    };

    const session = new Session(sessionData);
    await session.save();

    // Add session to course's sessions array
    await Course.findByIdAndUpdate(req.params.courseId, {
      $push: { sessions: session._id },
    });

    res.status(201).json({
      status: "success",
      message: "Session created successfully",
      data: session,
    });
  } catch (error) {
    logger.error("Error creating session:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create session",
      error: error.message,
    });
  }
};

// Update session information
exports.updateSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session not found",
      });
    }

    res.json({
      status: "success",
      message: "Session updated successfully",
      data: session,
    });
  } catch (error) {
    logger.error("Error updating session:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update session",
      error: error.message,
    });
  }
};

// Get session details
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId).populate({
      path: "lessons",
      model: "Lesson",
      options: { sort: { order_index: 1 } },
    });

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session not found",
      });
    }

    res.json({
      status: "success",
      data: session,
    });
  } catch (error) {
    logger.error("Error getting session details:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get session details",
      error: error.message,
    });
  }
};

// Delete a session
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session not found",
      });
    }

    // Remove session from course's sessions array
    await Course.findByIdAndUpdate(session.courseId, {
      $pull: { sessions: session._id },
    });

    res.json({
      status: "success",
      message: "Session deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting session:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete session",
      error: error.message,
    });
  }
};

// Update course rating
exports.updateCourseRating = async (courseId) => {
  try {
    const result = await Feedback.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: "$courseId",
          averageRating: { $avg: "$rate" },
        },
      },
    ]);

    if (result.length > 0) {
      await Course.findByIdAndUpdate(courseId, {
        rating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal place
      });
    }
  } catch (error) {
    logger.error(`Error updating course rating: ${error.message}`);
    throw error;
  }
};

// Increment total students when a new enrollment occurs
exports.incrementTotalStudents = async (courseId) => {
  try {
    // IMPORTANT: totalStudents is denormalized. We recompute it from Enroll to avoid drift
    // (seed data, not_paid enrollments, deletes, status changes, etc.).
    const cid = new mongoose.Types.ObjectId(courseId);
    const rows = await Enroll.aggregate([
      { $match: { courseId: cid, status: "paid" } },
      { $group: { _id: "$username" } },
      { $count: "count" },
    ]);
    const count = rows?.[0]?.count || 0;
    await Course.findByIdAndUpdate(courseId, { $set: { totalStudents: count } });
  } catch (error) {
    logger.error(`Error incrementing total students: ${error.message}`);
    throw error;
  }
};

/**
 * Get course attempts for grading
 */
exports.getCourseAttempts = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const courseId = req.params.courseId;
    const { status, sessionId } = req.query;

    // Verify course belongs to instructor
    const username = decodedToken.username;
    const instructor = await User.findOne({ username });
    if (!instructor) {
      return res.status(404).json({
        status: "error",
        message: "Instructor not found",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      instructorId: instructor._id,
    });
    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found or unauthorized",
      });
    }

    // Get sessions for this course
    let sessionQuery = { courseId: courseId };
    if (sessionId) {
      sessionQuery._id = sessionId;
    }

    const sessions = await Session.find(sessionQuery);
    const sessionIds = sessions.map((s) => s._id);

    // Get assignments for these sessions
    const assignments = await Assignment.find({
      sessionId: { $in: sessionIds },
    });
    const assignmentIds = assignments.map((a) => a._id);

    // Build attempts query
    let attemptsQuery = { assignmentId: { $in: assignmentIds } };

    if (status === "pending") {
      attemptsQuery.$or = [{ grade: { $exists: false } }, { grade: null }];
    } else if (status === "graded") {
      attemptsQuery.grade = { $exists: true, $ne: null };
    }

    // Get attempts with populated data
    const attempts = await Attempt.find(attemptsQuery)
      .populate({
        path: "assignmentId",
        select: "name description sessionId",
        populate: {
          path: "sessionId",
          select: "name orderIndex",
        },
      })
      .sort({ createdAt: -1 });

    // Get student information for each attempt
    const attemptsWithStudents = await Promise.all(
      attempts.map(async (attempt) => {
        const student = await User.findOne({ username: attempt.username });
        return {
          ...attempt.toObject(),
          student: student
            ? {
                _id: student._id,
                name:
                  `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
                  student.username,
                email: student.email || `${student.username}@example.com`,
                avatar: student.avatarUrl,
              }
            : {
                _id: null,
                name: attempt.username,
                email: `${attempt.username}@example.com`,
                avatar: null,
              },
          assignment: {
            _id: attempt.assignmentId._id,
            name: attempt.assignmentId.name,
            description: attempt.assignmentId.description,
            sessionId: attempt.assignmentId.sessionId._id,
            sessionName: attempt.assignmentId.sessionId.name,
            sessionOrder: attempt.assignmentId.sessionId.orderIndex,
          },
        };
      })
    );

    res.json({
      status: "success",
      data: attemptsWithStudents,
    });
  } catch (error) {
    logger.error("Error getting course attempts:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get course attempts",
    });
  }
};

/**
 * Grade an attempt
 */
exports.gradeAttempt = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const attemptId = req.params.attemptId;
    const { grade, feedback, gradingMode } = req.body;

    // Validate grade
    if (grade < 0 || grade > 100) {
      return res.status(400).json({
        status: "error",
        message: "Grade must be between 0 and 100",
      });
    }

    // Get instructor info
    const username = decodedToken.username;
    const instructor = await User.findOne({ username });
    if (!instructor) {
      return res.status(404).json({
        status: "error",
        message: "Instructor not found",
      });
    }

    // Find and update attempt
    const attempt = await Attempt.findById(attemptId).populate({
      path: "assignmentId",
      populate: {
        path: "sessionId",
        select: "courseId",
      },
    });

    if (!attempt) {
      return res.status(404).json({
        status: "error",
        message: "Attempt not found",
      });
    }

    // Verify instructor owns the course
    const course = await Course.findOne({
      _id: attempt.assignmentId.sessionId.courseId,
      instructorId: instructor._id,
    });

    if (!course) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized to grade this attempt",
      });
    }

    // Update attempt with grade and feedback
    attempt.grade = grade;
    attempt.feedback = feedback;
    if (gradingMode && ["manual", "auto", "ai"].includes(String(gradingMode))) {
      attempt.gradingMode = String(gradingMode);
    }
    attempt.instructorId = instructor._id;
    attempt.gradedAt = new Date();

    await attempt.save();

    res.json({
      status: "success",
      message: "Attempt graded successfully",
      data: attempt,
    });
  } catch (error) {
    logger.error("Error grading attempt:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to grade attempt",
    });
  }
};
