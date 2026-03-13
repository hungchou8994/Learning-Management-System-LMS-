const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");

// Session routes
router.get("/:sessionId", courseController.getSession);
router.put("/:sessionId", courseController.updateSession);
router.delete("/:sessionId", courseController.deleteSession);

module.exports = router;
