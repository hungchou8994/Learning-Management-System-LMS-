const express = require("express");
const router = express.Router();

// Import route files
const userRoutes = require("./user.routes");
const courseRoutes = require("./course.routes");
const sessionRoutes = require("./session.routes");
const lessonRoutes = require("./lesson.routes");
const assignmentRoutes = require("./assignment.routes");
const cartRoutes = require("./cart.routes");
const enrollRoutes = require("./enroll.routes");
const feedbackRoutes = require("./feedback.routes");
const attemptRoutes = require("./attempt.routes");
const problemRoutes = require("./problem.routes");
const submissionRoutes = require("./submission.routes");
const aiLessonPlanRoutes = require("./aiLessonPlan.routes");
const teacherApplicationRoutes = require("./teacherApplication.routes");
const analyticsRoutes = require("./analytics.routes");
const allowListRoutes = require("./allowlist.routes");
const adminRoutes = require("./admin.routes");
const forumRoutes = require("./forum.routes");

// Use routes
router.use("/user", userRoutes);
router.use("/course", courseRoutes);
router.use("/session", sessionRoutes);
router.use("/lesson", lessonRoutes);
router.use("/assignment", assignmentRoutes);
router.use("/cart", cartRoutes);
router.use("/enroll", enrollRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/attempt", attemptRoutes);
router.use("/problems", problemRoutes);
router.use("/submissions", submissionRoutes);
router.use("/lesson-plan", aiLessonPlanRoutes);
router.use("/teacher-applications", teacherApplicationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/meeting/allowlist", allowListRoutes);
router.use("/admin", adminRoutes);
router.use("/forum", forumRoutes);

module.exports = router;
