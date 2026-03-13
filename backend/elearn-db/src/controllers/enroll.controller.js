const Enroll = require("../models/Enroll");
const Course = require("../models/Course");
const User = require("../models/User");
const Session = require("../models/Session");
const Lesson = require("../models/Lesson");
const Assignment = require("../models/Assignment");
const Attempt = require("../models/Attempt");
const logger = require("../config/logger");
const { decodeToken } = require("../utils/jwt.utils");
const { incrementTotalStudents } = require("./course.controller");

/**
 * Create a new enrollment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createEnroll = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const courseId = req.params.courseId;

    // Check if user is already enrolled
    const existingEnroll = await Enroll.findOne({
      username,
      courseId,
    });

    if (existingEnroll) {
      return res.status(400).json({
        status: "error",
        message: "User is already enrolled in this course",
      });
    }

    const enroll = new Enroll({
      username,
      courseId,
      status: req.body.status || "not_paid",
      paymentMethod: req.body.paymentMethod,
    });

    await enroll.save();

    // Increment total students count
    await incrementTotalStudents(courseId);

    res.status(201).json({
      status: "success",
      message: "Enrolled successfully",
      data: enroll,
    });
  } catch (error) {
    logger.error("Error creating enrollment:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create enrollment",
      error: error.message,
    });
  }
};

/**
 * Update an enrollment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateEnroll = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const enroll = await Enroll.findOneAndUpdate(
      { _id: req.params.enrollmentId, username },
      { $set: req.body },
      { new: true }
    );

    if (!enroll) {
      return res.status(404).json({
        status: "error",
        message: "Enrollment not found or unauthorized",
      });
    }

    // totalStudents is denormalized; recompute after updates (status changes, etc.)
    await incrementTotalStudents(enroll.courseId);

    return res.status(200).json({
      status: "success",
      message: "Enrollment updated successfully",
      data: enroll,
    });
  } catch (error) {
    logger.error(`Error updating enrollment: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating enrollment",
      error: error.message,
    });
  }
};

/**
 * Delete an enrollment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteEnroll = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const enroll = await Enroll.findOneAndDelete({
      _id: req.params.enrollmentId,
      username,
    });

    if (!enroll) {
      return res.status(404).json({
        status: "error",
        message: "Enrollment not found or unauthorized",
      });
    }

    // totalStudents is denormalized; recompute after delete
    await incrementTotalStudents(enroll.courseId);

    return res.status(200).json({
      status: "success",
      message: "Enrollment deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting enrollment: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error deleting enrollment",
      error: error.message,
    });
  }
};

/**
 * Get all enrollments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEnrolls = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const enrolls = await Enroll.find({ username }).populate({
      path: "courseId",
      model: "Course",
      select:
        "name shortDescription thumbnail tag originalPrice salePrice status totalStudents sessions",
      populate: {
        path: "sessions",
        model: "Session",
        select: "_id lessons",
        populate: {
          path: "lessons",
          model: "Lesson",
          select: "duration",
        },
      },
    });

    const enrolledCourses = await Promise.all(
      enrolls.map(async (enroll) => {
        // Ensure we have valid session IDs
        const sessionIds = enroll.courseId.sessions
          ? enroll.courseId.sessions.map((s) => s._id)
          : [];

        logger.info(
          `Course ${enroll.courseId._id} has ${sessionIds.length} sessions`
        );

        // Get all assignments for the course's sessions
        const assignments = await Assignment.find({
          sessionId: { $in: sessionIds },
        });

        logger.info(
          `Found ${assignments.length} assignments for course ${enroll.courseId._id}`
        );

        // Get all attempts for these assignments by this user
        const attempts = await Attempt.find({
          username,
          assignmentId: { $in: assignments.map((a) => a._id) },
        });

        logger.info(`Found ${attempts.length} attempts for user ${username}`);

        // Calculate total and completed assignments
        const totalAssignments = assignments.length;
        const completedAssignments = attempts.filter(
          (attempt) =>
            attempt.status === "completed" || attempt.status === "graded"
        ).length;

        // Calculate total lessons
        const totalLessons = enroll.courseId.sessions.reduce(
          (total, session) => {
            return total + (session.lessons ? session.lessons.length : 0);
          },
          0
        );

        // Calculate total duration in minutes
        const totalMinutes = enroll.courseId.sessions.reduce(
          (total, session) => {
            return (
              total +
              session.lessons.reduce((lessonTotal, lesson) => {
                return lessonTotal + (lesson.duration || 0);
              }, 0)
            );
          },
          0
        );

        // Convert minutes to hours and minutes
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const duration = `${hours}h ${minutes}m`;

        return {
          id: enroll.courseId._id,
          name: enroll.courseId.name,
          shortDescription: enroll.courseId.shortDescription,
          thumbnail: enroll.courseId.thumbnail,
          tag: enroll.courseId.tag,
          progress: enroll.progress || 0,
          status: enroll.status,
          lessons: totalLessons,
          duration: duration,
          enrolledStudents: enroll.courseId.totalStudents || 0,
          createdAt: enroll.createdAt,
          courseId: {
            price: enroll.courseId.salePrice || enroll.courseId.originalPrice,
          },
          totalAssignments,
          completedAssignments,
          pendingAssignments: totalAssignments - completedAssignments,
        };
      })
    );

    return res.status(200).json({
      status: "success",
      data: enrolledCourses,
    });
  } catch (error) {
    logger.error(`Error getting enrollments: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error getting enrollments",
      error: error.message,
    });
  }
};

/**
 * Get a single enrollment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEnroll = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const enroll = await Enroll.findOne({
      _id: req.params.enrollmentId,
      username,
    });

    if (!enroll) {
      return res.status(404).json({
        status: "error",
        message: "Enrollment not found or unauthorized",
      });
    }

    return res.status(200).json({
      status: "success",
      data: enroll,
    });
  } catch (error) {
    logger.error(`Error getting enrollment: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error getting enrollment",
      error: error.message,
    });
  }
};

/**
 * Get enrollment statistics for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserEnrollmentStats = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;

    // Get all enrollments for the user with course information
    const enrollments = await Enroll.find({ username }).populate(
      "courseId",
      "name"
    );

    // Calculate statistics
    const stats = {
      totalEnrolled: enrollments.length,
      activeCourses: enrollments.filter(
        (e) => (e.progress || 0) > 0 && (e.progress || 0) < 100
      ).length,
      completedCourses: enrollments.filter((e) => (e.progress || 0) === 100)
        .length,
    };

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    logger.error("Error getting user enrollment stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get enrollment statistics",
      error: error.message,
    });
  }
};

/**
 * Create enrollments from cart items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createEnrollmentsFromCart = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const { courseIds, paymentMethod } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Course IDs array is required",
      });
    }

    // Check for existing enrollments
    const existingEnrollments = await Enroll.find({
      username,
      courseId: { $in: courseIds },
    });

    if (existingEnrollments.length > 0) {
      const enrolledCourseIds = existingEnrollments.map((e) =>
        e.courseId.toString()
      );
      return res.status(400).json({
        status: "error",
        message: "Already enrolled in some courses",
        enrolledCourseIds,
      });
    }

    // Create enrollments for all courses
    const enrollments = await Promise.all(
      courseIds.map(async (courseId) => {
        const enroll = new Enroll({
          username,
          courseId,
          status: "paid", // Since this is coming from cart checkout
          paymentMethod,
        });
        await enroll.save();
        await incrementTotalStudents(courseId);
        return enroll;
      })
    );

    res.status(201).json({
      status: "success",
      message: "Enrolled in all courses successfully",
      data: enrollments,
    });
  } catch (error) {
    logger.error("Error creating enrollments from cart:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create enrollments",
      error: error.message,
    });
  }
};

// Export all controller functions
module.exports = {
  createEnroll,
  updateEnroll,
  deleteEnroll,
  getEnrolls,
  getEnroll,
  /**
   * Instructor: list students enrolled in instructor courses
   * Route: GET /enroll/instructor/students
   * Query: status=paid|not_paid|all (optional)
   */
  getInstructorEnrolledStudents: async (req, res) => {
    try {
      const username =
        req.user?.username || decodeToken(req.headers.authorization)?.username;

      if (!username) {
        return res.status(401).json({
          status: "error",
          message: "Invalid or missing token",
        });
      }

      const instructor = await User.findOne({ username }).select("_id username");
      if (!instructor) {
        return res.status(404).json({
          status: "error",
          message: "Instructor not found",
        });
      }

      const courses = await Course.find({ instructorId: instructor._id })
        .select("_id name tag thumbnail createdAt")
        .sort({ createdAt: -1 })
        .lean();

      const courseIds = courses.map((c) => c._id);
      if (courseIds.length === 0) {
        return res.status(200).json({
          status: "success",
          data: { courses: [], totals: { courses: 0, students: 0 } },
        });
      }

      const status = String(req.query.status || "paid").trim();
      /** @type {Record<string, any>} */
      const match = { courseId: { $in: courseIds } };
      if (status === "paid" || status === "not_paid") {
        match.status = status;
      }

      const enrolls = await Enroll.find(match).sort({ createdAt: -1 }).lean();
      const usernames = Array.from(new Set(enrolls.map((e) => e.username)));
      const users = await User.find({ username: { $in: usernames } })
        .select("username firstName lastName email avatarUrl")
        .lean();

      const userByUsername = new Map(users.map((u) => [u.username, u]));
      const byCourseId = new Map();

      for (const e of enrolls) {
        const cid = String(e.courseId);
        const arr = byCourseId.get(cid) || [];
        const u = userByUsername.get(e.username);
        const name =
          u && (u.firstName || u.lastName)
            ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
            : e.username;

        arr.push({
          enrollmentId: String(e._id),
          username: e.username,
          name,
          email: (u && u.email) || `${e.username}@example.com`,
          avatar: u ? u.avatarUrl : undefined,
          status: e.status,
          progress: e.progress || 0,
          enrolledAt: e.createdAt,
        });
        byCourseId.set(cid, arr);
      }

      const resultCourses = courses.map((c) => {
        const students = byCourseId.get(String(c._id)) || [];
        const paid = students.filter((s) => s.status === "paid").length;
        const notPaid = students.filter((s) => s.status === "not_paid").length;
        return {
          course: {
            _id: String(c._id),
            name: c.name,
            tag: c.tag,
            thumbnail: c.thumbnail,
          },
          students,
          stats: { total: students.length, paid, not_paid: notPaid },
        };
      });

      return res.status(200).json({
        status: "success",
        data: {
          courses: resultCourses,
          totals: {
            courses: resultCourses.length,
            students: resultCourses.reduce((sum, c) => sum + c.stats.total, 0),
          },
        },
      });
    } catch (error) {
      logger.error("Error getting instructor enrolled students:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to get enrolled students",
        error: error.message,
      });
    }
  },
  getUserEnrollmentStats,
  createEnrollmentsFromCart,
};
