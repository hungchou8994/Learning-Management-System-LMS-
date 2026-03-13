const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");
const analytics = require("../controllers/analytics.controller");

function requireCenterStaff(req, res, next) {
  const role = req.user?.role;
  if (role === "admin" || role === "manager" || role === "recruiter" || role === "accountant") {
    return next();
  }
  return res.status(403).json({ status: "error", message: "Forbidden" });
}

router.use(verifyToken);
router.use(requireCenterStaff);

// Finance / revenue
router.get("/revenue/summary", analytics.getRevenueSummary);
router.get("/revenue/trend", analytics.getRevenueTrend);
router.get("/revenue/by-course", analytics.getRevenueByCourse);
router.get("/revenue/by-teacher", analytics.getRevenueByTeacher);
router.get("/revenue/by-category", analytics.getRevenueByCategory);

// Students
router.get("/students", analytics.listStudents);
router.get("/students/:username", analytics.getStudentDetail);

module.exports = router;


