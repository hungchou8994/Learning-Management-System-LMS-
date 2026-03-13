const express = require("express");
const router = express.Router();
const processController = require("../controllers/process.controller");

// Route to process code submission
router.post("/submit", processController.processSubmission);

module.exports = router;
