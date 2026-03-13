const express = require("express");
const router = express.Router();

const teacherApplicationController = require("../controllers/teacherApplication.controller");
const authMiddleware = require("../middleware/auth.middleware");
const teacherAppUpload = require("../middleware/teacherApplicationUpload.middleware");

// Public: teachers apply (no auth)
router.post(
  "/",
  teacherAppUpload.fields([
    { name: "idCardFront", maxCount: 1 },
    { name: "idCardBack", maxCount: 1 },
    { name: "cv", maxCount: 1 },
  ]),
  teacherApplicationController.createTeacherApplication
);

// Protected: manager/admin review
router.use(authMiddleware);
router.post("/draft", teacherApplicationController.createDraftTeacherApplication);
router.get("/", teacherApplicationController.listTeacherApplications);
router.get("/:id", teacherApplicationController.getTeacherApplication);
router.patch(
  "/:id/details",
  teacherAppUpload.fields([
    { name: "idCardFront", maxCount: 1 },
    { name: "idCardBack", maxCount: 1 },
    { name: "cv", maxCount: 1 },
  ]),
  teacherApplicationController.updateTeacherApplicationDetails
);
router.patch("/:id", teacherApplicationController.updateTeacherApplication);
router.delete("/:id", teacherApplicationController.deleteTeacherApplication);

module.exports = router;


