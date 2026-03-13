const express = require("express");
const router = express.Router();
const attemptController = require("../controllers/attempt.controller");

// Create attempt
router.post("/", attemptController.createAttempt);

// Update attempt
router.put("/:attemptId", attemptController.updateAttempt);

// Delete attempt
router.delete("/:attemptId", attemptController.deleteAttempt);

// Get attempts
router.get("/", attemptController.getAttempts);

module.exports = router;
