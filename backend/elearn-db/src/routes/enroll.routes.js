const express = require("express");
const router = express.Router();
const {
  createEnroll,
  updateEnroll,
  deleteEnroll,
  getEnrolls,
  getEnroll,
  getInstructorEnrolledStudents,
  getUserEnrollmentStats,
  createEnrollmentsFromCart,
} = require("../controllers/enroll.controller");
const verifyToken = require("../middleware/auth.middleware");

// Apply auth middleware to all routes
router.use(verifyToken);

// Get user enrollment statistics
router.get("/stats", getUserEnrollmentStats);

// Instructor: list students enrolled in instructor courses
router.get("/instructor/students", getInstructorEnrolledStudents);

// Create enrollments from cart
router.post("/cart", createEnrollmentsFromCart);

// Create enrollment
router.post("/:courseId", createEnroll);

// Update enrollment
router.put("/:enrollmentId", updateEnroll);

// Delete enrollment
router.delete("/:enrollmentId", deleteEnroll);

// Get all enrollments
router.get("/", getEnrolls);

// Get single enrollment
router.get("/:enrollmentId", getEnroll);

module.exports = router;
