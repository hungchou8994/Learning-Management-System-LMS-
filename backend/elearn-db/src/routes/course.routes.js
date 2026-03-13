const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");

// Course routes
router.post("/", courseController.createCourse);
router.put("/:courseId", courseController.updateCourse);
router.delete("/:courseId", courseController.deleteCourse);
router.get("/", courseController.getAllCourses);
router.get("/instructor-courses", courseController.getInstructorCourses);
router.get(
  "/instructor-courses-grading",
  courseController.getInstructorCoursesWithGradingStats
);
router.get("/:courseId", courseController.getCourseDetails);

// Grading routes
router.get("/:courseId/attempts", courseController.getCourseAttempts);
router.put("/attempt/:attemptId/grade", courseController.gradeAttempt);

// Session routes (create session still belongs to course)
router.post("/:courseId/session", courseController.createSession);

module.exports = router;
