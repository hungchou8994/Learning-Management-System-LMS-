const express = require("express");
const router = express.Router();
const problemController = require("../controllers/problem.controller");

// Problem statistics (must come before dynamic routes)
router.get("/stats", problemController.getProblemStats);

// Simple test route
router.get("/test", (req, res) => {
  res.json({ 
    status: "success", 
    message: "Problem routes are working!",
    timestamp: new Date()
  });
});

// Problem CRUD routes
router.post("/", problemController.createProblem);
router.put("/:problemId", problemController.updateProblem);
router.delete("/:problemId", problemController.deleteProblem);
router.get("/", problemController.getAllProblems);
router.get("/:problemId", problemController.getProblemById);

// Get problem with all test cases for submission
router.get("/:problemId/submission", problemController.getProblemForSubmission);

// Submit problem solution
router.post("/:problemId/submit", problemController.submitProblem);

module.exports = router; 