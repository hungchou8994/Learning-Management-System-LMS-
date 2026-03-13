const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const verifyToken = require("../middleware/auth.middleware");

// Protected: list feedbacks written by current user
router.get("/mine", verifyToken, feedbackController.getMyFeedbacks);

// Public: list feedback for a course
router.get("/course/:courseId", feedbackController.getFeedback);

// Protected: create/update feedback for a course (enrolled users only)
router.post(
  "/course/:courseId",
  verifyToken,
  feedbackController.createOrUpdateFeedbackForCourse
);

// Legacy endpoints (kept for backward compatibility)
router.post("/", feedbackController.createFeedback);

// Update feedback
router.put("/:feedbackId", verifyToken, feedbackController.updateFeedback);

// Delete feedback
router.delete("/:feedbackId", verifyToken, feedbackController.deleteFeedback);

// Get feedbacks
router.get("/", feedbackController.getFeedbacks);

module.exports = router;
