const mongoose = require("mongoose");
const logger = require("../config/logger");
const Course = require("../models/Course");
const Feedback = require("../models/Feedback");
const Enroll = require("../models/Enroll");

function requireAdminOrManager(req, res) {
  const role = req.user?.role;
  if (role === "admin" || role === "manager") return true;
  res.status(403).json({ status: "error", message: "Forbidden" });
  return false;
}

// POST /admin/sync-courses
// Recompute denormalized aggregates (rating, totalStudents) for all courses.
exports.syncCourses = async (req, res) => {
  try {
    if (!requireAdminOrManager(req, res)) return;

    const courseIds = await Course.find({}, { _id: 1 }).lean();
    const allIds = courseIds.map((c) => c._id);

    // Rating: avg(rate) grouped by courseId
    const ratingAgg = await Feedback.aggregate([
      {
        $group: {
          _id: "$courseId",
          averageRating: { $avg: "$rate" },
        },
      },
    ]);
    const ratingMap = new Map(
      ratingAgg.map((r) => [
        String(r._id),
        Math.round(Number(r.averageRating || 0) * 10) / 10,
      ])
    );

    // Total students: count DISTINCT username per courseId where status=paid
    const studentAgg = await Enroll.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: { courseId: "$courseId", username: "$username" } } },
      { $group: { _id: "$_id.courseId", count: { $sum: 1 } } },
    ]);
    const studentMap = new Map(studentAgg.map((r) => [String(r._id), Number(r.count || 0)]));

    const ops = allIds.map((id) => {
      const key = String(id);
      const rating = ratingMap.get(key) || 0;
      const totalStudents = studentMap.get(key) || 0;
      return {
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(key) },
          update: { $set: { rating, totalStudents } },
        },
      };
    });

    if (ops.length) {
      await Course.bulkWrite(ops, { ordered: false });
    }

    return res.json({
      status: "success",
      data: {
        courses: ops.length,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Admin syncCourses error:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể đồng bộ khóa học",
      details: error.message,
    });
  }
};


