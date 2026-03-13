const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");
const admin = require("../controllers/admin.controller");

router.use(verifyToken);

// Admin/manager tools
router.post("/sync-courses", admin.syncCourses);

module.exports = router;


