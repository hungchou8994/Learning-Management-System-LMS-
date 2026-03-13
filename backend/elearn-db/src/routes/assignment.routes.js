const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignment.controller");
const verifyToken = require("../middleware/auth.middleware");

// Apply auth middleware to all routes
router.use(verifyToken);

// Get all assignments
router.get("/", assignmentController.getAllAssignments);

// Get assignments by course ID
router.get("/course/:courseId", assignmentController.getCourseAssignments);

// Create assignment for a session
router.post("/session/:sessionId", assignmentController.createAssignment);

// Update assignment
router.put("/:assignmentId", assignmentController.updateAssignment);

// Delete assignment
router.delete("/:assignmentId", assignmentController.deleteAssignment);

// Get assignment
router.get("/:assignmentId", assignmentController.getAssignment);

// Get assignment for a session
router.get("/session/:sessionId", assignmentController.getSessionAssignment);

// Submit assignment answers
router.post("/:assignmentId/submit", assignmentController.submitAssignment);

module.exports = router;
