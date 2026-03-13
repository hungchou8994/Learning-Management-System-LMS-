const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submission.controller");

// Submission statistics (must come before dynamic routes)
router.get("/stats", submissionController.getUserSubmissionStats);

// Simple test route
router.get("/test", (req, res) => {
  res.json({ 
    status: "success", 
    message: "Submission routes are working!",
    timestamp: new Date()
  });
});

// Submission CRUD routes
router.post("/", submissionController.createSubmission);
router.get("/", submissionController.getUserSubmissions);
router.get("/:submissionId", submissionController.getSubmissionById);

module.exports = router; 