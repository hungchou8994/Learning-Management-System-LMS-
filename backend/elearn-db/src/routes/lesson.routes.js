const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lesson.controller");
const verifyToken = require("../middleware/auth.middleware");

// Apply auth middleware to all routes
router.use(verifyToken);

// Create lesson for a session
router.post("/session/:sessionId", lessonController.createLesson);

// Update lesson
router.put("/:lessonId", lessonController.updateLesson);

// Delete lesson
router.delete("/:lessonId", lessonController.deleteLesson);

// Get lesson
router.get("/:lessonId", lessonController.getLesson);

// Get all lessons for a session
router.get("/session/:sessionId", lessonController.getSessionLessons);

module.exports = router;
