const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const controller = require("../controllers/aiLessonPlan.controller");

// Auth required
router.use(verifyToken);

// Create AI lesson plan draft
router.post("/", controller.createAiLessonPlan);

// List my drafts (admin/manager can see all)
router.get("/", controller.listMyAiLessonPlans);

// Get one
router.get("/:id", controller.getAiLessonPlan);

// Update (teacher edits content, archive, etc.)
router.put("/:id", controller.updateAiLessonPlan);

// Delete
router.delete("/:id", controller.deleteAiLessonPlan);

module.exports = router;


